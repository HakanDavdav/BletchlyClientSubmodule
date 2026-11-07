import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { X, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import PasswordInput from '../common/PasswordInput'
import ModalPortal from '../common/ModalPortal'

export default function DeleteAccountModal({ isOpen, onClose }) {
  useDevLog('DeleteAccountModal', arguments[0] || {})
  const [password, setPassword] = useState('')
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const deleteAccountMutation = useMutation({
    mutationFn: (data) => identityApi.deleteAccount(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 3000 })
      clearAuth()
      navigate('/login')
      onClose()
    }
  })

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmit = password.trim() !== '' && !deleteAccountMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    deleteAccountMutation.mutate({ password })
  }

  if (!isOpen) return null

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box auth-modal-box" style={{ border: '1px solid var(--color-error-border, rgba(239, 68, 68, 0.4))' }}>
        <button
          type="button"
          className="btn-icon auth-modal-close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Top Centered Circular Icon Badge */}
        <div className="auth-modal-icon-badge auth-modal-icon-badge--danger">
          <AlertTriangle size={26} color="var(--color-error)" strokeWidth={2} />
        </div>

        <h2 className="auth-modal-title auth-modal-title--danger">
          {t('settings.delete_account')}
        </h2>

        {/* Warning Box with Lining */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--color-text-secondary)',
            fontSize: 13.5,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          {t('auth.delete_account_warning')}
        </div>

        {/* Modal Form */}
        <form noValidate onSubmit={handleSubmit}>
          <div className="form-group auth-modal-field" style={{ marginBottom: 20 }}>
            <label className="auth-modal-label">
              {t('auth.password')}
            </label>
            <PasswordInput
              className={`input auth-modal-input w-full ${hasSubmitted && !password.trim() ? 'error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Modal Footer with Top Lining */}
          <div className="auth-modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={deleteAccountMutation.isPending}
              style={{ minWidth: 90 }}
            >
              {t('common.close')}
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ minWidth: 140 }}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? t('auth.deleting') : t('auth.delete_account_button')}
            </button>
          </div>
        </form>
      </div>
      </div>
    </ModalPortal>
  )
}
