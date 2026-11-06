import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import PersonalityCard from '../components/card/PersonalityCard'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Podium,
  Users,
  History,
  Check,
  Sparkles,
  Calendar,
  Bot,
  Network,
} from 'lucide-react'
import TRexSkullIcon from '../assets/t-rex-skull-svgrepo-com.svg?react'
import BackButton from '../components/common/BackButton'
import { PageTopDockRow } from '../components/layout/PageTopDock'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import useThemeStore from '../store/themeStore'
import HowItWorksHelp from '../components/common/HowItWorksHelp'
import { getQueryErrorMessage } from '../utils/errorHelper'
import { formatDate } from '../utils/formatDate'
import { useHorizontalScrollIndicator } from '../hooks/useHorizontalScrollIndicator'

export default function LeaderboardPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isGreenMode = useThemeStore((s) => s.isGreenMode)
  const isDarkMode = useThemeStore((s) => s.isDarkMode)
  useDevLog('LeaderboardPage', arguments[0] || {})

  const type = (searchParams.get('type') || 'user') === 'actor' ? 'user' : searchParams.get('type') || 'user'
  const seasonParam = searchParams.get('season') || 'current'
  const isCurrentSeason = seasonParam === 'current'
  const [typesRef, typesScroll] = useHorizontalScrollIndicator([isCurrentSeason])

  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let isTouchScroll = false

    function handleTouchStart(e) {
      if (!e.touches || e.touches.length === 0) return
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      isTouchScroll = false
    }

    function handleTouchMove(e) {
      if (!e.touches || e.touches.length === 0) return
      const dx = Math.abs(e.touches[0].clientX - touchStartX)
      const dy = Math.abs(e.touches[0].clientY - touchStartY)
      if (dx > 8 || dy > 8) {
        isTouchScroll = true
      }
    }

    function handleTouchEnd(e) {
      if (isTouchScroll) return
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSeasonDropdownOpen(false)
      }
    }

    function handleMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSeasonDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // 1. Current active season status & countdown
  const { data: seasonStatus } = useQuery({
    queryKey: ['seasonStatus'],
    queryFn: async () => {
      try {
        const res = await searchApi.getSeasonStatus()
        return res.data?.data || null
      } catch (err) {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  // 2. Available past seasons
  const { data: availableSeasons = [] } = useQuery({
    queryKey: ['availableSeasons'],
    queryFn: async () => {
      try {
        const res = await searchApi.getAvailableSeasons()
        return res.data?.data || []
      } catch (err) {
        return []
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  // 3. Leaderboard query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['leaderboard', seasonParam, type],
    queryFn: async () => {
      if (isCurrentSeason) {
        let res
        if (type === 'user') res = await searchApi.getUserLeaderboard()
        else if (type === 'bot') res = await searchApi.getBotLeaderboard()
        else if (type === 'tribe') res = await searchApi.getTribeLeaderboard()
        else if (type === 'card') res = await searchApi.getCardLeaderboard()
        else res = await searchApi.getUserLeaderboard()
        return {
          items: parseCacheResponse(res),
          isArchive: false,
        }
      } else {
        if (type === 'card') {
          return { items: [], isArchive: true }
        }
        const cat = type === 'bot' ? 0 : type === 'user' ? 1 : 2
        const res = await searchApi.getSeasonLeaderboard(Number(seasonParam), cat)
        const payload = res.data?.data || {}
        return {
          items: payload.items || payload.Items || [],
          seasonNumber: payload.seasonNumber ?? Number(seasonParam),
          archivedAt: payload.archivedAt,
          fossilizedBotCount: payload.fossilizedBotCount,
          activeBotCount: payload.activeBotCount,
          totalBotsEvaluated: payload.totalBotsEvaluated,
          isArchive: true,
        }
      }
    },
  })

  const currentSeasonNumber = seasonStatus?.currentSeason ?? 1
  const items = data?.items || []

  const handleTypeChange = (newType) => {
    const params = new URLSearchParams(searchParams)
    params.set('type', newType)
    navigate(`/leaderboard?${params.toString()}`)
  }

  const handleSeasonChange = (newSeason) => {
    const params = new URLSearchParams(searchParams)
    if (newSeason === 'current') {
      params.delete('season')
    } else {
      params.set('season', String(newSeason))
      if (type === 'card') {
        params.set('type', 'user')
      }
    }
    navigate(`/leaderboard?${params.toString()}`)
    setSeasonDropdownOpen(false)
  }

  const selectedSeasonLabel = isCurrentSeason
    ? `${t('leaderboard.live_badge')} (S${currentSeasonNumber})`
    : `${t('common.season')} ${seasonParam}`

  return (
    <div className="flex-col gap-4">
      <PageTopDockRow
        left={<BackButton text={t('common.go_back')} onClick={() => navigate(-1)} style={{ marginBottom: 0 }} />}
        right={
          <div className="leaderboard-controls" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Season Selector Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setSeasonDropdownOpen((v) => !v)}
              style={{
                borderRadius: 20,
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: !isCurrentSeason ? 'var(--color-primary)' : undefined,
                color: !isCurrentSeason ? 'var(--color-primary)' : undefined,
                fontWeight: 600,
              }}
            >
              {!isCurrentSeason ? (
                <History size={14} />
              ) : (
                <Bot size={14} style={{ color: 'var(--color-primary)' }} />
              )}
              <span>{selectedSeasonLabel}</span>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 9,
                  lineHeight: 1,
                  display: 'inline-block',
                  transform: seasonDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                ▼
              </span>
            </button>

            {seasonDropdownOpen && (
              <div
                className="leaderboard-season-panel"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  minWidth: 250,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-lg)',
                  padding: 6,
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t('leaderboard.season_select')}
                </div>

                {/* Option 1: Live current season */}
                <button
                  type="button"
                  className={`season-option-btn ${isCurrentSeason ? 'active' : ''}`}
                  onClick={() => handleSeasonChange('current')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bot size={14} style={{ color: 'var(--color-primary)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {t('leaderboard.active_season', {
                          season: currentSeasonNumber,
                        })}
                      </div>
                      {seasonStatus?.daysRemaining != null && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {seasonStatus.daysRemaining} {t('common.days_left')}
                        </div>
                      )}
                    </div>
                  </div>
                  {isCurrentSeason && <Check size={14} color="var(--color-primary)" />}
                </button>

                {/* Past seasons */}
                {availableSeasons.length > 0 ? (
                  availableSeasons.map((s) => {
                    const isSelected = seasonParam === String(s.seasonNumber)
                    return (
                      <button
                        key={s.seasonNumber}
                        type="button"
                        className={`season-option-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSeasonChange(s.seasonNumber)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <History size={14} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {t('common.season')} {s.seasonNumber}
                            </div>
                            {s.archivedAt && (
                              <div className="date-text">
                                {formatDate(s.archivedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check size={14} color="var(--color-primary)" />}
                      </button>
                    )
                  })
                ) : (
                  <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    {t('common.nothing_here_yet')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toggle Buttons: Users, Bots, Tribes — mobilde yatay kaydırılır */}
          <div className="leaderboard-types-wrap">
            {typesScroll.scrollable && (
              <div className="leaderboard-types-scrollbar" aria-hidden="true">
                <div
                  className="leaderboard-types-scrollbar-thumb"
                  style={{ width: `${typesScroll.width}%`, left: `${typesScroll.left}%` }}
                />
              </div>
            )}
            <div className="hscroll-strip leaderboard-types-strip" ref={typesRef} style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn btn-sm ${type === 'user' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleTypeChange('user')}
                style={{ borderRadius: 20, padding: '6px 14px' }}
              >
                {t('common.users')}
              </button>
              <button
                className={`btn btn-sm ${type === 'bot' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleTypeChange('bot')}
                style={{ borderRadius: 20, padding: '6px 14px' }}
              >
                {t('common.bots')}
              </button>
              <button
                className={`btn btn-sm ${type === 'tribe' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleTypeChange('tribe')}
                style={{ borderRadius: 20, padding: '6px 14px' }}
              >
                {t('common.tribes')}
              </button>
              {isCurrentSeason && (
                <button
                  className={`btn btn-sm ${type === 'card' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleTypeChange('card')}
                  style={{ borderRadius: 20, padding: '6px 14px' }}
                >
                  {t('common.cards')}
                </button>
              )}
            </div>
          </div>
        </div>
        }
        style={{ marginBottom: 16 }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Podium size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {type === 'user'
              ? t('leaderboard.user_leaderboard')
              : type === 'bot'
              ? t('leaderboard.bot_leaderboard')
              : type === 'tribe'
              ? t('leaderboard.tribe_leaderboard')
              : t('leaderboard.card_leaderboard')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {!isCurrentSeason
              ? t('leaderboard.archive_desc')
              : type === 'user'
              ? t('leaderboard.user_desc')
              : type === 'bot'
              ? t('leaderboard.bot_desc')
              : type === 'tribe'
              ? t('leaderboard.tribe_desc')
              : t('leaderboard.card_desc')}
          </p>
        </div>
        <HowItWorksHelp
          title={t('leaderboard.how_it_works_title')}
          items={[
            t('leaderboard.how_it_works_1'),
            t('leaderboard.how_it_works_2'),
            t('leaderboard.how_it_works_3'),
            t('leaderboard.how_it_works_4'),
            t('leaderboard.how_it_works_5'),
          ]}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {/* Case A: Active Season - Minimalist Status Strip */}
      {isCurrentSeason && seasonStatus && (
        <div className="season-live-bar-mini">
          <div className="live-mini-left">
            <span className="live-dot" />
            <span className="live-mini-title">
              {t('leaderboard.active_season', {
                season: currentSeasonNumber,
              })}
            </span>
          </div>
          <div className="live-mini-right">
            <div
              className="season-remaining-badge season-remaining-badge--subtle"
            >
              <span>
                {seasonStatus.daysRemaining > 0
                  ? t('common.days_remaining_short', { count: seasonStatus.daysRemaining })
                  : t('common.hours_remaining_short', { count: seasonStatus.hoursRemaining ?? 0 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Case B: Past Season Archive - Minimalist Stat Strip */}
      {!isCurrentSeason && (
        <div className="season-archive-bar-mini">
          <div className="archive-mini-left">
            <span className="archive-mini-title">
              {t('common.season')} {seasonParam}
            </span>
            {data?.archivedAt && (
              <span className="archive-mini-date date-text">
                • {formatDate(data.archivedAt)}
              </span>
            )}
          </div>

          <div className="archive-mini-stats">
            <div
              className="archive-stat-chip archive-stat-chip--fossil"
            >
              <TRexSkullIcon className="badge-fossil-icon" style={{ width: 12, height: 12 }} />
              <span>{data?.fossilizedBotCount ?? 0} {t('leaderboard.fossil_short')}</span>
            </div>

            <div
              className="archive-stat-chip archive-stat-chip--active"
            >
              <Bot size={11} />
              <span>{data?.activeBotCount ?? 0} {t('leaderboard.active_short')}</span>
            </div>

            <div
              className="archive-stat-chip archive-stat-chip--total"
            >
              <Bot size={11} />
              <span>{data?.totalBotsEvaluated ?? 0} {t('leaderboard.total_short')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Items: Grid for Cards (Marketplace Style), List for Users/Bots/Tribes */}
      {type === 'card' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {isLoading ? (
            <div className="flex justify-center" style={{ padding: 40, gridColumn: '1 / -1' }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : isError ? (
            <div className="empty-state form-error" style={{ gridColumn: '1 / -1' }}>
              {getQueryErrorMessage(error, t)}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              {t('common.nothing_here_yet')}
            </div>
          ) : (
            items.map((item, index) => {
              const rank = index + 1
              const isTop3 = rank <= 3
              const cardData = item.card || item
              const cardId = cardData.personalityCardId || item.cardId || cardData.cardId

              return (
                <div
                  key={item.ownershipId ?? cardId ?? index}
                  style={{
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  {/* Top Rank Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingBottom: 8,
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {isTop3 ? (
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          opacity: rank === 1 ? 1 : rank === 2 ? 0.8 : 0.6,
                          fontWeight: rank === 1 ? 800 : rank === 2 ? 700 : 600,
                          fontSize: rank === 1 ? 20 : rank === 2 ? 18 : 16,
                        }}
                      >
                        #{rank}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>#{rank}</span>
                    )}
                  </div>

                  {/* PersonalityCard Component */}
                  <PersonalityCard card={item} showMark={false} />
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Regular List for Users, Bots, Tribes */
        <div className="minimal-card-list">
          {isLoading ? (
            <div className="flex justify-center" style={{ padding: 40 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : isError ? (
            <div className="empty-state form-error">{getQueryErrorMessage(error, t)}</div>
          ) : !items || items.length === 0 ? (
            <div className="empty-state">{t('common.nothing_here_yet')}</div>
          ) : (
            items.map((item, index) => {
              const rank = index + 1
              const isTop3 = rank <= 3

              return (
                <div
                  key={type !== 'tribe' ? (item.actorId ?? item.ActorId) : (item.tribeId ?? item.TribeId)}
                  className="lb-card"
                  style={{ padding: '8px 16px' }}
                >
                  <div className="lb-rank" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {isTop3 ? (
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          opacity: rank === 1 ? 1 : rank === 2 ? 0.8 : 0.6,
                          fontWeight: rank === 1 ? 800 : rank === 2 ? 700 : 600,
                          fontSize: rank === 1 ? 20 : rank === 2 ? 18 : 16,
                        }}
                      >
                        #{rank}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>#{rank}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {type !== 'tribe' ? (
                      <ActorMinimalCard actor={item} clickable={true} showPoint={true} />
                    ) : (
                      <TribeMinimalCard
                        tribe={item}
                        tribeId={item.tribeId ?? item.TribeId}
                        tribeName={item.tribeName ?? item.TribeName}
                        imageUrl={item.imageUrl ?? item.ImageUrl}
                        tribePoint={item.tribeActorPoint ?? item.TribeActorPoint ?? item.tribePoint ?? item.TribePoint}
                        isDormant={item.isDormant ?? item.IsDormant ?? false}
                        clickable={true}
                        showPoint={true}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
