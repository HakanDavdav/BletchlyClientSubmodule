import { useEffect, useRef, useState } from 'react'
import { Reply, Send, Smile, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import ChatEmojiPicker from './ChatEmojiPicker'
import TwemojiText from '../common/TwemojiText'

export default function ChatComposer({ targetActorId, onSend, disabled, replyTo, onCancelReply }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [sending, setSending] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const textareaRef = useRef(null)
  const composerRef = useRef(null)

  useEffect(() => {
    setValue('')
    setSending(false)
    setEmojiOpen(false)
    if (textareaRef.current) textareaRef.current.focus()
  }, [targetActorId])

  useEffect(() => {
    if (replyTo && textareaRef.current) textareaRef.current.focus()
  }, [replyTo])

  useEffect(() => {
    if (!emojiOpen) return undefined

    const handlePointerDown = (event) => {
      if (composerRef.current && !composerRef.current.contains(event.target)) {
        setEmojiOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setEmojiOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [emojiOpen])

  const submit = async () => {
    const content = value.trim()
    if (!content || sending || disabled) return
    setSending(true)
    try {
      await onSend(content, replyTo?.chatMessageId || null)
      setValue('')
      setEmojiOpen(false)
    } catch (err) {
      toast.error(err?.message || t('chat.send_failed'))
    } finally {
      setSending(false)
    }
  }

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`
    setValue(nextValue)
    setEmojiOpen(false)

    requestAnimationFrame(() => {
      if (!textarea) return
      textarea.focus()
      const caret = start + emoji.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const isDisabled = disabled || sending || !value.trim()

  return (
    <div className="chat-composer" ref={composerRef}>
      {replyTo && (
        <div className="chat-composer__reply">
          <Reply size={14} />
          <div className="chat-composer__reply-body">
            <strong>
              {replyTo.senderActorId
                ? t('chat.replying_to', {
                    name: replyTo.senderProfileName || t('chat.user'),
                  })
                : t('chat.reply')}
            </strong>
            <span>{replyTo.content || t('chat.message_deleted')}</span>
          </div>
          <button
            type="button"
            className="chat-composer__reply-cancel"
            onClick={onCancelReply}
            aria-label={t('chat.cancel_reply')}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {emojiOpen && <ChatEmojiPicker onSelect={insertEmoji} />}
      <div className="chat-composer__row">
        <button
          type="button"
          className="chat-composer__emoji-btn"
          onClick={() => setEmojiOpen((open) => !open)}
          aria-label={t('chat.emoji_picker')}
          title={t('chat.emoji_picker')}
          aria-expanded={emojiOpen}
        >
          <Smile size={20} />
        </button>
        <div className="chat-composer__field">
          <div className={`chat-composer__ghost${!value && !focused ? ' is-placeholder' : ''}`}>
            {value ? <TwemojiText text={value} /> : (!focused ? t('chat.message_placeholder') : null)}
            {focused && <span className="chat-composer__caret" />}
          </div>
          <textarea
            ref={textareaRef}
            className="chat-composer__input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label={t('chat.message_placeholder')}
          />
        </div>
        <button
          type="button"
          className="chat-composer__send"
          onClick={submit}
          disabled={isDisabled}
          aria-label={t('chat.send')}
        >
          {sending ? <div className="spinner spinner-sm" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}
