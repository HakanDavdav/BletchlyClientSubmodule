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
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
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
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 440, padding: '36px 32px', textAlign: 'left', position: 'relative', border: '1px solid var(--color-error-border, rgba(239, 68, 68, 0.4))' }}>
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
            background: 'rgba(239, 68, 68, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <AlertTriangle size={26} color="var(--color-error)" strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: 'var(--color-error)', textAlign: 'center' }}>
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
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {t('auth.password')}
            </label>
            <PasswordInput
              className={`input w-full ${hasSubmitted && !password.trim() ? 'error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                height: 42,
                padding: '10px 14px',
                borderRadius: 10,
              }}
            />
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
              disabled={deleteAccountMutation.isPending}
              style={{ minWidth: 90 }}
            >
              {t('common.close', 'Kapat')}
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
  )
}
