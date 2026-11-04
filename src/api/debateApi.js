import api from './axios'

export const debateApi = {
  loadLobbyDebates: () => api.get('/debate/lobby/modules'),
  loadBrowseDebates: (page = 1, query = '', orderType = '', startDate = null, endDate = null) => {
    const params = { page }
    if (query) params.query = query
    if (orderType) params.orderType = orderType
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    return api.get('/debate/browse', { params })
  },
  getDebateById: (debateId) => api.get(`/actor/debate/${debateId}`),
}

export default debateApi

