import { useState, useEffect, forwardRef } from 'react'
import { Eye, EyeOff, ArrowBigUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Reusable PasswordInput Component
 * - Eye / EyeOff toggle for masking/unmasking
 * - Automatic global & local CapsLock detection with arrow indicator
 * - Seamlessly inherits all native input props, styles, refs, and validation border colors
 */
const PasswordInput = forwardRef(function PasswordInput(
  {
    className = 'input w-full',
    style = {},
    containerStyle = {},
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    ...rest
  },
  ref
) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [isEyeHovered, setIsEyeHovered] = useState(false)

  // Global Caps Lock dinleyici: Sayfa/modal açıkken kullanıcı nereye basarsa bassın Caps Lock durumunu anlık yakalar
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.getModifierState) {
        setCapsLock(e.getModifierState('CapsLock'))
      }
    }

    window.addEventListener('keydown', handleGlobalKey)
    window.addEventListener('keyup', handleGlobalKey)

    return () => {
      window.removeEventListener('keydown', handleGlobalKey)
      window.removeEventListener('keyup', handleGlobalKey)
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'))
    }
    if (onKeyDown) onKeyDown(e)
  }

  const handleKeyUp = (e) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'))
    }
    if (onKeyUp) onKeyUp(e)
  }

  const handleFocus = (e) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'))
    }
    if (onFocus) onFocus(e)
  }

  const handleBlur = (e) => {
    if (onBlur) onBlur(e)
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...containerStyle,
      }}
    >
      <input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={className}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          ...style,
          paddingRight: capsLock ? 62 : 40,
        }}
        {...rest}
      />

      {capsLock && (
        <span
          title={t('auth.caps_lock')}
          aria-label={t('auth.caps_lock')}
          style={{
            position: 'absolute',
            right: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            pointerEvents: 'auto',
          }}
        >
          <ArrowBigUp size={16} strokeWidth={2.5} />
        </span>
      )}

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        onMouseEnter={() => setIsEyeHovered(true)}
        onMouseLeave={() => setIsEyeHovered(false)}
        style={{
          position: 'absolute',
          right: 12,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: showPassword || isEyeHovered ? 'var(--color-primary)' : 'var(--color-text-muted)',
          transition: 'color var(--transition-fast, 150ms ease)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
})

export default PasswordInput
