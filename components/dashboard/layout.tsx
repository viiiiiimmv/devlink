'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  Award, 
  BookOpen, 
  Settings,
  Palette,
  MessageSquare,
  Download,
  LogOut,
  Menu,
  X,
  Code,
  Eye,
  ExternalLink,
  UsersRound,
  MessagesSquare,
  Bell,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SimpleThemeToggle } from '@/components/ui/theme-toggle'
import { connectChatSocket, disconnectChatSocket } from '@/lib/socket-client'
import { CHAT_UNREAD_REFRESH_EVENT } from '@/lib/chat-events'
import { toast } from 'sonner'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardLayoutProps {
  children: React.ReactNode
}

type NotificationConversationSummary = {
  id: string
  unreadCount?: number
  lastMessageText?: string
  peer?: {
    name?: string
  } | null
}

type IncomingSparkSummary = {
  connectionId: string
  peerName?: string
  peerUsername?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'SparkForge', href: '/dashboard/sparkforge', icon: Lightbulb },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Projects', href: '/dashboard/projects', icon: Code },
  { name: 'Experience', href: '/dashboard/experience', icon: Briefcase },
  { name: 'Testimonials', href: '/dashboard/testimonials', icon: MessageSquare },
  { name: 'Certifications', href: '/dashboard/certifications', icon: Award },
  { name: 'Research Papers', href: '/dashboard/researches', icon: BookOpen },
  { name: 'Talent Network', href: '/dashboard/network', icon: UsersRound },
  { name: 'Pulse Chat', href: '/dashboard/chats', icon: MessagesSquare },
  { name: 'Import', href: '/dashboard/import', icon: Download },
  { name: 'Customise', href: '/dashboard/customise', icon: Palette },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const activePathname = pathname ?? ''
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [isDesktopHovering, setIsDesktopHovering] = useState(false)
  const [unreadPulseCount, setUnreadPulseCount] = useState(0)
  const [notificationSocketConnected, setNotificationSocketConnected] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [notificationsSupported, setNotificationsSupported] = useState(false)
  const username = (session?.user as { username?: string | null } | undefined)?.username
  const currentUserId = typeof session?.user?.id === 'string' ? session.user.id : ''
  const isOnPulseChat = activePathname.startsWith('/dashboard/chats')
  const isOnPulseChatRef = useRef(isOnPulseChat)
  const userImage =
    typeof session?.user?.image === 'string' && session.user.image.trim().length > 0
      ? session.user.image
      : undefined
  const isDesktopExpanded = !isDesktopCollapsed || isDesktopHovering
  const unreadByConversationRef = useRef<Record<string, number>>({})
  const incomingSparkIdsRef = useRef<Record<string, IncomingSparkSummary>>({})
  const fallbackHydratedRef = useRef(false)

  useEffect(() => {
    isOnPulseChatRef.current = isOnPulseChat
  }, [isOnPulseChat])

  useEffect(() => {
    unreadByConversationRef.current = {}
    incomingSparkIdsRef.current = {}
    fallbackHydratedRef.current = false
  }, [currentUserId])

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId) return

    try {
      const response = await fetch('/api/chat/conversations', { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      const conversations = Array.isArray(data?.conversations) ? data.conversations : []
      const totalUnread = conversations.reduce((sum: number, conversation: any) => {
        const unread = Number(conversation?.unreadCount ?? 0)
        if (!Number.isFinite(unread) || unread <= 0) return sum
        return sum + unread
      }, 0)
      setUnreadPulseCount(totalUnread)
    } catch (error) {
      console.error('Unread count fetch failed:', error)
    }
  }, [currentUserId])

  const maybeShowBrowserNotification = useCallback((title: string, body: string, conversationId: string) => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const notification = new Notification(title, { body })
    notification.onclick = () => {
      window.focus()
      window.location.href = `/dashboard/chats?conversation=${encodeURIComponent(conversationId)}`
      notification.close()
    }
  }, [])

  const pollNotificationFallback = useCallback(async (options?: { notify?: boolean }) => {
    if (!currentUserId) return

    try {
      const [chatResponse, networkResponse] = await Promise.all([
        fetch('/api/chat/conversations', { cache: 'no-store' }),
        fetch('/api/network/connections', { cache: 'no-store' }),
      ])

      if (!chatResponse.ok || !networkResponse.ok) {
        return
      }

      const [chatData, networkData] = await Promise.all([
        chatResponse.json(),
        networkResponse.json(),
      ])

      const conversations = Array.isArray(chatData?.conversations)
        ? chatData.conversations as NotificationConversationSummary[]
        : []
      const incomingSparks = Array.isArray(networkData?.incomingSparks)
        ? networkData.incomingSparks as IncomingSparkSummary[]
        : []

      const totalUnread = conversations.reduce((sum, conversation) => {
        const unread = Number(conversation?.unreadCount ?? 0)
        if (!Number.isFinite(unread) || unread <= 0) return sum
        return sum + unread
      }, 0)
      setUnreadPulseCount(totalUnread)

      const shouldNotify = options?.notify === true && fallbackHydratedRef.current
      const nextUnreadByConversation: Record<string, number> = {}

      for (const conversation of conversations) {
        const conversationId = typeof conversation?.id === 'string' ? conversation.id : ''
        if (!conversationId) continue

        const unread = Number(conversation?.unreadCount ?? 0)
        const unreadCount = Number.isFinite(unread) && unread > 0 ? unread : 0
        nextUnreadByConversation[conversationId] = unreadCount

        if (!shouldNotify || isOnPulseChatRef.current) continue

        const previousUnread = Number(unreadByConversationRef.current[conversationId] ?? 0)
        if (unreadCount <= previousUnread || unreadCount <= 0) {
          continue
        }

        const senderName = conversation.peer?.name || 'a contact'
        const fallbackPreview = `${unreadCount - previousUnread} new message${unreadCount - previousUnread > 1 ? 's' : ''}`
        const preview = typeof conversation?.lastMessageText === 'string' && conversation.lastMessageText.trim().length > 0
          ? conversation.lastMessageText.trim().slice(0, 90)
          : fallbackPreview

        toast(`${senderName} sent a message`, {
          description: preview,
          action: {
            label: 'Open',
            onClick: () => {
              window.location.href = `/dashboard/chats?conversation=${encodeURIComponent(conversationId)}`
            },
          },
        })

        maybeShowBrowserNotification(
          `New message from ${senderName}`,
          preview,
          conversationId
        )
      }

      const nextIncomingSparks: Record<string, IncomingSparkSummary> = {}
      for (const spark of incomingSparks) {
        const connectionId = typeof spark?.connectionId === 'string' ? spark.connectionId : ''
        if (!connectionId) continue
        nextIncomingSparks[connectionId] = spark
      }

      if (shouldNotify) {
        const newSparks = Object.keys(nextIncomingSparks)
          .filter((connectionId) => !incomingSparkIdsRef.current[connectionId])
          .slice(0, 3)

        for (const connectionId of newSparks) {
          const spark = nextIncomingSparks[connectionId]
          const name = typeof spark?.peerName === 'string' && spark.peerName.trim().length > 0
            ? spark.peerName.trim()
            : 'a developer'
          toast.success(`New Link Spark from ${name}`)
        }
      }

      unreadByConversationRef.current = nextUnreadByConversation
      incomingSparkIdsRef.current = nextIncomingSparks
      fallbackHydratedRef.current = true
    } catch (error) {
      console.error('Notification fallback polling failed:', error)
    }
  }, [currentUserId, maybeShowBrowserNotification])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleDesktopLogoClick = () => {
    setIsDesktopCollapsed((current) => !current)
    setIsDesktopHovering(false)
  }

  const handleEnableBrowserAlerts = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Browser notifications are not supported here')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        toast.success('Browser notifications enabled')
        return
      }

      if (permission === 'denied') {
        toast.error('Notifications are blocked. Enable them from browser site settings.')
        return
      }

      toast('Notification permission dismissed')
    } catch (error) {
      console.error('Notification permission request failed:', error)
      toast.error('Unable to enable notifications')
    }
  }, [])

  const formatUnreadCount = (count: number) => {
    if (count > 99) return '99+'
    return `${count}`
  }

  useEffect(() => {
    if (!currentUserId) return

    const handleVisibilitySync = () => {
      if (document.visibilityState !== 'visible') return
      if (notificationSocketConnected) {
        fetchUnreadCount()
        return
      }

      pollNotificationFallback({ notify: false })
    }

    if (notificationSocketConnected) {
      fetchUnreadCount()
    } else {
      pollNotificationFallback({ notify: false })
    }

    window.addEventListener('focus', handleVisibilitySync)
    document.addEventListener('visibilitychange', handleVisibilitySync)

    return () => {
      window.removeEventListener('focus', handleVisibilitySync)
      document.removeEventListener('visibilitychange', handleVisibilitySync)
    }
  }, [currentUserId, fetchUnreadCount, notificationSocketConnected, pollNotificationFallback])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!currentUserId) return

    const supported = 'Notification' in window
    setNotificationsSupported(supported)

    if (!supported) return
    setNotificationPermission(Notification.permission)
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) return

    let mounted = true
    let detachSocketHandlers: (() => void) | null = null

    const onRefreshUnread = () => {
      fetchUnreadCount()
    }

    const setupSocket = async () => {
      try {
        const socket = await connectChatSocket()
        if (!mounted) return

        const handleConversationUpdate = (payload: {
          conversationId: string
          lastMessageText: string
          lastMessageAt: string
          lastMessageSenderId: string
          senderName: string
        }) => {
          fetchUnreadCount()

          const isIncoming = payload.lastMessageSenderId !== currentUserId
          if (!isIncoming || isOnPulseChatRef.current) {
            return
          }

          const preview = payload.lastMessageText.length > 90
            ? `${payload.lastMessageText.slice(0, 90)}...`
            : payload.lastMessageText

          toast(`${payload.senderName} sent a message`, {
            description: preview,
            action: {
              label: 'Open',
              onClick: () => {
                window.location.href = `/dashboard/chats?conversation=${encodeURIComponent(payload.conversationId)}`
              },
            },
          })

          maybeShowBrowserNotification(
            `New message from ${payload.senderName}`,
            preview || 'Open Pulse Chat to respond.',
            payload.conversationId
          )
        }

        const handleRead = () => {
          fetchUnreadCount()
        }

        const handleConnect = () => {
          setNotificationSocketConnected(true)
          fallbackHydratedRef.current = false
          fetchUnreadCount()
        }

        const handleDisconnect = () => {
          setNotificationSocketConnected(false)
          fallbackHydratedRef.current = false
        }

        socket.on('chat:conversation:update', handleConversationUpdate)
        socket.on('chat:read', handleRead)
        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)
        setNotificationSocketConnected(socket.connected)

        detachSocketHandlers = () => {
          socket.off('chat:conversation:update', handleConversationUpdate)
          socket.off('chat:read', handleRead)
          socket.off('connect', handleConnect)
          socket.off('disconnect', handleDisconnect)
        }
      } catch (error) {
        console.error('Notification socket init failed:', error)
        setNotificationSocketConnected(false)
        fallbackHydratedRef.current = false
      }
    }

    window.addEventListener(CHAT_UNREAD_REFRESH_EVENT, onRefreshUnread)
    setupSocket()

    return () => {
      mounted = false
      window.removeEventListener(CHAT_UNREAD_REFRESH_EVENT, onRefreshUnread)
      if (detachSocketHandlers) {
        detachSocketHandlers()
      }
      setNotificationSocketConnected(false)
      fallbackHydratedRef.current = false
      disconnectChatSocket()
    }
  }, [currentUserId, fetchUnreadCount, maybeShowBrowserNotification])

  useEffect(() => {
    if (!currentUserId || notificationSocketConnected) return

    const runPollingSnapshot = () => {
      pollNotificationFallback({ notify: fallbackHydratedRef.current })
    }

    runPollingSnapshot()

    const interval = window.setInterval(() => {
      runPollingSnapshot()
    }, 20000)

    return () => {
      window.clearInterval(interval)
    }
  }, [currentUserId, notificationSocketConnected, pollNotificationFallback])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-black/60 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className={`fixed inset-y-0 left-0 flex w-full max-w-xs transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col w-full bg-card shadow-xl">
            <div className="flex items-center justify-between h-16 px-6 border-b border-border">
              <div className="flex items-center">
                <Code className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-foreground">DevLink</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  {(() => {
                    const isPulseChatItem = item.href === '/dashboard/chats'
                    const showUnread = isPulseChatItem && unreadPulseCount > 0

                    return (
                  <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activePathname === item.href
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {showUnread ? (
                        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                          {formatUnreadCount(unreadPulseCount)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                    )
                  })()}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      {isDesktopCollapsed && !isDesktopHovering ? (
        <div
          className="hidden lg:block fixed inset-y-0 left-0 z-20 w-3"
          onMouseEnter={() => setIsDesktopHovering(true)}
          aria-hidden
        />
      ) : null}

      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-[width] duration-200 ${
          isDesktopExpanded ? 'lg:w-64' : 'lg:w-16'
        }`}
        onMouseEnter={() => {
          if (isDesktopCollapsed) setIsDesktopHovering(true)
        }}
        onMouseLeave={() => {
          if (isDesktopCollapsed) setIsDesktopHovering(false)
        }}
      >
        <div className="flex flex-col flex-grow bg-card shadow-sm border-r border-border overflow-hidden">
          <button
            type="button"
            onClick={handleDesktopLogoClick}
            className={`flex items-center h-16 border-b border-border transition-[padding] duration-200 hover:bg-muted/40 ${
              isDesktopExpanded ? 'px-6 justify-start' : 'px-0 justify-center'
            }`}
            aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Code className="h-8 w-8 text-blue-600 shrink-0" />
            {isDesktopExpanded ? (
              <span className="ml-2 text-xl font-bold text-foreground whitespace-nowrap">DevLink</span>
            ) : null}
          </button>
          <div className="sr-only" aria-live="polite">
            {isDesktopCollapsed ? 'Sidebar collapsed' : 'Sidebar expanded'}
          </div>
          
          <nav className={`flex-1 py-6 space-y-2 transition-[padding] duration-200 ${isDesktopExpanded ? 'px-4' : 'px-2'}`}>
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                {(() => {
                  const isPulseChatItem = item.href === '/dashboard/chats'
                  const showUnread = isPulseChatItem && unreadPulseCount > 0

                  return (
                <div className={`relative flex items-center rounded-lg text-sm font-medium transition-colors ${
                  isDesktopExpanded ? 'px-3 py-2 justify-start' : 'px-0 py-2 justify-center'
                } ${
                  activePathname === item.href
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>
                  <item.icon className={`h-5 w-5 shrink-0 ${isDesktopExpanded ? 'mr-3' : ''}`} />
                  {isDesktopExpanded ? (
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span>{item.name}</span>
                      {showUnread ? (
                        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                          {formatUnreadCount(unreadPulseCount)}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {!isDesktopExpanded && showUnread ? (
                    <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  ) : null}
                </div>
                  )
                })()}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-[padding] duration-200 ${isDesktopCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-card shadow-sm border-b border-border">
          <button
            type="button"
            className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 lg:px-6">
            <div className="flex items-center">
              {/* Breadcrumb or page title could go here */}
            </div>
            
            <div className="flex items-center gap-4">
              <SimpleThemeToggle />
              {notificationsSupported && notificationPermission !== 'granted' ? (
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleEnableBrowserAlerts}>
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Enable Alerts</span>
                </Button>
              ) : null}
              <Link href={`/${username ?? ''}`} target="_blank">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">View Portfolio</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userImage} />
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{session?.user?.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/customise">
                      <Palette className="mr-2 h-4 w-4" />
                      Customise
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="p-6 lg:p-8">
            <div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
