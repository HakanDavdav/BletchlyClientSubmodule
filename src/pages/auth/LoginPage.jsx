import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate, Link } from 'react-router-dom'
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, microsoftProvider } from '../../config/firebase'
import { trackLogin } from '../../utils/analytics'

import Logo from '../../components/common/icons/Logo'
import SelectionMarker from '../../components/common/SelectionMarker'
import PasswordInput from '../../components/common/PasswordInput'
import AuthWelcomeBackground from '../../components/auth/AuthWelcomeBackground'

export default function LoginPage() {
  useDevLog('LoginPage', arguments[0] || {})
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [identifier, setIdentifier] = useState('') // email veya username
  const [password, setPassword] = useState('')
  
  // Forgot Password state
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  
  // 2FA state
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [tempUserId, setTempUserId] = useState(null)
  const { t } = useTranslation()
  const providerRef = useRef('google')

  const loginMutation = useMutation({
    mutationFn: (data) => identityApi.login(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      // Backend'den "RequiresTwoFactor" gelirse state değiştir (backend implementasyonuna bağlı)
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated
      const isAdmin = res.data?.data?.isAdmin

      if (actorId) {
         trackLogin('password')
         setAuth(actorId, isProfileCreated, false, isAdmin)
         queryClient.invalidateQueries()
         if (isAdmin && import.meta.env.VITE_IS_ADMIN_BUILD === 'true') {
           navigate('/admin/panel')
         } else if (isProfileCreated) {
           navigate('/')
         } else {
           navigate('/init-profile')
         }
      } else {
         // 2FA senaryosu
         setRequiresTwoFactor(true)
         // Not: tempUserId'yi response'dan almak gerekebilir
      }
    }
  })

  const twoFactorMutation = useMutation({
    mutationFn: (data) => identityApi.loginTwoFactor(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated
      const isAdmin = res.data?.data?.isAdmin

      if (actorId) {
         trackLogin('two_factor')
         setAuth(actorId, isProfileCreated, false, isAdmin)
         queryClient.invalidateQueries()
         if (isAdmin && import.meta.env.VITE_IS_ADMIN_BUILD === 'true') {
           navigate('/admin/panel')
         } else if (isProfileCreated) {
           navigate('/')
         } else {
           navigate('/init-profile')
         }
      }
    }
  })

  const firebaseLoginMutation = useMutation({
    mutationFn: (data) => identityApi.firebaseLogin(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated
      const isAdmin = res.data?.data?.isAdmin

      if (actorId) {
         trackLogin(providerRef.current)
         setAuth(actorId, isProfileCreated, true, isAdmin)
         queryClient.invalidateQueries()
         if (isAdmin && import.meta.env.VITE_IS_ADMIN_BUILD === 'true') {
           navigate('/admin/panel')
         } else if (isProfileCreated) {
           navigate('/')
         } else {
           navigate('/init-profile')
         }
      }
    }
  })

  const handleProviderLogin = async (provider, providerName = 'google') => {
    try {
      providerRef.current = providerName
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      firebaseLoginMutation.mutate({ idToken })
    } catch (err) {
      console.error(err)
    }
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmitLogin = identifier.trim() !== '' && password.trim() !== '' && !loginMutation.isPending
  const canSubmitTwoFactor = twoFactorToken.trim() !== '' && !twoFactorMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!canSubmitLogin) {
      setHasSubmitted(true)
      return
    }

    loginMutation.mutate({ username: identifier, email: identifier, password })
  }

  const handleTwoFactorSubmit = (e) => {
    e.preventDefault()
    
    if (!canSubmitTwoFactor) {
      setHasSubmitted(true)
      return
    }

    twoFactorMutation.mutate({ userId: tempUserId, twoFactorToken, provider: 'Email' })
  }

  if (requiresTwoFactor) {
    return (
      <AuthWelcomeBackground>
        <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>{t('auth.two_factor')}</h2>
          <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
            {t('auth.two_factor_desc')}
          </p>

          <form noValidate onSubmit={handleTwoFactorSubmit} className="flex-col gap-4">
            <div className="form-group">
              <label className="form-label">{t('auth.two_factor_code')}</label>
              <input 
                className={`input ${hasSubmitted && !twoFactorToken.trim() ? 'error' : ''}`}
                type="text" 
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                required 
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4 }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={twoFactorMutation.isPending}
            >
              {twoFactorMutation.isPending ? t('auth.verifying') : t('auth.verify')}
            </button>
          </form>
        </div>
      </AuthWelcomeBackground>
    )
  }

  return (
    <>
      <AuthWelcomeBackground>
        <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            marginBottom: 24,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <Logo width={36} height={48} fill="var(--color-primary)" />
          <span
            style={{
              fontWeight: 800,
              fontSize: 28,
              color: 'var(--color-primary)',
              marginTop: 4,
              marginLeft: -2,
            }}
          >
            letchly
          </span>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">{t('auth.username_or_email')}</label>
            <input 
              className={`input ${hasSubmitted && !identifier.trim() ? 'error' : ''}`}
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label">{t('auth.password')}</label>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: 0 }} onClick={() => setIsForgotOpen(true)}>{t('auth.forgot_password')}</button>
            </div>
            <PasswordInput
              className={`input w-full ${hasSubmitted && !password.trim() ? 'error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 8, padding: '12px 16px', backgroundColor: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)', transition: 'border-color 0.2s ease-in-out, background-color 0.2s ease-in-out' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: '1.4', display: 'block', textAlign: 'center' }}>
              {t('auth.agree_prefix')}{' '}
              <Link to="/terms" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                Terms of Service
              </Link>{' '}
              {t('auth.and')}{' '}
              <Link to="/privacy" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                Privacy Policy
              </Link>
              {t('auth.agree_suffix')}
            </span>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loginMutation.isPending}
            style={{ marginTop: 24 }}
          >
            {loginMutation.isPending ? t('auth.logging_in') : t('common.login')}
          </button>
        </form>

        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button 
            className="btn w-full" 
            style={{ background: '#fff', color: '#757575', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            type="button"
            disabled={firebaseLoginMutation.isPending}
            onClick={() => handleProviderLogin(googleProvider, 'google')}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Google
          </button>
          <button 
            className="btn w-full" 
            style={{ background: '#2F2F2F', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            type="button"
            disabled={firebaseLoginMutation.isPending}
            onClick={() => handleProviderLogin(microsoftProvider, 'microsoft')}
          >
            <svg width="18" height="18" viewBox="0 0 21 21" style={{ marginRight: 8 }}>
              <path fill="#f25022" d="M1 1h9v9H1z"/>
              <path fill="#00a4ef" d="M1 11h9v9H1z"/>
              <path fill="#7fba00" d="M11 1h9v9h-9z"/>
              <path fill="#ffb900" d="M11 11h9v9h-9z"/>
            </svg>
            Microsoft
          </button>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {t('auth.no_account')} <button className="btn btn-ghost" style={{ padding: 0, color: 'var(--color-primary)' }} onClick={() => navigate('/register')}>{t('common.register')}</button>
        </div>
        </div>
      </AuthWelcomeBackground>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </>
  )
}
