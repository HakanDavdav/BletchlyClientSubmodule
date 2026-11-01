import axiosInstance from './axios'

export const personalityCardApi = {
  createCard: (data) => axiosInstance.post('/PersonalityCard/create', data),
  editCard: (cardId, data) => axiosInstance.put(`/PersonalityCard/edit-card/${cardId}`, data),
  editOwnership: (ownershipId, data) =>
    axiosInstance.put(`/PersonalityCard/edit-ownership/${ownershipId}`, data),
  buyCard: (cardId) => axiosInstance.post(`/PersonalityCard/buy/${cardId}`),
  assignCards: (botId, data) => axiosInstance.post(`/PersonalityCard/assign/${botId}`, data),
  deleteCard: (cardId, confirmed = false) =>
    axiosInstance.delete(`/PersonalityCard/delete-card/${cardId}`, { params: { confirmed } }),
  getBotCards: (botId) => axiosInstance.get(`/PersonalityCard/bot-cards/${botId}`),
  getOwnedCards: (actorId) =>
    axiosInstance.get('/PersonalityCard/owned-cards', { params: { actorId } }),
  getCardHierarchy: (cardId, includeHistory = false) =>
    axiosInstance.get(`/PersonalityCard/hierarchy/${cardId}`, {
      params: includeHistory ? { includeHistory: true } : undefined,
    }),
  getMyCardIds: () => axiosInstance.get('/PersonalityCard/my-card-ids'),
  getAssignedCards: (actorId, tribeId) =>
    axiosInstance.get('/PersonalityCard/assigned-cards', { params: { actorId, tribeId } }),
  getCardOwners: (cardId, page = 1, includeDormant = false) =>
    axiosInstance.get(`/PersonalityCard/owners/${cardId}`, {
      params: { page, includeDormant: includeDormant ? true : undefined },
    }),
  getCardAssignees: (cardId, page = 1, includeDormant = false) =>
    axiosInstance.get(`/PersonalityCard/assignees/${cardId}`, {
      params: { page, includeDormant: includeDormant ? true : undefined },
    }),
  getMarketplaceCards: (page = 1, query = '', orderType = '', startDate = null, endDate = null) => {
    const params = { page }
    if (query) params.query = query
    if (orderType) params.orderType = orderType
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    return axiosInstance.get(`/PersonalityCard/marketplace`, { params })
  },
  getNodeAssignments: (cardId, sourceActorId, includeDormant = false, includeDeleted = false) => {
    const params = { sourceActorId };
    if (includeDormant) params.includeDormant = true;
    if (includeDeleted) params.includeDeleted = true;
    return axiosInstance.get(`/PersonalityCard/node-assignments/${cardId}`, { params });
  },
  lockAssignment: (assignmentId) =>
    axiosInstance.post(`/PersonalityCard/lock-assignment/${assignmentId}`),
  unlockAssignment: (assignmentId) =>
    axiosInstance.post(`/PersonalityCard/unlock-assignment/${assignmentId}`),
}
