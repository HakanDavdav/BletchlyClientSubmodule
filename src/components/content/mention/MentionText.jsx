import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ActorMinimalCard from '../../actor/ActorMinimalCard'
import TribeMinimalCard from '../../tribe/TribeMinimalCard'
import { MentionTargetType } from '../../../constants/enums'
import { splitContentByMentions } from './mentionUtils'

/**
 * Renders stored text with its "@<n>" mention tokens replaced by inline actor/tribe cards.
 * Tokens of deleted (or no longer existing) targets render as the "deleted" label.
 */
export default function MentionText({ text, mentions }) {
  const { t } = useTranslation()
  const segments = useMemo(() => splitContentByMentions(text, mentions), [text, mentions])

  return segments.map((segment, index) => {
    if (typeof segment === 'string') return <Fragment key={index}>{segment}</Fragment>
    if (segment.deleted) return <Fragment key={index}>{t('mention.deleted')}</Fragment>
    const { mention } = segment
    return mention.targetType === MentionTargetType.Tribe ? (
      <TribeMinimalCard key={index} tribe={mention.tribe} variant="inline" />
    ) : (
      <ActorMinimalCard key={index} actor={mention.actor} variant="inline" />
    )
  })
}
