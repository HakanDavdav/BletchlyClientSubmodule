import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { triggerConfetti } from '../../utils/confetti'
import PasswordInput from '../common/PasswordInput'
import ModalPortal from '../common/ModalPortal'

export default function ChangeUsernameModal({ isOpen, onClose }) {
  useDevLog('ChangeUsernameModal', arguments[0] || {})
  const [formData, setFormData] = useState({
    password: '',
    newUsername: ''
  })
  
  const { t } = useTranslation()
  const [successMsg, setSuccessMsg] = useState('')
  const queryClient = useQueryClient()

  const changeUsernameMutation = useMutation({
    mutationFn: (data) => identityApi.changeUsername(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      onClose()
      triggerConfetti()
      queryClient.invalidateQueries()
      setFormData({ password: '', newUsername: '' })
      setHasSubmitted(false)
    }
  })

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmit = formData.password.trim() !== '' && formData.newUsername.trim() !== '' && !changeUsernameMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    changeUsernameMutation.mutate(formData)
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
          <User size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        <h2 className="auth-modal-title auth-modal-title--spaced">
          {t('settings.change_username')}
        </h2>

        {/* Modal Form */}
        <form noValidate onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Mevcut Şifre (Üstte) */}
            <div className="form-group auth-modal-field">
              <label className="auth-modal-label">
                {t('auth.current_password')}
              </label>
              <PasswordInput
                className={`input auth-modal-input w-full ${hasSubmitted && !formData.password.trim() ? 'error' : ''}`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            {/* 2. Yeni Kullanıcı Adı (Altta) */}
            <div className="form-group auth-modal-field">
              <label className="auth-modal-label">
                {t('auth.new_username')}
              </label>
              <input
                className={`input auth-modal-input ${hasSubmitted && !formData.newUsername.trim() ? 'error' : ''}`}
                type="text"
                value={formData.newUsername}
                onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
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
              disabled={changeUsernameMutation.isPending}
              style={{ minWidth: 90 }}
            >
              {t('common.close')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={changeUsernameMutation.isPending}
              style={{ minWidth: 120 }}
            >
              {changeUsernameMutation.isPending ? t('action.saving') : t('action.change')}
            </button>
          </div>
        </form>
      </div>
      </div>
    </ModalPortal>
  )
}
