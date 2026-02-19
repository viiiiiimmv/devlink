import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/auth-user'
import { clampLimit, escapeRegex, getViewerConnectionState } from '@/lib/network'
import User from '@/models/User'
import Profile from '@/models/Profile'
import Connection from '@/models/Connection'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') || ''
    const query = rawQuery.trim().slice(0, 80)
    const limit = clampLimit(Number(searchParams.get('limit') || 15), 1, 30)

    let profileMatchedUsernames: string[] = []

    if (query.length >= 2) {
      const queryRegex = new RegExp(escapeRegex(query), 'i')
      const profileMatches = await Profile.find({
        $or: [
          { bio: { $regex: queryRegex } },
          { skills: { $in: [queryRegex] } },
        ],
      })
        .select('username')
        .limit(limit * 3)
        .lean()

      profileMatchedUsernames = profileMatches
        .map((profile) => typeof profile.username === 'string' ? profile.username : '')
        .filter(Boolean)
    }

    const userFilter: Record<string, unknown> = {
      _id: { $ne: authUser.userId },
      username: { $exists: true, $ne: '' },
    }

    if (query.length >= 2) {
      const queryRegex = new RegExp(escapeRegex(query), 'i')
      userFilter.$or = [
        { name: { $regex: queryRegex } },
        { username: { $regex: queryRegex } },
        ...(profileMatchedUsernames.length > 0 ? [{ username: { $in: profileMatchedUsernames } }] : []),
      ]
    }

    const users = await User.find(userFilter)
      .select('_id username name image')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()

    const usernames = users
      .map((user) => typeof user.username === 'string' ? user.username : '')
      .filter(Boolean)

    const profileDocs = await Profile.find({ username: { $in: usernames } })
      .select('username bio skills profilePhoto profileImage isPublished')
      .lean()

    const profileByUsername = new Map<string, {
      bio: string
      skills: string[]
      profileImage?: string
      isPublished: boolean
    }>()

    for (const profile of profileDocs) {
      const username = typeof profile.username === 'string' ? profile.username : ''
      if (!username) continue

      const imageFromPhoto =
        profile.profilePhoto && typeof profile.profilePhoto === 'object' && typeof profile.profilePhoto.url === 'string'
          ? profile.profilePhoto.url
          : ''
      const image = imageFromPhoto || (typeof profile.profileImage === 'string' ? profile.profileImage : '')

      profileByUsername.set(username, {
        bio: typeof profile.bio === 'string' ? profile.bio : '',
        skills: Array.isArray(profile.skills) ? profile.skills.filter((skill) => typeof skill === 'string') : [],
        profileImage: image || undefined,
        isPublished: profile.isPublished !== false,
      })
    }

    const candidateUserIds = users
      .map((user) => user._id?.toString())
      .filter((value): value is string => typeof value === 'string' && value.length > 0)

    const existingConnections = await Connection.find({
      status: { $in: ['pending', 'accepted'] },
      $or: [
        {
          requesterUserId: authUser.userId,
          recipientUserId: { $in: candidateUserIds },
        },
        {
          recipientUserId: authUser.userId,
          requesterUserId: { $in: candidateUserIds },
        },
      ],
    })
      .select('_id requesterUserId recipientUserId status')
      .lean()

    const connectionByPeerId = new Map<string, {
      id: string
      requesterUserId: string
      recipientUserId: string
      status: 'pending' | 'accepted' | 'declined'
    }>()

    for (const connection of existingConnections) {
      const peerUserId = connection.requesterUserId === authUser.userId
        ? connection.recipientUserId
        : connection.requesterUserId

      connectionByPeerId.set(peerUserId, {
        id: connection._id?.toString() || '',
        requesterUserId: connection.requesterUserId,
        recipientUserId: connection.recipientUserId,
        status: connection.status,
      })
    }

    const results = users.map((user) => {
      const userId = user._id?.toString() || ''
      const username = typeof user.username === 'string' ? user.username : ''
      const userProfile = profileByUsername.get(username)
      const connection = connectionByPeerId.get(userId) ?? null
      const connectionState = getViewerConnectionState(connection, authUser.userId)

      return {
        userId,
        username,
        name: typeof user.name === 'string' ? user.name : '',
        image: typeof user.image === 'string' && user.image.trim().length > 0
          ? user.image
          : userProfile?.profileImage,
        bio: userProfile?.bio ?? '',
        skills: userProfile?.skills?.slice(0, 5) ?? [],
        isPublished: userProfile?.isPublished ?? false,
        connectionState,
        connectionId: connection?.id || undefined,
        canMessage: connectionState === 'connected',
      }
    })

    return NextResponse.json({
      query,
      results,
    })
  } catch (error) {
    console.error('Network search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
