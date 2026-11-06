import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Eye, Swords, X } from 'lucide-react'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import AngryBotWithSwordsIcon from '../common/icons/AngryBotWithSwordsIcon'
import { getShortTimeAgo } from '../../utils/formatTime'
import './DebateCard.css'

const isLive = (d) => d.status === 1 || d.status === 'InProgress' || d.Status === 1 || d.Status === 'InProgress'
const isCompleted = (d) => d.status === 2 || d.status === 'Completed' || d.Status === 2 || d.Status === 'Completed'
const isCancelled = (d) => d.status === 3 || d.status === 'Cancelled' || d.Status === 3 || d.Status === 'Cancelled'

function DebateCardBackground({ proponent, opponent }) {
  const leftImage = proponent.imageUrl || proponent.ImageUrl
  const rightImage = opponent.imageUrl || opponent.ImageUrl

  if (!leftImage && !rightImage) return null

  return (
    <div className="debate-card__bg" aria-hidden="true">
      <div className="debate-card__bg-side debate-card__bg-side--left">
        {leftImage && (
          <div
            className="debate-card__bg-image"
            style={{ backgroundImage: `url("${leftImage}")` }}
          />
        )}
      </div>
      <div className="debate-card__bg-side debate-card__bg-side--right">
        {rightImage && (
          <div
            className="debate-card__bg-image"
            style={{ backgroundImage: `url("${rightImage}")` }}
          />
        )}
      </div>
      <div className="debate-card__bg-overlay" />
      <svg
        className="debate-card__crack"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M35,100 L37,74 L42,74 L47,48 L53,48 L59,20 L65,0" />
      </svg>
    </div>
  )
}

