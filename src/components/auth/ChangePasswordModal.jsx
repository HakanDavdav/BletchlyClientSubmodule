import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { triggerConfetti } from '../../utils/confetti'
import PasswordInput from '../common/PasswordInput'

export default function ChangePasswordModal({ isOpen, onClose }) {
  useDevLog('ChangePasswordModal', arguments[0] || {})
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: ''
  })
  
  const { t } = useTranslation()
  const [successMsg, setSuccessMsg] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: (data) => identityApi.changePassword(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      onClose()
      triggerConfetti()
      setFormData({ currentPassword: '', newPassword: '' })
      setHasSubmitted(false)
    }
  })

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmit = formData.currentPassword.trim() !== '' && formData.newPassword.trim() !== '' && !changePasswordMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    changePasswordMutation.mutate(formData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 440, padding: '36px 32px', textAlign: 'left', position: 'relative' }}>
        <button
          type="button"
          className="btn-icon"
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, color: 'var(--color-text-muted)' }}
        >
          <X size={20} />
        </button>

        {/* Top Centered Circular Icon Badge */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--color-primary-lighter)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Lock size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', color: 'var(--color-text-primary)', textAlign: 'center' }}>
          {t('settings.change_password')}
        </h2>

        {/* Modal Form */}
        <form noValidate onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {t('auth.current_password')}
              </label>
              <PasswordInput
                className={`input w-full ${hasSubmitted && !formData.currentPassword.trim() ? 'error' : ''}`}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  height: 42,
                  padding: '10px 14px',
                  borderRadius: 10,
                }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {t('auth.new_password')}
              </label>
              <PasswordInput
                className={`input w-full ${hasSubmitted && !formData.newPassword.trim() ? 'error' : ''}`}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  height: 42,
                  padding: '10px 14px',
                  borderRadius: 10,
                }}
              />
            </div>
          </div>

          {/* Modal Footer with Top Lining */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 20,
              marginTop: 24,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={changePasswordMutation.isPending}
              style={{ minWidth: 90 }}
            >
              {t('common.close', 'Kapat')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={changePasswordMutation.isPending}
              style={{ minWidth: 120 }}
            >
              {changePasswordMutation.isPending ? t('action.saving') : t('action.change')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
