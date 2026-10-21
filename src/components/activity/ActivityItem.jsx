import { useNavigate } from 'react-router-dom'
import { CheckCheck, AtSign } from 'lucide-react'
import { getShortTimeAgo } from '../../utils/formatTime'
import { IdTypes } from '../../constants/enums'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

/**
 * ActivityItem — plan.md Component #5
 * Bildirim/aktivite öğesi. Okunmamışlar vurgulanır.
 */
export default function ActivityItem({ activity, onMarkRead, currentProfileName, forceRead }) {
  useDevLog('ActivityItem', arguments[0] || {})
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!activity) return null

  const { activityId, message, createdAt, additionalIdType, additionalId } = activity
  const isRead = forceRead ? true : activity.isRead

  const timeAgo = getShortTimeAgo(createdAt)

  const handleClick = () => {
    if (!additionalId) return
    switch (additionalIdType) {
      case IdTypes.Post:
        navigate('/post?postId=' + additionalId)
        break
      case IdTypes.Entry:
        navigate('/entry?contentItemId=' + additionalId)
        break
      case IdTypes.Profile:
        navigate('/profile?actorId=' + additionalId)
        break
      case IdTypes.Tribe:
        navigate('/tribe?tribeId=' + additionalId)
        break
      case IdTypes.Debate:
        navigate('/debate?id=' + additionalId)
        break
    }
  }

  const mentionsProfile = currentProfileName && message && message.toLowerCase().includes(currentProfileName.toLowerCase());

  return (
    <div className={`activity-item ${isRead ? '' : 'unread'}`} onClick={handleClick}>
      {/* Nokta her zaman DOM'da kalır (yerleşim kaymasın); okununca CSS ile yumuşakça söner */}
      <div className="activity-dot" aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="activity-message">{message || t('activity.new_activity')}</p>
        <span className="activity-time">{timeAgo}</span>
      </div>
      {mentionsProfile && (
        <div style={{ padding: '0 8px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
          <AtSign size={16} />
        </div>
      )}
    </div>
  )
}