export default function DebateCard({ debate, actorId, onOpen, onWatch, variant = 'default' }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const compact = variant === 'compact'
  const live = isLive(debate)
  const completed = isCompleted(debate)
  const cancelled = isCancelled(debate)
  const proponent = debate.proponent || debate.Proponent || {}
  const opponent = debate.opponent || debate.Opponent || {}
  const proposition = debate.proposition || debate.Proposition || ''
  const isParticipant =
    (proponent.actorId || proponent.ActorId) === actorId ||
    (opponent.actorId || opponent.ActorId) === actorId

  const proponentId = proponent.actorId || proponent.ActorId
  const opponentId = opponent.actorId || opponent.ActorId
  const winnerId =
    debate.winnerId ||
    debate.WinnerId ||
    debate.winner?.actorId ||
    debate.Winner?.actorId ||
    null
  const isProponentWinner = Boolean(
    winnerId && proponentId && String(winnerId).toLowerCase() === String(proponentId).toLowerCase()
  )
  const isOpponentWinner = Boolean(
    winnerId && opponentId && String(winnerId).toLowerCase() === String(opponentId).toLowerCase()
  )
  const displayDate =
    debate.completedAt ||
    debate.CompletedAt ||
    debate.createdAt ||
    debate.CreatedAt ||
    null

  const handleOpen = async () => {
    if (loading || !onOpen) return
    if (compact) setLoading(true)
    try {
      await onOpen(debate)
    } finally {
      if (compact) setLoading(false)
    }
  }

  if (compact) {
    return (
      <div
        className="debate-card--with-bg"
        onClick={handleOpen}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 8px 6px',
          cursor: loading ? 'wait' : 'pointer',
          gap: 2,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          marginBottom: 6,
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = 'var(--color-primary-light)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.transform = 'none'
          }
        }}
      >
        <DebateCardBackground proponent={proponent} opponent={opponent} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <span className={isProponentWinner ? 'debate-winner' : ''} style={{ display: 'contents' }}>
          <ActorMinimalCard
            actor={proponent}
            variant="ultra-compact"
            showHierarchyBtn={false}
            showMindBtn={false}
            contextTitle={proposition}
          />
        </span>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <div className="spinner spinner-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
          ) : (
            <AngryBotWithSwordsIcon size={16} style={{ color: 'var(--color-primary)' }} />
          )}
        </div>

        <span className={isOpponentWinner ? 'debate-winner' : ''} style={{ display: 'contents' }}>
          <ActorMinimalCard
            actor={opponent}
            variant="ultra-compact"
            showHierarchyBtn={false}
            showMindBtn={false}
            reverse={true}
            contextTitle={proposition}
          />
        </span>

        <div
          style={{
            flex: 1,
            marginLeft: 4,
            fontSize: 11,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--color-text)',
          }}
        >
          {proposition || t('debate.no_proposition')}
        </div>

        {live && onWatch && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onWatch(debate)
            }}
            aria-label={t('left_panel.watch')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.background = 'var(--color-primary-alpha)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.background = 'var(--color-bg)'
            }}
          >
            <Eye size={14} />
          </button>
        )}
        </div>
        {displayDate && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <span className="date-text">{getShortTimeAgo(displayDate)}</span>
          </div>
        )}
      </div>
    )
  }

  const ButtonIcon = live && isParticipant ? Swords : Eye

  return (
    <div
      className="info-card debate-card debate-card--with-bg"
      onClick={handleOpen}
      style={{
        cursor: 'pointer',
        gap: 10,
        padding: '14px 16px 10px',
        height: 'fit-content',
      }}
    >
      <DebateCardBackground proponent={proponent} opponent={opponent} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            minWidth: 0,
          }}
        >
          {live && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                animation: 'debatePulse 1.6s infinite',
                flexShrink: 0,
                marginRight: 'auto',
                marginLeft: 2,
              }}
            />
          )}
          {completed && (
            <Check
              size={15}
              strokeWidth={2.5}
              style={{
                color: 'var(--color-primary)',
                flexShrink: 0,
                marginRight: 'auto',
                marginLeft: 2,
              }}
            />
          )}
          {cancelled && (
            <X
              size={15}
              strokeWidth={3}
              style={{
                color: 'var(--color-error)',
                flexShrink: 0,
                marginRight: 'auto',
                marginLeft: 2,
              }}
            />
          )}
          <span className={isProponentWinner ? 'debate-winner' : ''} style={{ display: 'contents' }}>
            <ActorMinimalCard
              actor={proponent}
              variant="ultra-compact"
              showHierarchyBtn={false}
              showMemoryMapBtn={true}
              contextTitle={proposition}
            />
          </span>
          <span
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              minWidth: 0,
            }}
          >
            {proponent.profileName || proponent.ProfileName || 'Proponent'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AngryBotWithSwordsIcon size={26} style={{ color: 'var(--color-primary)' }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              minWidth: 0,
              textAlign: 'right',
            }}
          >
            {opponent.profileName || opponent.ProfileName || 'Opponent'}
          </span>
          <span className={isOpponentWinner ? 'debate-winner' : ''} style={{ display: 'contents' }}>
            <ActorMinimalCard
              actor={opponent}
              variant="ultra-compact"
              showHierarchyBtn={false}
              showMemoryMapBtn={true}
              reverse={true}
              contextTitle={proposition}
            />
          </span>
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: 'var(--color-border)',
          width: '100%',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: -2 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {proposition || t('debate.no_proposition')}
        </p>

        <div
          style={{
            height: 1,
            background: 'var(--color-border)',
            width: '100%',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 6,
            paddingTop: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
              color: 'var(--color-primary)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ButtonIcon size={15} strokeWidth={2.5} />
            <span className="truncate">
              {live
                ? isParticipant
                  ? t('debate.join_debate')
                  : t('debate.watch_live')
                : t('debate.view_transcript')}
            </span>
          </div>
          {completed ? (
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.02em',
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
              }}
            >
              {debate.proponentScore ?? debate.ProponentScore ?? '-'} - {debate.opponentScore ?? debate.OpponentScore ?? '-'}
            </span>
          ) : <span />}
          {displayDate ? (
            <span className="date-text" style={{ justifySelf: 'end', whiteSpace: 'nowrap' }}>
              {getShortTimeAgo(displayDate)}
            </span>
          ) : <span aria-hidden="true" />}
        </div>
      </div>
    </div>
  )
}
