import { getTwemojiUrl } from '../../utils/twemoji'

export function Twemoji({ emoji, className = '', title }) {
  return (
    <img
      className={`twemoji${className ? ` ${className}` : ''}`}
      src={getTwemojiUrl(emoji)}
      alt={emoji}
      title={title || emoji}
      draggable="false"
      loading="lazy"
    />
  )
}

export default Twemoji
