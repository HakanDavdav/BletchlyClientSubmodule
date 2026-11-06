import api from './axios'

// ─── Search API ───────────────────────────────────────────────────────────────

export const searchApi = {
  // ─── Filtered Search ─────────────────────────────────────────────────────
  filterPosts: (params) =>
    api.get('/search/posts/filter', { params }),
  // params: { query, orderType, startDate, endDate }

  filterActors: (params) =>
    api.get('/search/actors/filter', { params }),

  filterTribes: (params) =>
    api.get('/search/tribes/filter', { params }),


  general: (query) =>
    api.get('/search/general', { params: { query } }),

  // ─── Cache Endpoints ─────────────────────────────────────────────────────
  // DİKKAT: Cache endpoint'leri WebIdentityResult<string> döner (raw JSON string).
  // result.data.data içinde JSON.parse() yapılması gerekiyor.
  getRecentPosts: () =>
    api.get('/search/cache/recent-posts'),

  getTrendingPosts: () =>
    api.get('/search/cache/trending-posts'),

  getTrendingPostsByTopic: (topicType) =>
    api.get('/search/cache/trending-posts/by-topic', { params: { topicType } }),

  getMostLikedEntries: () =>
    api.get('/search/cache/most-liked-entries'),

  getMostDislikedEntries: () =>
    api.get('/search/cache/most-disliked-entries'),

  getUserLeaderboard: () =>
    api.get('/search/cache/user-leaderboard'),

  getBotLeaderboard: () =>
    api.get('/search/cache/bot-leaderboard'),

  getTribeLeaderboard: () =>
    api.get('/search/cache/tribe-leaderboard'),

  getCardLeaderboard: () =>
    api.get('/search/cache/card-leaderboard'),

  // ─── Season & Archive Endpoints ──────────────────────────────────────────
  getSeasonStatus: () =>
    api.get('/search/season-status'),

  getAvailableSeasons: () =>
    api.get('/search/seasons'),

  getSeasonLeaderboard: (seasonNumber, category) => {
    const categoryMap = { bot: 0, user: 1, tribe: 2, Bot: 0, User: 1, Tribe: 2 }
    const cat = typeof category === 'number' ? category : (categoryMap[category] ?? 0)
    return api.get(`/search/season-leaderboard/${seasonNumber}`, { params: { category: cat } })
  },
}

/**
 * Cache endpoint'lerinin string response'unu parse eder.
 * Backend WebIdentityResult<string> döndürür — data alanı JSON stringdir.
 * @param {import('axios').AxiosResponse} response
 * @returns {Array}
 */
export function parseCacheResponse(response) {
  try {
    const raw = response.data?.data
    if (!raw) return []
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

    // C# Backend (Redis) cache'den gelen veriler PascalCase (ActorId) oluyor.
    // Frontend componentleri ise camelCase (actorId) bekliyor.
    // Bu yüzden tüm propertyleri camelCase'e çeviriyoruz.
    const toCamel = (obj) => {
      if (Array.isArray(obj)) return obj.map(toCamel)
      if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1)
          acc[camelKey] = toCamel(obj[key])
          return acc
        }, {})
      }
      return obj
    }

    let result = toCamel(parsed)
    if (Array.isArray(result)) {
      const seen = new Set()
      result = result.filter(item => {
        if (!item || typeof item !== 'object') return true
        const id = item.contentItemId || item.actorId || item.tribeId || item.ownershipId || item.personalityCardId || item.cardId
        if (!id) return true
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
    }
    return result
  } catch (err) {
    console.error("Cache parse error:", err)
    return []
  }
}
