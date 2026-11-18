import { MentionTargetType } from '../../../constants/enums'

// Same boundary rule as the backend ContentMentionResolver: a mention token "@Name" must not be
// glued to a letter, digit or underscore on either side.
const NAME_CHAR = /[\p{L}\p{Nd}_]/u
const isNameChar = (ch) => Boolean(ch) && NAME_CHAR.test(ch)

export const MENTION_NODE = 'mention'

export function mentionTargetId(mention) {
  return mention.targetType === MentionTargetType.Tribe ? mention.tribe?.tribeId : mention.actor?.actorId
}

export function mentionTargetName(mention) {
  return mention.targetType === MentionTargetType.Tribe ? mention.tribe?.tribeName : mention.actor?.profileName
}

function mentionIsRenderable(mention) {
  const entity = mention.targetType === MentionTargetType.Tribe ? mention.tribe : mention.actor
  return Boolean(entity && !entity.isDeleted && mentionTargetName(mention))
}

/**
 * Splits plain content into text segments and mention segments, matching "@Name" tokens against
 * the content item's mention list (ContentMentionDto[]). Longest names win so "@Ali" never
 * shadows "@Alican".
 * @returns {Array<string | {mention: object, raw: string}>}
 */
export function splitContentByMentions(text, mentions) {
  if (!text) return []
  const candidates = (mentions || [])
    .filter(mentionIsRenderable)
    .map((mention) => ({ mention, name: mentionTargetName(mention) }))
    .sort((a, b) => b.name.length - a.name.length)
  if (candidates.length === 0) return [text]

  const segments = []
  let cursor = 0
  let i = text.indexOf('@')
  while (i !== -1) {
    const hit = !isNameChar(text[i - 1])
      ? candidates.find(({ name }) => text.startsWith(name, i + 1) && !isNameChar(text[i + 1 + name.length]))
      : null
    if (hit) {
      if (i > cursor) segments.push(text.slice(cursor, i))
      const end = i + 1 + hit.name.length
      segments.push({ mention: hit.mention, raw: text.slice(i, end) })
      cursor = end
      i = text.indexOf('@', end)
    } else {
      i = text.indexOf('@', i + 1)
    }
  }
  if (cursor < text.length) segments.push(text.slice(cursor))
  return segments
}

export function mentionNodeAttrs(targetType, entity) {
  const isTribe = targetType === MentionTargetType.Tribe
  return {
    id: isTribe ? entity.tribeId : entity.actorId,
    label: isTribe ? entity.tribeName : entity.profileName,
    targetType,
    entity,
  }
}

/** Plain content + ContentMentionDto[] -> TipTap JSON document (one paragraph per line). */
export function contentToDoc(text, mentions) {
  const lines = (text || '').split('\n')
  return {
    type: 'doc',
    content: lines.map((line) => {
      const content = splitContentByMentions(line, mentions).map((segment) =>
        typeof segment === 'string'
          ? { type: 'text', text: segment }
          : {
              type: MENTION_NODE,
              attrs: mentionNodeAttrs(
                segment.mention.targetType,
                segment.mention.targetType === MentionTargetType.Tribe ? segment.mention.tribe : segment.mention.actor
              ),
            }
      )
      return content.length > 0 ? { type: 'paragraph', content } : { type: 'paragraph' }
    }),
  }
}

/**
 * TipTap document -> request payload.
 * - content: plain text, mention chips serialized as "@Name" (a space is inserted when a chip is
 *   glued to a name character so the backend's token boundary check holds)
 * - mentions: ContentMentionInputDto[] for the API
 * - mentionDtos: ContentMentionDto[] for optimistic local rendering
 */
export function docToPayload(doc) {
  const lines = []
  const seen = new Map()

  doc.forEach((paragraph) => {
    let line = ''
    let pendingBoundary = false
    paragraph.forEach((child) => {
      if (child.type.name === MENTION_NODE) {
        const { id, label, targetType, entity } = child.attrs
        if (isNameChar(line[line.length - 1])) line += ' '
        line += `@${label}`
        pendingBoundary = true
        const key = `${targetType}:${id}`
        if (!seen.has(key)) {
          seen.set(key, {
            input: { targetType, targetId: id },
            dto: targetType === MentionTargetType.Tribe ? { targetType, tribe: entity } : { targetType, actor: entity },
          })
        }
        return
      }
      const text = child.text || ''
      if (pendingBoundary && isNameChar(text[0])) line += ' '
      line += text
      pendingBoundary = false
    })
    lines.push(line)
  })

  const entries = [...seen.values()]
  return {
    content: lines.join('\n'),
    mentions: entries.map((e) => e.input),
    mentionDtos: entries.map((e) => e.dto),
  }
}
