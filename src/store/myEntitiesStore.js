import { create } from 'zustand'
import { actorApi } from '../api/actorApi'
import { tribeApi } from '../api/tribeApi'
import { personalityCardApi } from '../api/personalityCardApi'

const sortEntitiesByDormant = (list) => {
  if (!Array.isArray(list) || list.length <= 1) return list || []
  return [...list].sort((a, b) => {
    const aDormant = Boolean(a?.isDormant ?? a?.IsDormant ?? false) ? 1 : 0
    const bDormant = Boolean(b?.isDormant ?? b?.IsDormant ?? false) ? 1 : 0
    return aDormant - bDormant
  })
}

const useMyEntitiesStore = create((set, get) => ({
  myBots: [],
  myTribes: [],
  myCards: [],
  myFollowData: { followers: [], following: [] },
  mySettings: null,
  isLoadingBots: false,
  isLoadingTribes: false,
  isLoadingCards: false,
  isLoadingFollowData: false,
  isLoadingSettings: false,
  hasFetchedOnce: false,

  fetchMyBots: async () => {
    try {
      set({ isLoadingBots: true })
      const res = await actorApi.getMyBots()
      const sorted = sortEntitiesByDormant(res.data?.data || [])
      set({ myBots: sorted, isLoadingBots: false, hasFetchedOnce: true })
    } catch (error) {
      console.error('Error fetching my bots:', error)
      set({ isLoadingBots: false })
    }
  },

  fetchMyTribes: async () => {
    try {
      set({ isLoadingTribes: true })
      const res = await tribeApi.getMyTribes()
      const sorted = sortEntitiesByDormant(res.data?.data || [])
      set({ myTribes: sorted, isLoadingTribes: false, hasFetchedOnce: true })
    } catch (error) {
      console.error('Error fetching my tribes:', error)
      set({ isLoadingTribes: false })
    }
  },

  fetchMyCards: async () => {
    try {
      set({ isLoadingCards: true })
      const res = await personalityCardApi.getMyCardIds()
      set({ myCards: res.data?.data || [], isLoadingCards: false, hasFetchedOnce: true })
    } catch (error) {
      console.error('Error fetching my cards:', error)
      set({ isLoadingCards: false })
    }
  },

  fetchMyFollowData: async () => {
    try {
      set({ isLoadingFollowData: true })
      const res = await actorApi.getFollowData()
      const payload = res.data?.data || {}
      const followers = payload.followers || payload.Followers || []
      const following = payload.following || payload.Following || []
      console.log('[myEntitiesStore] fetchMyFollowData response:', payload)
      set({ myFollowData: { followers, following }, isLoadingFollowData: false })
    } catch (error) {
      console.error('Error fetching follow data:', error)
      set({ isLoadingFollowData: false })
    }
  },

  fetchMySettings: async () => {
    try {
      set({ isLoadingSettings: true })
      const res = await actorApi.getUserSettings()
      set({ mySettings: res.data?.data || null, isLoadingSettings: false, hasFetchedOnce: true })
    } catch (error) {
      console.error('Error fetching my user settings:', error)
      set({ isLoadingSettings: false })
    }
  },

  addFollowing: (actorId) =>
    set((state) => ({
      myFollowData: {
        ...state.myFollowData,
        following: [...state.myFollowData.following, actorId],
      },
    })),

  removeFollowing: (actorId) =>
    set((state) => ({
      myFollowData: {
        ...state.myFollowData,
        following: state.myFollowData.following.filter((id) => id !== actorId),
      },
    })),

  refreshAll: async () => {
    await Promise.all([
      get().fetchMyBots(),
      get().fetchMyTribes(),
      get().fetchMyFollowData(),
      get().fetchMyCards(),
      get().fetchMySettings(),
    ])
  },

  clear: () =>
    set({
      myBots: [],
      myTribes: [],
      myCards: [],
      myFollowData: { followers: [], following: [] },
      mySettings: null,
      hasFetchedOnce: false,
    }),
}))

export default useMyEntitiesStore
