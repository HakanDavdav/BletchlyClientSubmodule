import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ModalHeader({
  icon = null,
  title,
  subtitle = null,
  titleId = undefined,
  onClose = null,
  actions = null,
  className = '',
  style = {},
}) {
  const { t } = useTranslation()
  const hasSubtitle = Boolean(subtitle)

  return (
    <div
      className={`modal-header ${hasSubtitle ? '' : 'modal-header--compact modal-header--no-subtitle'} ${className}`.trim()}
      style={style}
    >
      <div className="modal-header-left">
        {icon && <div className="modal-header-icon">{icon}</div>}
        <div className="modal-header-text">
          <h2 id={titleId} className="modal-header-title">
            {title}
          </h2>
          {subtitle && <p className="modal-header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="modal-header-actions">
        {actions}
        {onClose && (
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label={t('common.close', 'Kapat')}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
