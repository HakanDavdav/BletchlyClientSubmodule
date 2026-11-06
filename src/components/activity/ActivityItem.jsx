import { useNavigate } from 'react-router-dom'
import { AtSign } from 'lucide-react'
import { getShortTimeAgo } from '../../utils/formatTime'
import { IdTypes } from '../../constants/enums'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

/**
 * ActivityItem — plan.md Component #5
 * Bildirim/aktivite öğesi. Okunmamışlar vurgulanır.
 */
export default function ActivityItem({ activity, onMarkRead, currentProfileName, forceRead, variant = 'default' }) {
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

  if (variant === 'profile') {
    return (
      <div
        className={`activity-item ${isRead ? '' : 'unread'}`}
        onClick={handleClick}
        style={{ minWidth: 0, maxWidth: '100%', flexShrink: 0, display: 'flex', alignItems: 'stretch' }}
      >
        <div className="activity-dot" aria-hidden="true" style={{ alignSelf: 'flex-start', marginTop: 5 }} />

        {/* Mesaj Bölümü: Sağdaki meta bloğuna asla giremez */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            paddingRight: 14,
          }}
        >
          <span
            className="activity-message"
            style={{
              margin: 0,
              display: 'block',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              wordWrap: 'break-word',
            }}
          >
            {message || t('activity.new_activity')}
          </span>
        </div>

        {/* Sağ Meta Bloğu: @ ikonu ve süre için ayrılmış bağımsız alan */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'stretch',
            minWidth: 65,
          }}
        >
          <div
            style={{
              minHeight: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              transform: 'translateY(-2px)',
            }}
          >
            {mentionsProfile && (
              <div
                style={{
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AtSign size={16} />
              </div>
            )}
          </div>
          <span
            className="activity-time date-text"
            style={{
              whiteSpace: 'nowrap',
              marginTop: 'auto',
              textAlign: 'center',
              alignSelf: 'center',
            }}
          >
            {timeAgo}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`activity-item ${isRead ? '' : 'unread'}`}
      onClick={handleClick}
      style={{ minWidth: 0, maxWidth: '100%', flexShrink: 0 }}
    >
      {/* Nokta her zaman DOM'da kalır (yerleşim kaymasın); okununca CSS ile yumuşakça söner */}
      <div className="activity-dot" aria-hidden="true" />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            className="activity-message"
            style={{
              margin: 0,
              flex: 1,
              minWidth: 0,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              wordWrap: 'break-word',
            }}
          >
            {message || t('activity.new_activity')}
          </span>
          {mentionsProfile && (
            <div
              style={{
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                marginTop: 2,
                marginRight: 10,
              }}
            >
              <AtSign size={14} />
            </div>
          )}
        </div>
        <span
          className="activity-time date-text"
          style={{
            alignSelf: 'flex-end',
            whiteSpace: 'nowrap',
          }}
        >
          {timeAgo}
        </span>
      </div>
    </div>
  )
}
