import { Link } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function PostMinimalCard({ contentItemId, title, entryCount }) {
  useDevLog('PostMinimalCard', arguments[0] || {})
  const { t } = useTranslation()

  return (
    <Link
      to={'/post?postId=' + contentItemId}
      className="post-minimal-card"
    >
      <span className="post-minimal-title">{title || t('card.untitled')}</span>
      <span className="post-minimal-count">{entryCount ?? 0}</span>
    </Link>
  )
}
