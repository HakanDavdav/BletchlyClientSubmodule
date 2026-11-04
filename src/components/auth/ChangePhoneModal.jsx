import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { triggerConfetti } from '../../utils/confetti'
import TokenModal from './TokenModal'

export default function ChangePhoneModal({ isOpen, onClose }) {
  useDevLog('ChangePhoneModal', arguments[0] || {})
  const { t } = useTranslation()
  const [step, setStep] = useState(1) // 1: Request, 2: Confirm
  const [phoneNumber, setPhoneNumber] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setPhoneNumber('')
    }
  }, [isOpen])

  const requestMutation = useMutation({
    mutationFn: (data) => identityApi.requestPhoneChange(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep(2)
    }
  })

  const confirmMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPhone(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      onClose()
      triggerConfetti()
    }
  })

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmitRequest = phoneNumber.trim() !== '' && !requestMutation.isPending

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!canSubmitRequest) {
      setHasSubmitted(true)
      return
    }
    requestMutation.mutate({ phoneNumber })
  }

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  if (!isOpen) return null

  if (step === 2) {
    return (
      <TokenModal
        isOpen={isOpen}
        title={t('auth.change_phone_title')}
        targetText={phoneNumber}
        onSubmit={(token) => confirmMutation.mutate({ token })}
        isPending={confirmMutation.isPending}
        onClose={onClose}
      />
    )
  }

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

        <AnimatePresence mode="wait">
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <Phone size={26} color="var(--color-primary)" strokeWidth={2} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-text-primary)', textAlign: 'center' }}>
              {t('auth.change_phone_title')}
            </h2>

            {/* Modal Description */}
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--color-text-muted)',
                margin: '0 0 24px 0',
                textAlign: 'center',
              }}
            >
              {t('auth.change_phone_desc')}
            </p>

            {/* Modal Form */}
            <form noValidate onSubmit={handleRequestSubmit}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {t('auth.phone_label')}
                </label>
                <input
                  className={`input ${hasSubmitted && !phoneNumber.trim() ? 'error' : ''}`}
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+905..."
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
                  disabled={requestMutation.isPending}
                  style={{ minWidth: 90 }}
                >
                  {t('common.close', 'Kapat')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={requestMutation.isPending}
                  style={{ minWidth: 120 }}
                >
                  {requestMutation.isPending ? t('common.sending') : t('auth.send_sms')}
                </button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
