import { CirclePlus, CircleMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import TRexSkullIcon from '../../assets/t-rex-skull-svgrepo-com.svg?react'

/**
 * Fosil (dormant) birimleri göster/gizle hap butoncuğu.
 * Hierarchy'deki `vtree-fossil-pill` ile aynı görünüm: skull + sayı + artı/eksi.
 * Fosil yoksa da "0" yazarak görünür kalır.
 */
export default function FossilTogglePill({
  count = null,
  open = false,
  onToggle,
  keepDropdownOpen = false,
  wrapperStyle,
  style,
  title,
  titleOpen,
  small = false,
  showCountOnlyWhenOpen = true,
  loading = false,
}) {
  const { t } = useTranslation()
  const iconSize = small ? 12 : 15
  const hasCount = !loading && count !== null && count !== undefined && count > 0 && (!showCountOnlyWhenOpen || open)

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
          ? titleOpen || t('hierarchy.hide_fossils')
          : title || t('hierarchy.show_fossils')
      }
      title={
        open
          ? titleOpen || t('hierarchy.hide_fossils')
          : title || t('hierarchy.show_fossils')
      }
      style={style}
    >
      <TRexSkullIcon className="badge-fossil-icon" />
      {loading ? (
        <div className="spinner spinner-sm" style={{ width: small ? 10 : 12, height: small ? 10 : 12, borderWidth: 1.5 }} />
      ) : (
        hasCount && <span>{count}</span>
      )}
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
