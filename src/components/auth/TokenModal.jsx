import { useState, useEffect, useRef } from 'react'
import useDevLog from '../../utils/useDevLog'
import { KeyRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  totalSeconds = 120
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
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'
    
    if (isRequired) {
      return (!value || !value.trim()) ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

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

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const progressPct = (countdown / totalSeconds) * 100
  const isLowTime = countdown <= 60
  const hasPasted = token.length > 10

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 460, padding: '40px 36px', textAlign: 'center', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button 
            type="button"
            className="btn-icon" 
            onClick={onClose} 
            style={{ position: 'absolute', top: 16, right: 16, color: 'var(--color-text-muted)' }}
          >
            <X size={20} />
          </button>
        )}

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--color-primary-lighter)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <KeyRound size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
          {title || t('auth.email_verification')}
        </h2>

        {displayTarget ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{displayTarget}</span>{t('auth.to_address', ' adresine')}
            {' '}{description || t('auth.email_verification_desc')}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
            {description || t('auth.email_verification_desc')}
          </p>
        )}

        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Token Input */}
          <div style={{ position: 'relative' }}>
            <input
              ref={textareaRef}
              type="text"
              className="input"
              value={token}
              onChange={handleChange}
              placeholder={t('auth.enter_code')}
              spellCheck={false}
              autoComplete="off"
              required
              style={{
                textAlign: 'center',
                padding: '14px',
                fontSize: 14,
                letterSpacing: 0.5,
                border: `1.5px solid ${getBorderColor('token', token, true)}`,
                paddingRight: hasPasted ? '60px' : '14px',
                outline: 'none'
              }}
              onFocus={() => setFocused('token')}
              onBlur={() => setFocused(null)}
            />
            {/* Yapıştırıldı onay etiketi */}
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

          {/* Geri Sayım */}
          <div>
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
            disabled={isPending}
          >
            {isPending ? t('common.verifying') : t('action.verify')}
          </button>
        </form>
      </div>
    </div>
  )
}
