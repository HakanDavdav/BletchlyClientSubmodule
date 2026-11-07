import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { triggerConfetti } from '../../utils/confetti'
import ModalPortal from '../common/ModalPortal'

export default function TwoFactorModal({ isOpen, onClose }) {
  useDevLog('TwoFactorModal', arguments[0] || {})
  const { t } = useTranslation()
  const [successMsg, setSuccessMsg] = useState('')

  const enableTwoFactorMutation = useMutation({
    mutationFn: () => identityApi.enableTwoFactor(),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 3000 })
      setSuccessMsg(t('auth.two_factor_enabled'))
      triggerConfetti()
      setTimeout(() => {
        onClose()
        setSuccessMsg('')
      }, 2000)
    }
  })

  const disableTwoFactorMutation = useMutation({
    mutationFn: () => identityApi.disableTwoFactor(),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 3000 })
      setSuccessMsg(t('auth.two_factor_disabled'))
      triggerConfetti()
      setTimeout(() => {
        onClose()
        setSuccessMsg('')
      }, 2000)
    }
  })

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
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
            <ShieldCheck size={26} color="var(--color-primary)" strokeWidth={2} />
          </div>

          <h2 className="auth-modal-title">
            {t('auth.two_factor')}
          </h2>

          {successMsg ? (
            <div className="text-center" style={{ color: 'var(--color-success)', fontWeight: 600, padding: '24px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🎉</div>
              <p style={{ fontSize: 15, margin: 0 }}>{successMsg}</p>
            </div>
          ) : (
            <>
              <p className="auth-modal-desc" style={{ color: 'var(--color-text-secondary)' }}>
                {t('auth.two_factor_modal_desc')}
              </p>

              {/* Modal Footer with Top Lining */}
              <div className="auth-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
                  style={{ minWidth: 90 }}
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => disableTwoFactorMutation.mutate()}
                  className="btn btn-danger"
                  style={{ minWidth: 110 }}
                  disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
                >
                  {disableTwoFactorMutation.isPending ? t('auth.disabling') : t('auth.disable')}
                </button>
                <button
                  onClick={() => enableTwoFactorMutation.mutate()}
                  className="btn btn-primary"
                  style={{ minWidth: 110 }}
                  disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
                >
                  {enableTwoFactorMutation.isPending ? t('auth.enabling') : t('auth.enable')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  )
}
