import api from './axios'

export const chatApi = {
  loadConversations: (page = 1) => api.get('/chat/conversations', { params: { page } }),
  loadThread: (targetActorId, page = 1) =>
    api.get(`/chat/thread/${targetActorId}`, { params: { page } }),
  loadUsers: (query = '', page = 1) =>
    api.get('/chat/users', { params: { query, page } }),
  markRead: (targetActorId) => api.post(`/chat/read/${targetActorId}`),
  toggleFavorite: (messageId) => api.post(`/chat/messages/${messageId}/favorite`),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
  pinMessage: (messageId) => api.post(`/chat/messages/${messageId}/pin`),
}

export default chatApi
