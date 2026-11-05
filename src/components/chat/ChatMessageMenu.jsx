import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Flag, Pin, PinOff, Reply, Star, StarOff, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ChatMessageMenu({
  anchorRect,
  message,
  isMine,
  onClose,
  onReply,
  onCopy,
  onFavorite,
  onDelete,
  onReport,
  onPin,
}) {
  const { t } = useTranslation()
  const menuRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const handleScroll = () => onClose()
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  useLayoutEffect(() => {
    const element = menuRef.current
    if (!element || !anchorRect) return
    const width = element.offsetWidth
    const height = element.offsetHeight
    let left = anchorRect.right - width
    let top = anchorRect.bottom + 6
    if (top + height > window.innerHeight - 8) top = anchorRect.top - height - 6
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
    top = Math.max(8, top)
    element.style.left = `${left}px`
    element.style.top = `${top}px`
  }, [anchorRect])

  const item = (label, Icon, action, danger = false, active = false) => (
    <button
      type="button"
      className={`chat-message-menu__item${danger ? ' is-danger' : ''}${active ? ' is-active' : ''}`}
      onClick={action}
      role="menuitem"
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  )

  return createPortal(
    <div className="chat-message-menu" ref={menuRef} role="menu">
      {item(t('chat.reply'), Reply, onReply)}
      {item(t('chat.copy'), Copy, onCopy)}
      {item(
        message.isFavorited ? t('chat.unfavorite') : t('chat.favorite'),
        message.isFavorited ? StarOff : Star,
        onFavorite,
        false,
        message.isFavorited
      )}
      {item(
        message.isPinned ? t('chat.unpin') : t('chat.pin'),
        message.isPinned ? PinOff : Pin,
        onPin,
        false,
        message.isPinned
      )}
      {!isMine && item(t('chat.report'), Flag, onReport, true)}
      {isMine && item(t('chat.delete'), Trash2, onDelete, true)}
    </div>,
    document.body
  )
}
