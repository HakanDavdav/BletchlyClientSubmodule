import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { PenSquare, Flame, Clock8, ThumbsUp, Skull, PackageOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import PostMinimalCard from '../content/PostMinimalCard'
import EntryMinimalCard from '../content/EntryMinimalCard'
import ActivityItem from '../activity/ActivityItem'
import DebateCard from '../debate/DebateCard'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { TopicTypes } from '../../constants/TopicTypes'
import { TopicColors } from '../../constants/enums'
import { useTranslation } from 'react-i18next'
import { useHorizontalScrollIndicator } from '../../hooks/useHorizontalScrollIndicator'

export default function LeftPanel() {
  useDevLog('LeftPanel', arguments[0] || {})
  const { isLoggedIn, actorId } = useAuthStore()
  const navigate = useNavigate()
  const {
    isActivitiesExpanded,
    toggleActivities,
    activeLeftCacheType,
    setActiveLeftCacheType,
    activeLeftTopicType,
    setActiveLeftTopicType,
    isDebatesExpanded,
    toggleDebates,
  } = useUIStore()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const lastCountRef = useRef(-1)
  const [isMobileTopicOpen, setIsMobileTopicOpen] = useState(false)
  const [mobileTopicPos, setMobileTopicPos] = useState(null)
  const mobileTopicBtnRef = useRef(null)
  const mobileTopicPanelRef = useRef(null)
  const [cacheTabsRef, cacheTabsScroll] = useHorizontalScrollIndicator([])

  // Sekmelerde yatay kaydırma yaparken dokunma jestinin sol çekmeceye (drawer swipe)
  // yayılmasını engelleyerek çekmecenin sürüklenmesini önle
  useEffect(() => {
    const el = cacheTabsRef.current
    if (!el) return undefined
    const stopProp = (e) => {
      e.stopPropagation()
    }
    el.addEventListener('touchstart', stopProp, { passive: true })
    el.addEventListener('touchmove', stopProp, { passive: true })
    el.addEventListener('touchend', stopProp, { passive: true })
    el.addEventListener('pointerdown', stopProp, { passive: true })
    return () => {
      el.removeEventListener('touchstart', stopProp)
      el.removeEventListener('touchmove', stopProp)
      el.removeEventListener('touchend', stopProp)
      el.removeEventListener('pointerdown', stopProp)
    }
  }, [cacheTabsRef])

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        mobileTopicBtnRef.current &&
        !mobileTopicBtnRef.current.contains(event.target) &&
        !mobileTopicPanelRef.current?.contains(event.target)
      ) {
        setIsMobileTopicOpen(false)
        setMobileTopicPos(null)
      }
    }
    const handleResize = () => {
      setIsMobileTopicOpen(false)
      setMobileTopicPos(null)
    }
    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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

  const { data: topicPopularPosts } = useQuery({
    queryKey: ['cache', 'topic-popular', activeLeftTopicType],
    queryFn: () => searchApi.getTrendingPostsByTopic(activeLeftTopicType).then((r) => r.data?.data || []),
    enabled: !!activeLeftTopicType && activeLeftCacheType === 'topicPopular',
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

  const markAllReadMutation = useMutation({
    mutationFn: () => actorApi.markAllActivitiesRead(),
    meta: { showErrorToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['activities-unread'] })
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

  const activeTopicLabel = React.useMemo(() => {
    const topic = TopicTypes.find((item) => item.value === activeLeftTopicType)
    return topic ? t(`topics.${topic.key || topic.enumName?.toLowerCase()}`, topic.label) : ''
  }, [activeLeftTopicType, t])

  const handleTopicChange = (value) => {
    const numericValue = value ? Number(value) : null
    setActiveLeftTopicType(numericValue)
    setActiveLeftCacheType(numericValue ? 'topicPopular' : 'trending')
  }

  const toggleMobileTopics = (event) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const panelWidth = Math.min(320, window.innerWidth - 16)
    const left = Math.min(window.innerWidth - panelWidth - 8, Math.max(8, rect.right - panelWidth))
    setMobileTopicPos({ top: rect.bottom + 6, left, width: panelWidth })
    setIsMobileTopicOpen((value) => !value)
  }

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

  const handleDebateClick = async (debate) => {
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
            }}
          >
            <button
              onClick={handleToggleActivities}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                padding: 0,
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
            </button>
            {isActivitiesExpanded && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending || (unreadCount ?? 0) === 0}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                {t('left_panel.mark_all_read', 'Tümünü oku')}
              </button>
            )}
            <button
              onClick={handleToggleActivities}
              aria-label={isActivitiesExpanded ? t('common.collapse', 'Daralt') : t('common.expand', 'Genişlet')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                transform: isActivitiesExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            >
              ▼
            </button>
          </div>

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
                      <DebateCard
                        key={d.debateId}
                        debate={d}
                        actorId={actorId}
                        variant="compact"
                        onOpen={handleDebateClick}
                        onWatch={(debate) =>
                          navigate(`/debate?id=${debate.debateId || debate.DebateId}&spectate=1`)
                        }
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
      <div className="left-cache-tabs-row" data-no-drawer-swipe="true">
        <div className="left-cache-tabs-wrap" data-no-drawer-swipe="true">
          {cacheTabsScroll.scrollable && (
            <div className="left-cache-tabs-scrollbar" aria-hidden="true" data-no-drawer-swipe="true">
              <div
                className="left-cache-tabs-scrollbar-thumb"
                style={{ width: `${cacheTabsScroll.width}%`, left: `${cacheTabsScroll.left}%` }}
              />
            </div>
          )}
          <div className="left-cache-tabs hscroll-strip" ref={cacheTabsRef} data-no-drawer-swipe="true">
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
                data-no-drawer-swipe="true"
                onClick={() => {
                  setActiveLeftTopicType(null)
                  setActiveLeftCacheType(tab.key)
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button
          ref={mobileTopicBtnRef}
          type="button"
          className={`btn ${activeLeftCacheType === 'topicPopular' ? 'btn-primary' : 'btn-ghost'} left-topic-menu-btn`}
          style={{ padding: '6px 10px', minWidth: 42, fontSize: 12 }}
          onClick={toggleMobileTopics}
          aria-haspopup="menu"
          aria-expanded={isMobileTopicOpen}
          aria-label={t('sort.topic', 'Konu')}
          title={t('sort.topic', 'Konu')}
        >
          ...
        </button>
      </div>

      {isMobileTopicOpen && mobileTopicPos && createPortal(
        <div
          ref={mobileTopicPanelRef}
          role="menu"
          style={{
            position: 'fixed',
            top: mobileTopicPos.top,
            left: mobileTopicPos.left,
            width: mobileTopicPos.width,
            maxHeight: 'min(360px, 60vh)',
            overflowY: 'auto',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            padding: 8,
            zIndex: 500,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              handleTopicChange('')
              setIsMobileTopicOpen(false)
              setMobileTopicPos(null)
            }}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: activeLeftTopicType == null ? 600 : 500,
              cursor: 'pointer',
              background: activeLeftTopicType == null ? 'var(--color-primary)' : 'transparent',
              color: activeLeftTopicType == null ? '#fff' : 'var(--color-text-secondary)',
              border: `1px solid ${activeLeftTopicType == null ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {t('sort.all_topics', 'Tüm konular')}
          </button>
          {TopicTypes.map((topic) => {
            const color = TopicColors[topic.value] || 'var(--color-primary)'
            const isSelected = activeLeftTopicType === topic.value
            return (
              <button
                key={topic.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  handleTopicChange(String(topic.value))
                  setIsMobileTopicOpen(false)
                  setMobileTopicPos(null)
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  background: isSelected ? color : `${color}18`,
                  color: isSelected ? '#fff' : color,
                  border: `1px solid ${isSelected ? color : `${color}55`}`,
                }}
              >
                {t(`topics.${topic.key || topic.enumName?.toLowerCase()}`, topic.label)}
              </button>
            )
          })}
        </div>,
        document.body
      )}

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

      {activeLeftCacheType === 'topicPopular' && (
        <CacheWidget
          title={`${t('sort.popular', 'Popüler')}${activeTopicLabel ? ` • ${activeTopicLabel}` : ''}`}
          items={topicPopularPosts}
          type="post"
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
          <LimitDropdown limit={limit} onChange={setLimit} maxItems={maxItems} t={t} />
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
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          padding: '4px 8px',
          minWidth: 42,
          fontSize: 12,
          fontWeight: 600,
          gap: 5,
        }}
      >
        {limit}
        <span
          aria-hidden="true"
          style={{
            fontSize: 8,
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
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 6,
            zIndex: 100,
            minWidth: 64,
            boxShadow: 'var(--shadow-lg)',
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                background:
                  opt.value === limit
                    ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                    : 'transparent',
                border: 'none',
                color: opt.value === limit ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: 12,
                fontWeight: opt.value === limit ? 700 : 500,
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'inherit',
                lineHeight: 1.2,
                outline: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== limit) e.currentTarget.style.background = 'var(--color-surface-2)'
              }}
              onMouseLeave={(e) => {
                if (opt.value !== limit) e.currentTarget.style.background = 'transparent'
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


