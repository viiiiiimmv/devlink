#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { MongoClient, ObjectId } = require('mongodb')

const VALID_PROVIDERS = new Set(['google', 'github'])
const SOCIAL_LINK_KEYS = ['github', 'linkedin', 'twitter', 'website']

function parseArgs(argv) {
  const args = argv.slice(2)
  const flags = new Set(args.filter((arg) => arg.startsWith('--')))
  const getValue = (name) => {
    const prefix = `${name}=`
    const found = args.find((arg) => arg.startsWith(prefix))
    return found ? found.slice(prefix.length) : undefined
  }

  return {
    apply: flags.has('--apply'),
    emailFilter: normalizeEmail(getValue('--email') || ''),
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function loadEnv() {
  loadEnvFile(path.resolve(process.cwd(), '.env'))
  loadEnvFile(path.resolve(process.cwd(), '.env.local'))
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function normalizeUsername(username) {
  return typeof username === 'string' ? username.trim().toLowerCase() : ''
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function uniqueStrings(values, { lowerCase = false } = {}) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    if (!nonEmpty(value)) continue
    const trimmed = value.trim()
    const key = lowerCase ? trimmed.toLowerCase() : trimmed
    if (seen.has(key)) continue
    seen.add(key)
    result.push(lowerCase ? trimmed.toLowerCase() : trimmed)
  }
  return result
}

function pickFirstNonEmpty(values) {
  for (const value of values) {
    if (nonEmpty(value)) return value.trim()
  }
  return ''
}

function pickLongestNonEmpty(values) {
  let winner = ''
  for (const value of values) {
    if (!nonEmpty(value)) continue
    const trimmed = value.trim()
    if (trimmed.length > winner.length) {
      winner = trimmed
    }
  }
  return winner
}

function toDate(value) {
  const date = value ? new Date(value) : new Date(0)
  return Number.isNaN(date.getTime()) ? new Date(0) : date
}

function getProvidersFromUser(user) {
  const providers = []

  if (VALID_PROVIDERS.has(user?.provider)) {
    providers.push(user.provider)
  }

  if (Array.isArray(user?.providers)) {
    for (const provider of user.providers) {
      if (VALID_PROVIDERS.has(provider)) {
        providers.push(provider)
      }
    }
  }

  return uniqueStrings(providers, { lowerCase: true })
}

function countNonEmptySocialLinks(socialLinks) {
  if (!socialLinks || typeof socialLinks !== 'object') return 0
  return SOCIAL_LINK_KEYS.filter((key) => nonEmpty(socialLinks[key])).length
}

function profileScore(profile) {
  const bio = nonEmpty(profile?.bio) ? profile.bio.trim() : ''
  const skills = Array.isArray(profile?.skills) ? profile.skills.length : 0
  const projects = Array.isArray(profile?.projects) ? profile.projects.length : 0
  const experiences = Array.isArray(profile?.experiences) ? profile.experiences.length : 0
  const certifications = Array.isArray(profile?.certifications) ? profile.certifications.length : 0
  const researches = Array.isArray(profile?.researches) ? profile.researches.length : 0
  const socialCount = countNonEmptySocialLinks(profile?.socialLinks)
  const hasProfileImage = nonEmpty(profile?.profileImage) || nonEmpty(profile?.profilePhoto?.url)
  const hasUsername = nonEmpty(profile?.username)

  return (
    (hasUsername ? 80 : 0) +
    Math.min(bio.length, 500) / 10 +
    skills * 2 +
    projects * 4 +
    experiences * 4 +
    certifications * 3 +
    researches * 3 +
    socialCount * 3 +
    (hasProfileImage ? 10 : 0)
  )
}

function userScore(user, profileCount) {
  return (
    (profileCount > 0 ? 200 + profileCount * 10 : 0) +
    (nonEmpty(user?.username) ? 80 : 0) +
    getProvidersFromUser(user).length * 20 +
    (nonEmpty(user?.image) ? 10 : 0) +
    (nonEmpty(user?.name) ? 5 : 0)
  )
}

function uniqueByKey(items, keyFn) {
  const result = []
  const seen = new Set()

  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

function mergeRecordsById(arrays) {
  const merged = []
  const seen = new Set()

  for (const list of arrays) {
    if (!Array.isArray(list)) continue
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const id = nonEmpty(item.id) ? `id:${item.id.trim()}` : `json:${JSON.stringify(item)}`
      if (seen.has(id)) continue
      seen.add(id)
      merged.push(item)
    }
  }

  return merged
}

function mergeSocialLinks(profiles) {
  const merged = {}
  for (const key of SOCIAL_LINK_KEYS) {
    for (const profile of profiles) {
      const value = profile?.socialLinks?.[key]
      if (nonEmpty(value)) {
        merged[key] = value.trim()
        break
      }
    }
  }
  return merged
}

function mergeSectionSettings(profiles) {
  const settings = []
  const seen = new Set()

  for (const profile of profiles) {
    if (!Array.isArray(profile?.sectionSettings)) continue
    for (const section of profile.sectionSettings) {
      if (!section || !nonEmpty(section.id)) continue
      const id = section.id.trim()
      if (seen.has(id)) continue
      seen.add(id)
      settings.push({
        id,
        visible: Boolean(section.visible),
      })
    }
  }

  return settings
}

function findProfileOwnerId(profile, userIdsSet) {
  if (!profile || profile.userId == null) return null
  const ownerId = profile.userId instanceof ObjectId ? profile.userId.toString() : String(profile.userId)
  return userIdsSet.has(ownerId) ? ownerId : null
}

async function pickUsername({
  usersCollection,
  profilesCollection,
  groupUserIds,
  groupProfileIds,
  candidates,
}) {
  const normalizedCandidates = uniqueStrings(candidates.map((value) => normalizeUsername(value)), { lowerCase: true })

  for (const candidate of normalizedCandidates) {
    if (!candidate) continue

    const userConflict = await usersCollection.findOne({
      username: candidate,
      _id: { $nin: groupUserIds },
    })

    if (userConflict) continue

    const profileConflict = await profilesCollection.findOne({
      username: candidate,
      _id: { $nin: groupProfileIds },
    })

    if (!profileConflict) {
      return candidate
    }
  }

  return ''
}

function buildMergedProfile(canonicalProfile, allProfiles, canonicalUserId, selectedUsername, fallbackName) {
  const profilePriority = [canonicalProfile, ...allProfiles.filter((p) => String(p._id) !== String(canonicalProfile._id))]
  const mergedBio = pickLongestNonEmpty(profilePriority.map((profile) => profile.bio))
  const mergedName = pickFirstNonEmpty([
    canonicalProfile.name,
    fallbackName,
    ...allProfiles.map((profile) => profile.name),
  ])

  const mergedProfileImage = pickFirstNonEmpty(profilePriority.map((profile) => profile.profileImage))
  const mergedPhotoSource = profilePriority.find(
    (profile) => nonEmpty(profile?.profilePhoto?.url) || nonEmpty(profile?.profilePhoto?.publicId)
  )
  const mergedTheme = pickFirstNonEmpty(profilePriority.map((profile) => profile.theme))
  const mergedTemplate = pickFirstNonEmpty(profilePriority.map((profile) => profile.template))
  const mergedSectionSettings = mergeSectionSettings(profilePriority)

  const merged = {
    userId: canonicalUserId,
    username: selectedUsername || canonicalProfile.username,
    name: mergedName || fallbackName || canonicalProfile.name,
    bio: mergedBio,
    skills: uniqueStrings(profilePriority.flatMap((profile) => (Array.isArray(profile.skills) ? profile.skills : [])), { lowerCase: true }),
    socialLinks: mergeSocialLinks(profilePriority),
    projects: mergeRecordsById(profilePriority.map((profile) => profile.projects)),
    experiences: mergeRecordsById(profilePriority.map((profile) => profile.experiences)),
    certifications: mergeRecordsById(profilePriority.map((profile) => profile.certifications)),
    researches: mergeRecordsById(profilePriority.map((profile) => profile.researches)),
    updatedAt: new Date(),
  }

  if (mergedProfileImage) {
    merged.profileImage = mergedProfileImage
  }

  if (mergedPhotoSource?.profilePhoto && (nonEmpty(mergedPhotoSource.profilePhoto.url) || nonEmpty(mergedPhotoSource.profilePhoto.publicId))) {
    merged.profilePhoto = {
      ...(nonEmpty(mergedPhotoSource.profilePhoto.url) ? { url: mergedPhotoSource.profilePhoto.url.trim() } : {}),
      ...(nonEmpty(mergedPhotoSource.profilePhoto.publicId) ? { publicId: mergedPhotoSource.profilePhoto.publicId.trim() } : {}),
    }
  }

  if (mergedTheme) {
    merged.theme = mergedTheme
  }

  if (mergedTemplate) {
    merged.template = mergedTemplate
  }

  if (mergedSectionSettings.length > 0) {
    merged.sectionSettings = mergedSectionSettings
  }

  return merged
}

async function ensureUniqueEmailIndex(usersCollection, shouldApply) {
  const indexes = await usersCollection.indexes()
  const emailIndex = indexes.find(
    (index) =>
      index &&
      index.key &&
      Object.keys(index.key).length === 1 &&
      index.key.email === 1
  )

  if (emailIndex?.unique) {
    return { changed: false, message: 'Email index is already unique.' }
  }

  if (!shouldApply) {
    return {
      changed: false,
      message: emailIndex
        ? `Would replace non-unique email index (${emailIndex.name}) with a unique one.`
        : 'Would create a unique email index.',
    }
  }

  if (emailIndex) {
    await usersCollection.dropIndex(emailIndex.name)
  }

  await usersCollection.createIndex({ email: 1 }, { unique: true })
  return { changed: true, message: 'Unique email index ensured.' }
}

async function main() {
  loadEnv()
  const { apply, emailFilter } = parseArgs(process.argv)

  const mongoUri = process.env.MONGODB_URI
  if (!nonEmpty(mongoUri)) {
    throw new Error('MONGODB_URI is not set in .env or .env.local')
  }

  const client = new MongoClient(mongoUri.trim())
  await client.connect()

  const dbName = process.env.MONGODB_DB?.trim() || undefined
  const database = client.db(dbName)
  const usersCollection = database.collection('users')
  const profilesCollection = database.collection('profiles')

  const allUsers = await usersCollection.find({ email: { $type: 'string' } }).toArray()

  const groupsByEmail = new Map()
  for (const user of allUsers) {
    const normalized = normalizeEmail(user.email)
    if (!normalized) continue
    if (emailFilter && normalized !== emailFilter) continue

    if (!groupsByEmail.has(normalized)) {
      groupsByEmail.set(normalized, [])
    }
    groupsByEmail.get(normalized).push(user)
  }

  const duplicateGroups = Array.from(groupsByEmail.entries()).filter(([, users]) => users.length > 1)

  console.log(`Found ${duplicateGroups.length} duplicate email group(s).`)
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`)
  if (emailFilter) {
    console.log(`Email filter: ${emailFilter}`)
  }

  const summary = {
    groups: duplicateGroups.length,
    usersToDelete: 0,
    profilesToDelete: 0,
    usersUpdated: 0,
    profilesUpdated: 0,
    failedGroups: 0,
  }

  for (const [normalizedEmail, users] of duplicateGroups) {
    const sortedUsers = [...users].sort((a, b) => toDate(a.createdAt) - toDate(b.createdAt))
    const userIds = sortedUsers.map((user) => user._id)
    const userIdStrings = sortedUsers.map((user) => user._id.toString())
    const userIdsSet = new Set(userIdStrings)

    const profiles = await profilesCollection
      .find({
        $or: [
          { userId: { $in: userIdStrings } },
          { userId: { $in: userIds } },
        ],
      })
      .toArray()

    const profilesByOwnerId = new Map()
    for (const profile of profiles) {
      const ownerId = findProfileOwnerId(profile, userIdsSet)
      if (!ownerId) continue
      if (!profilesByOwnerId.has(ownerId)) {
        profilesByOwnerId.set(ownerId, [])
      }
      profilesByOwnerId.get(ownerId).push(profile)
    }

    const canonicalUser = [...sortedUsers].sort((a, b) => {
      const aProfiles = profilesByOwnerId.get(a._id.toString()) || []
      const bProfiles = profilesByOwnerId.get(b._id.toString()) || []
      const scoreDiff = userScore(b, bProfiles.length) - userScore(a, aProfiles.length)
      if (scoreDiff !== 0) return scoreDiff

      const updatedDiff = toDate(b.updatedAt) - toDate(a.updatedAt)
      if (updatedDiff !== 0) return updatedDiff

      return toDate(a.createdAt) - toDate(b.createdAt)
    })[0]

    const duplicateUsers = sortedUsers.filter((user) => String(user._id) !== String(canonicalUser._id))
    const canonicalUserId = canonicalUser._id.toString()
    const profileCandidates = [...profiles].sort((a, b) => {
      const scoreDiff = profileScore(b) - profileScore(a)
      if (scoreDiff !== 0) return scoreDiff
      return toDate(b.updatedAt) - toDate(a.updatedAt)
    })
    const canonicalProfile = profileCandidates[0] || null
    const duplicateProfiles = canonicalProfile
      ? profiles.filter((profile) => String(profile._id) !== String(canonicalProfile._id))
      : []

    const primaryProvider =
      (VALID_PROVIDERS.has(canonicalUser.provider) && canonicalUser.provider) ||
      sortedUsers.map((user) => user.provider).find((provider) => VALID_PROVIDERS.has(provider)) ||
      'google'

    const groupProfileIds = profiles.map((profile) => profile._id)
    const selectedUsername = await pickUsername({
      usersCollection,
      profilesCollection,
      groupUserIds: userIds,
      groupProfileIds,
      candidates: [
        canonicalProfile?.username,
        canonicalUser.username,
        ...sortedUsers.map((user) => user.username),
        ...profiles.map((profile) => profile.username),
      ],
    })

    const selectedName = pickFirstNonEmpty([
      canonicalProfile?.name,
      canonicalUser.name,
      ...sortedUsers.map((user) => user.name),
      ...profiles.map((profile) => profile.name),
    ])

    const selectedImage = pickFirstNonEmpty([
      canonicalUser.image,
      ...sortedUsers.map((user) => user.image),
    ])

    const userUpdate = {
      email: normalizedEmail,
      name: selectedName || canonicalUser.name || normalizedEmail.split('@')[0],
      provider: primaryProvider,
      providers: [primaryProvider],
      updatedAt: new Date(),
    }

    if (selectedImage) {
      userUpdate.image = selectedImage
    }

    if (selectedUsername) {
      userUpdate.username = selectedUsername
    }

    const profileUpdate = canonicalProfile
      ? buildMergedProfile(
          canonicalProfile,
          profiles,
          canonicalUserId,
          selectedUsername,
          userUpdate.name
        )
      : null

    console.log(
      JSON.stringify({
        email: normalizedEmail,
        canonicalUserId,
        mergeUserIds: duplicateUsers.map((user) => user._id.toString()),
        canonicalProfileId: canonicalProfile?._id?.toString() || null,
        mergeProfileIds: duplicateProfiles.map((profile) => profile._id.toString()),
        resultingUsername: selectedUsername || canonicalUser.username || null,
        resultingProviders: userUpdate.providers,
      })
    )

    summary.usersToDelete += duplicateUsers.length
    summary.profilesToDelete += duplicateProfiles.length

    if (!apply) {
      continue
    }

    try {
      await usersCollection.updateOne(
        { _id: canonicalUser._id },
        { $set: userUpdate }
      )
      summary.usersUpdated += 1

      if (profileUpdate && canonicalProfile) {
        await profilesCollection.updateOne(
          { _id: canonicalProfile._id },
          { $set: profileUpdate }
        )
        summary.profilesUpdated += 1
      }

      if (duplicateProfiles.length > 0) {
        await profilesCollection.deleteMany({
          _id: { $in: duplicateProfiles.map((profile) => profile._id) },
        })
      }

      if (duplicateUsers.length > 0) {
        await usersCollection.deleteMany({
          _id: { $in: duplicateUsers.map((user) => user._id) },
        })
      }
    } catch (error) {
      summary.failedGroups += 1
      console.error(`Failed to merge group for ${normalizedEmail}:`, error)
    }
  }

  if (!emailFilter) {
    const indexResult = await ensureUniqueEmailIndex(usersCollection, apply)
    console.log(indexResult.message)
  } else if (!apply) {
    console.log('Skipped unique index check because --email filter is set.')
  }

  console.log('Summary:')
  console.log(JSON.stringify(summary, null, 2))

  await client.close()
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exitCode = 1
})
