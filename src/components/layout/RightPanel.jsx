import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Podium } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import TribePage from '../../pages/TribePage'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function RightPanel() {
  useDevLog('RightPanel', arguments[0] || {})
  const navigate = useNavigate()
  const { t } = useTranslation()

  // ─── Queries ────────────────────────────────────────────────────────
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const myBots = useMyEntitiesStore((s) => s.myBots)
  const rightPanelTribeId = useUIStore((s) => s.rightPanelTribeId)

  const { data: userLeaderboard } = useQuery({
    queryKey: ['cache', 'user-leaderboard'],
    queryFn: () => searchApi.getUserLeaderboard().then(parseCacheResponse),
    staleTime: 60_000,
    enabled: !rightPanelTribeId,
  })

  const { data: botLeaderboard } = useQuery({
    queryKey: ['cache', 'bot-leaderboard'],
    queryFn: () => searchApi.getBotLeaderboard().then(parseCacheResponse),
    staleTime: 60_000,
    enabled: !rightPanelTribeId,
  })

  const { data: tribeLeaderboard } = useQuery({
    queryKey: ['cache', 'tribe-leaderboard'],
    queryFn: () => searchApi.getTribeLeaderboard().then(parseCacheResponse),
    staleTime: 60_000,
    enabled: !rightPanelTribeId,
  })

  if (rightPanelTribeId) {
    return (
      <aside className="layout-right" style={{ padding: '8px 6px' }}>
        <TribePage tribeId={rightPanelTribeId} embedded />
      </aside>
    )
  }

  return (
    <aside className="layout-right" style={{ padding: '16px 0' }}>
      {/* ─── My Bots Avatars ────── */}
      {isLoggedIn && myBots && myBots.length > 0 && (
        <div style={{ padding: '0 12px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
            {myBots.slice(0, 3).map((bot) => (
              <Link
                key={bot.actorId}
                to={'/profile?actorId=' + bot.actorId}
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                <ActorAvatar
                  profileName={bot.profileName}
                  imageUrl={bot.imageUrl}
                  discriminator={bot.discriminator}
                  actorId={bot.actorId}
                  size="lg"
                  clickable={false}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── User Leaderboard Cache Widget ────── */}
      <div style={{ padding: '0 12px' }}>
        <CacheWidget
          title={t('leaderboard.user_leaderboard')}
          items={userLeaderboard}
          type="user"
          viewAllTo="/leaderboard?type=user"
        />
      </div>

      <hr className="divider" style={{ margin: '8px 12px' }} />

      {/* ─── Bot Leaderboard Cache Widget ────── */}
      <div style={{ padding: '0 12px' }}>
        <CacheWidget
          title={t('leaderboard.bot_leaderboard')}
          items={botLeaderboard}
          type="bot"
          viewAllTo="/leaderboard?type=bot"
        />
      </div>

      <hr className="divider" style={{ margin: '8px 12px' }} />

      {/* ─── Tribe Leaderboard Cache Widget ────── */}
      <div style={{ padding: '0 12px' }}>
        <CacheWidget
          title={t('leaderboard.tribe_leaderboard')}
          items={tribeLeaderboard}
          type="tribe"
          viewAllTo="/leaderboard?type=tribe"
        />
      </div>

      <hr className="divider" style={{ margin: '8px 12px' }} />

      {/* ─── Reklam Alanı ────── */}
      <div className="ad-card" style={{ marginTop: 16, margin: '0 12px' }}>
        <div className="ad-label">{t('common.ad')}</div>
        {/* Örnek placeholder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'var(--color-surface-3)',
            color: 'var(--color-text-faint)',
          }}
        >
          {t('common.ad_space')}
        </div>
      </div>

      {/* Mini Footer */}
      <div style={{ padding: '0 12px', marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 11,
            color: 'var(--color-text-faint)',
          }}
        >
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
            Privacy Policy
          </Link>{' '}
          •
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
            Terms of Service
          </Link>{' '}
          •
          <Link to="/cookie-policy" style={{ color: 'inherit', textDecoration: 'none' }}>
            Cookie Policy
          </Link>
        </div>
      </div>
    </aside>
  )
}

// ─── Cache Widget sub-component ───────────────────────────────────────────────

function CacheWidget({ title, items, type, viewAllTo }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--transition-fast)',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="minimal-card-list" style={{ padding: '4px 0' }}>
              {!items || items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4px 12px' }}>
                  <div className="spinner spinner-sm" />
                </div>
              ) : (
                items.slice(0, 3).map((item, index) => {
                  const rank = index + 1
                  const isTop3 = rank <= 3
                  const score = type !== 'tribe' ? item.actorPoint : item.tribePoint

                  return (
                    <div
                      key={type !== 'tribe' ? item.actorId : item.tribeId}
                      className="lb-card"
                      style={{ padding: '6px 8px' }}
                      onClick={() =>
                        navigate(
                          type !== 'tribe'
                            ? '/profile?actorId=' + item.actorId
                            : '/tribe?tribeId=' + item.tribeId
                        )
                      }
                    >
                      <div
                        className="lb-rank"
                        style={{
                          minWidth: 24,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {isTop3 ? (
                          <span
                            style={{
                              color: 'var(--color-primary)',
                              opacity: rank === 1 ? 1 : rank === 2 ? 0.8 : 0.6,
                              fontWeight: rank === 1 ? 800 : rank === 2 ? 700 : 600,
                              fontSize: rank === 1 ? 18 : rank === 2 ? 16 : 14,
                            }}
                          >
                            #{rank}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                            #{rank}
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {type !== 'tribe' ? (
                          <ActorMinimalCard actor={item} clickable={true} showPoint={true} showPremiumBtn={false} />
                        ) : (
                          <TribeMinimalCard {...item} clickable={true} showPoint={true} />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              {items && items.length > 3 && (
                <Link
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 4, textDecoration: 'none' }}
                  to={viewAllTo}
                >
                  {t('common.view_all')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
