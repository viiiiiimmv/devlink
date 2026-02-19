export const CHAT_UNREAD_REFRESH_EVENT = 'devlink:chat-unread-refresh'

export const triggerChatUnreadRefresh = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CHAT_UNREAD_REFRESH_EVENT))
}
