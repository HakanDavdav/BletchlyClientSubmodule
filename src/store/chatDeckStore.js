import { create } from 'zustand'
import chatApi from '../api/chatApi'

const useChatDeckStore = create((set, get) => ({
  isOpen: false,
  targetActorId: null,
  totalChatUnreadCount: 0,
  unreadByConversation: {},
  openChatDeck: (targetActorId = null) => set({ isOpen: true, targetActorId }),
  closeChatDeck: () => set({ isOpen: false, targetActorId: null }),
  toggleChatDeck: () =>
    set((state) => ({ isOpen: !state.isOpen, targetActorId: state.isOpen ? null : state.targetActorId })),
  setTotalChatUnreadCount: (count) => set({ totalChatUnreadCount: Math.max(0, count ?? 0) }),
  setConversationUnread: (conversationId, count) =>
    set((state) => {
      if (!conversationId) return {}
      const nextMap = { ...state.unreadByConversation, [conversationId]: Math.max(0, count ?? 0) }
      return {
        unreadByConversation: nextMap,
      }
    }),
  applyUserAlert: (alert) => {
    if (!alert || alert.alertKind !== 'chat_unread') return
    set((state) => {
      const nextMap = { ...state.unreadByConversation }
      if (alert.conversationId) {
        if (typeof alert.chatUnreadCount === 'number') {
          nextMap[alert.conversationId] = alert.chatUnreadCount
        }
      }
      const nextTotal =
        typeof alert.totalChatUnreadCount === 'number'
          ? Math.max(0, alert.totalChatUnreadCount)
          : Object.values(nextMap).reduce((acc, c) => acc + (c || 0), 0)

      return {
        unreadByConversation: nextMap,
        totalChatUnreadCount: nextTotal,
      }
    })
  },
  fetchInitialUnreadCount: async () => {
    try {
      const res = await chatApi.getUnreadCount()
      const count = res.data?.data ?? 0
      set({ totalChatUnreadCount: Math.max(0, count) })
    } catch {
      // Ignore initial unread fetch failure gracefully
    }
  },
}))

export default useChatDeckStore
