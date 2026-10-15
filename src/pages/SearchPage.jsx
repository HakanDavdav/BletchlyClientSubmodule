import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchApi } from '../api/searchApi'
import PostCard from '../components/content/PostCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import PostMinimalCard from '../components/content/PostMinimalCard'
import BackButton from '../components/common/BackButton'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query') || ''
  const mode = searchParams.get('mode') || 'general'
  const orderType = searchParams.get('orderType') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  // Mobil cihazlarda üst barda arama formu gizli olduğundan,
  // arama sayfasının kendi içinde bir form bulunur.
  const [localQuery, setLocalQuery] = useState(query)
  const [localMode, setLocalMode] = useState(mode)

  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  useEffect(() => {
    setLocalMode(mode)
  }, [mode])

  useDevLog('SearchPage', arguments[0] || {})

  // Ensure orderType is never empty string
  const finalOrderType = orderType || 'None'
  const { t } = useTranslation()

  console.log('SearchPage params:', { query, mode, orderType: finalOrderType, startDate, endDate })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', mode, query, finalOrderType, startDate, endDate],
    queryFn: () => {
      if (!query && mode === 'general') return []

      console.log('API call params:', {
        query,
        mode,
        orderType: finalOrderType,
        startDate,
        endDate,
      })

      switch (mode) {
        case 'posts':
          return searchApi
            .filterPosts({ query, orderType: finalOrderType, startDate, endDate })
            .then((r) => r.data?.data || [])
        case 'actors':
          return searchApi
            .filterActors({ query, orderType: finalOrderType, startDate, endDate })
            .then((r) => r.data?.data || [])
        case 'tribes':
          return searchApi
            .filterTribes({ query, orderType: finalOrderType, startDate, endDate })
            .then((r) => r.data?.data || [])
        default:
          return searchApi.general(query).then((r) => {
            const data = r.data?.data
            console.log('General search response:', data)
            return {
              posts: data?.posts || data?.Posts || [],
              actors: data?.actors || data?.Actors || [],
              tribes: data?.tribes || data?.Tribes || [],
            }
          })
      }
    },
    enabled: !!query || mode !== 'general',
  })

  if (!query && mode === 'general') {
    return (
      <>
        <MobileSearchForm
          query={localQuery}
          mode={localMode}
          onQueryChange={setLocalQuery}
          onModeChange={setLocalMode}
          onSubmit={() =>
            navigate(
              `/search?query=${encodeURIComponent(localQuery)}&mode=${localMode}`
            )
          }
          t={t}
        />
        <div className="empty-state">{t('search.type_to_search')}</div>
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (isError) {
    return <div className="empty-state form-error">{t('search.error')}</div>
  }

  const renderResults = () => {
    if (mode === 'general') {
      const g = data || { posts: [], actors: [], tribes: [] }
      const total = (g.posts?.length || 0) + (g.actors?.length || 0) + (g.tribes?.length || 0)

      if (total === 0) return <div className="empty-state">{t('search.no_results_for', { query })}</div>

      return (
        <div className="flex flex-col">
          {g.actors?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t('search.actors')}</h3>
              <div className="flex flex-col">
                {g.actors.map((a) => (
                  <div key={a.actorId} className="lb-card" style={{ padding: '8px 16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <ActorMinimalCard actor={a} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {g.tribes?.length > 0 && (
            <div
              style={{
                marginTop: g.actors?.length > 0 ? 16 : 12,
                paddingTop: g.actors?.length > 0 ? 16 : 0,
                borderTop: g.actors?.length > 0 ? '1px solid var(--color-border)' : undefined,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t('search.tribes')}</h3>
              <div className="flex flex-col">
                {g.tribes.map((t) => (
                  <div key={t.tribeId} className="lb-card" style={{ padding: '8px 16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <TribeMinimalCard {...t} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {g.posts?.length > 0 && (
            <div
              style={{
                marginTop: (g.actors?.length > 0 || g.tribes?.length > 0) ? 16 : 12,
                paddingTop: (g.actors?.length > 0 || g.tribes?.length > 0) ? 16 : 0,
                borderTop: (g.actors?.length > 0 || g.tribes?.length > 0) ? '1px solid var(--color-border)' : undefined,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t('search.posts')}</h3>
              <div className="flex flex-col gap-4">
                {g.posts.map((p) => (
                  <PostCard key={p.contentItemId} {...p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (!data || data.length === 0)
      return (
        <div className="empty-state">
          {query ? t('search.no_results_for', { query }) : t('search.no_results')}
        </div>
      )

    if (mode === 'posts')
      return (
        <div className="flex flex-col gap-4">
          {data.map((p) => (
            <PostCard key={p.contentItemId} {...p} />
          ))}
        </div>
      )
    if (mode === 'actors')
      return (
        <div className="flex flex-col">
          {data.map((a) => (
            <div key={a.actorId} className="lb-card" style={{ padding: '8px 16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ActorMinimalCard actor={a} />
              </div>
            </div>
          ))}
        </div>
      )
    if (mode === 'tribes')
      return (
        <div className="flex flex-col">
          {data.map((t) => (
            <div key={t.tribeId} className="lb-card" style={{ padding: '8px 16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TribeMinimalCard {...t} />
              </div>
            </div>
          ))}
        </div>
      )
  }

  return (
    <div className="flex-col gap-4">
      <MobileSearchForm
        query={localQuery}
        mode={localMode}
        onQueryChange={setLocalQuery}
        onModeChange={setLocalMode}
        onSubmit={() =>
          navigate(`/search?query=${encodeURIComponent(localQuery)}&mode=${localMode}`)
        }
        t={t}
      />
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
        <BackButton />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 16,
                background: 'var(--color-bg-alt)',
                border: '1px solid var(--color-border)',
              }}
            >
              {t('search.search_label', 'Arama: ')}{query || t('search.none', 'Yok')}
            </span>
          
          {mode !== 'general' && (
            <>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 16,
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {t('search.order')}
                {orderType && orderType !== 'None'
                  ? orderType === 'Oldest'
                    ? t('search.oldest')
                    : orderType === 'Newest'
                      ? t('search.newest')
                      : orderType === 'MostLiked'
                        ? t('search.most_liked')
                        : orderType
                  : t('search.none', 'Yok')}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 16,
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {t('search.start_date')}
                {startDate ? new Date(startDate).toLocaleDateString(undefined) : t('search.none', 'Yok')}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 16,
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {t('search.end_date')}
                {endDate ? new Date(endDate).toLocaleDateString(undefined) : t('search.none', 'Yok')}
              </span>
            </>
          )}
        </div>
      </div>
      {renderResults()}
    </div>
  )
}

/**
 * Mobil (≤900px) ekranlarda üst bardaki arama formunun yerini alan
 * sayfa içi arama formu. Masaüstünde gizlenir.
 */
function MobileSearchForm({ query, mode, onQueryChange, onModeChange, onSubmit, t }) {
  const [suggestions, setSuggestions] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const searchWrapRef = useRef(null)

  const modes = [
    { key: 'general', label: t('search.mode.general', 'Genel') },
    { key: 'posts', label: t('search.mode.posts', 'Başlıklar') },
    { key: 'actors', label: t('search.mode.actors', 'Kişiler') },
    { key: 'tribes', label: t('search.mode.tribes', 'Klanlar') },
  ]

  // Debounced search suggestions (identical to PC topbar)
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSuggestions(null)
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        let result
        switch (mode) {
          case 'posts':
            result = await searchApi.filterPosts({ query: query.trim() })
            setSuggestions({ posts: (result.data?.data || []).slice(0, 5) })
            break
          case 'actors':
            result = await searchApi.filterActors({ query: query.trim() })
            setSuggestions({ actors: (result.data?.data || []).slice(0, 5) })
            break
          case 'tribes':
            result = await searchApi.filterTribes({ query: query.trim() })
            setSuggestions({ tribes: (result.data?.data || []).slice(0, 5) })
            break
          default:
            result = await searchApi.general(query.trim())
            const data = result.data?.data
            setSuggestions({
              posts: (data?.posts || data?.Posts || []).slice(0, 3),
              actors: (data?.actors || data?.Actors || []).slice(0, 3),
              tribes: (data?.tribes || data?.Tribes || []).slice(0, 3),
            })
        }
        setShowSuggestions(true)
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err)
        setSuggestions(null)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, mode])

  // Click outside to close suggestions
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
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }

    function handleMouseDown(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false)
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

  return (
    <form
      className="mobile-search-form"
      ref={searchWrapRef}
      onSubmit={(e) => {
        e.preventDefault()
        setShowSuggestions(false)
        onSubmit()
      }}
    >
      <div className="mobile-search-form__input-row" style={{ position: 'relative' }}>
        <div className="mobile-search-form__input-wrap">
          <Search size={17} className="mobile-search-form__icon" />
          <input
            className="input"
            placeholder={t('topbar.search', 'Ara')}
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value)
              if (!showSuggestions && e.target.value.trim().length > 0) {
                setShowSuggestions(true)
              }
            }}
            onFocus={() => {
              if (suggestions && query.trim().length > 0) {
                setShowSuggestions(true)
              }
            }}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          {t('topbar.search_button', 'Ara')}
        </button>

        {/* Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (suggestions || isLoadingSuggestions) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 6,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 300,
                maxHeight: 380,
                overflowY: 'auto',
              }}
            >
              {isLoadingSuggestions ? (
                <div style={{ padding: 16, textAlign: 'center' }}>
                  <div className="spinner spinner-sm" />
                </div>
              ) : suggestions ? (
                <div style={{ padding: 8 }}>
                  {mode === 'general' ? (
                    <>
                      {suggestions.actors?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--color-text-faint)',
                              padding: '4px 8px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('common.actors', 'Kişiler')}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {suggestions.actors.slice(0, 3).map((actor) => (
                              <div
                                key={actor.actorId}
                                className="lb-card"
                                style={{ padding: '8px 16px', cursor: 'pointer' }}
                                onClick={() => setShowSuggestions(false)}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <ActorMinimalCard actor={actor} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestions.tribes?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--color-text-faint)',
                              padding: '4px 8px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('common.tribes', 'Klanlar')}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {suggestions.tribes.slice(0, 3).map((tribe) => (
                              <div
                                key={tribe.tribeId}
                                onClick={() => setShowSuggestions(false)}
                              >
                                <TribeMinimalCard {...tribe} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestions.posts?.length > 0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--color-text-faint)',
                              padding: '4px 8px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {t('common.posts', 'Başlıklar')}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {suggestions.posts.slice(0, 4).map((post) => (
                              <div
                                key={post.contentItemId}
                                onClick={() => setShowSuggestions(false)}
                              >
                                <PostMinimalCard {...post} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!suggestions.posts || suggestions.posts.length === 0) &&
                        (!suggestions.actors || suggestions.actors.length === 0) &&
                        (!suggestions.tribes || suggestions.tribes.length === 0) && (
                          <div
                            style={{
                              padding: 16,
                              textAlign: 'center',
                              color: 'var(--color-text-faint)',
                              fontSize: 13,
                            }}
                          >
                            {t('search.no_results', 'Sonuç bulunamadı')}
                          </div>
                        )}
                    </>
                  ) : (
                    <>
                      {mode === 'posts' && suggestions.posts?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {suggestions.posts.map((post) => (
                            <div
                              key={post.contentItemId}
                              onClick={() => setShowSuggestions(false)}
                            >
                              <PostMinimalCard {...post} />
                            </div>
                          ))}
                        </div>
                      )}

                      {mode === 'actors' && suggestions.actors?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {suggestions.actors.map((actor) => (
                            <div
                              key={actor.actorId}
                              className="lb-card"
                              style={{ padding: '8px 16px', cursor: 'pointer' }}
                              onClick={() => setShowSuggestions(false)}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <ActorMinimalCard actor={actor} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {mode === 'tribes' && suggestions.tribes?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {suggestions.tribes.map((tribe) => (
                            <div
                              key={tribe.tribeId}
                              onClick={() => setShowSuggestions(false)}
                            >
                              <TribeMinimalCard {...tribe} />
                            </div>
                          ))}
                        </div>
                      )}

                      {((mode === 'posts' && (!suggestions.posts || suggestions.posts.length === 0)) ||
                        (mode === 'actors' && (!suggestions.actors || suggestions.actors.length === 0)) ||
                        (mode === 'tribes' && (!suggestions.tribes || suggestions.tribes.length === 0))) && (
                        <div
                          style={{
                            padding: 16,
                            textAlign: 'center',
                            color: 'var(--color-text-faint)',
                            fontSize: 13,
                          }}
                        >
                          {t('search.no_results', 'Sonuç bulunamadı')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mobile-search-form__modes hscroll-strip">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`mobile-search-form__mode${mode === m.key ? ' is-active' : ''}`}
            onClick={() => onModeChange(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </form>
  )
}
