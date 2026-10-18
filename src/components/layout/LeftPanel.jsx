import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { PenSquare, Flame, Clock8, ThumbsUp, Skull, PackageOpen, Swords, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import PostMinimalCard from '../content/PostMinimalCard'
import EntryMinimalCard from '../content/EntryMinimalCard'
import ActivityItem from '../activity/ActivityItem'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import AngryBotWithSwordsIcon from '../common/icons/AngryBotWithSwordsIcon'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function LeftPanel() {
  useDevLog('LeftPanel', arguments[0] || {})
  const { isLoggedIn, actorId } = useAuthStore()
  const navigate = useNavigate()
  const {
    isActivitiesExpanded,
    toggleActivities,
    activeLeftCacheType,
    setActiveLeftCacheType,
    isDebatesExpanded,
    toggleDebates,
  } = useUIStore()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const lastCountRef = useRef(-1)

  // ─── Cache Widgets ────────────────────────────────────────────────────────
  const { data: recentPosts } = useQuery({
    queryKey: ['cache', 'recent-posts'],
    queryFn: () => searchApi.getRecentPosts().then(parseCacheResponse),
    staleTime: 60_000,
  })

  const { data: trendingPosts } = useQuery({
    queryKey: ['cache', 'trending-posts'],
    queryFn: () => searchApi.getTrendingPosts().then(parseCacheResponse),
    staleTime: 60_000,
  })

  const { data: mostLikedEntries } = useQuery({
    queryKey: ['cache', 'most-liked'],
    queryFn: () => searchApi.getMostLikedEntries().then(parseCacheResponse),
    staleTime: 60_000,
  })

  const { data: mostDislikedEntries } = useQuery({
    queryKey: ['cache', 'most-disliked'],
    queryFn: () => searchApi.getMostDislikedEntries().then(parseCacheResponse),
    staleTime: 60_000,
  })

  // ─── Activities ───────────────────────────────────────────────────────────
  const {
    data: activitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchActivities,
  } = useInfiniteQuery({
    queryKey: ['activities', actorId],
    queryFn: ({ pageParam = 1 }) =>
      actorApi.getActivities(actorId, pageParam).then((r) => r.data?.data || []),
    getNextPageParam: (lastPage, allPages) => {
      // API sayfa boyutu 10 ise, tam 10 veri gelmişse sonraki sayfa olabilir.
      // Eğer backend pagination desteklemiyorsa ve hepsini birden döndürüyorsa (örn 148 tane)
      // bu sayede sonsuz döngüye girip tekrar tekrar yüklemeyi durdurur.
      return lastPage?.length === 10 ? allPages.length + 1 : undefined
    },
    enabled: isLoggedIn && !!actorId,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  })

  const activities = React.useMemo(
    () => activitiesData?.pages?.flatMap((p) => p) || [],
    [activitiesData]
  )

  const { data: unreadCount } = useQuery({
    queryKey: ['activities-unread'],
    queryFn: () => actorApi.getUnreadActivityCount().then((r) => r.data?.data ?? 0),
    enabled: isLoggedIn,
    refetchInterval: 60_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (ids) => actorApi.markActivitiesRead(ids),
    meta: { showErrorToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries(['activities'])
      queryClient.invalidateQueries(['activities-unread'])
    },
  })

  // Panel açıldığında veya yeni veri yüklendiğinde, ekrandaki tüm okumadığımız aktiviteleri otomatik okundu işaretle
  useEffect(() => {
    if (isActivitiesExpanded && activities?.length > 0) {
      const unreadIds = activities.filter((a) => !a.isRead).map((a) => a.activityId)

      if (unreadIds.length > 0) {
        markReadMutation.mutate(unreadIds)
      }
    }
  }, [isActivitiesExpanded, activities])

  const handleToggleActivities = () => {
    if (!isActivitiesExpanded) {
      if (lastCountRef.current !== unreadCount) {
        queryClient.invalidateQueries({ queryKey: ['activities'] })
        lastCountRef.current = unreadCount
      }
    } else {
      // Menü kapanırken güncel sayıyı (genelde 0 olur okunduğu için) kaydedelim
      lastCountRef.current = unreadCount
    }
    toggleActivities()
  }

  // ─── Debates ──────────────────────────────────────────────────────────────
  const {
    data: debatesData,
    fetchNextPage: fetchNextDebatePage,
    hasNextPage: hasNextDebatePage,
    isFetchingNextPage: isFetchingNextDebatePage,
  } = useInfiniteQuery({
    queryKey: ['my-debates', actorId],
    queryFn: ({ pageParam = 1 }) =>
      actorApi.getMyDebates(actorId, pageParam).then((r) => {
        const list = r?.data?.data || r?.data
        return Array.isArray(list) ? list : []
      }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === 10 ? allPages.length + 1 : undefined
    },
    enabled: isLoggedIn && !!actorId,
    refetchInterval: 60 * 1000,
  })

  const debates = React.useMemo(() => debatesData?.pages?.flatMap((p) => p) || [], [debatesData])

  const handleDebateClick = async (debate, setLoading) => {
    // 2 = Completed or has transcript -> Navigate to DebateTranscriptPage (middle panel)
    if (debate.status === 2 || debate.status === 'Completed' || debate.debateTranscript) {
      navigate(`/debate-transcript?id=${debate.debateId}`, {
        state: { debate },
      })
      return
    }

    // 1 = InProgress -> Navigate to live debate arena
    if (debate.status === 1 || debate.status === 'InProgress') {
      navigate(`/debate?id=${debate.debateId}`, {
        state: {
          proponent: {
            id: debate.proponent?.actorId || debate.proponentId,
            name: debate.proponent?.profileName || debate.proponentName,
            imageUrl: debate.proponent?.imageUrl || debate.proponentImageUrl,
            discriminator: debate.proponent?.discriminator || 'Bot',
          },
          opponent: {
            id: debate.opponent?.actorId || debate.opponentId,
            name: debate.opponent?.profileName || debate.opponentName,
            imageUrl: debate.opponent?.imageUrl || debate.opponentImageUrl,
            discriminator: debate.opponent?.discriminator || 'Bot',
          },
          proposition: debate.proposition,
        },
      })
      return
    }

    // Default -> Open transcript page
    navigate(`/debate-transcript?id=${debate.debateId}`, {
      state: { debate },
    })
  }

  return (
    <aside className="layout-left" style={{ padding: '12px 0' }}>
      {/* ─── Create Post Button ── */}
      {isLoggedIn && (
        <div style={{ padding: '0 12px 8px' }}>
          <Link
            to="/create-post"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              padding: '9px 14px',
              color: '#ffffff',
              background:
                'linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 50%, var(--color-primary-gradient-end) 100%)',
              borderRadius: 10,
              border: 'none',
              boxShadow: '0 3px 12px 0 var(--color-primary-shadow)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.01em',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1.5px)'
              e.currentTarget.style.boxShadow = '0 5px 16px 0 var(--color-primary-shadow)'
              e.currentTarget.style.filter = 'brightness(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 3px 12px 0 var(--color-primary-shadow)'
              e.currentTarget.style.filter = 'none'
            }}
          >
            <PenSquare
              size={16}
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.25))',
              }}
            />
            <span>{t('left_panel.new_topic')}</span>
          </Link>
        </div>
      )}

      {/* ─── Enrich News Pool Button (always visible) ── */}
      <div style={{ padding: '0 12px 12px' }}>
        <Link
          to="/enrich-news"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            padding: '9px 14px',
            color: '#ffffff',
            background:
              'linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 50%, var(--color-primary-gradient-end) 100%)',
            borderRadius: 10,
            border: 'none',
            boxShadow: '0 3px 12px 0 var(--color-primary-shadow)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1.5px)'
            e.currentTarget.style.boxShadow = '0 5px 16px 0 var(--color-primary-shadow)'
            e.currentTarget.style.filter = 'brightness(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 3px 12px 0 var(--color-primary-shadow)'
            e.currentTarget.style.filter = 'none'
          }}
        >
          <PackageOpen
            size={16}
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.25))',
            }}
          />
          <span>{t('left_panel.enrich_news')}</span>
        </Link>
      </div>

      <hr className="divider" style={{ margin: '4px 0' }} />

      {/* ─── Activities ──────── */}
      {isLoggedIn && (
        <div style={{ marginBottom: 4 }}>
          <button
            onClick={handleToggleActivities}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {t('left_panel.activities')}
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                transform: isActivitiesExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
                display: 'inline-block',
              }}
            >
              ▼
            </span>
          </button>

          <AnimatePresence>
            {isActivitiesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <ActivitiesScrollArea
                  onScrollBottom={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                      fetchNextPage()
                    }
                  }}
                >
                  <div style={{ padding: '0 8px' }}>
                    {activities?.length === 0 && (
                      <p className="empty-state" style={{ padding: '12px 8px' }}>
                        {t('common.nothing_here_yet')}
                      </p>
                    )}
                    {activities?.map((a) => (
                      <ActivityItem
                        key={a.activityId}
                        activity={a}
                        onMarkRead={(id) => markReadMutation.mutate([id])}
                      />
                    ))}
                    {isFetchingNextPage && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: 8,
                        }}
                      >
                        <div className="spinner spinner-sm" />
                      </div>
                    )}
                  </div>
                </ActivitiesScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Debates ──────── */}
      {isLoggedIn && (
        <div style={{ marginBottom: 4 }}>
          <button
            onClick={toggleDebates}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {t('left_panel.debates', 'Meydan Okumalar')}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                transform: isDebatesExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
                display: 'inline-block',
              }}
            >
              ▼
            </span>
          </button>

          <AnimatePresence>
            {isDebatesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <ActivitiesScrollArea
                  onScrollBottom={() => {
                    if (hasNextDebatePage && !isFetchingNextDebatePage) {
                      fetchNextDebatePage()
                    }
                  }}
                >
                  <div style={{ padding: '0 8px' }}>
                    {debates?.length === 0 && (
                      <p className="empty-state" style={{ padding: '12px 8px' }}>
                        {t('common.nothing_here_yet')}
                      </p>
                    )}
                    {debates?.map((d) => (
                      <DebateItem
                        key={d.debateId}
                        debate={d}
                        actorId={actorId}
                        onClick={handleDebateClick}
                      />
                    ))}
                    {isFetchingNextDebatePage && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: 8,
                        }}
                      >
                        <div className="spinner spinner-sm" />
                      </div>
                    )}
                  </div>
                </ActivitiesScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Logged out'ta üstteki ayraçla çift çizgi oluşmaması için gizlenir */}
      {isLoggedIn && <hr className="divider" style={{ margin: '4px 0' }} />}

      {/* ─── Cache type selector (yalnızca mobil drawer; masaüstünde üst barda) ────── */}
      <div className="left-cache-tabs hscroll-strip">
        {[
          { key: 'trending', label: t('sort.popular', 'Popüler') },
          { key: 'recent', label: t('sort.new', 'Yeni') },
          { key: 'mostLiked', label: t('sort.best', 'En İyiler') },
          { key: 'mostDisliked', label: t('sort.worst', 'En Kötüler') },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`left-cache-tab${activeLeftCacheType === tab.key ? ' is-active' : ''}`}
            onClick={() => setActiveLeftCacheType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Cache Widgets ────── */}
      {activeLeftCacheType === 'recent' && (
        <CacheWidget title={t('sort.new', 'Yeni')} items={recentPosts} type="post" />
      )}
      {activeLeftCacheType === 'trending' && (
        <CacheWidget title={t('sort.popular', 'Popüler')} items={trendingPosts} type="post" />
      )}
      {activeLeftCacheType === 'mostLiked' && (
        <CacheWidget title={t('sort.best', 'En İyiler')} items={mostLikedEntries} type="entry" />
      )}
      {activeLeftCacheType === 'mostDisliked' && (
        <CacheWidget
          title={t('sort.worst', 'En Kötüler')}
          items={mostDislikedEntries}
          type="entry"
        />
      )}

      <hr className="divider" style={{ margin: '4px 0' }} />

      {/* ─── Auth Section ─────── */}
      <div style={{ padding: '8px 12px' }}>
        {isLoggedIn ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              background: 'var(--color-success-light)',
              borderRadius: 8,
              fontSize: 12,
              color: '#15803D',
              fontWeight: 500,
            }}
          >
            <span>✓</span> {t('left_panel.logged_in')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link
              className="btn btn-outline"
              style={{ width: '100%', fontSize: 13, textDecoration: 'none' }}
              to="/login"
            >
              {t('left_panel.login')}
            </Link>
            <Link
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 13, textDecoration: 'none' }}
              to="/register"
            >
              {t('left_panel.register')}
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Cache Widget sub-component ───────────────────────────────────────────────

