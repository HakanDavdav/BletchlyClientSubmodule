import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bot, Users, Network, Sparkles } from 'lucide-react'
import ActorAvatar from '../actor/ActorAvatar'
import CardDetailModal from './CardDetailModal'

export default function CardMinimalCard({
  card: rawItem,
  clickable = true,
  onClick = null,
  style = {},
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Card ownership DTO or pure card mapping
  const cardData = rawItem?.card || rawItem?.originalCard || rawItem || {}
  const actorData = rawItem?.actor || cardData?.actor || {}

  const cardName = cardData.cardName || rawItem.cardName || t('card.card')
  const cardId = cardData.personalityCardId || cardData.cardId || rawItem.cardId || rawItem.personalityCardId
  const assignmentCount = cardData.assignmentCount ?? rawItem.assignmentCount ?? 0
  const ownershipCount = cardData.ownershipCount ?? rawItem.ownershipCount ?? 0
  const cardHint = cardData.cardHint || rawItem.cardHint

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e)
      return
    }
    if (clickable) {
      setIsDetailOpen(true)
    }
  }

  const handleHierarchyClick = (e) => {
    e.stopPropagation()
    if (cardId) {
      navigate(`/card-hierarchy?cardId=${cardId}`)
    }
  }

  const handleActorClick = (e) => {
    e.stopPropagation()
    if (actorData.actorId) {
      navigate(`/profile/${actorData.actorId}`)
    }
  }

  return (
    <>
      <div
        className="card-minimal-row"
        onClick={handleCardClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 12px',
          borderRadius: 10,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          cursor: clickable ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          ...style,
        }}
      >
        {/* Left: Card Icon & Name & Creator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb, 99, 102, 241), 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cardName}
              </span>

              {cardHint && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 6,
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={cardHint}
                >
                  {cardHint}
                </span>
              )}
            </div>

            {actorData.profileName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
                onClick={handleActorClick}
              >
                <span style={{ opacity: 0.7 }}>{t('card.creator')}:</span>
                <ActorAvatar
                  profileName={actorData.profileName}
                  imageUrl={actorData.imageUrl}
                  discriminator={actorData.discriminator}
                  actorId={actorData.actorId}
                  size="sm"
                  onClick={handleActorClick}
                />
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                  }}
                  className="hover:underline"
                >
                  {actorData.profileName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Assignment count badge (primary metric) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 14,
              background: 'rgba(var(--color-primary-rgb, 99, 102, 241), 0.1)',
              border: '1px solid rgba(var(--color-primary-rgb, 99, 102, 241), 0.25)',
              fontSize: 12,
            }}
          >
            <Bot size={13} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {assignmentCount}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'none', smDisplay: 'inline' }}>
              {t('card.assignments_short')}
            </span>
          </div>

          {/* Ownership count badge */}
          {ownershipCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                color: 'var(--color-text-muted)',
              }}
            >
              <Users size={12} />
              <span>{ownershipCount}</span>
            </div>
          )}

          {/* View Hierarchy Button */}
          {cardId && (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handleHierarchyClick}
              aria-label={t('card.view_hierarchy')}
              style={{
                padding: '4px',
                borderRadius: 6,
                color: 'var(--color-text-muted)',
              }}
            >
              <Network size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Card detail modal */}
      {isDetailOpen && (
        <CardDetailModal
          card={rawItem}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </>
  )
}
