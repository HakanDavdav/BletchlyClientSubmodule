import emojiRegex from 'emoji-regex'
import Twemoji from './Twemoji'

export default function TwemojiText({ text = '' }) {
  if (!text) return null

  const regex = emojiRegex()
  const parts = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(<Twemoji key={`emoji-${key++}`} emoji={match[0]} />)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}
