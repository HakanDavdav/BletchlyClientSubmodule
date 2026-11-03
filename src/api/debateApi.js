import api from './axios'

export const debateApi = {
  loadLobbyDebates: () => api.get('/debate/lobby/modules'),
  getTodayDebates: () => api.get('/debate/lobby/today'),
  getDebateById: (debateId) => api.get(`/actor/debate/${debateId}`),
}

export default debateApi

