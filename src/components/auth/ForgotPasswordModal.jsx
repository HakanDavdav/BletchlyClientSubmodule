import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { KeyRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { triggerConfetti } from '../../utils/confetti'
import { useNavigate } from 'react-router-dom'
import TokenModal from './TokenModal'
import PasswordInput from '../common/PasswordInput'
import ModalPortal from '../common/ModalPortal'

const PASSWORD_SECONDS = 180

export default function ForgotPasswordModal({ isOpen, onClose }) {
  useDevLog('ForgotPasswordModal', arguments[0] || {})
  
  // Step: 'request' | 'verify_token' | 'set_password'
  const [step, setStep] = useState('request')
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // Form fields
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [confirmToken, setConfirmToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Countdown for set_password step
  const [countdown, setCountdown] = useState(PASSWORD_SECONDS)

  // 1. Request Password Reset Mutation
  const requestResetMutation = useMutation({
    mutationFn: (data) => identityApi.requestPasswordReset(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep('verify_token')
    }
  })

  // 2. Verify Token Mutation
  const verifyTokenMutation = useMutation({
    mutationFn: (data) => identityApi.verifyPasswordResetToken(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep('set_password')
      setCountdown(PASSWORD_SECONDS)
    }
  })

  // 3. Confirm Password Reset Mutation
  const confirmResetMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPasswordReset(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      handleClose()
      triggerConfetti()
    }
  })

  const passwordEndTimeRef = useRef(null)
  const hasPasswordTimedOutRef = useRef(false)

  // Countdown Logic for set_password step
  useEffect(() => {
    if (!isOpen || step !== 'set_password') {
      passwordEndTimeRef.current = null
      hasPasswordTimedOutRef.current = false
      setCountdown(PASSWORD_SECONDS)
      return
    }

    if (!passwordEndTimeRef.current) {
      passwordEndTimeRef.current = Date.now() + PASSWORD_SECONDS * 1000
      hasPasswordTimedOutRef.current = false
    }

    const updateTimer = () => {
      if (!passwordEndTimeRef.current) return
      const remaining = Math.max(0, Math.ceil((passwordEndTimeRef.current - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining === 0 && !hasPasswordTimedOutRef.current) {
        hasPasswordTimedOutRef.current = true
        toast.error(t('common.session_timeout'))
        handleClose()
        navigate('/register')
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isOpen, step, t, navigate])

  const handleClose = () => {
    onClose()
    passwordEndTimeRef.current = null
    hasPasswordTimedOutRef.current = false
    setTimeout(() => {
      setStep('request')
      setEmailOrUsername('')
      setConfirmToken('')
      setNewPassword('')
      setCountdown(PASSWORD_SECONDS)
      setHasSubmitted(false)
    }, 300)
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmitRequest = emailOrUsername.trim() !== '' && !requestResetMutation.isPending
  const canSubmitConfirm = newPassword.trim() !== '' && !confirmResetMutation.isPending

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!canSubmitRequest) {
      setHasSubmitted(true)
      return
    }
    requestResetMutation.mutate({ emailOrUsername, distributionStrategy: 0 })
  }

  const handleConfirmSubmit = (e) => {
    e.preventDefault()
    if (!canSubmitConfirm) {
      setHasSubmitted(true)
      return
    }
    confirmResetMutation.mutate({ emailOrUsername, token: confirmToken.trim(), newPassword })
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  
  const progressPct = (countdown / PASSWORD_SECONDS) * 100
  const isLowTime = countdown <= 60

  if (!isOpen) return null

  if (step === 'verify_token') {
    return (
      <TokenModal
        isOpen={isOpen}
        title={t('auth.reset_password')}
        description={t('auth.reset_password_desc')}
        targetText={emailOrUsername}
        onSubmit={(token) => {
          setConfirmToken(token)
          verifyTokenMutation.mutate({ emailOrUsername, token })
        }}
        isPending={verifyTokenMutation.isPending}
        onTimeout={() => {
          setStep('request')
          setConfirmToken('')
        }}
        onClose={handleClose}
      />
    )
  }

  return (
    <ModalPortal>
      <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={handleClose}>
      <div 
        className="modal-box" 
        style={{ maxWidth: 460, padding: '40px 36px', textAlign: 'center', position: 'relative' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          className="btn-icon" 
          onClick={handleClose} 
          style={{ position: 'absolute', top: 16, right: 16, color: 'var(--color-text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--color-primary-lighter)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <KeyRound size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        {step === 'request' && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
              {t('auth.forgot_password_title')}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
              {t('auth.forgot_password_desc')}
            </p>
            
            <form noValidate onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input 
                className={`input ${hasSubmitted && !emailOrUsername.trim() ? 'error' : ''}`}
                type="text" 
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required 
                placeholder={t('auth.email_or_username')}
                style={{ textAlign: 'center', padding: '14px', fontSize: 14 }}
              />

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={requestResetMutation.isPending}
                style={{ marginTop: 8 }}
              >
                {requestResetMutation.isPending ? t('common.sending') : t('action.send')}
              </button>
            </form>
          </>
        )}

        {step === 'set_password' && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
              {t('settings.change_password')}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
              {t('auth.set_new_password')}
            </p>
            
            <form noValidate onSubmit={handleConfirmSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* New Password */}
              <PasswordInput
                className={`input w-full ${hasSubmitted && !newPassword.trim() ? 'error' : ''}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder={t('auth.new_password')}
                style={{ textAlign: 'center', padding: '14px', fontSize: 14 }}
              />

              {/* Geri Sayım */}
              <div style={{ marginTop: 8 }}>
                <div style={{
                  height: 3, borderRadius: 99,
                  background: 'var(--color-border)',
                  overflow: 'hidden', marginBottom: 6,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    borderRadius: 99,
                    background: isLowTime ? 'var(--color-error)' : 'var(--color-primary)',
                    transition: 'width 1s linear, background 0.3s',
                  }} />
                </div>
                <p style={{
                  fontSize: 12, margin: 0,
                  color: isLowTime ? 'var(--color-error)' : 'var(--color-text-muted)',
                  fontWeight: isLowTime ? 600 : 400,
                  transition: 'color 0.3s',
                }}>
                  {t('auth.code_expiry')}: <strong>{formatTime(countdown)}</strong>
                </p>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={confirmResetMutation.isPending}
                style={{ marginTop: 8 }}
              >
                {confirmResetMutation.isPending ? t('common.verifying') : t('settings.change_password')}
              </button>
            </form>
          </>
        )}
      </div>
      </div>
    </ModalPortal>
  )
}
