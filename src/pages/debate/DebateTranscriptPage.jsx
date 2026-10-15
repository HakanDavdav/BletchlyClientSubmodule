import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Calendar,
  Crown,
  Trophy,
  MessageSquare,
  Bot as BotIcon,
} from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import BackButton from '../../components/common/BackButton'
import ActorAvatar from '../../components/actor/ActorAvatar'
import ActorMinimalCard from '../../components/actor/ActorMinimalCard'
import AngryBotIcon from '../../components/common/icons/AngryBotIcon'
import LazyBotIcon from '../../components/common/icons/LazyBotIcon'
import SwordIcon from '../../components/common/icons/SwordIcon'
import ShieldIcon from '../../components/common/icons/ShieldIcon'
import AngryBotWithSwordsIcon from '../../components/common/icons/AngryBotWithSwordsIcon'
import './DebatePage.css'

export default function DebateTranscriptPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const debateId = searchParams.get('id')

  const initialDebate = location.state?.debate || null

  const { data: fetchedDebate, isLoading, isError } = useQuery({
    queryKey: ['debate-detail', debateId],
    queryFn: () => actorApi.getDebateById(debateId).then((r) => r.data?.data || r.data),
    enabled: Boolean(debateId) && !initialDebate?.debateTranscript,
    initialData: initialDebate,
  })

  const debate = fetchedDebate || initialDebate

  const proponent = debate?.proponent || {}
  const opponent = debate?.opponent || {}
  const winner = debate?.winner || null
  const isDraw =
    (debate?.status === 2 || debate?.status === 'Completed') &&
    !winner &&
    debate?.proponentScore === debate?.opponentScore

  const [isTopicExpanded, setIsTopicExpanded] = useState(false)
  const arenaWrapRef = useRef(null)
  const [ellipseStyle, setEllipseStyle] = useState(null)
  const [debateBots, setDebateBots] = useState([])

  const pPoints = proponent.actorPoint || 0
  const oPoints = opponent.actorPoint || 0

  useEffect(() => {
    const el = arenaWrapRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const ellipseW = rect.width * 0.77
      const ellipseH = rect.height * 0.84

      setEllipseStyle({ left: centerX, top: centerY, width: ellipseW, height: ellipseH })

      const Rx = ellipseW / 2
      const Ry = ellipseH / 2
      const offsetX = 0
      const offsetY = 0

      const icons = []
      const totalPoints = pPoints + oPoints
      const numIcons = Math.min(300, 72 + Math.floor(totalPoints / 20))
      for (let i = 0; i < numIcons; i++) {
        const rx = Rx * (1.02 + Math.random() * 0.2)
        const ry = Ry * (1.02 + Math.random() * 0.2)
        const theta = Math.random() * 2 * Math.PI
        const x = offsetX + Math.cos(theta) * rx
        const y = offsetY + Math.sin(theta) * ry
        const size = 16 + Math.random() * 12
        const angleRad = Math.atan2(Math.sin(theta) * ry, Math.cos(theta) * rx)
        const rotation = (angleRad * 180) / Math.PI + 90
        const opacity = 0.35 + Math.random() * 0.4
        const delay = Math.random() * 4
        const duration = 1.6 + Math.random() * 2.4
        const r = Math.random()
        let botType = 'normal'
        if (r < 0.25) botType = 'angry'
        else if (r < 0.5) botType = 'lazy'
        const hasSword = Math.random() < 0.15
        const hasShield = Math.random() < 0.15
        icons.push({
          id: i,
          x,
          y,
          size,
          rotation,
          opacity,
          delay,
          duration,
          botType,
          hasSword,
          hasShield,
        })
      }
      setDebateBots(icons)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pPoints, oPoints])

  const parsedTurns = useMemo(() => {
    if (!debate?.debateTranscript) return []
    const lines = debate.debateTranscript.split('\n')
    const turns = []
    let currentTurn = null

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      const match = line.match(/^\[Turn\s+(\d+)\]\s+(Proponent|Opponent)\s*\(([^)]+)\):\s*(.*)$/i)
      if (match) {
        if (currentTurn) turns.push(currentTurn)
        currentTurn = {
          turnNumber: match[1],
          role: match[2].toLowerCase(),
          speakerName: match[3],
          content: match[4] || '',
        }
      } else if (currentTurn) {
        currentTurn.content += '\n' + line
      } else {
        turns.push({
          turnNumber: '•',
          role: 'neutral',
          speakerName: '',
          content: line,
        })
      }
    }
    if (currentTurn) turns.push(currentTurn)
    return turns
  }, [debate?.debateTranscript])

  const maxTurnNumber = useMemo(() => {
    const numbers = parsedTurns
      .map((t) => parseInt(t.turnNumber, 10))
      .filter((n) => !isNaN(n))
    return numbers.length > 0 ? Math.max(...numbers) : parsedTurns.length
  }, [parsedTurns])

  const formattedDate = debate?.completedAt || debate?.createdAt
    ? new Date(debate.completedAt || debate.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (isLoading && !debate) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (isError && !debate) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontWeight: '600' }}>{t('debate.not_found', 'Meydan okuma bulunamadı.')}</p>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginTop: '12px' }}>
          <ArrowLeft size={14} /> {t('common.back', 'Geri')}
        </button>
      </div>
    )
  }

  if (!debate) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <p>{t('debate.no_debate_selected', 'Görüntülenecek meydan okuma seçilmedi.')}</p>
      </div>
    )
  }

  const winnerName = winner?.profileName || (
    debate.winnerId === proponent.actorId
      ? proponent.profileName
      : debate.winnerId === opponent.actorId
      ? opponent.profileName
      : isDraw
      ? t('debate.draw', 'Berabere')
      : null
  )

  return (
    <div className="debate-page-wrapper">
      <div
        className="px-2"
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <BackButton onClick={() => navigate(-1)} style={{ marginBottom: 0 }} />
        {formattedDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            <Calendar size={13} />
            {formattedDate}
          </div>
        )}
      </div>

      <div className="debate-container">
        {/* Debate Header */}
        <div className="debate-header">
          <div className="debate-header__top">
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {t('debate.transcript_title', 'Meydan Okuma Transkripti')}
            </span>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
                border: '1px solid var(--color-border)',
                padding: '2px 12px',
                borderRadius: '9999px',
                letterSpacing: '0.5px',
              }}
            >
              <AngryBotWithSwordsIcon size={14} />
              <span>{t('debate.completed_status', 'Tamamlandı')}</span>
            </div>
            <div className="debate-status">
              {maxTurnNumber > 0 && `${maxTurnNumber} ${t('debate.turns_total', 'Tur')}`}
            </div>
          </div>

          <div
            className={`debate-proposition-container ${isTopicExpanded ? 'expanded' : ''}`}
            onClick={() => setIsTopicExpanded(!isTopicExpanded)}
          >
            <h2 className="debate-proposition-text">{debate.proposition || t('debate.no_proposition', 'Önerme belirtilmedi')}</h2>
          </div>
        </div>

        {/* Arena Wrap */}
        <div className="debate-arena-wrap" ref={arenaWrapRef}>
          <div className="debate-arena-backdrop fade-center">
            <div className="debate-ellipse" aria-hidden="true" style={ellipseStyle}></div>
            {debateBots.map((bot) => (
              <div
                key={bot.id}
                className="scattered-bot-positioner"
                style={{
                  transform: `translate(calc(-50% + ${bot.x}px), calc(-50% + ${bot.y}px)) rotate(${bot.rotation}deg)`,
                  opacity: bot.opacity,
                  zIndex: 0,
                }}
              >
                <div
                  className="scattered-bot-animator"
                  style={{
                    animationDelay: `${bot.delay}s`,
                    animationDuration: `${bot.duration}s`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {bot.hasSword && (
                    <div style={{ position: 'absolute', right: '55%', bottom: '-5%', transform: 'rotate(-25deg)', zIndex: 2, opacity: 0.9 }}>
                      <SwordIcon size={bot.size * 0.8} />
                    </div>
                  )}
                  {bot.botType === 'angry' ? (
                    <AngryBotIcon size={bot.size} />
                  ) : bot.botType === 'lazy' ? (
                    <LazyBotIcon size={bot.size} />
                  ) : (
                    <BotIcon size={bot.size} />
                  )}
                  {bot.hasShield && (
                    <div style={{ position: 'absolute', left: '55%', bottom: '-5%', transform: 'rotate(25deg)', zIndex: 2, opacity: 0.9 }}>
                      <ShieldIcon size={bot.size * 0.8} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Unified Chat Timeline */}
          <div className="debate-arena single-chat">
            <div className="chat-messages-container">
              {parsedTurns.length > 0 ? (
                parsedTurns.map((turn, index) => {
                  const isProponent = turn.role === 'proponent'
                  const isOpponent = turn.role === 'opponent'
                  const currentActor = isProponent ? proponent : isOpponent ? opponent : null
                  const speakerDisplayName = turn.speakerName || currentActor?.profileName || (isProponent ? 'Proponent' : isOpponent ? 'Opponent' : '')

                  return (
                    <div
                      key={index}
                      className={`chat-message-block ${isProponent ? 'msg-proponent' : isOpponent ? 'msg-opponent' : ''}`}
                    >
                      <div className="chat-message-header">
                        <ActorMinimalCard
                          actor={currentActor}
                          variant="ultra-compact"
                          showHierarchyBtn={false}
                          showMindBtn={true}
                          contextTitle={debate.proposition}
                        />
                        <div className="chat-message-info">
                          <span className="chat-message-name">{speakerDisplayName}</span>
                          <span className="chat-message-role">
                            {isProponent ? `${t('debate.role_proponent_short', 'Savunan')} • Tur ${turn.turnNumber}` : isOpponent ? `${t('debate.role_opponent_short', 'Karşıt')} • Tur ${turn.turnNumber}` : `Tur ${turn.turnNumber}`}
                          </span>
                        </div>
                      </div>
                      <div className="chat-message-body speech-stream">
                        {turn.content}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <MessageSquare size={44} style={{ marginBottom: '16px', opacity: 0.4 }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: '600' }}>
                    {debate.debateTranscript
                      ? debate.debateTranscript
                      : t('debate.no_transcript_available', 'Bu meydan okuma için henüz kayıtlı bir transkript bulunmuyor.')}
                  </div>
                </div>
              )}

              {/* Verdict Announcement inside Timeline */}
              {(winnerName || debate.proponentScore !== null) && (
                <div className="verdict-banner" style={{ marginTop: 'var(--space-4)' }}>
                  <div className="verdict-banner__content">
                    <div
                      className="page-header-icon"
                      style={{ width: 42, height: 42, borderRadius: 12 }}
                    >
                      <AngryBotWithSwordsIcon size={22} color="#fff" />
                    </div>
                    <div className="verdict-banner__text">
                      <span className="verdict-banner__title">{t('debate.verdict_title', 'Meydan Okuma Sonucu')}</span>
                      <span className="verdict-banner__winner">
                        {winnerName ? (
                          <>
                            {t('debate.winner', 'Kazanan')}: <strong>{winnerName}</strong> ({debate.proponentScore ?? '-'} - {debate.opponentScore ?? '-'})
                          </>
                        ) : (
                          `${debate.proponentScore ?? '-'} - ${debate.opponentScore ?? '-'}`
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={16} /> {t('common.back_to_home', 'Ana Sayfaya Dön')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verdict Bottom Banner */}
        {(winnerName || debate.proponentScore !== null) && (
          <div className="verdict-banner">
            <div className="verdict-banner__content">
              <div
                className="page-header-icon"
                style={{ width: 48, height: 48, borderRadius: 14 }}
              >
                <AngryBotWithSwordsIcon size={26} color="#fff" />
              </div>
              <div className="verdict-banner__text">
                <span className="verdict-banner__title">{t('debate.concluded_title', 'Meydan Okuma Tamamlandı')}</span>
                <span className="verdict-banner__winner">
                  {winnerName ? (
                    <>
                      {t('debate.winner', 'Kazanan')}: <strong>{winnerName}</strong> ({debate.proponentScore ?? '-'} - {debate.opponentScore ?? '-'})
                    </>
                  ) : (
                    `${debate.proponentScore ?? '-'} - ${debate.opponentScore ?? '-'}`
                  )}
                </span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={16} /> {t('common.back_to_home', 'Ana Sayfaya Dön')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
