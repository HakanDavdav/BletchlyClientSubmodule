import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Flag, MoreHorizontal, Share2, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
        aria-label={t('common.more', 'Daha fazla')}
        title={t('common.more', 'Daha fazla')}
      >
        <MoreHorizontal size={16} />
      </button>
      {isOpen && position && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: 190,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            padding: 6,
            zIndex: 400,
          }}
        >
          {onToggleFavourite && (
            <button
              type="button"
              role="menuitem"
              className="btn btn-ghost btn-sm card-utility-fav-item"
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={run(onToggleFavourite)}
              disabled={favouriteDisabled}
            >
              <Star size={14} fill={isFavourite ? 'currentColor' : 'none'} />
              {isFavourite
                ? t('card.remove_favourite', 'Favorilerden çıkar')
                : t('card.add_favourite', 'Favorilere ekle')}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={run(onShare)}
          >
            <Share2 size={14} />
            {t('action.share', 'Paylaş')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={run(onReport)}
          >
            <Flag size={14} />
            {t('card.report', 'Şikayet')}
          </button>
          {onCopyEntryNo && (
            <button
              type="button"
              role="menuitem"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={run(onCopyEntryNo)}
            >
              <Copy size={14} />
              {t('card.copy_entry_no', 'Entry No Kopyala')}
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
