import { useTranslation } from 'react-i18next'
import Twemoji from '../common/Twemoji'

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😋', '😛',
  '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒',
  '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺',
  '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶',
  '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲',
  '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧',
  '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '🤡', '💩', '👻',
  '💀', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼',
  '👋', '🤚', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
  '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊',
  '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
  '💅', '🤳', '💪', '👀', '👁️', '👅', '👄', '💋', '❤️', '🧡',
  '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
  '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✨', '⭐',
  '🌟', '💫', '⚡', '🔥', '💥', '💦', '💨', '🎉', '🎊', '🎁',
  '🎈', '🎵', '🎶', '☀️', '🌙', '⛅', '🌈', '☕', '🍕', '🍔',
  '🍟', '🍰', '🍫', '🍎', '🍓', '🍇', '🐶', '🐱', '🦊', '🐻',
  '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐔', '🐧', '🦄', '🐝',
]

export default function ChatEmojiPicker({ onSelect }) {
  const { t } = useTranslation()

  return (
    <div className="chat-emoji-picker" role="dialog" aria-label={t('chat.emoji_picker', 'Emoji seç')}>
      <div className="chat-emoji-picker__grid">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="chat-emoji-picker__item"
            onClick={() => onSelect(emoji)}
            title={emoji}
            aria-label={emoji}
          >
            <Twemoji emoji={emoji} />
          </button>
        ))}
      </div>
      <a
        className="chat-emoji-picker__credit"
        href="https://github.com/jdecked/twemoji"
        target="_blank"
        rel="noreferrer"
      >
        Twemoji · CC-BY 4.0
      </a>
    </div>
  )
}
