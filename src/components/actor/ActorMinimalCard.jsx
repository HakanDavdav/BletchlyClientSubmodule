import { useMemo } from 'react'
import { Network, Edit2, Brain } from 'lucide-react'
import SynapseBrainIcon from '../common/SynapseBrainIcon'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { actorApi } from '../../api/actorApi'
import ActorAvatar from './ActorAvatar'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import SelectionMarker from '../common/SelectionMarker'
import ModifierArrowSvg from '../../assets/FigmaNew/modifierarrow.svg?react'
import CardIcon from '../common/icons/CardIcon'
import KingIcon from '../common/icons/KingIcon'
import TRexSkullIcon from '../../assets/t-rex-skull-svgrepo-com.svg?react'
import { UserCapabilities } from '../../constants/enums'

/**
 * ActorMinimalCard — avatar + isim, hierarchy button, selection support.
 * Plan.md'ye göre her listede kullanılan temel aktör komponenti.
 */
export default function ActorMinimalCard({
  actor,
  showHierarchyBtn = true,
  showMemoryMapBtn = true,
  showPoint = false,
  showJuryPoints = false,
  juryProponentScore = null,
  juryOpponentScore = null,
  showEditBtn = true,
  showPremiumBtn = true,
  clickable = true,
  variant = 'compact',
  ultraCompact = false,
  reverse = false,
  avatarSize = null,
  chipStyle = {},
  nameMaxWidth = '14ch',
  selectable = false,
  selected = false,
  onSelect,
  disabled = false,
  triggeredNodeIds = null,
  contextTitle = null,
  children,
}) {
  useDevLog('ActorMinimalCard', arguments[0] || {})
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const currentUserId = useAuthStore((s) => s.actorId)

  const isUltraCompact =
    ultraCompact ||
    variant === 'ultra-compact' ||
    variant === 'ultra_compact' ||
    variant === 'ultracompact'

  const myBots = useMyEntitiesStore((s) => s.myBots)
  const myCards = useMyEntitiesStore((s) => s.myCards)

  // Matching personality cards between current actor and logged-in user
  const matchingCards = useMemo(() => {
    if (isUltraCompact || !isLoggedIn || !myCards?.length || !actor) return []

    const rawAssigned = [
      ...(actor.assignedCardIds || actor.AssignedCardIds || []),
      ...(actor.assignedCards || actor.AssignedCards || []).map((c) => c?.cardId || c?.CardId || c),
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
  }, [isUltraCompact, isLoggedIn, myCards, actor])

  const matchingCardsCount = matchingCards.length
  const visibleCards = matchingCards.slice(0, 5)

  const { data: currentUserProfile } = useQuery({
    queryKey: ['actorProfile', currentUserId],
    queryFn: () => actorApi.getProfile(currentUserId).then((r) => r.data?.data ?? null),
    enabled: isLoggedIn && !!currentUserId,
    staleTime: 5 * 60 * 1000,
  })

  const isPremiumOwner =
    ((currentUserProfile?.userSettings?.userCapabilities ?? UserCapabilities.Default) &
      UserCapabilities.Premium) === UserCapabilities.Premium

  if (!actor) return null

  const actorId = actor.actorId || actor.ActorId || actor.id || actor.Id
  const profileName = actor.profileName || actor.ProfileName || actor.name || actor.Name
  const imageUrl = actor.imageUrl !== undefined ? actor.imageUrl : (actor.ImageUrl !== undefined ? actor.ImageUrl : null)
  const discriminator = actor.discriminator || actor.Discriminator || 'Bot'
  const isBot = (discriminator || '').toLowerCase() === 'bot'
  const isDormant = Boolean(isBot && (actor.isDormant ?? actor.IsDormant ?? false))

  const effectiveTriggeredNodeIds =
    (triggeredNodeIds && triggeredNodeIds.length > 0)
      ? triggeredNodeIds
      : (actor.triggeredNodeIds || actor.TriggeredNodeIds || null)

  const isMe = currentUserId === actorId
  const isMyBot = myBots?.some((b) => b.actorId === actorId)
  const isOwner = isMe || isMyBot

  const pScore = juryProponentScore ?? actor?.proponentScore ?? actor?.juryProponentScore ?? null
  const oScore = juryOpponentScore ?? actor?.opponentScore ?? actor?.juryOpponentScore ?? null
  const hasJuryScores = pScore !== null && oScore !== null
  const isPropLeading = hasJuryScores && pScore >= oScore
  const isOppLeading = hasJuryScores && oScore >= pScore

  const handleActorClick = (e) => {
    if (selectable) {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation()
      }
      if (!disabled && onSelect) {
        onSelect(!selected, actor)
      }
      return
    }
    if (!clickable) return
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    navigate('/profile?actorId=' + actorId)
  }

  const handleHierarchyClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/hierarchy?actorId=' + actorId)
  }

  const handleMemoryMapClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    let query = ''
    if (effectiveTriggeredNodeIds && effectiveTriggeredNodeIds.length > 0) {
      query = `&highlightIds=${effectiveTriggeredNodeIds.join(',')}`
    }
    if (contextTitle) {
      query += `&contextTitle=${encodeURIComponent(contextTitle)}`
    }
    navigate(`/memory-map?actorId=${actorId}${query}`, { state: { profileName, contextTitle } })
  }

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isMe) {
      navigate('/profile?actorId=' + actorId + '&edit=true')
    } else if (isMyBot) {
      navigate('/edit-bot?botId=' + actorId)
    }
  }

  if (isUltraCompact) {
    return (
      <div
        className={`actor-chip actor-chip--ultra-compact${isDormant ? ' actor-chip--dormant' : ''}`}
        onClick={selectable ? handleActorClick : undefined}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 4px',
          borderRadius: 9999,
          background: 'var(--color-surface-2, rgba(255, 255, 255, 0.05))',
          border: '1px solid var(--color-border)',
          width: 'fit-content',
          maxWidth: 'fit-content',
          flexShrink: 0,
          userSelect: 'none',
          boxSizing: 'border-box',
          flexDirection: reverse ? 'row-reverse' : 'row',
          transition: 'all 0.15s ease',
          ...chipStyle,
        }}
      >
        <ActorAvatar
          profileName={profileName}
          imageUrl={imageUrl}
          discriminator={discriminator}
          actorId={actorId}
          size={avatarSize || (variant === 'expanded' ? 'md' : 'sm')}
          onClick={clickable && !selectable ? (aId, e) => handleActorClick(e) : undefined}
        />

        {showHierarchyBtn && !selectable && (
          <button
            type="button"
            className="actor-chip-hier-btn actor-chip-hier-btn--ultra"
            onClick={handleHierarchyClick}
            aria-label={t('actor.show_hierarchy', 'Hiyerarşiyi göster')}
          >
            <Network size={11} />
          </button>
        )}

        {children}
      </div>
    )
  }

  const hasTriggeredNodes = effectiveTriggeredNodeIds && effectiveTriggeredNodeIds.length > 0

  const hasExtraElements =
    isDormant ||
    (showHierarchyBtn && !selectable) ||
    (showMemoryMapBtn && !selectable && isBot) ||
    (showEditBtn && !selectable && isOwner) ||
    (showPoint && actor.actorPoint != null) ||
    showJuryPoints ||
    selectable ||
    Boolean(children)

  const chipContent = (
    <div
      className={`actor-chip flex items-center gap-1${selectable ? ' actor-chip--selectable' : ''}${selected ? ' actor-chip--selected' : ''}${isDormant ? ' actor-chip--dormant' : ''}`}
      onClick={selectable ? handleActorClick : undefined}
      style={{
        position: 'relative',
        zIndex: 2,
        width: selectable ? '100%' : undefined,
        maxWidth: '100%',
        justifyContent: selectable ? 'space-between' : undefined,
        paddingRight: selectable ? 12 : 10,
        paddingLeft: selectable ? 6 : undefined,
        cursor: selectable ? (disabled ? 'not-allowed' : 'pointer') : undefined,
        border: selectable && selected ? '1.5px solid var(--color-primary)' : undefined,
        background:
          selectable && selected
            ? 'color-mix(in srgb, var(--color-primary) 14%, var(--color-surface) 86%)'
            : undefined,
        userSelect: selectable ? 'none' : undefined,
        transition: 'all 0.15s ease',
        ...chipStyle,
      }}
    >
      <div
        onClick={selectable ? undefined : handleActorClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: clickable || selectable ? 'pointer' : 'default',
          flex: 1,
          minWidth: 0,
          marginRight: hasExtraElements || matchingCardsCount > 0 ? 15 : 0,
        }}
      >
        <ActorAvatar
          profileName={profileName}
          imageUrl={imageUrl}
          discriminator={discriminator}
          actorId={actorId}
          size={avatarSize || (variant === 'expanded' ? 'md' : 'sm')}
          onClick={clickable && !selectable ? (aId, e) => handleActorClick(e) : undefined}
        />
        <span
          className="actor-chip-name"
          style={{
            display: 'block',
            minWidth: 0,
            maxWidth: nameMaxWidth,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {clickable && !selectable ? (
            <Link
              to={'/profile?actorId=' + actorId}
              style={{ color: 'inherit', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {profileName || t('actor.unnamed', 'İsimsiz')}
            </Link>
          ) : (
            profileName || t('actor.unnamed', 'İsimsiz')
          )}
        </span>
      </div>

      {matchingCardsCount > 0 && (
        <div
          className="actor-chip-card-stack"
          onClick={clickable && !selectable ? handleActorClick : undefined}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexShrink: 0,
            cursor: clickable && !selectable ? 'pointer' : 'default',
            pointerEvents: clickable && !selectable ? 'auto' : 'none',
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

      {isDormant && (
        <span
          className="badge-fossil badge-fossil--plain"
        >
          <TRexSkullIcon className="badge-fossil-icon" />
        </span>
      )}

      {showHierarchyBtn && !selectable && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleHierarchyClick}
          aria-label={t('actor.show_hierarchy', 'Hiyerarşiyi göster')}
        >
          <Network size={12} />
        </button>
      )}
      {showMemoryMapBtn && !selectable && isBot && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleMemoryMapClick}
          aria-label={
            hasTriggeredNodes
              ? `${t('memoryMap.show', 'Memory Map')} (${effectiveTriggeredNodeIds.length} ${t('memoryMap.triggered_nodes', 'tetiklenen anı')})`
              : t('memoryMap.show', 'Memory Map')
          }
        >
          {hasTriggeredNodes ? (
            <SynapseBrainIcon brainSize={12} zapSize={8} brainColor="currentColor" zapColor="var(--color-synapse-zap, var(--color-primary))" />
          ) : (
            <Brain size={12} />
          )}
        </button>
      )}
      {showEditBtn && !selectable && isOwner && !isDormant && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleEditClick}
          aria-label={t('action.edit')}
        >
          <Edit2 size={12} />
        </button>
      )}
      {showEditBtn && showPremiumBtn && !selectable && isOwner && !isDormant && (
        <Link
          to="/premium"
          className="actor-chip-premium-btn"
          onClick={(e) => {
            e.stopPropagation()
          }}
          aria-label={isPremiumOwner ? t('premium.active', 'Pro Aktif') : t('premium.title', 'Pro')}
        >
          {isPremiumOwner ? (
            <KingIcon size={16} />
          ) : (
            <ModifierArrowSvg
              width={16}
              height={22}
              className="modifier-arrow"
              style={{ display: 'block' }}
            />
          )}
        </Link>
      )}
      {showPoint && actor.actorPoint != null && (
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
          {actor.actorPoint} P
        </span>
      )}
      {showJuryPoints && (
        <div
          className="actor-chip-jury-scores"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          {hasJuryScores ? (
            <>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isPropLeading ? 800 : 600,
                  color: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: isPropLeading ? '1px solid #3b82f6' : '1px solid transparent',
                  lineHeight: '14px',
                }}
              >
                P:{pScore}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isOppLeading ? 800 : 600,
                  color: '#ec4899',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: isOppLeading ? '1px solid #ec4899' : '1px solid transparent',
                  lineHeight: '14px',
                }}
              >
                O:{oScore}
              </span>
            </>
          ) : (
            <span
              style={{
                fontSize: 9,
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                padding: '0 4px',
              }}
            >
              ...
            </span>
          )}
        </div>
      )}
      {selectable && (
        <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <SelectionMarker
            checked={selected}
            size="sm"
            disabled={disabled}
            label={actor.profileName}
          />
        </div>
      )}
      {children}
    </div>
  )

  return chipContent
}
