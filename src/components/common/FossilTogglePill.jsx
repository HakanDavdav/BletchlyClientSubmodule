import { CirclePlus, CircleMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import TRexSkullIcon from '../../assets/t-rex-skull-svgrepo-com.svg?react'

/**
 * Fosil (dormant) birimleri göster/gizle hap butoncuğu.
 * Hierarchy'deki `vtree-fossil-pill` ile aynı görünüm: skull + sayı + artı/eksi.
 * Fosil yoksa da "0" yazarak görünür kalır.
 */
export default function FossilTogglePill({
  count = 0,
  open = false,
  onToggle,
  keepDropdownOpen = false,
  wrapperStyle,
  style,
  title,
  titleOpen,
  small = false,
}) {
  const { t } = useTranslation()
  const iconSize = small ? 12 : 15

  const button = (
    <button
      type="button"
      {...(keepDropdownOpen ? { 'data-keep-dropdown-open': true } : {})}
      className={`vtree-fossil-pill${small ? ' vtree-fossil-pill--sm' : ''}${open ? ' vtree-fossil-pill--expanded' : ''}`}
      onClick={(event) => {
        event.stopPropagation()
        onToggle?.(event)
      }}
      aria-label={
        open
          ? titleOpen || t('hierarchy.hide_fossils', 'Fosilleşmiş alt birimleri daralt')
          : title || t('hierarchy.show_fossils', 'Fosilleşmiş alt birimleri göster')
      }
      title={
        open
          ? titleOpen || t('hierarchy.hide_fossils', 'Fosilleşmiş alt birimleri daralt')
          : title || t('hierarchy.show_fossils', 'Fosilleşmiş alt birimleri göster')
      }
      style={style}
    >
      <TRexSkullIcon className="badge-fossil-icon" />
      <span>{count}</span>
      {open ? (
        <CircleMinus size={iconSize} strokeWidth={2.2} />
      ) : (
        <CirclePlus size={iconSize} strokeWidth={2.2} />
      )}
    </button>
  )

  if (!wrapperStyle) return button
  return <div style={wrapperStyle}>{button}</div>
}
