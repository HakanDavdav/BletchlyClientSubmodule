const STORAGE_KEY = 'aiforum_recent_searches'
const MAX_STORED = 20
const MAX_DISPLAY = 5
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 gün sonra eski aramalar otomatik temizlenir

/**
 * Tarayıcıda saklanan son aramaları döndürür (en fazla 5 adet).
 * 30 günden eski aramalar filtrelenir ve localStorage güncellenir.
 */
export function getRecentSearches() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const now = Date.now()
    const valid = parsed.filter(
      (item) =>
        item &&
        typeof item.query === 'string' &&
        item.query.trim().length > 0 &&
        (!item.timestamp || now - item.timestamp < TTL_MS)
    )

    if (valid.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid.slice(0, MAX_STORED)))
    }

    return valid.slice(0, MAX_DISPLAY).map((i) => i.query)
  } catch (err) {
    console.error('getRecentSearches error:', err)
    return []
  }
}

/**
 * Yapılan aramayı tarayıcıya kaydeder.
 * Var olan aynı arama başa taşınır, max 20 arama saklanır.
 */
export function saveRecentSearch(query) {
  if (typeof window === 'undefined') return
  const trimmed = typeof query === 'string' ? query.trim() : ''
  if (!trimmed) return

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    let list = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) list = parsed
      } catch {}
    }

    const now = Date.now()
    // Aynı aramayı büyük/küçük harf duyarsız çıkar ve süresi dolanları temizle
    list = list.filter(
      (item) =>
        item &&
        typeof item.query === 'string' &&
        item.query.trim().toLowerCase() !== trimmed.toLowerCase() &&
        now - (item.timestamp || 0) < TTL_MS
    )

    list.unshift({ query: trimmed, timestamp: now })
    if (list.length > MAX_STORED) {
      list = list.slice(0, MAX_STORED)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event('recent-searches-updated'))
  } catch (err) {
    console.error('saveRecentSearch error:', err)
  }
}

/**
 * Belirli bir son aramayı tarayıcı deposundan siler.
 */
export function removeRecentSearch(query) {
  if (typeof window === 'undefined') return
  const trimmed = typeof query === 'string' ? query.trim().toLowerCase() : ''
  if (!trimmed) return

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return

    const filtered = parsed.filter(
      (item) =>
        item &&
        typeof item.query === 'string' &&
        item.query.trim().toLowerCase() !== trimmed
    )

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new Event('recent-searches-updated'))
  } catch (err) {
    console.error('removeRecentSearch error:', err)
  }
}

/**
 * Tüm son aramaları temizler.
 */
export function clearRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('recent-searches-updated'))
  } catch (err) {
    console.error('clearRecentSearches error:', err)
  }
}
