import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import { Edit2, Brain, Crown } from 'lucide-react'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import TRexSkullIcon from '../../assets/t-rex-skull-svgrepo-com.svg?react'
import CardIcon from '../common/icons/CardIcon'
import ImageWithLoader from '../common/ImageWithLoader'

/**
 * TribeMinimalCard — plan.md Component #4
 * MinimalTribeDto'dan tribe kartı. Tıklanınca Center Panel'de TribeProfileView açar.
 */
export default function TribeMinimalCard({
  tribe,
  tribeId: propTribeId,
  tribeName: propTribeName,
  tribePoint: propTribePoint,
  imageUrl: propImageUrl,
  isDormant: propIsDormant,
  IsDormant: propIsDormantUpper,
  assignedCardIds: propAssignedCardIds,
  AssignedCardIds: propAssignedCardIdsUpper,
  clickable = true,
  showPoint = true,
  showMindBtn = true,
  showEditBtn = true,
  variant = 'expanded',
  ultraCompact = false,
  style = {},
}) {
  const tribeId = propTribeId || tribe?.tribeId || tribe?.TribeId
  const tribeName = propTribeName || tribe?.tribeName || tribe?.TribeName
  const tribePoint = propTribePoint ?? tribe?.tribePoint ?? tribe?.TribePoint ?? tribe?.tribeActorPoint
  const imageUrl = propImageUrl || tribe?.imageUrl || tribe?.ImageUrl
  const isDormant = propIsDormant ?? tribe?.isDormant
  const IsDormant = propIsDormantUpper ?? tribe?.IsDormant
  useDevLog('TribeMinimalCard', arguments[0] || {})
  const [failedUrl, setFailedUrl] = useState(null)
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { t } = useTranslation()

  const myTribes = useMyEntitiesStore((s) => s.myTribes)
  const myCards = useMyEntitiesStore((s) => s.myCards)
  const isMyTribe = myTribes?.some((t) => t.tribeId === tribeId)
  const isCompact = variant === 'compact'
  const isUltraCompact =
    ultraCompact ||
    variant === 'ultra-compact' ||
    variant === 'ultra_compact' ||
    variant === 'ultracompact'
  const isDormantTribe = Boolean(isDormant ?? IsDormant ?? false)

  // Matching personality cards between current tribe and logged-in user
  const matchingCards = useMemo(() => {
    if (isUltraCompact || !isLoggedIn || !myCards?.length) return []

    const rawAssigned = [
      ...(propAssignedCardIds || []),
      ...(propAssignedCardIdsUpper || []),
      ...(tribe?.assignedCardIds || tribe?.AssignedCardIds || []),
      ...(tribe?.assignedCards || tribe?.AssignedCards || []).map((c) => c?.cardId || c?.CardId || c),
    ]
    if (!rawAssigned.length) return []

    const assignedIds = rawAssigned
      .map((c) => (typeof c === 'string' ? c : c?.cardId || c?.CardId || c?.id || c?.Id))
      .filter(Boolean)

    if (!assignedIds.length) return []

    const matches = assignedIds
      .map((aId) => {
        const myCard = myCards.find((mc) => {
          const mId = typeof mc === 'string' ? mc : mc?.cardId || mc?.CardId || mc?.id || mc?.Id
          return mId && mId.toLowerCase() === aId.toLowerCase()
        })
        if (!myCard) return null
        const acqType = typeof myCard === 'string' ? null : (myCard?.acquisitionType ?? null)
        return { id: aId, acquisitionType: acqType }
      })
      .filter(Boolean)

    return matches
  }, [isUltraCompact, isLoggedIn, myCards, propAssignedCardIds, propAssignedCardIdsUpper, tribe])

  const matchingCardsCount = matchingCards.length
  const visibleCards = matchingCards.slice(0, 5)

  const handleClick = (e) => {
    if (!clickable) return
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    navigate('/tribe?tribeId=' + tribeId)
  }

  const handleMindClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/mind?tribeId=' + tribeId, { state: { profileName: tribeName } })
  }

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/tribe/settings?tribeId=' + tribeId)
  }

  return (
    <div
      className={`tribe-card ${isCompact ? 'tribe-card--compact' : 'tribe-card--expanded'}${isDormantTribe ? ' tribe-card--dormant' : ''}`}
      onClick={handleClick}
      style={{
        width: isCompact ? 'auto' : '100%',
        maxWidth: '100%',
        cursor: clickable ? 'pointer' : 'default',
        margin: 0,
        ...style,
      }}
    >
      <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
        {showImage ? (
          <ImageWithLoader
            src={imageUrl}
            alt={tribeName}
            className="tribe-card-img"
            onError={() => setFailedUrl(imageUrl)}
            spinnerSize="sm"
            spinnerOpacity={0.4}
            wrapperClassName="tribe-card-img"
            wrapperStyle={{
              padding: 0,
              overflow: 'hidden',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface-2)',
            }}
          />
        ) : (
          <div
            className="tribe-card-img"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: isCompact ? 11 : 16,
            }}
          >
            {tribeName?.[0] || 'T'}
          </div>
        )}
        {isMyTribe && (
          <span
            style={{
              position: 'absolute',
              top: isCompact ? -3 : -4,
              left: isCompact ? -3 : -4,
              color: 'var(--color-warning)',
              zIndex: 2,
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
              transform: 'rotate(-15deg)',
              display: 'flex',
              pointerEvents: 'auto',
            }}
          >
            <Crown size={isCompact ? 12 : 16} strokeWidth={2.5} />
          </span>
        )}
      </div>
      <div style={{ flex: isCompact ? '0 1 auto' : 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="tribe-card-name truncate">
          {clickable ? (
            <Link
              to={'/tribe?tribeId=' + tribeId}
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {tribeName || t('tribe.unnamed_tribe', 'İsimsiz Klan')}
            </Link>
          ) : (
            tribeName || t('tribe.unnamed_tribe', 'İsimsiz Klan')
          )}
        </div>
      </div>

      {matchingCardsCount > 0 && (
        <div
          className="actor-chip-card-stack"
          onClick={clickable ? handleClick : undefined}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexShrink: 0,
            cursor: clickable ? 'pointer' : 'default',
            pointerEvents: clickable ? 'auto' : 'none',
          }}
        >
          {visibleCards.map((card, idx) => (
            <span
              key={card.id ?? idx}
              className="actor-chip-card-item"
              style={{
                position: 'relative',
                marginLeft: idx === 0 ? 0 : -10,
                zIndex: idx + 1,
                display: 'inline-flex',
                alignItems: 'flex-end',
              }}
            >
              <CardIcon
                crowned
                purchased={card.acquisitionType === 1}
                width={21}
                height={24}
                style={{ display: 'block' }}
              />
            </span>
          ))}
        </div>
      )}

      {isDormantTribe && (
        <span
          className="badge-fossil badge-fossil--plain"
        >
          <TRexSkullIcon className="badge-fossil-icon" />
        </span>
      )}
      {!isCompact && showMindBtn && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleMindClick}
          aria-label={t('mind.show', 'Hafıza haritasını göster')}
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Brain size={12} />
        </button>
      )}
      {!isCompact && isMyTribe && showEditBtn && !isDormantTribe && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleEditClick}
          aria-label={t('action.edit', 'Düzenle')}
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Edit2 size={12} />
        </button>
      )}
      {!isCompact && showPoint && tribePoint != null && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-surface-2)',
            padding: '2px 6px',
            borderRadius: 12,
          }}
        >
          {tribePoint.toLocaleString()} P
        </span>
      )}
    </div>
  )
}
