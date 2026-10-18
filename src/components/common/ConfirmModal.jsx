import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  confirmText,
  cancelText,
  confirmVariant = 'primary',
  isLoading = false,
  maxWidth = 440,
}) {
  const { t } = useTranslation()

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="modal-overlay"
          onClick={onClose}
          style={{ zIndex: 1000 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth, padding: 24, textAlign: 'center' }}
          >
            {title && (
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {title}
              </h3>
            )}

            {description && (
              <div
                style={{
                  color: 'var(--color-text-secondary)',
                  marginBottom: warning ? 16 : 24,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {description}
              </div>
            )}

            {warning && (
              <div
                style={{
                  marginBottom: 20,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  fontSize: 13,
                  lineHeight: 1.5,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{t('common.warning', 'Uyarı')}</span>
                </div>
                <div>{warning}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText || t('common.cancel', 'İptal')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={
                  confirmVariant === 'danger'
                    ? {
                        background: '#ef4444',
                        borderColor: '#ef4444',
                        color: '#fff',
                      }
                    : undefined
                }
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner spinner-sm" />
                ) : (
                  confirmText || t('common.confirm', 'Onayla')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
