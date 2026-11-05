// TopicTag & TopicTagList
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TopicLabels, TopicColors, TopicTypes, TopicEnumNames, parseTopicFlags } from '../../constants/enums'
import useDevLog from '../../utils/useDevLog'

export function TopicTag({ topicType, size = 'sm', onClick, clickable = true }) {
  useDevLog('TopicTag', arguments[0] || {})
  const { t } = useTranslation()
  const navigate = useNavigate()
  const enumName = TopicEnumNames[topicType]
  const label = enumName ? t(`topics.${enumName}`) : (TopicLabels[topicType] || `${t('card.topic_prefix')}${topicType}`)
  const color = TopicColors[topicType] || '#64748B'

  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
      return
    }
    if (clickable) {
      e.stopPropagation()
      const targetTopic = enumName || topicType
      navigate(`/explore?topic=${encodeURIComponent(targetTopic)}`)
    }
  }

  const isInteractive = Boolean(onClick || clickable)

  return (
    <span
      className={`topic-tag ${isInteractive ? 'topic-tag--clickable' : ''}`}
      style={{
        background: color + '20',
        color: color,
        fontSize: size === 'sm' ? '11px' : '13px',
        padding: size === 'sm' ? '2px 8px' : '3px 12px',
        cursor: isInteractive ? 'pointer' : 'default',
      }}
      onClick={isInteractive ? handleClick : undefined}
    >
      {label}
    </span>
  )
}

export function TopicTagList({ topicTypes, max = 5, clickable = true }) {
  useDevLog('TopicTagList', arguments[0] || {})
  if (!topicTypes || topicTypes.length === 0) return null

  // Backend array of int → parse
  const parsed = parseTopicFlags(topicTypes)
  const visible = parsed.slice(0, max)
  const rest = parsed.length - visible.length

  return (
    <div className="topic-tag-list">
      {visible.map((t) => (
        <TopicTag key={t} topicType={t} clickable={clickable} />
      ))}
      {rest > 0 && (
        <span className="badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
          +{rest}
        </span>
      )}
    </div>
  )
}

export default TopicTag
