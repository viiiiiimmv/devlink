'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  ArrowUpRight,
  Check,
  Clock3,
  Filter,
  Lightbulb,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react'
import MarkdownContent from '@/components/MarkdownContent'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type IdeaStatus = 'open' | 'in_progress' | 'closed'
type ConnectionState = 'self' | 'none' | 'pending_incoming' | 'pending_outgoing' | 'connected'
type CollaborationType = 'any' | 'cofounder' | 'freelance' | 'open_source' | 'hackathon'
type ContactPreference = 'either' | 'chat' | 'profile_contact'
type StatusFilter = 'active' | 'all' | IdeaStatus

type IdeaItem = {
  id: string
  title: string
  summary: string
  details: string
  tags: string[]
  skills: string[]
  collaborationType: CollaborationType
  contactPreference: ContactPreference
  status: IdeaStatus
  createdAt: string
  updatedAt: string
  owner: {
    userId: string
    username: string
    name: string
    image?: string
  }
  viewer: {
    isAuthenticated: boolean
    isOwner: boolean
    connectionState: ConnectionState
    connectionId?: string
    canSpark: boolean
    canChat: boolean
    canContact: boolean
  }
}

type IdeaFormState = {
  title: string
  summary: string
  details: string
  tagsInput: string
  skillsInput: string
  collaborationType: CollaborationType
  contactPreference: ContactPreference
  status: IdeaStatus
}

const DEFAULT_FORM: IdeaFormState = {
  title: '',
  summary: '',
  details: '',
  tagsInput: '',
  skillsInput: '',
  collaborationType: 'any',
  contactPreference: 'either',
  status: 'open',
}

const STATUS_LABELS: Record<IdeaStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

const COLLABORATION_LABELS: Record<CollaborationType, string> = {
  any: 'Any collaboration',
  cofounder: 'Co-founder',
  freelance: 'Freelance support',
  open_source: 'Open source',
  hackathon: 'Hackathon build',
}

const CONTACT_LABELS: Record<ContactPreference, string> = {
  either: 'Spark or direct contact',
  chat: 'Spark + chat preferred',
  profile_contact: 'Direct contact form preferred',
}

