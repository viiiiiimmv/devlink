'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Search, Sparkles, MessageCircle, UserPlus, Check, X, UserMinus, Clock3, Bell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { connectChatSocket, getChatSocket } from '@/lib/socket-client'

type ConnectionState = 'none' | 'pending_incoming' | 'pending_outgoing' | 'connected'

type SearchResult = {
  userId: string
  username: string
  name: string
  image?: string
  bio: string
  skills: string[]
  isPublished: boolean
  connectionState: ConnectionState
  canMessage: boolean
  connectionId?: string
}

type ConnectionItem = {
  connectionId: string
  peerUserId: string
  peerUsername: string
  peerName: string
  peerImage?: string
  requesterUserId: string
  status: 'pending' | 'accepted'
  createdAt: string
  updatedAt: string
  respondedAt?: string
}

type ConnectionsResponse = {
  codeCircles: ConnectionItem[]
  incomingSparks: ConnectionItem[]
  outgoingSparks: ConnectionItem[]
}

type NetworkRealtimePayload = {
  type: 'spark_incoming' | 'spark_accepted' | 'spark_declined' | 'spark_canceled' | 'connection_removed'
  connectionId: string
  fromUserId: string
  fromUsername: string
  fromName: string
  toUserId: string
  at: string
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'
}

