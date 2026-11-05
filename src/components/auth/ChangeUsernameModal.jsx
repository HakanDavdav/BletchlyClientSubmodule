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
          <User size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', color: 'var(--color-text-primary)', textAlign: 'center' }}>
          {t('settings.change_username')}
        </h2>

        {/* Modal Form */}
        <form noValidate onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Mevcut Şifre (Üstte) */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {t('auth.current_password')}
              </label>
              <PasswordInput
                className={`input w-full ${hasSubmitted && !formData.password.trim() ? 'error' : ''}`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  height: 42,
                  padding: '10px 14px',
                  borderRadius: 10,
                }}
              />
            </div>

            {/* 2. Yeni Kullanıcı Adı (Altta) */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {t('auth.new_username')}
              </label>
              <input
                className={`input ${hasSubmitted && !formData.newUsername.trim() ? 'error' : ''}`}
                type="text"
                value={formData.newUsername}
                onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
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
