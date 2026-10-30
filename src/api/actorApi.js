import api from './axios'

// ─── Actor API ────────────────────────────────────────────────────────────────

export const actorApi = {
  // ─── Profile ─────────────────────────────────────────────────────────────
  getProfile: (actorId) => api.get(`/actor/profile/${actorId}`),

  getProfileEntries: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/entries`, { params: { page } }),

  getProfilePosts: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/posts`, { params: { page } }),

  getProfileLikes: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/likes`, { params: { page } }),

  getProfileFollowers: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/followers`, { params: { page } }),

  getProfileFollowing: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/following`, { params: { page } }),

  // ─── Hierarchy ───────────────────────────────────────────────────────────
  getParentHierarchy: (actorId, depth = 1) =>
    api.get(`/actor/minimal-parent-hierarchy/${actorId}`, { params: { depth } }),

  getChildHierarchy: (actorId, depth = 3) =>
    api.get(`/actor/minimal-child-hierarchy/${actorId}`, { params: { depth } }),

  // ─── Follow ──────────────────────────────────────────────────────────────
  getFollowData: () => api.get('/actor/follow-data'),

  follow: (actorId) => api.post(`/actor/follow/${actorId}`),

  unfollow: (actorId) => api.delete(`/actor/unfollow/${actorId}`),

  // ─── Activities ──────────────────────────────────────────────────────────
  getActivities: (actorId, page = 1) => api.get('/actor/activities', { params: { actorId, page } }),

  getUnreadActivityCount: () => api.get('/actor/activities/unread-count'),

  markActivitiesRead: (activityIds) => api.post('/actor/activities/mark-read', activityIds),

  markAllActivitiesRead: () => api.post('/actor/activities/mark-all-read'),

  // ─── Favourites ──────────────────────────────────────────────────────────
  getFavouriteContentItemIds: () => api.get('/actor/favourites/ids'),

  addFavourite: (contentItemId) => api.post(`/actor/favourites/${contentItemId}`),

  removeFavourite: (contentItemId) => api.delete(`/actor/favourites/${contentItemId}`),

  getProfileFavourites: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/favourites`, { params: { page } }),

  loadActors: (page = 1, query = '', orderType = '', startDate = null, endDate = null, topicType = '') => {
    const topicTypes = Array.isArray(topicType) ? topicType.filter(Boolean) : topicType ? [topicType] : []
    return api.get('/actor/load', {
      params: {
        page,
        query: query || undefined,
        orderType: orderType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        topicType: topicTypes.length ? topicTypes : undefined,
      },
      paramsSerializer: { indexes: null },
    })
  },

  // ─── Bot ─────────────────────────────────────────────────────────────────
  createBot: (dto) => api.post('/actor/create-bot', dto),

  editBot: (botId, dto) => api.put(`/actor/edit-bot/${botId}`, dto),

  deleteBot: (botId) => api.delete(`/actor/delete-bot/${botId}`),

  // ─── User Profile Edit ───────────────────────────────────────────────────
  editUser: (dto) => api.put('/actor/edit-user', dto),

  // ─── My Bots ─────────────────────────────────────────────────────────────
  getMyBots: () => api.get('/actor/my-bots'),

  // ─── Memory ──────────────────────────────────────────────────────────────
  getFullMemory: (actorId) => api.get(`/actor/full-memory/${actorId}`),

  // ─── News Pool ───────────────────────────────────────────────────────────
  enrichNewsPool: (content) =>
    api.post('/actor/enrich-news-pool', JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json' },
    }),

  // ─── Debate ──────────────────────────────────────────────────────────────
  triggerDebate: (dto) => api.post('/actor/trigger-debate', dto),

  acceptDebate: (debateId) => api.post(`/actor/accept-debate/${debateId}`),

  declineDebate: (debateId) => api.post(`/actor/decline-debate/${debateId}`),

  getDebates: (actorId, page = 1) => api.get('/actor/debates', { params: { actorId, page } }),

  getTodayDebates: () => api.get('/actor/debates/today'),

  getMyDebates: (actorId, page = 1) => api.get('/actor/my-debates', { params: { actorId, page } }),

  getDebateById: (debateId) => api.get(`/actor/debate/${debateId}`),

  // ─── Settings ────────────────────────────────────────────────────────────
  getUserSettings: () => api.get('/actor/user-settings'),

  getBotSettings: (botId) => api.get(`/actor/bot-settings/${botId}`),

  // ─── Theme ───────────────────────────────────────────────────────────────
  selectTheme: (theme, targetActorId = null) =>
    api.put(`/actor/select-theme/${theme}`, null, {
      params: targetActorId ? { targetActorId } : {},
    }),
}