export default function NetworkPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [connections, setConnections] = useState<ConnectionsResponse>({
    codeCircles: [],
    incomingSparks: [],
    outgoingSparks: [],
  })
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [latestSparkNotice, setLatestSparkNotice] = useState<{
    fromName: string
    fromUsername: string
    at: string
  } | null>(null)
  const [sparkSuccessNotice, setSparkSuccessNotice] = useState<{
    name: string
    username: string
    state: 'pending_outgoing' | 'connected'
  } | null>(null)

  const connectionStateByUserId = useMemo(() => {
    const lookup = new Map<string, { state: ConnectionState; connectionId: string }>()

    for (const item of connections.codeCircles) {
      lookup.set(item.peerUserId, { state: 'connected', connectionId: item.connectionId })
    }

    for (const item of connections.incomingSparks) {
      lookup.set(item.peerUserId, { state: 'pending_incoming', connectionId: item.connectionId })
    }

    for (const item of connections.outgoingSparks) {
      lookup.set(item.peerUserId, { state: 'pending_outgoing', connectionId: item.connectionId })
    }

    return lookup
  }, [connections])

  const fetchConnections = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoadingConnections(true)
      }
      const response = await fetch('/api/network/connections', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch connections')
      }

      const data = await response.json()
      setConnections({
        codeCircles: Array.isArray(data?.codeCircles) ? data.codeCircles : [],
        incomingSparks: Array.isArray(data?.incomingSparks) ? data.incomingSparks : [],
        outgoingSparks: Array.isArray(data?.outgoingSparks) ? data.outgoingSparks : [],
      })
    } catch (error) {
      console.error(error)
      if (!options?.silent) {
        toast.error('Unable to load your network right now')
      }
    } finally {
      if (!options?.silent) {
        setLoadingConnections(false)
      }
    }
  }, [])

  const fetchSearch = useCallback(async (value: string) => {
    try {
      setSearching(true)
      const params = new URLSearchParams({ limit: '20' })
      if (value.trim().length > 0) {
        params.set('q', value.trim())
      }

      const response = await fetch(`/api/network/search?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to search users')
      }

      const data = await response.json()
      const incomingResults = (Array.isArray(data?.results) ? data.results : []) as SearchResult[]
      setSearchResults(incomingResults)
    } catch (error) {
      console.error(error)
      toast.error('Search is temporarily unavailable')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchSearch(query)
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [fetchSearch, query])

  useEffect(() => {
    setSearchResults((previous) => {
      let changed = false
      const next = previous.map((item) => {
        const knownState = connectionStateByUserId.get(item.userId)
        const nextState: ConnectionState = knownState?.state ?? 'none'
        const nextConnectionId = knownState?.connectionId

        if (item.connectionState === nextState && item.connectionId === nextConnectionId) {
          return item
        }

        changed = true
        return {
          ...item,
          connectionState: nextState,
          connectionId: nextConnectionId,
          canMessage: nextState === 'connected',
        }
      })

      return changed ? next : previous
    })
  }, [connectionStateByUserId])

  useEffect(() => {
    if (!sparkSuccessNotice) return
    const timer = window.setTimeout(() => {
      setSparkSuccessNotice(null)
    }, 2600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [sparkSuccessNotice])

  useEffect(() => {
    let mounted = true
    let detachSocketListeners: (() => void) | null = null

    const setupRealtimeSparks = async () => {
      try {
        const socket = await connectChatSocket()
        if (!mounted) return

        const handleNetworkUpdate = (payload: NetworkRealtimePayload) => {
          fetchConnections({ silent: true })

          if (payload.type === 'spark_incoming') {
            const at = payload.at || new Date().toISOString()
            setLatestSparkNotice({
              fromName: payload.fromName,
              fromUsername: payload.fromUsername,
              at,
            })
            toast.success(`${payload.fromName} sent you a Link Spark`)
          }
        }

        socket.on('network:connection:update', handleNetworkUpdate)

        detachSocketListeners = () => {
          socket.off('network:connection:update', handleNetworkUpdate)
        }
      } catch (error) {
        console.error('Realtime spark listener failed:', error)
      }
    }

    setupRealtimeSparks()

    return () => {
      mounted = false
      if (detachSocketListeners) {
        detachSocketListeners()
      }
    }
  }, [fetchConnections])

  const sendSpark = async (targetUserId: string) => {
    try {
      setActioningId(targetUserId)
      const response = await fetch('/api/network/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send request')
      }

      const nextState: 'pending_outgoing' | 'connected' =
        data?.state === 'connected' ? 'connected' : 'pending_outgoing'
      const nextConnectionId = typeof data?.connectionId === 'string' ? data.connectionId : undefined
      const target = searchResults.find((item) => item.userId === targetUserId)

      setSearchResults((previous) =>
        previous.map((item) =>
          item.userId === targetUserId
            ? {
              ...item,
              connectionState: nextState,
              connectionId: nextConnectionId ?? item.connectionId,
              canMessage: nextState === 'connected',
            }
            : item
        )
      )

      setSparkSuccessNotice({
        name: target?.name || 'Developer',
        username: target?.username || '',
        state: nextState,
      })

      await fetchConnections({ silent: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send request')
    } finally {
      setActioningId(null)
    }
  }

  const updateConnection = async (connectionId: string, action: 'accept' | 'decline' | 'cancel' | 'remove') => {
    try {
      setActioningId(connectionId)
      const response = await fetch(`/api/network/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update connection')
      }

      await Promise.all([fetchConnections(), fetchSearch(query)])

      const successLabel: Record<typeof action, string> = {
        accept: 'Welcome to your Code Circle',
        decline: 'Link Spark declined',
        cancel: 'Link Spark canceled',
        remove: 'Connection removed',
      }
      toast.success(successLabel[action])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update connection')
    } finally {
      setActioningId(null)
    }
  }

  const openChat = async (peerUserId: string) => {
    try {
      setActioningId(peerUserId)
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantUserId: peerUserId }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to open chat')
      }

      const conversationId = data?.conversation?.id
      if (typeof conversationId === 'string' && conversationId.length > 0) {
        router.push(`/dashboard/chats?conversation=${encodeURIComponent(conversationId)}`)
      } else {
        router.push('/dashboard/chats')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to open chat')
    } finally {
      setActioningId(null)
    }
  }

  const renderResultAction = (result: SearchResult) => {
    if (result.connectionState === 'connected') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openChat(result.userId)}
          disabled={actioningId === result.userId}
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          Chat
        </Button>
      )
    }

    if (result.connectionState === 'pending_outgoing') {
      return (
        <Button size="sm" variant="secondary" disabled>
          <Clock3 className="mr-1 h-4 w-4" />
          Spark Sent
        </Button>
      )
    }

    if (result.connectionState === 'pending_incoming') {
      return (
        <Button
          size="sm"
          onClick={() => result.connectionId && updateConnection(result.connectionId, 'accept')}
          disabled={!result.connectionId || actioningId === result.connectionId}
        >
          <Check className="mr-1 h-4 w-4" />
          Accept Spark
        </Button>
      )
    }

    return (
      <Button
        size="sm"
        onClick={() => sendSpark(result.userId)}
        disabled={actioningId === result.userId}
      >
        <UserPlus className="mr-1 h-4 w-4" />
        Send Spark
      </Button>
    )
  }

  return (
    
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Talent Network</h1>
            <p className="text-sm text-muted-foreground">
              Discover builders, send <span className="font-medium text-foreground">Link Sparks</span>, and grow your <span className="font-medium text-foreground">Code Circle</span>.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {connections.codeCircles.length} in your Code Circle
          </Badge>
        </div>

        {latestSparkNotice ? (
          <Card className="border-blue-200/80 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    New Link Spark from {latestSparkNotice.fromName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{latestSparkNotice.fromUsername} · {new Date(latestSparkNotice.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setLatestSparkNotice(null)} variant="outline">
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    document.getElementById('incoming-sparks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {sparkSuccessNotice ? (
          <div className="fixed bottom-6 right-6 z-50 w-[280px] rounded-xl border border-emerald-200/80 bg-emerald-50/95 p-3 shadow-lg backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/80">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {sparkSuccessNotice.state === 'connected' ? 'Code Circle established' : 'Link Spark sent'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {sparkSuccessNotice.username
                ? `${sparkSuccessNotice.name} (@${sparkSuccessNotice.username})`
                : sparkSuccessNotice.name}
            </p>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Talent Radar
            </CardTitle>
            <CardDescription>
              Search by name, username, bio, or skills.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try: react, product engineer, or @username"
                className="pl-9"
              />
            </div>

            {searching ? (
              <div className="text-sm text-muted-foreground">Searching network...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-sm text-muted-foreground">No people found yet. Try a broader search.</div>
            ) : (
              <div className="grid gap-3">
                {searchResults.map((result) => (
                  <div
                    key={result.userId}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={result.image} />
                        <AvatarFallback>{getInitials(result.name)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-none">{result.name}</p>
                          <Badge variant="outline" className="text-xs">@{result.username}</Badge>
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {result.bio || 'No bio added yet.'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.skills.slice(0, 4).map((skill) => (
                            <Badge key={`${result.userId}-${skill}`} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        {result.isPublished ? (
                          <Link
                            href={`/${result.username}`}
                            className="inline-flex text-xs font-medium text-blue-600 hover:text-blue-700"
                            target="_blank"
                          >
                            View public profile
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderResultAction(result)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Code Circle
              </CardTitle>
              <CardDescription>
                Your active DevLink connections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConnections ? (
                <p className="text-sm text-muted-foreground">Loading your Code Circle...</p>
              ) : connections.codeCircles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connections yet. Send your first Link Spark above.</p>
              ) : (
                <div className="space-y-3">
                  {connections.codeCircles.map((item) => (
                    <div key={item.connectionId} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={item.peerImage} />
                          <AvatarFallback>{getInitials(item.peerName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{item.peerName}</p>
                          <p className="text-xs text-muted-foreground">@{item.peerUsername}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openChat(item.peerUserId)}
                          disabled={actioningId === item.peerUserId}
                        >
                          <MessageCircle className="mr-1 h-4 w-4" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateConnection(item.connectionId, 'remove')}
                          disabled={actioningId === item.connectionId}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card id="incoming-sparks">
              <CardHeader>
                <CardTitle className="text-lg">Incoming Link Sparks</CardTitle>
                <CardDescription>People who want to join your Code Circle.</CardDescription>
              </CardHeader>
              <CardContent>
                {connections.incomingSparks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No incoming sparks right now.</p>
                ) : (
                  <div className="space-y-3">
                    {connections.incomingSparks.map((item) => (
                      <div key={item.connectionId} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="text-sm font-medium">{item.peerName}</p>
                          <p className="text-xs text-muted-foreground">@{item.peerUsername}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateConnection(item.connectionId, 'accept')}
                            disabled={actioningId === item.connectionId}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateConnection(item.connectionId, 'decline')}
                            disabled={actioningId === item.connectionId}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Outgoing Link Sparks</CardTitle>
                <CardDescription>Requests waiting for acceptance.</CardDescription>
              </CardHeader>
              <CardContent>
                {connections.outgoingSparks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No outgoing sparks pending.</p>
                ) : (
                  <div className="space-y-3">
                    {connections.outgoingSparks.map((item) => (
                      <div key={item.connectionId} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="text-sm font-medium">{item.peerName}</p>
                          <p className="text-xs text-muted-foreground">@{item.peerUsername}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateConnection(item.connectionId, 'cancel')}
                          disabled={actioningId === item.connectionId}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  )
}
