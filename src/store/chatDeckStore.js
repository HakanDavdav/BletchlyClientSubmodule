import { create } from 'zustand'

const useChatDeckStore = create((set) => ({
  isOpen: false,
  targetActorId: null,
  openChatDeck: (targetActorId = null) => set({ isOpen: true, targetActorId }),
  closeChatDeck: () => set({ isOpen: false }),
  toggleChatDeck: () =>
    set((state) => ({ isOpen: !state.isOpen, targetActorId: state.isOpen ? state.targetActorId : null })),
}))

export default useChatDeckStore
