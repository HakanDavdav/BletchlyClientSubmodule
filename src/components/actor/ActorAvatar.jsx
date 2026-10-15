import { useState } from 'react'
import { Bot, User, Crown } from 'lucide-react'
import { BotGradeColors, UserGradeColors } from '../../constants/enums'
import useDevLog from '../../utils/useDevLog'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import { useTranslation } from 'react-i18next'
import ImageWithLoader from '../common/ImageWithLoader'

/**
 * ActorAvatar — profil resmi veya isim harfi fallback.
 * Link olarak davranır, tıklanınca profile navigasyon tetikler.
 *
 * @param {object} props
 * @param {string|null} props.profileName
 * @param {string|null} props.imageUrl
 * @param {'User'|'Bot'|null} props.discriminator
 * @param {string} props.actorId
 * @param {number|null} [props.botGrade]
 * @param {number|null} [props.userGrade]
 * @param {number|null} [props.grade]
 * @param {'sm'|'md'|'lg'|'xl'|'xxl'|'xxxl'} [props.size='md']
 * @param {function} [props.onClick] - navigasyon yerine custom handler
 */
export default function ActorAvatar({
  profileName,
  imageUrl,
  discriminator,
  actorId,
  botGrade,
  userGrade,
  grade,
  size = 'md',
  onClick,
  hideBadge = false,
}) {
  useDevLog('ActorAvatar', arguments[0] || {})
  const { t } = useTranslation()
  const [failedUrl, setFailedUrl] = useState(null)
  const isBot = discriminator === 'Bot'
  const initial = profileName ? profileName[0].toUpperCase() : '?'
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl

  const myBots = useMyEntitiesStore((s) => s.myBots)
  const isMyBot = isBot && myBots?.some((b) => b.actorId === actorId)

  const sizeMap = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl',
    xxl: 'avatar-xxl',
    xxxl: 'avatar-xxxl',
  }
  const sizeClass = sizeMap[size] || 'avatar-md'

  const badgeSizeMap = {
    sm: { size: 14, icon: 10, bottom: -2, right: -2 },
    md: { size: 18, icon: 12, bottom: -2, right: -2 },
    lg: { size: 22, icon: 14, bottom: -2, right: -2 },
    xl: { size: 28, icon: 16, bottom: 0, right: 0 },
    xxl: { size: 40, icon: 24, bottom: 2, right: 2 },
    xxxl: { size: 44, icon: 26, bottom: 4, right: 4 },
  }
  const badgeOpts = badgeSizeMap[size] || badgeSizeMap.md

  const effectiveBotGrade = botGrade ?? (isBot ? grade : null)
  const botGradeLabel =
    isBot && effectiveBotGrade !== null && effectiveBotGrade !== undefined
      ? ['A', 'B', 'C', 'D', 'F'][effectiveBotGrade] ||
        (typeof effectiveBotGrade === 'string' ? effectiveBotGrade : '?')
      : null

  const effectiveUserGrade = userGrade ?? (!isBot ? grade : null)
  const userGradeLabel =
    !isBot && effectiveUserGrade !== null && effectiveUserGrade !== undefined
      ? ['A', 'B', 'C', 'D', 'F'][effectiveUserGrade] ||
        (typeof effectiveUserGrade === 'string' ? effectiveUserGrade : '?')
      : null

  const gradeBadgeSize = Math.max(12, Math.round(badgeOpts.size * 0.52))

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick(actorId, e)
    }
  }

  return (
    <div
      className="actor-avatar-wrap"
      style={{
        cursor: 'pointer',
        alignSelf: 'flex-start',
        height: 'max-content',
        display: 'inline-flex',
      }}
      onClick={handleClick}
    >
      {showImage ? (
        <ImageWithLoader
          src={imageUrl}
          alt={profileName || t('actor.avatar_alt', 'Kişi')}
          className={`avatar ${sizeClass}`}
          onError={() => setFailedUrl(imageUrl)}
          spinnerSize="sm"
          spinnerOpacity={0.35}
          wrapperClassName={`avatar ${sizeClass}`}
          wrapperStyle={{
            padding: 0,
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isBot ? 'var(--color-bot-light)' : 'var(--color-primary-light)',
          }}
        />
      ) : (
        <div
          className={`avatar-fallback ${sizeClass}`}
          style={{
            background: isBot ? 'var(--color-bot-light)' : 'var(--color-primary-light)',
            color: isBot ? 'var(--color-bot)' : 'var(--color-primary-dark)',
          }}
        >
          {initial}
        </div>
      )}

      {isMyBot && (
        <span
          style={{
            position: 'absolute',
            top: -(badgeOpts.size * 0.25),
            left: -(badgeOpts.size * 0.12),
            color: 'var(--color-warning)',
            zIndex: 2,
            filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
            transform: 'rotate(-15deg)',
            display: 'flex',
            pointerEvents: 'auto',
          }}
        >
          <Crown size={Math.max(16, badgeOpts.size * 0.9)} strokeWidth={2.5} />
        </span>
      )}

      {!hideBadge && isBot && (
        <div
          className="actor-avatar-badge-group"
          style={{ bottom: badgeOpts.bottom, right: badgeOpts.right }}
        >
          <div
            className="actor-avatar-user-badge"
            style={{ width: badgeOpts.size, height: badgeOpts.size }}
          >
            <Bot size={badgeOpts.icon} color="white" strokeWidth={2.5} />
          </div>
          {botGradeLabel && (
            <div
              className="actor-avatar-grade-badge"
              style={{
                width: gradeBadgeSize,
                height: gradeBadgeSize,
                background: BotGradeColors[effectiveBotGrade] ?? 'var(--color-primary)',
                fontSize: Math.max(9, Math.round(gradeBadgeSize * 0.42)),
              }}
            >
              {botGradeLabel}
            </div>
          )}
        </div>
      )}
      {!hideBadge && discriminator === 'User' && (
        <div
          className="actor-avatar-badge-group"
          style={{ bottom: badgeOpts.bottom, right: badgeOpts.right }}
        >
          <div
            className="actor-avatar-user-badge"
            style={{ width: badgeOpts.size, height: badgeOpts.size }}
          >
            <User size={badgeOpts.icon} color="white" strokeWidth={2.5} />
          </div>
          {userGradeLabel && (
            <div
              className="actor-avatar-grade-badge"
              style={{
                width: gradeBadgeSize,
                height: gradeBadgeSize,
                background:
                  UserGradeColors[effectiveUserGrade] ??
                  BotGradeColors[effectiveUserGrade] ??
                  'var(--color-primary)',
                fontSize: Math.max(9, Math.round(gradeBadgeSize * 0.42)),
              }}
            >
              {userGradeLabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
