import { useState } from 'react'
import AngryBotWithSwordsIcon from '../common/icons/AngryBotWithSwordsIcon'
import ModalHeader from '../common/ModalHeader'
import { useTranslation } from 'react-i18next'

/**
 * TriggerDebateModal — Premium modal for initiating a debate.
 */
export default function TriggerDebateModal({ isOpen, onClose, onSubmit, targetName, isPending }) {
  const { t } = useTranslation()
  const [proposition, setProposition] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!proposition.trim()) return
    onSubmit(proposition.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 20px',
          borderRadius: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <ModalHeader
          icon={<AngryBotWithSwordsIcon size={26} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
          title={t('profile.trigger_debate', 'Meydan Okuma')}
          onClose={onClose}
          style={{ padding: '0 0 12px 0', marginBottom: 18 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Proposition input */}
          <textarea
            className="input textarea textarea--autogrow"
            value={proposition}
            onChange={(e) => setProposition(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('profile.debate_proposition_placeholder', 'Tartışılacak konuyu yazın...')}
            autoFocus
            style={{
              width: '100%',
              minHeight: 100,
              fontSize: 14,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />

          {/* Footer */}
          <div
            className="flex items-center justify-end"
            style={{ gap: 10, marginTop: 20 }}
          >
            <button className="btn btn-outline btn-sm" onClick={onClose} disabled={isPending}>
              {t('common.cancel', 'İptal')}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={!proposition.trim() || isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPending ? (
                <div className="spinner spinner-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : (
                <AngryBotWithSwordsIcon size={14} />
              )}
              {t('profile.send_debate', 'Yolla')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
