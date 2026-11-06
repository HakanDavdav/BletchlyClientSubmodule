const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/'

export function getTwemojiCodePoints(emoji) {
  return Array.from(emoji)
    .filter((char) => char.codePointAt(0) !== 0xfe0f)
    .map((char) => char.codePointAt(0).toString(16))
    .join('-')
}

export function getTwemojiUrl(emoji) {
  return `${TWEMOJI_BASE}${getTwemojiCodePoints(emoji)}.svg`
}
