import { useState, useEffect, useRef } from 'react'
import useDevLog from '../../utils/useDevLog'
import { KeyRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ModalPortal from '../common/ModalPortal'

export default function TokenModal({
  isOpen,
  title,
  description,
  targetText,
  email, // backward compatibility
  onSubmit,
  isPending = false,
  onTimeout,
  onClose,
  totalSeconds = 180
}) {
  useDevLog('TokenModal', arguments[0] || {})
  const [token, setToken] = useState('')
  const [countdown, setCountdown] = useState(totalSeconds)
  const textareaRef = useRef(null)
  const { t } = useTranslation()

  const displayTarget = targetText || email

  const endTimeRef = useRef(null)
  const hasTimedOutRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      endTimeRef.current = null
      hasTimedOutRef.current = false
      setCountdown(totalSeconds)
      setToken('')
      return
    }

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + totalSeconds * 1000
      hasTimedOutRef.current = false
    }

    const updateTimer = () => {
      if (!endTimeRef.current) return
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining === 0 && !hasTimedOutRef.current) {
        hasTimedOutRef.current = true
        if (onTimeout) onTimeout()
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
  }, [isOpen, onTimeout, totalSeconds])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen])

  const handleChange = (e) => {
    setToken(e.target.value)
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmit = token.trim() !== '' && !isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    if (onSubmit) {
      onSubmit(token.trim())
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay') && onClose) {
      onClose()
    }
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const progressPct = (countdown / totalSeconds) * 100
  const isLowTime = countdown <= 60
  const hasPasted = token.length > 10

  if (!isOpen) return null

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 1000 }}>
        <div className="modal-box auth-modal-box">
          {onClose && (
            <button
              type="button"
              className="btn-icon auth-modal-close"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          )}

          {/* Top Centered Circular Icon Badge */}
          <div className="auth-modal-icon-badge">
            <KeyRound size={26} color="var(--color-primary)" strokeWidth={2} />
          </div>

          <h2 className="auth-modal-title">
            {title || t('auth.email_verification')}
          </h2>

          <p className="auth-modal-desc">
            {displayTarget && (
              <>
                <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{displayTarget}</span>
                {t('auth.to_address')}{' '}
              </>
            )}
            {description || t('auth.email_verification_desc')}
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <div className="form-group auth-modal-field">
              <label className="auth-modal-label">
                {t('auth.two_factor_code')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={textareaRef}
                  type="text"
                  className={`input w-full auth-modal-input ${hasSubmitted && !token.trim() ? 'error' : ''}`}
                  value={token}
                  onChange={handleChange}
                  placeholder={t('auth.enter_code')}
                  spellCheck={false}
                  autoComplete="off"
                  required
                  style={{
                    textAlign: 'center',
                    letterSpacing: 0.5,
                    paddingRight: hasPasted ? '60px' : '14px',
                  }}
                />
                {hasPasted && (
                  <span style={{
                    position: 'absolute', top: '50%', right: 14,
                    transform: 'translateY(-50%)',
                    fontSize: 11, color: 'var(--color-primary)',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    ✓ {t('common.ready')}
                  </span>
                )}
              </div>
            </div>

            {/* Geri Sayım */}
            <div style={{ marginTop: 16 }}>
              <div className="auth-modal-progress-track">
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

            {/* Modal Footer with Top Lining */}
            <div className="auth-modal-footer">
              {onClose && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  disabled={isPending}
                  style={{ minWidth: 90 }}
                >
                  {t('common.close')}
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ minWidth: 120 }}
              >
                {isPending ? t('common.verifying') : t('action.verify')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
