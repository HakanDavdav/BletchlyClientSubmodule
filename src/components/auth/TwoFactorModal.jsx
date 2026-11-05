import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
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
          <ShieldCheck size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: 'var(--color-text-primary)', textAlign: 'center' }}>
          {t('auth.two_factor')}
        </h2>

        {successMsg ? (
          <div className="text-center" style={{ color: 'var(--color-success)', fontWeight: 600, padding: '24px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🎉</div>
            <p style={{ fontSize: 15, margin: 0 }}>{successMsg}</p>
          </div>
        ) : (
          <div>
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'var(--color-text-secondary)',
                marginBottom: 24,
                margin: '0 0 24px 0',
              }}
            >
              {t('auth.two_factor_modal_desc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => enableTwoFactorMutation.mutate()}
                className="btn btn-primary w-full"
                style={{ height: 42, justifyContent: 'center' }}
                disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
              >
                {enableTwoFactorMutation.isPending ? t('auth.enabling') : t('auth.enable')}
              </button>

              <button
                onClick={() => disableTwoFactorMutation.mutate()}
                className="btn btn-danger w-full"
                style={{ height: 42, justifyContent: 'center' }}
                disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
              >
                {disableTwoFactorMutation.isPending ? t('auth.disabling') : t('auth.disable')}
              </button>
            </div>

            {/* Modal Footer with Top Lining */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: 20,
                marginTop: 24,
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                style={{ minWidth: 90 }}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </ModalPortal>
  )
}
