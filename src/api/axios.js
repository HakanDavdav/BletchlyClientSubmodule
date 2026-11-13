import axios from 'axios'

/**
 * Merkezi Axios instance.
 * - baseURL: Vite proxy üzerinden /api backend'e yönleniyor
 * - withCredentials: ASP.NET Core Identity cookie auth için zorunlu
 * - Response interceptor: WebIdentityResult envelope'u unwrap eder
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Initial API Cache Reader (Server Hydration) ──────────────────────────────
let initialApiCache = {}
if (typeof document !== 'undefined') {
  const cacheEl = document.getElementById('__INITIAL_API_CACHE__')
  if (cacheEl && cacheEl.textContent) {
    try {
      initialApiCache = JSON.parse(cacheEl.textContent)
    } catch (e) {
      console.error('Failed to parse __INITIAL_API_CACHE__', e)
    }
  }
}

// ─── Target Language Header (mevcut çevirileri overlay etmek için) ────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const lang = (localStorage.getItem('i18nextLng') || navigator.language || 'en').split('-')[0].toLowerCase()
    config.headers['X-Target-Language'] = lang
  }
  return config
})

// ─── Cache Interceptor (Network Bypass) ───────────────────────────────────────
api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    const rawUrl = config.url || ''
    const cleanUrl = rawUrl.replace(/^\/api/, '')
    const fullCleanUrl = cleanUrl + (config.params ? '?' + new URLSearchParams(config.params).toString() : '')

    const matchedKey = Object.keys(initialApiCache).find((key) => {
      const cleanKey = key.replace(/^\/api/, '')
      return cleanKey === cleanUrl || cleanKey === fullCleanUrl || cleanKey === rawUrl
    })

    if (matchedKey && initialApiCache[matchedKey]) {
      const cachedResponse = initialApiCache[matchedKey]
      delete initialApiCache[matchedKey] // One-time consumption

      return Promise.reject({
        __fromPreloadedCache: true,
        syntheticResponse: {
          data: cachedResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        },
      })
    }
  }
  return config
})

// ─── Dev-only Request Logger ──────────────────────────────────────────────────
if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    console.log(`[API ➤] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, { params: config.params, data: config.data })
    return config
  })
}

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Backend her zaman WebIdentityResult<T> döner:
// { succeeded: bool, data: T | null, errors: AppError[] }
api.interceptors.response.use(
  (response) => {
    const result = response.data

    // succeeded: false → hata olarak fırlat
    if (result && typeof result === 'object' && result.succeeded === false) {
      const errorMessages = result.errors?.map((e) => e.description || e.message || e).join(', ') || 'Bir hata oluştu'
      const error = new Error(errorMessages)
      error.errors = result.errors || []
      error.isApiError = true
      if (import.meta.env.DEV) {
        console.log(`[API ✗] ${response.config?.method?.toUpperCase()} ${response.config?.url}`, { errors: result.errors })
      }
      return Promise.reject(error)
    }

    const traceId = response.headers?.['x-trace-id']
    if (traceId && typeof window !== 'undefined') {
      window.__lastApiSuccessTraceId = traceId
      window.__lastApiSuccessTraceTime = Date.now()
    }

    if (import.meta.env.DEV) {
      console.log(`[API ✓] ${response.config?.method?.toUpperCase()} ${response.config?.url}`, { data: result?.data ?? result })
    }

    return response
  },
  (error) => {
    if (error?.__fromPreloadedCache) {
      const result = error.syntheticResponse.data
      if (import.meta.env.DEV) {
        console.log(`[API ⚡ Cache] ${error.syntheticResponse.config?.method?.toUpperCase()} ${error.syntheticResponse.config?.url}`, { data: result?.data ?? result })
      }
      return Promise.resolve(error.syntheticResponse)
    }
    const data = error.response?.data
    const traceId = error.response?.headers?.['x-trace-id']
    if (traceId) {
      error.traceId = traceId
      if (typeof window !== 'undefined') {
        window.__lastApiTraceId = traceId
        window.__lastApiTraceTime = Date.now()
      }
    }

    if (data && typeof data === 'object') {
      const rawErrors = data.errors || data.Errors
      if (Array.isArray(rawErrors) && rawErrors.length > 0) {
        error.errors = rawErrors
        const messages = rawErrors
          .map((e) => (typeof e === 'string' ? e : e?.description || e?.Description || e?.message || e?.Message))
          .filter(Boolean)
        if (messages.length > 0) {
          error.message = messages.join(', ')
        }
      } else if (typeof data.message === 'string') {
        error.message = data.message
      }
    }

    // HTTP seviyesinde hata (401, 403, 500 vb.)
    if (import.meta.env.DEV) {
      console.log(`[API ✗] ${error.config?.method?.toUpperCase()} ${error.config?.url} — HTTP ${error.response?.status} [Trace: ${traceId || 'N/A'}]`, { error: data })
    }
    if (error.response?.status === 401) {
      // Cookie geçersiz — auth store'u temizle
      // (circular dependency önlemek için event yayıyoruz)
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
