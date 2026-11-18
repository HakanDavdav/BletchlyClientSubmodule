import { Fragment, useMemo } from 'react'
import ActorMinimalCard from '../../actor/ActorMinimalCard'
import TribeMinimalCard from '../../tribe/TribeMinimalCard'
import { MentionTargetType } from '../../../constants/enums'
import { splitContentByMentions } from './mentionUtils'

/**
 * Renders stored plain content with its @mentions replaced by inline actor/tribe cards.
 * Tokens without a matching mention (typed by hand, deleted targets) stay plain text.
 */
export default function MentionText({ text, mentions }) {
  const segments = useMemo(() => splitContentByMentions(text, mentions), [text, mentions])

  return segments.map((segment, index) => {
    if (typeof segment === 'string') return <Fragment key={index}>{segment}</Fragment>
    const { mention } = segment
    return mention.targetType === MentionTargetType.Tribe ? (
      <TribeMinimalCard key={index} tribe={mention.tribe} variant="inline" />
    ) : (
      <ActorMinimalCard key={index} actor={mention.actor} variant="inline" />
    )
  })
}
