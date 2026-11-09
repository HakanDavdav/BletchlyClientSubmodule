import { useEffect, useId, useState } from 'react'
import { ShieldQuestion, X, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import IconActionButton from './IconActionButton'
import ModalHeader from './ModalHeader'
import ModalPortal from './ModalPortal'
import { useTranslation } from 'react-i18next'

export default function HowItWorksHelp({
  title,
  items,
  triggerLabel = title,
  closeLabel = null,
  triggerStyle,
  modalWidth = 'min(700px, calc(100vw - 32px))',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  return (
    <>
      <IconActionButton
        onClick={() => setIsOpen(true)}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={triggerStyle}
      >
        <ShieldQuestion size={20} strokeWidth={2.2} />
      </IconActionButton>

      {isOpen && (
        <ModalPortal>
          <div
            className="modal-overlay modal-overlay--tall"
          onClick={() => setIsOpen(false)}
          style={{ zIndex: 100000, display: 'flex', justifyContent: 'center' }}
          role="presentation"
        >
          <section
            className="modal-box how-it-works-modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            style={{ width: modalWidth }}
          >
            {/* Header */}
            <ModalHeader
              icon={<ShieldQuestion size={28} color="var(--color-primary)" />}
              title={title}
              titleId={titleId}
              onClose={() => setIsOpen(false)}
              style={{ padding: '0 0 12px 0', marginBottom: 16 }}
            />

            {/* Body */}
            <div className="how-it-works-modal-body">
              <div className="how-it-works-items-scroll">
                <div className="how-it-works-items-list">
                  {items.map((item, index) => (
                    <div
                      key={`${titleId}-${index}`}
                      className="how-it-works-item"
                    >
                      <div className="how-it-works-item-icon">
                        <Info size={16} color="var(--color-primary)" />
                      </div>
                      <div className="how-it-works-item-text">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="how-it-works-guide-wrap">
                <button
                  type="button"
                  className="how-it-works-guide-btn"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/basic-concepts')
                  }}
                  aria-label={t('bletchly_guide.hierarchy_link')}
                  title={t('bletchly_guide.hierarchy_link')}
                >
                  <ShieldQuestion size={22} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </section>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
