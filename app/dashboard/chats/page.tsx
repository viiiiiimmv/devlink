'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, MessageCircle, Send, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { connectChatSocket, getChatSocket } from '@/lib/socket-client'
import { triggerChatUnreadRefresh } from '@/lib/chat-events'
import { toast } from 'sonner'

type Conversation = {
  id: string
  isDirect: boolean
  peer: {
    userId: string
    username: string
    name: string
    image?: string
  } | null
  participants: Array<{
    userId: string
    username: string
    name: string
    image?: string
  }>
  lastMessageText: string
  lastMessageAt: string
  unreadCount: number
  updatedAt: string
}

type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  senderName: string
  senderImage?: string
  body: string
  createdAt: string
  isOwnMessage: boolean
  isRead: boolean
}

type IncomingSocketMessage = Omit<ChatMessage, 'isOwnMessage' | 'isRead'> & {
  isOwnMessage?: boolean
  isRead?: boolean
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'
}

const normalizeIsoDate = (value: unknown): string => {
  if (typeof value === 'string') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  return new Date().toISOString()
}

const sortConversationsByActivity = (items: Conversation[]) => {
  return [...items].sort((first, second) => {
    const firstValue = new Date(first.lastMessageAt || first.updatedAt).getTime()
    const secondValue = new Date(second.lastMessageAt || second.updatedAt).getTime()
    return secondValue - firstValue
  })
}

function ChatsPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  const currentUserId = typeof session?.user?.id === 'string' ? session.user.id : ''

  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({})
  const [messageBody, setMessageBody] = useState('')
  const [sending, setSending] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  )

  const selectedMessages = useMemo(
    () => (selectedConversationId ? (messagesByConversation[selectedConversationId] || []) : []),
    [messagesByConversation, selectedConversationId]
  )

  const scrollMessagesToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])

  const fetchConversations = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoadingConversations(true)
      }
      const response = await fetch('/api/chat/conversations', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      const incoming = (Array.isArray(data?.conversations) ? data.conversations : []) as Conversation[]

      const mapped = incoming.map((item: Conversation) => ({
        ...item,
        lastMessageAt: normalizeIsoDate(item.lastMessageAt || item.updatedAt),
        updatedAt: normalizeIsoDate(item.updatedAt),
      })) as Conversation[]

      setConversations(sortConversationsByActivity(mapped))
      triggerChatUnreadRefresh()
    } catch (error) {
      console.error(error)
      if (!options?.silent) {
        toast.error('Unable to load chats right now')
      }
    } finally {
      if (!options?.silent) {
        setLoadingConversations(false)
      }
    }
  }, [])

  const markConversationRead = useCallback(async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
      })

      setConversations((previous) => previous.map((conversation) => {
        if (conversation.id !== conversationId) return conversation
        return {
          ...conversation,
          unreadCount: 0,
        }
      }))
      triggerChatUnreadRefresh()
    } catch (error) {
      console.error('Failed to mark conversation as read', error)
    }
  }, [])

  const fetchMessages = useCallback(async (
    conversationId: string,
    options?: { silent?: boolean; forceMarkRead?: boolean }
  ) => {
    try {
      if (!options?.silent) {
        setLoadingMessages(true)
      }
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages?limit=80`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      const incomingMessages = (Array.isArray(data?.messages) ? data.messages : []) as ChatMessage[]

      const mappedMessages = incomingMessages.map((message: ChatMessage) => ({
        ...message,
        createdAt: normalizeIsoDate(message.createdAt),
        isOwnMessage: Boolean(message.isOwnMessage),
        isRead: Boolean(message.isRead),
      })) as ChatMessage[]

      setMessagesByConversation((previous) => ({
        ...previous,
        [conversationId]: mappedMessages,
      }))

      const hasUnreadIncoming = mappedMessages.some((message) => !message.isOwnMessage && !message.isRead)
      if (options?.forceMarkRead || hasUnreadIncoming) {
        await markConversationRead(conversationId)
      }

      if (!options?.silent) {
        window.requestAnimationFrame(scrollMessagesToBottom)
      }
    } catch (error) {
      console.error(error)
      if (!options?.silent) {
        toast.error('Unable to load messages')
      }
    } finally {
      if (!options?.silent) {
        setLoadingMessages(false)
      }
    }
  }, [markConversationRead, scrollMessagesToBottom])

  const selectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId)
    await fetchMessages(conversationId, { forceMarkRead: true })
  }, [fetchMessages])

  const upsertConversationPreview = useCallback((payload: {
    conversationId: string
    messageText: string
    messageAt: string
    senderId: string
    incrementUnread: boolean
  }) => {
    setConversations((previous) => {
      const updated = previous.map((conversation) => {
        if (conversation.id !== payload.conversationId) {
          return conversation
        }

        return {
          ...conversation,
          lastMessageText: payload.messageText,
          lastMessageAt: payload.messageAt,
          updatedAt: payload.messageAt,
          unreadCount: payload.incrementUnread ? conversation.unreadCount + 1 : 0,
        }
      })

      return sortConversationsByActivity(updated)
    })
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (conversations.length === 0) return
    if (selectedConversationId) return

    const requestedConversationId = searchParams?.get('conversation')
    const requestedConversation = requestedConversationId
      ? conversations.find((conversation) => conversation.id === requestedConversationId)
      : null

    const defaultConversation = requestedConversation || conversations[0]
    if (defaultConversation) {
      selectConversation(defaultConversation.id)
    }
  }, [conversations, searchParams, selectedConversationId, selectConversation])

  useEffect(() => {
    let mounted = true
    let detachHandlers: (() => void) | null = null

    const initSocket = async () => {
      try {
        const socket = await connectChatSocket()
        if (!mounted) return

        const syncConnectedState = () => {
          setSocketConnected(socket.connected)
        }

        syncConnectedState()
        socket.on('connect', syncConnectedState)
        socket.on('disconnect', syncConnectedState)

        detachHandlers = () => {
          socket.off('connect', syncConnectedState)
          socket.off('disconnect', syncConnectedState)
        }
      } catch (error) {
        console.error(error)
        if (!mounted) return
        setSocketConnected(false)
      }
    }

    initSocket()

    return () => {
      mounted = false
      if (detachHandlers) {
        detachHandlers()
      }
    }
  }, [])

  useEffect(() => {
    const socket = getChatSocket()
    if (!socket) {
      return
    }

    const handleIncomingMessage = (payload: {
      conversationId: string
      message: IncomingSocketMessage
    }) => {
      const normalizedMessage: ChatMessage = {
        ...payload.message,
        createdAt: normalizeIsoDate(payload.message.createdAt),
        isOwnMessage: Boolean(payload.message.isOwnMessage),
        isRead: Boolean(payload.message.isRead),
      }

      setMessagesByConversation((previous) => {
        const existing = previous[payload.conversationId] || []
        if (existing.some((message) => message.id === normalizedMessage.id)) {
          return previous
        }

        return {
          ...previous,
          [payload.conversationId]: [...existing, normalizedMessage],
        }
      })

      const incrementUnread = payload.conversationId !== selectedConversationId && normalizedMessage.senderId !== currentUserId
      upsertConversationPreview({
        conversationId: payload.conversationId,
        messageText: normalizedMessage.body,
        messageAt: normalizedMessage.createdAt,
        senderId: normalizedMessage.senderId,
        incrementUnread,
      })
      triggerChatUnreadRefresh()

      if (payload.conversationId === selectedConversationId && normalizedMessage.senderId !== currentUserId) {
        markConversationRead(payload.conversationId)
        window.requestAnimationFrame(scrollMessagesToBottom)
      }
    }

    const handleConversationUpdate = (payload: {
      conversationId: string
      lastMessageText: string
      lastMessageAt: string
      lastMessageSenderId: string
      senderName: string
    }) => {
      const incrementUnread = payload.conversationId !== selectedConversationId && payload.lastMessageSenderId !== currentUserId
      upsertConversationPreview({
        conversationId: payload.conversationId,
        messageText: payload.lastMessageText,
        messageAt: normalizeIsoDate(payload.lastMessageAt),
        senderId: payload.lastMessageSenderId,
        incrementUnread,
      })
      triggerChatUnreadRefresh()
    }

    socket.on('chat:message', handleIncomingMessage)
    socket.on('chat:conversation:update', handleConversationUpdate)

    return () => {
      socket.off('chat:message', handleIncomingMessage)
      socket.off('chat:conversation:update', handleConversationUpdate)
    }
  }, [currentUserId, markConversationRead, scrollMessagesToBottom, selectedConversationId, socketConnected, upsertConversationPreview])

  useEffect(() => {
    const socket = getChatSocket()
    if (!socket || !socketConnected || !selectedConversationId) {
      return
    }

    socket.emit('chat:join-conversation', selectedConversationId)

    return () => {
      socket.emit('chat:leave-conversation', selectedConversationId)
    }
  }, [selectedConversationId, socketConnected])

  useEffect(() => {
    if (selectedMessages.length === 0) return
    window.requestAnimationFrame(scrollMessagesToBottom)
  }, [selectedMessages, scrollMessagesToBottom])

  useEffect(() => {
    const handleVisibilitySync = () => {
      if (document.visibilityState !== 'visible') return
      fetchConversations({ silent: true })
      if (selectedConversationId) {
        fetchMessages(selectedConversationId, {
          silent: true,
          forceMarkRead: true,
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilitySync)
    window.addEventListener('focus', handleVisibilitySync)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilitySync)
      window.removeEventListener('focus', handleVisibilitySync)
    }
  }, [fetchConversations, fetchMessages, selectedConversationId])

  useEffect(() => {
    if (socketConnected) return

    const interval = window.setInterval(() => {
      fetchConversations({ silent: true })
      if (selectedConversationId) {
        fetchMessages(selectedConversationId, {
          silent: true,
          forceMarkRead: true,
        })
      }
    }, 15000)

    return () => {
      window.clearInterval(interval)
    }
  }, [fetchConversations, fetchMessages, selectedConversationId, socketConnected])

  const sendMessageOverRealtime = useCallback(async (
    conversationId: string,
    body: string
  ): Promise<ChatMessage | null> => {
    const socket = getChatSocket()
    if (!socket || !socket.connected) {
      return null
    }

    return new Promise<ChatMessage>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('Realtime send timeout'))
      }, 7000)

      socket.emit('chat:send-message', { conversationId, body }, (response) => {
        window.clearTimeout(timeout)

        if (!response.ok) {
          reject(new Error(response.error || 'Failed to send message'))
          return
        }

        const normalized: ChatMessage = {
          ...response.message,
          createdAt: normalizeIsoDate(response.message.createdAt),
          isOwnMessage: Boolean(response.message.isOwnMessage),
          isRead: Boolean(response.message.isRead),
        }

        resolve(normalized)
      })
    })
  }, [])

  const sendMessage = async () => {
    if (!selectedConversationId) return

    const normalizedBody = messageBody.trim()
    if (!normalizedBody) return

    try {
      setSending(true)
      let normalizedMessage: ChatMessage | null = null

      try {
        normalizedMessage = await sendMessageOverRealtime(selectedConversationId, normalizedBody)
      } catch (realtimeError) {
        console.warn('Realtime send failed, using API fallback:', realtimeError)
      }

      if (!normalizedMessage) {
        const response = await fetch(`/api/chat/conversations/${selectedConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: normalizedBody }),
        })

        const data = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to send message')
        }

        const fallbackMessage = data?.message as ChatMessage | undefined
        if (fallbackMessage?.id) {
          normalizedMessage = {
            ...fallbackMessage,
            createdAt: normalizeIsoDate(fallbackMessage.createdAt),
            isOwnMessage: Boolean(fallbackMessage.isOwnMessage),
            isRead: Boolean(fallbackMessage.isRead),
          }
        }
      }

      if (normalizedMessage?.id) {
        const messageToInsert = normalizedMessage
        triggerChatUnreadRefresh()

        setMessagesByConversation((previous) => {
          const existing = previous[selectedConversationId] || []
          if (existing.some((message) => message.id === messageToInsert.id)) {
            return previous
          }

          return {
            ...previous,
            [selectedConversationId]: [...existing, messageToInsert],
          }
        })

        upsertConversationPreview({
          conversationId: selectedConversationId,
          messageText: messageToInsert.body,
          messageAt: messageToInsert.createdAt,
          senderId: messageToInsert.senderId,
          incrementUnread: false,
        })
      }

      setMessageBody('')
      window.requestAnimationFrame(scrollMessagesToBottom)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send message')
    } finally {
      setSending(false)
    }
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pulse Chat</h1>
          <p className="text-sm text-muted-foreground">
            Real-time messaging for your Code Circle powered by secure websockets.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              Conversations
            </CardTitle>
            <CardDescription>
              {socketConnected ? 'Realtime is connected' : 'Realtime is reconnecting'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <div className="rounded-lg border border-border">
                {loadingConversations ? (
                  <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading chats...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex h-80 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <Users className="h-6 w-6" />
                    <p>No chats yet.</p>
                    <p>Start from the Talent Network and connect first.</p>
                  </div>
                ) : (
                  <div className="max-h-[65vh] overflow-y-auto">
                    {conversations.map((conversation) => {
                      const isSelected = conversation.id === selectedConversationId
                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          className={`w-full border-b border-border p-3 text-left transition-colors ${
                            isSelected ? 'bg-muted/70' : 'hover:bg-muted/40'
                          }`}
                          onClick={() => selectConversation(conversation.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={conversation.peer?.image} />
                              <AvatarFallback>{getInitials(conversation.peer?.name || 'User')}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium">{conversation.peer?.name || 'Conversation'}</p>
                                {conversation.unreadCount > 0 ? (
                                  <Badge variant="default" className="h-5 rounded-full px-2 text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">@{conversation.peer?.username || 'team'}</p>
                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {conversation.lastMessageText || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border">
                {!selectedConversation ? (
                  <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                    Choose a conversation to start chatting.
                  </div>
                ) : (
                  <div className="flex h-[65vh] flex-col">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={selectedConversation.peer?.image} />
                          <AvatarFallback>{getInitials(selectedConversation.peer?.name || 'User')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{selectedConversation.peer?.name || 'Conversation'}</p>
                          <p className="text-xs text-muted-foreground">@{selectedConversation.peer?.username || 'team'}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Pulse Chat</Badge>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading messages...
                        </div>
                      ) : selectedMessages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Send the first message.
                        </div>
                      ) : (
                        selectedMessages.map((message) => {
                          const isOwn = message.senderId === currentUserId || message.isOwnMessage

                          return (
                            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isOwn
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-muted text-foreground'
                              }`}>
                                {!isOwn ? (
                                  <p className="mb-1 text-xs font-medium opacity-80">{message.senderName}</p>
                                ) : null}
                                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                                <p className={`mt-1 text-[11px] ${isOwn ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-border p-3">
                      <div className="flex items-end gap-2">
                        <Textarea
                          value={messageBody}
                          onChange={(event) => setMessageBody(event.target.value)}
                          onKeyDown={handleComposerKeyDown}
                          placeholder="Type your message..."
                          className="min-h-[50px] resize-none"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={sending || messageBody.trim().length === 0}
                          className="h-[50px] px-4"
                        >
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading chats...</div>}>
      <ChatsPageContent />
    </Suspense>
  )
}
