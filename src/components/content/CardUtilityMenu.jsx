import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Flag, MoreHorizontal, Share2, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DropdownOption, DropdownPanel } from '../common/Dropdown'

export default function CardUtilityMenu({
  onShare,
  onReport,
  onCopyEntryNo,
  isFavourite = false,
  onToggleFavourite,
  favouriteDisabled = false,
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const wrapperRef = useRef(null)
  const menuRef = useRef(null)
  const menuIdRef = useRef(Symbol('card-utility-menu'))

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false)
        setPosition(null)
      }
    }
    const handleResize = () => {
      setIsOpen(false)
      setPosition(null)
    }
    const handleOtherMenuOpen = (event) => {
      if (event.detail !== menuIdRef.current) {
        setIsOpen(false)
        setPosition(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('resize', handleResize)
    window.addEventListener('card-utility-menu-open', handleOtherMenuOpen)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('card-utility-menu-open', handleOtherMenuOpen)
    }
  }, [])

  const toggle = (event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 190
    const left = Math.min(
      window.innerWidth - menuWidth - 8,
      Math.max(8, rect.right - menuWidth)
    )
    setPosition({ top: rect.bottom + 6, left })
    setIsOpen((value) => {
      if (!value) {
        window.dispatchEvent(new CustomEvent('card-utility-menu-open', { detail: menuIdRef.current }))
      }
      return !value
    })
  }

  const run = (handler) => (event) => {
    event.stopPropagation()
    setIsOpen(false)
    setPosition(null)
    handler?.()
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm card-utility-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('common.more')}
        title={t('common.more')}
      >
        <MoreHorizontal size={16} />
      </button>
      {createPortal(
        <DropdownPanel
          open={Boolean(isOpen && position)}
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: position?.top,
            left: position?.left,
            width: 190,
            zIndex: 400,
          }}
        >
          {onToggleFavourite && (
            <DropdownOption
              role="menuitem"
              className="dropdown-option-btn--start card-utility-fav-item"
              onClick={run(onToggleFavourite)}
              disabled={favouriteDisabled}
            >
              <Star size={14} fill={isFavourite ? 'currentColor' : 'none'} />
              {isFavourite
                ? t('card.remove_favourite')
                : t('card.add_favourite')}
            </DropdownOption>
          )}
          <DropdownOption
            role="menuitem"
            className="dropdown-option-btn--start"
            onClick={run(onShare)}
          >
            <Share2 size={14} />
            {t('action.share')}
          </DropdownOption>
          <DropdownOption
            role="menuitem"
            className="dropdown-option-btn--start"
            onClick={run(onReport)}
          >
            <Flag size={14} />
            {t('card.report')}
          </DropdownOption>
          {onCopyEntryNo && (
            <DropdownOption
              role="menuitem"
              className="dropdown-option-btn--start"
              onClick={run(onCopyEntryNo)}
            >
              <Copy size={14} />
              {t('card.copy_entry_no')}
            </DropdownOption>
          )}
        </DropdownPanel>,
        document.body
      )}
    </div>
  )
}
