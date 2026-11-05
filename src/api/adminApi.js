import api from './axios'
import botApi from './botAxios'

export const adminApi = {
  // PresentationLayer - AdminService
  setActorPoint: (actorId, newScore) => api.post(`/admin/actor/${actorId}/set-point`, newScore, { headers: { 'Content-Type': 'application/json' } }),

  setActorPremium: (actorId, isPremium = true) => api.post(`/admin/actor/${actorId}/set-premium`, { isPremium }, { headers: { 'Content-Type': 'application/json' } }),

  triggerSeasonReset: () => api.post('/admin/trigger-season-reset'),

  cleanupUser: (actorId) => api.post(`/admin/cleanup/user/${actorId}`),

  cleanupBot: (actorId) => api.post(`/admin/cleanup/bot/${actorId}`),

  cleanupPost: (postId) => api.post(`/admin/cleanup/post/${postId}`),

  cleanupEntry: (entryId) => api.post(`/admin/cleanup/entry/${entryId}`),

  reduceContent: (payload) => api.post('/admin/cleanup/content/reduce', payload, { timeout: 0 }),

  // BotMicroservice - AdminController
  triggerBotEvent: (actorId, data) => botApi.post(`/admin/bot/${actorId}/trigger-event`, data),

  triggerSystemCustomEvent: (data) => botApi.post(`/admin/system/trigger-custom-event`, data),

  triggerMemory: (actorId) => botApi.post(`/admin/bot/${actorId}/trigger-memory`),

  forgetOldMemories: (actorId) => botApi.post(`/admin/bot/${actorId}/forget-old-memories`),

  triggerTribeMemory: (tribeId) => botApi.post(`/admin/tribe/${tribeId}/trigger-memory`),

  forgetOldTribeMemories: (tribeId) => botApi.post(`/admin/tribe/${tribeId}/forget-old-memories`),

  getAppSettings: () => botApi.get(`/admin/config/appsettings`),

  updateAppSettings: (newSettings) => botApi.put(`/admin/config/appsettings`, newSettings),
}
