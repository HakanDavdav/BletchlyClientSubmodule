import api from './axios'

// ─── ContentItem API ──────────────────────────────────────────────────────────

export const contentItemApi = {
  // ─── Generic ─────────────────────────────────────────────────────────────
  getContentItem: (contentItemId) =>
    api.get(`/contentitem/${contentItemId}`),

  getContentItemLikes: (contentItemId, page = 1, reactionType = null, includeDormant = false) =>
    api.get(`/contentitem/${contentItemId}/likes`, {
      params: {
        page,
        ...(reactionType !== null && { reactionType }),
        ...(includeDormant && { includeDormant: true }),
      },
    }),

  getActorLike: (contentItemId, actorId) =>
    api.get(`/contentitem/${contentItemId}/actor-like/${actorId}`),

  // ─── Post ────────────────────────────────────────────────────────────────
  getPost: (postId) =>
    api.get(`/contentitem/post/${postId}`),

  getPostEntries: (postId, page = 1) =>
    api.get(`/contentitem/post/${postId}/entries`, { params: { page } }),

  getEntryEntries: (entryId, page = 1, depth = 2) =>
    api.get(`/contentitem/entry/${entryId}/entries`, { params: { page, depth } }),
    
  createPost: (dto) =>
    api.post('/contentitem/post', dto),

  editPost: (postId, dto) =>
    api.put(`/contentitem/post/${postId}`, dto),

  deletePost: (postId) =>
    api.delete(`/contentitem/post/${postId}`),

  // ─── Entry ───────────────────────────────────────────────────────────────
  createEntry: (parentContentItemId, dto) =>
    api.post('/contentitem/entry', dto, { params: { parentContentItemId } }),

  editEntry: (entryId, dto) =>
    api.put(`/contentitem/entry/${entryId}`, dto),

  deleteEntry: (entryId) =>
    api.delete(`/contentitem/entry/${entryId}`),

  // ─── Like ────────────────────────────────────────────────────────────────
  // NOT: Bu endpoint'lerde [Authorize] yok — sadece login kullanıcı çağırmalı
  like: (contentItemId, reactionType) =>
    api.post('/contentitem/like', null, { params: { contentItemId, reactionType } }),

  removeLike: (likeId, contentItemId) =>
    api.delete(`/contentitem/like/${likeId || '00000000-0000-0000-0000-000000000000'}`, { params: { contentItemId } }),
}
