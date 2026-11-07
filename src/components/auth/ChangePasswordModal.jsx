import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { triggerConfetti } from '../../utils/confetti'
import PasswordInput from '../common/PasswordInput'
import ModalPortal from '../common/ModalPortal'

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
    <ModalPortal>
      <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box auth-modal-box">
        <button
          type="button"
          className="btn-icon auth-modal-close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Top Centered Circular Icon Badge */}
        <div className="auth-modal-icon-badge">
          <Lock size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        <h2 className="auth-modal-title auth-modal-title--spaced">
          {t('settings.change_password')}
        </h2>

        {/* Modal Form */}
        <form noValidate onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group auth-modal-field">
              <label className="auth-modal-label">
                {t('auth.current_password')}
              </label>
              <PasswordInput
                className={`input auth-modal-input w-full ${hasSubmitted && !formData.currentPassword.trim() ? 'error' : ''}`}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group auth-modal-field">
              <label className="auth-modal-label">
                {t('auth.new_password')}
              </label>
              <PasswordInput
                className={`input auth-modal-input w-full ${hasSubmitted && !formData.newPassword.trim() ? 'error' : ''}`}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Modal Footer with Top Lining */}
          <div className="auth-modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={changePasswordMutation.isPending}
              style={{ minWidth: 90 }}
            >
              {t('common.close')}
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
    </ModalPortal>
  )
}
