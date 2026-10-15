import { Link } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'

export default function EntryMinimalCard({ contentItemId, title, likeCount }) {
  useDevLog('EntryMinimalCard', arguments[0] || {})
  return (
    <Link className="post-minimal-card" to={'/entry?contentItemId=' + contentItemId}>
      <span className="post-minimal-title">{title || `#${contentItemId?.slice(0, 8)}`}</span>
      <span className="post-minimal-count">{likeCount ?? 0}</span>
    </Link>
  )
}
