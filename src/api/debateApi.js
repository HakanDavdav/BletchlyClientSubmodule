import api from './axios'

export const debateApi = {
  loadLobbyDebates: () => api.get('/debate/lobby/modules'),
  getDebateById: (debateId) => api.get(`/actor/debate/${debateId}`),
}

export default debateApi