const splitCommaValues = (value: string): string[] => {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

const getInitials = (value: string): string => {
  return value
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'D'
}

const toStatusClassName = (status: IdeaStatus): string => {
  if (status === 'open') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  if (status === 'in_progress') {
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
  }

  return 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
}

export default function SparkForgeBoard() {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const isAuthenticated = sessionStatus === 'authenticated'

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [activeTag, setActiveTag] = useState('')
  const [mineOnly, setMineOnly] = useState(false)

  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [loadingIdeas, setLoadingIdeas] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalIdeas, setTotalIdeas] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null)
  const [formState, setFormState] = useState<IdeaFormState>(DEFAULT_FORM)
  const [submittingIdea, setSubmittingIdea] = useState(false)

  const [expandedIdeaIds, setExpandedIdeaIds] = useState<Record<string, boolean>>({})
  const [actioningKey, setActioningKey] = useState<string | null>(null)
  const [sparkNotice, setSparkNotice] = useState<{
    name: string
    username: string
    state: 'pending_outgoing' | 'connected'
  } | null>(null)

  const requestSequenceRef = useRef(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 260)

    return () => {
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    if (!sparkNotice) return

    const timer = window.setTimeout(() => {
      setSparkNotice(null)
    }, 2600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [sparkNotice])

  useEffect(() => {
    if (mineOnly && !isAuthenticated) {
      setMineOnly(false)
    }
  }, [isAuthenticated, mineOnly])

  const fetchIdeas = useCallback(async (options?: { append?: boolean; offset?: number }) => {
    const append = options?.append === true
    const skip = append ? Math.max(0, options?.offset ?? 0) : 0
    const sequence = requestSequenceRef.current + 1
    requestSequenceRef.current = sequence

    if (append) {
      setLoadingMore(true)
    } else {
      setLoadingIdeas(true)
    }

    try {
      const params = new URLSearchParams({
        limit: '12',
        skip: String(skip),
      })

      if (debouncedQuery.length > 0) {
        params.set('q', debouncedQuery)
      }

      if (statusFilter !== 'active') {
        params.set('status', statusFilter)
      }

      if (activeTag) {
        params.set('tag', activeTag)
      }

      if (mineOnly && isAuthenticated) {
        params.set('mine', 'true')
      }

      const response = await fetch(`/api/ideas?${params.toString()}`, {
        cache: 'no-store',
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load SparkForge ideas')
      }

      if (requestSequenceRef.current !== sequence) {
        return
      }

      const incomingIdeas = Array.isArray(data?.ideas) ? data.ideas as IdeaItem[] : []
      const nextTotal = Number(data?.total ?? 0)
      const nextHasMore = Boolean(data?.hasMore)

      setIdeas((previous) => append ? [...previous, ...incomingIdeas] : incomingIdeas)
      setTotalIdeas(Number.isFinite(nextTotal) ? nextTotal : 0)
      setHasMore(nextHasMore)

      if (!append) {
        setExpandedIdeaIds({})
      }
    } catch (error) {
      if (!append) {
        setIdeas([])
        setTotalIdeas(0)
      }

      toast.error(error instanceof Error ? error.message : 'Unable to load ideas')
    } finally {
      if (requestSequenceRef.current === sequence) {
        if (append) {
          setLoadingMore(false)
        } else {
          setLoadingIdeas(false)
        }
      }
    }
  }, [activeTag, debouncedQuery, isAuthenticated, mineOnly, statusFilter])

  useEffect(() => {
    fetchIdeas({ append: false })
  }, [fetchIdeas])

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>()

    for (const idea of ideas) {
      for (const tag of idea.tags) {
        const normalized = tag.trim().toLowerCase()
        if (!normalized) continue
        counts.set(normalized, (counts.get(normalized) || 0) + 1)
      }
    }

    return Array.from(counts.entries())
      .sort((first, second) => second[1] - first[1])
      .slice(0, 7)
      .map(([tag]) => tag)
  }, [ideas])

  const updateIdeasForOwner = useCallback((ownerUserId: string, updater: (idea: IdeaItem) => IdeaItem) => {
    setIdeas((previous) => previous.map((idea) => {
      if (idea.owner.userId !== ownerUserId) {
        return idea
      }

      return updater(idea)
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormState(DEFAULT_FORM)
    setEditingIdeaId(null)
    setFormOpen(false)
  }, [])

  const openCreateForm = () => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?from=${encodeURIComponent('/sparkforge')}`)
      return
    }

    setEditingIdeaId(null)
    setFormState(DEFAULT_FORM)
    setFormOpen(true)
  }

  const openEditForm = (idea: IdeaItem) => {
    if (!idea.viewer.isOwner) {
      return
    }

    setEditingIdeaId(idea.id)
    setFormState({
      title: idea.title,
      summary: idea.summary,
      details: idea.details,
      tagsInput: idea.tags.join(', '),
      skillsInput: idea.skills.join(', '),
      collaborationType: idea.collaborationType,
      contactPreference: idea.contactPreference,
      status: idea.status,
    })
    setFormOpen(true)
  }

  const submitIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isAuthenticated) {
      router.push(`/auth/signin?from=${encodeURIComponent('/sparkforge')}`)
      return
    }

    const payload = {
      title: formState.title,
      summary: formState.summary,
      details: formState.details,
      tags: splitCommaValues(formState.tagsInput),
      skills: splitCommaValues(formState.skillsInput),
      collaborationType: formState.collaborationType,
      contactPreference: formState.contactPreference,
      status: formState.status,
    }

    setSubmittingIdea(true)
    try {
      const endpoint = editingIdeaId ? `/api/ideas/${editingIdeaId}` : '/api/ideas'
      const response = await fetch(endpoint, {
        method: editingIdeaId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to save idea')
      }

      toast.success(editingIdeaId ? 'Idea updated' : 'Idea posted to SparkForge')
      resetForm()
      await fetchIdeas({ append: false })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save idea')
    } finally {
      setSubmittingIdea(false)
    }
  }

  const deleteIdea = async (idea: IdeaItem) => {
    if (!idea.viewer.isOwner) {
      return
    }

    const shouldDelete = window.confirm('Delete this idea from SparkForge?')
    if (!shouldDelete) {
      return
    }

    setActioningKey(`delete-${idea.id}`)

    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: 'DELETE',
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to delete idea')
      }

      setIdeas((previous) => previous.filter((entry) => entry.id !== idea.id))
      setTotalIdeas((previous) => Math.max(0, previous - 1))
      toast.success('Idea removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete idea')
    } finally {
      setActioningKey(null)
    }
  }

  const sendSpark = async (idea: IdeaItem) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?from=${encodeURIComponent('/sparkforge')}`)
      return
    }

    const targetUserId = idea.owner.userId
    if (!targetUserId) {
      toast.error('Unable to send spark for this idea')
      return
    }

    setActioningKey(`spark-${targetUserId}`)

    try {
      const response = await fetch('/api/network/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to send spark')
      }

      const nextState: 'pending_outgoing' | 'connected' = data?.state === 'connected'
        ? 'connected'
        : 'pending_outgoing'
      const nextConnectionId = typeof data?.connectionId === 'string' ? data.connectionId : undefined

      updateIdeasForOwner(targetUserId, (entry) => ({
        ...entry,
        viewer: {
          ...entry.viewer,
          connectionState: nextState,
          connectionId: nextConnectionId ?? entry.viewer.connectionId,
          canSpark: false,
          canChat: nextState === 'connected',
        },
      }))

      setSparkNotice({
        name: idea.owner.name,
        username: idea.owner.username,
        state: nextState,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send spark')
    } finally {
      setActioningKey(null)
    }
  }

  const acceptSpark = async (idea: IdeaItem) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?from=${encodeURIComponent('/sparkforge')}`)
      return
    }

    const connectionId = idea.viewer.connectionId
    if (!connectionId) {
      toast.error('Connection request not found')
      return
    }

    setActioningKey(`accept-${connectionId}`)

    try {
      const response = await fetch(`/api/network/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to accept spark')
      }

      updateIdeasForOwner(idea.owner.userId, (entry) => ({
        ...entry,
        viewer: {
          ...entry.viewer,
          connectionState: 'connected',
          canSpark: false,
          canChat: true,
        },
      }))

      toast.success('Spark accepted. You can now chat.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to accept spark')
    } finally {
      setActioningKey(null)
    }
  }

  const openChat = async (idea: IdeaItem) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?from=${encodeURIComponent('/sparkforge')}`)
      return
    }

    setActioningKey(`chat-${idea.owner.userId}`)

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantUserId: idea.owner.userId }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to open chat')
      }

      const conversationId = typeof data?.conversation?.id === 'string' ? data.conversation.id : ''
      if (conversationId) {
        router.push(`/dashboard/chats?conversation=${encodeURIComponent(conversationId)}`)
        return
      }

      router.push('/dashboard/chats')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to open chat')
    } finally {
      setActioningKey(null)
    }
  }

  const toggleExpanded = (ideaId: string) => {
    setExpandedIdeaIds((previous) => ({
      ...previous,
      [ideaId]: !previous[ideaId],
    }))
  }

  const renderConnectionAction = (idea: IdeaItem) => {
    if (idea.viewer.isOwner) {
      return null
    }

    if (!isAuthenticated) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/auth/signin?from=${encodeURIComponent('/sparkforge')}`)}
        >
          Sign in to Spark
        </Button>
      )
    }

    if (idea.viewer.connectionState === 'connected') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openChat(idea)}
          disabled={actioningKey === `chat-${idea.owner.userId}`}
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          Chat
        </Button>
      )
    }

    if (idea.viewer.connectionState === 'pending_outgoing') {
      return (
        <Button size="sm" variant="secondary" disabled>
          <Clock3 className="mr-1 h-4 w-4" />
          Spark Sent
        </Button>
      )
    }

    if (idea.viewer.connectionState === 'pending_incoming') {
      return (
        <Button
          size="sm"
          onClick={() => acceptSpark(idea)}
          disabled={actioningKey === `accept-${idea.viewer.connectionId}`}
        >
          <Check className="mr-1 h-4 w-4" />
          Accept Spark
        </Button>
      )
    }

    return (
      <Button
        size="sm"
        onClick={() => sendSpark(idea)}
        disabled={actioningKey === `spark-${idea.owner.userId}`}
      >
        <UserPlus className="mr-1 h-4 w-4" />
        Send Spark
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200/70 bg-card/85 dark:border-blue-900/40">
        <CardContent className="space-y-4 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              <Lightbulb className="mr-1 h-3.5 w-3.5" />
              SparkForge
            </Badge>
            <Badge variant="secondary" className="border-blue-200/60 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
              {totalIdeas} ideas live
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Find people to build your next project with.</h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Post your concept, discover what others are building, send sparks, and move to chat or direct contact.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={openCreateForm} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Post an idea
            </Button>
            <Link href="/discover">
              <Button variant="outline">Explore profiles</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {sparkNotice ? (
        <div className="fixed bottom-6 right-6 z-50 w-[280px] rounded-xl border border-emerald-200/80 bg-emerald-50/95 p-3 shadow-lg backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/80">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {sparkNotice.state === 'connected' ? 'Code Circle established' : 'Spark sent'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {sparkNotice.username ? `${sparkNotice.name} (@${sparkNotice.username})` : sparkNotice.name}
          </p>
        </div>
      ) : null}

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingIdeaId ? 'Edit idea' : 'Post a new idea'}</CardTitle>
            <CardDescription>
              Keep it concise and clear so the right collaborators can find you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitIdea} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formState.title}
                    onChange={(event) => setFormState((previous) => ({ ...previous, title: event.target.value }))}
                    placeholder="AI mock interview coach for students"
                    required
                    minLength={6}
                    maxLength={140}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Summary</label>
                  <Textarea
                    value={formState.summary}
                    onChange={(event) => setFormState((previous) => ({ ...previous, summary: event.target.value }))}
                    placeholder="What you are building and what kind of collaborator you need."
                    required
                    minLength={12}
                    maxLength={320}
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Details (optional, markdown supported)</label>
                  <Textarea
                    value={formState.details}
                    onChange={(event) => setFormState((previous) => ({ ...previous, details: event.target.value }))}
                    placeholder="Share milestones, stack, constraints, and timeline."
                    rows={5}
                    maxLength={12000}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <Input
                    value={formState.tagsInput}
                    onChange={(event) => setFormState((previous) => ({ ...previous, tagsInput: event.target.value }))}
                    placeholder="saas, ai, fintech"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Skills needed</label>
                  <Input
                    value={formState.skillsInput}
                    onChange={(event) => setFormState((previous) => ({ ...previous, skillsInput: event.target.value }))}
                    placeholder="Next.js, Python, Product"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Collaboration type</label>
                  <Select
                    value={formState.collaborationType}
                    onValueChange={(value: CollaborationType) => {
                      setFormState((previous) => ({ ...previous, collaborationType: value }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collaboration type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COLLABORATION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred first contact</label>
                  <Select
                    value={formState.contactPreference}
                    onValueChange={(value: ContactPreference) => {
                      setFormState((previous) => ({ ...previous, contactPreference: value }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTACT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Current status</label>
                  <Select
                    value={formState.status}
                    onValueChange={(value: IdeaStatus) => {
                      setFormState((previous) => ({ ...previous, status: value }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={submittingIdea}>
                  {submittingIdea ? 'Saving...' : editingIdeaId ? 'Update idea' : 'Publish idea'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                  disabled={submittingIdea}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Discover ideas
          </CardTitle>
          <CardDescription>Search by concept, stack, tag, or builder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr,180px,200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try: marketplace, ai, react-native, @username"
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={mineOnly ? 'default' : 'outline'}
              onClick={() => {
                if (!isAuthenticated) {
                  router.push(`/auth/signin?from=${encodeURIComponent('/sparkforge')}`)
                  return
                }
                setMineOnly((previous) => !previous)
              }}
              className="justify-start"
            >
              {mineOnly ? 'Showing my ideas' : 'Show only my ideas'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Trending tags</p>
            {popularTags.length === 0 ? (
              <span className="text-xs text-muted-foreground">No tags yet</span>
            ) : (
              popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((previous) => previous === tag ? '' : tag)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    activeTag === tag
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-blue-300 hover:text-foreground'
                  }`}
                >
                  #{tag}
                </button>
              ))
            )}
            {activeTag ? (
              <Button size="sm" variant="ghost" onClick={() => setActiveTag('')}>Clear tag</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {loadingIdeas ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading SparkForge ideas...</CardContent>
        </Card>
      ) : ideas.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="font-medium">No ideas found for this filter.</p>
            <p className="text-sm text-muted-foreground">Try removing filters or post the first idea in this space.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => {
                setQuery('')
                setStatusFilter('active')
                setActiveTag('')
                setMineOnly(false)
              }}>
                Reset filters
              </Button>
              <Button onClick={openCreateForm}>
                <Plus className="mr-1.5 h-4 w-4" />
                Post idea
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => {
            const isExpanded = Boolean(expandedIdeaIds[idea.id])
            const hasDetails = idea.details.trim().length > 0
            const showContact = idea.viewer.canContact

            return (
              <Card key={idea.id} className="flex h-full flex-col">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={idea.owner.image} alt={idea.owner.name} />
                        <AvatarFallback>{getInitials(idea.owner.name || idea.owner.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-none">{idea.owner.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">@{idea.owner.username}</p>
                      </div>
                    </div>

                    <Badge className={toStatusClassName(idea.status)}>{STATUS_LABELS[idea.status]}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold leading-snug">{idea.title}</h3>
                    <p className="text-sm text-muted-foreground">{idea.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{COLLABORATION_LABELS[idea.collaborationType]}</Badge>
                    {idea.tags.map((tag) => (
                      <button
                        key={`${idea.id}-tag-${tag}`}
                        type="button"
                        onClick={() => setActiveTag(tag)}
                        className="rounded-full border border-border bg-muted/35 px-2 py-0.5 text-xs text-muted-foreground hover:border-blue-300 hover:text-foreground"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="mt-auto space-y-4 pt-0">
                  {idea.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {idea.skills.map((skill) => (
                        <Badge key={`${idea.id}-skill-${skill}`} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {hasDetails ? (
                    <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
                      <MarkdownContent
                        content={isExpanded ? idea.details : `${idea.details.slice(0, 220)}${idea.details.length > 220 ? '...' : ''}`}
                        className="text-xs text-muted-foreground"
                      />
                      {idea.details.length > 220 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 px-2"
                          onClick={() => toggleExpanded(idea.id)}
                        >
                          {isExpanded ? 'Hide details' : 'Read details'}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    {renderConnectionAction(idea)}

                    {showContact ? (
                      <Link href={`/contact/${idea.owner.username}`}>
                        <Button size="sm" variant="outline">
                          Contact
                          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    ) : null}

                    {idea.viewer.isOwner ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(idea)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteIdea(idea)}
                          disabled={actioningKey === `delete-${idea.id}`}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(idea.updatedAt).toLocaleDateString()} · {CONTACT_LABELS[idea.contactPreference]}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchIdeas({ append: true, offset: ideas.length })}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load more ideas'}
            {!loadingMore ? <Sparkles className="ml-1.5 h-4 w-4" /> : null}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
