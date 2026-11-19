import { MentionTargetType } from '../../../constants/enums'

// Stored mention format (same as the backend MentionRenderer): the text carries "@<n>" tokens, and n is the
// localKey of the content item's / card's mention that holds the target.
const TOKEN_PATTERN = /@<(\d+)>/g

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

/** MentionDto[] -> API inputs ({ targetType, targetId, localKey }), e.g. for an edit form that is saved untouched. */
export function mentionDtosToInputs(mentions) {
  return (mentions || []).map((m) => ({ targetType: m.targetType, targetId: mentionTargetId(m), localKey: m.localKey }))
}

/**
 * Splits stored text into text segments and mention segments by its "@<n>" tokens. A token whose mention is
 * missing or whose target is deleted becomes { deleted: true }.
 * @returns {Array<string | {mention: object} | {deleted: true}>}
 */
export function splitContentByMentions(text, mentions) {
  if (!text) return []
  const byKey = new Map((mentions || []).map((m) => [m.localKey, m]))

  const segments = []
  let cursor = 0
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    if (match.index > cursor) segments.push(text.slice(cursor, match.index))
    const mention = byKey.get(Number(match[1]))
    segments.push(mention && mentionIsRenderable(mention) ? { mention } : { deleted: true })
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) segments.push(text.slice(cursor))
  return segments
}

/** Stored text with its tokens rendered to "@Name" (document titles and other plain-text places). */
export function mentionsToPlainText(text, mentions, deletedLabel) {
  return splitContentByMentions(text, mentions)
    .map((segment) => {
      if (typeof segment === 'string') return segment
      return segment.mention ? `@${mentionTargetName(segment.mention)}` : deletedLabel
    })
    .join('')
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

/** Stored text + MentionDto[] -> TipTap JSON document (one paragraph per line); deleted targets become plain text. */
export function contentToDoc(text, mentions, deletedLabel) {
  const lines = (text || '').split('\n')
  return {
    type: 'doc',
    content: lines.map((line) => {
      const content = splitContentByMentions(line, mentions).map((segment) => {
        if (typeof segment === 'string') return { type: 'text', text: segment }
        if (segment.deleted) return { type: 'text', text: deletedLabel }
        const { mention } = segment
        return {
          type: MENTION_NODE,
          attrs: mentionNodeAttrs(mention.targetType, mention.targetType === MentionTargetType.Tribe ? mention.tribe : mention.actor),
        }
      })
      return content.length > 0 ? { type: 'paragraph', content } : { type: 'paragraph' }
    }),
  }
}

/**
 * TipTap document -> request payload.
 * - content: plain text where each mention chip is "@<n>". n is assigned per target in order of first
 *   appearance, so the same target mentioned twice shares one n. A literal "@<n>" typed as text is broken
 *   with a zero-width space so it is never read as a token.
 * - mentions: [{ targetType, targetId, localKey }] for the API
 * - mentionDtos: [{ targetType, localKey, actor | tribe }] for optimistic local rendering
 */
export function docToPayload(doc) {
  const lines = []
  const byTarget = new Map()

  doc.forEach((paragraph) => {
    let line = ''
    paragraph.forEach((child) => {
      if (child.type.name === MENTION_NODE) {
        const { id, targetType, entity } = child.attrs
        const key = `${targetType}:${id}`
        let entry = byTarget.get(key)
        if (!entry) {
          const localKey = byTarget.size + 1
          entry = {
            localKey,
            input: { targetType, targetId: id, localKey },
            dto:
              targetType === MentionTargetType.Tribe
                ? { targetType, localKey, tribe: entity }
                : { targetType, localKey, actor: entity },
          }
          byTarget.set(key, entry)
        }
        line += `@<${entry.localKey}>`
        return
      }
      line += (child.text || '').replace(TOKEN_PATTERN, '@​<$1>')
    })
    lines.push(line)
  })

  const entries = [...byTarget.values()]
  return {
    content: lines.join('\n'),
    mentions: entries.map((e) => e.input),
    mentionDtos: entries.map((e) => e.dto),
  }
}
