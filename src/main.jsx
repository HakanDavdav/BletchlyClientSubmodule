import './utils/browserLogger'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import './components/layout/layout.css'
import './i18n'

// Toast hata mesajlarına traceId entegrasyonu
const origToastError = toast.error
toast.error = (message, options = {}) => {
  let finalMsg = message
  const opts = { ...options }

  if (message && typeof message === 'object' && !message.$$typeof) {
    if (message.traceId && !opts.traceId) {
      opts.traceId = message.traceId
    } else if (message.response?.headers?.['x-trace-id'] && !opts.traceId) {
      opts.traceId = message.response.headers['x-trace-id']
    }
    finalMsg = message.message || 'Beklenmeyen bir hata oluştu.'
  }

  if (!opts.traceId && typeof window !== 'undefined' && window.__lastApiTraceId) {
    if (Date.now() - (window.__lastApiTraceTime || 0) < 3000) {
      opts.traceId = window.__lastApiTraceId
    }
  }

  return origToastError(finalMsg, opts)
}

// Admin sayfası için başarılı toast bildirimlerine traceId entegrasyonu
const origToastSuccess = toast.success
toast.success = (message, options = {}) => {
  let finalMsg = message
  const opts = { ...options }

  const isAdminPage =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/admin') || import.meta.env.VITE_IS_ADMIN_BUILD === 'true')

  if (isAdminPage) {
    if (!opts.traceId && typeof window !== 'undefined' && window.__lastApiSuccessTraceId) {
      if (Date.now() - (window.__lastApiSuccessTraceTime || 0) < 3000) {
        opts.traceId = window.__lastApiSuccessTraceId
      }
    }
  }

  return origToastSuccess(finalMsg, opts)
}

// React Query konfigürasyonu
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Veriyi süresiz olarak taze kabul et (arka planda istek atma)
      refetchOnWindowFocus: false, // Sekme değişiminde gereksiz istekleri önler
      retry: (failureCount, error) =>
        failureCount < 1 && !error?.isApiError && (!error?.response || error.response.status >= 500),
    },
  },
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Varsayılan olarak kapalı. Sadece spesifik mutasyonlarda açmak için:
      // useMutation({ ..., meta: { showErrorToast: true } })
      if (!mutation.meta?.showErrorToast) return

      const traceId = error.traceId || error.response?.headers?.['x-trace-id']
      let errorMessages = [error.message || 'Beklenmeyen bir hata oluştu.']
      if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          errorMessages = error.response.data.errors.map((e) => e.description || e.message || e)
        } else if (typeof error.response.data.errors === 'object') {
          errorMessages = Object.values(error.response.data.errors).flat()
        }
      }

      errorMessages.forEach((msg) => {
        toast.error(msg, {
          traceId,
          style: {
            borderRadius: '10px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        })
      })
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Varsayılan olarak kapalı. Sadece spesifik sorgularda açmak için:
      // useQuery({ ..., meta: { showErrorToast: true } })
      if (!query.meta?.showErrorToast) return

      const traceId = error.traceId || error.response?.headers?.['x-trace-id']
      let errorMessages = [error.message || 'Beklenmeyen bir hata oluştu.']
      if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          errorMessages = error.response.data.errors.map((e) => e.description || e.message || e)
        } else if (typeof error.response.data.errors === 'object') {
          errorMessages = Object.values(error.response.data.errors).flat()
        }
      }

      errorMessages.forEach((msg) => {
        toast.error(msg, {
          traceId,
          style: {
            borderRadius: '10px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        })
      })
    },
  }),
})

import { BrowserRouter } from 'react-router-dom'

// Authentication interceptor error handle (Token düştüğünde vb.)
window.addEventListener('auth:unauthorized', () => {
  import('./store/authStore').then(({ default: useAuthStore }) => {
    // Oturum yokken (anonim gezinme) 401 alınması login'e yönlendirmez
    if (!useAuthStore.getState().isLoggedIn) return
    useAuthStore.getState().logout()
    window.location.href = '/login'
  })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
