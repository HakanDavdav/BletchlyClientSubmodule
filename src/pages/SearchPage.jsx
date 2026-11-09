import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { getRecentSearches, saveRecentSearch, removeRecentSearch } from '../utils/recentSearches'
import { searchApi } from '../api/searchApi'
import PostCard from '../components/content/PostCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import SearchSuggestionsDropdown from '../components/common/SearchSuggestionsDropdown'
import BackButton from '../components/common/BackButton'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { getQueryErrorMessage } from '../utils/errorHelper'
import { formatDate } from '../utils/formatDate'

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

  const { data, isLoading, isError, error } = useQuery({
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
    return <div className="empty-state form-error">{getQueryErrorMessage(error, t)}</div>
  }

  const renderResults = () => {
    if (mode === 'general') {
      const g = data || { posts: [], actors: [], tribes: [] }
      const total = (g.posts?.length || 0) + (g.actors?.length || 0) + (g.tribes?.length || 0)

      if (total === 0) return <div className="empty-state">{t('search.no_results')}</div>

      return (
        <div className="flex flex-col">
          {g.actors?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 className="section-divider-title" style={{ marginBottom: 12 }}>{t('search.actors')}</h3>
              <div className="minimal-card-list">
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
              <h3 className="section-divider-title" style={{ marginBottom: 12 }}>{t('search.tribes')}</h3>
              <div className="minimal-card-list">
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
              <h3 className="section-divider-title" style={{ marginBottom: 12 }}>{t('search.posts')}</h3>
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
          {t('search.no_results')}
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
        <div className="minimal-card-list">
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
        <div className="minimal-card-list">
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
          <span className="search-filter-chip">
            {t('search.search_label')}{query || t('search.none')}
          </span>
          
          {mode !== 'general' && (
            <>
              <span className="search-filter-chip">
                {t('search.order')}
                {orderType && orderType !== 'None'
                  ? orderType === 'Oldest'
                    ? t('search.oldest')
                    : orderType === 'Newest'
                      ? t('search.newest')
                      : orderType === 'MostLiked'
                        ? t('search.most_liked')
                        : orderType
                  : t('search.none')}
              </span>
              <span className="search-filter-chip">
                {t('search.start_date')}
                {startDate ? <span className="date-text">{formatDate(startDate)}</span> : t('search.none')}
              </span>
              <span className="search-filter-chip">
                {t('search.end_date')}
                {endDate ? <span className="date-text">{formatDate(endDate)}</span> : t('search.none')}
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
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearches())
  const searchWrapRef = useRef(null)

  useEffect(() => {
    const handleUpdate = () => setRecentSearches(getRecentSearches())
    window.addEventListener('recent-searches-updated', handleUpdate)
    return () => window.removeEventListener('recent-searches-updated', handleUpdate)
  }, [])

  const modes = [
    { key: 'general', label: t('search.mode.general') },
    { key: 'posts', label: t('search.mode.posts') },
    { key: 'actors', label: t('search.mode.actors') },
    { key: 'tribes', label: t('search.mode.tribes') },
  ]

  // Debounced search suggestions (identical to PC topbar)
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSuggestions(null)
      setIsLoadingSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    const timer = setTimeout(async () => {
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
        if (e && e.preventDefault) e.preventDefault()
        const trimmed = (query || '').trim()
        if (trimmed) {
          saveRecentSearch(trimmed)
          setRecentSearches(getRecentSearches())
        }
        setShowSuggestions(false)
        onSubmit()
      }}
    >
      <div className="mobile-search-form__input-row" style={{ position: 'relative' }}>
        <div className="mobile-search-form__input-wrap">
          <Search size={17} className="mobile-search-form__icon" />
          <input
            className="input"
            placeholder={t('topbar.search')}
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              setShowSuggestions(true)
            }}
            onClick={() => {
              setShowSuggestions(true)
            }}
          />
          {query && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                padding: 0,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
              onClick={() => {
                onQueryChange('')
                setShowSuggestions(false)
              }}
              aria-label={t('common.clear')}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-sm hide-under-900"
          style={{ display: 'none' }}
          aria-hidden="true"
          tabIndex={-1}
        >
          {t('topbar.search_button')}
        </button>

        {/* Search Suggestions & Recent Searches Dropdown */}
        <SearchSuggestionsDropdown
          show={showSuggestions}
          query={query}
          mode={mode}
          isLoading={isLoadingSuggestions}
          suggestions={suggestions}
          recentSearches={recentSearches}
          maxHeight={380}
          marginTop={6}
          onSelectRecent={(item) => {
            onQueryChange(item)
            setShowSuggestions(false)
            saveRecentSearch(item)
            setRecentSearches(getRecentSearches())
            onSubmit()
          }}
          onRemoveRecent={(item) => {
            removeRecentSearch(item)
            setRecentSearches(getRecentSearches())
          }}
          onSelectSuggestion={() => setShowSuggestions(false)}
        />
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