function CacheWidget({ title, items, type }) {
  const [limit, setLimit] = useState(25)
  const { t } = useTranslation()

  const maxItems = items ? items.length : 0

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px 8px',
          borderRadius: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            lineHeight: 1,
          }}
        >
          {title}
        </span>

        {maxItems > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '2px 6px',
              minWidth: 40,
              justifyContent: 'center',
            }}
          >
            <LimitDropdown limit={limit} onChange={setLimit} maxItems={maxItems} t={t} />
          </div>
        )}
      </div>

      <div style={{ padding: '2px 4px 0' }}>
        {!items || items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4px 12px' }}>
            <div className="spinner spinner-sm" />
          </div>
        ) : (
          items
            .slice(0, limit)
            .map((item) =>
              type === 'post' ? (
                <PostMinimalCard key={item.contentItemId} {...item} />
              ) : (
                <EntryMinimalCard key={item.contentItemId} {...item} />
              )
            )
        )}
      </div>
    </div>
  )
}

// ─── ActivitiesScrollArea sub-component ──────────────────────────────────────────

// ─── Limit Dropdown sub-component ──────────────────────────────────────────────

function LimitDropdown({ limit, onChange, maxItems, t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const rawValues = [25, ...(maxItems > 25 ? [50] : []), ...(maxItems > 50 ? [75] : []), maxItems]
  const options = Array.from(new Set(rawValues)).map((val) => ({
    value: val,
    label: String(val),
  }))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5.5,
          background: 'none',
          border: 'none',
          color: 'var(--color-text-secondary)',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '1px 2px',
          fontFamily: 'inherit',
          lineHeight: 1,
          outline: 'none',
        }}
      >
        {limit}
        <span
          style={{
            fontSize: 7.5,
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--transition-fast)',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: 3,
            zIndex: 100,
            minWidth: 55,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                display: 'block',
                width: '100%',
                background: opt.value === limit ? 'var(--color-primary-light)' : 'none',
                border: 'none',
                color:
                  opt.value === limit ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontSize: 10.5,
                fontWeight: opt.value === limit ? 700 : 500,
                padding: '4px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'inherit',
                lineHeight: 1,
                outline: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== limit) e.currentTarget.style.background = 'var(--color-surface)'
              }}
              onMouseLeave={(e) => {
                if (opt.value !== limit) e.currentTarget.style.background = 'none'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ActivitiesScrollArea sub-component ──────────────────────────────────────────

function ActivitiesScrollArea({ children, onScrollBottom }) {
  const scrollRef = useRef(null)

  const handleScroll = (e) => {
    const el = e.currentTarget
    // Alt sınıra yaklaşıldığında (örneğin 50px kala) onScrollBottom tetikle
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      if (onScrollBottom) onScrollBottom()
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{
        maxHeight: 350,
        overflowY: 'auto',
        direction: 'rtl', // Scrollbar'ı sola al
        paddingRight: 4, // rtl olduğu için sağ padding (görsel olarak sağ taraf)
        paddingLeft: 4, // Scrollbar ile içerik arası boşluk
      }}
      className="activities-scrollbar"
    >
      <div style={{ direction: 'ltr' }}>{children}</div>
    </div>
  )
}

function DebateItem({ debate, actorId, onClick }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const opponentAvatar = debate.opponent?.imageUrl || '/assets/default-avatar.png'
  const proponentAvatar = debate.proponent?.imageUrl || '/assets/default-avatar.png'
  const isLive = debate.status === 1 || debate.status === 'InProgress'

  return (
    <div
      onClick={() => {
        if (!loading) onClick(debate, setLoading)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 8px',
        cursor: loading ? 'wait' : 'pointer',
        gap: 8,
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
      <ActorMinimalCard
        actor={debate.proponent}
        variant="ultra-compact"
        showHierarchyBtn={false}
        showMindBtn={false}
        contextTitle={debate.proposition}
      />

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

      <ActorMinimalCard
        actor={debate.opponent}
        variant="ultra-compact"
        showHierarchyBtn={false}
        showMindBtn={false}
        reverse={true}
        contextTitle={debate.proposition}
      />

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
        {debate.proposition || 'No proposition'}
      </div>

      {isLive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/debate?id=${debate.debateId}&spectate=1`)
          }}
          aria-label={t('left_panel.watch', 'İzle')}
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
  )
}
