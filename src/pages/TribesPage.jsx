import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { X, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { TopicTag } from '../components/topic/TopicTag'
import { tribeApi } from '../api/tribeApi'
import { TopicTypes } from '../constants/TopicTypes'
import { TopicColors } from '../constants/enums'

const EXPLORE_PAGE_COUNT = 4

const resolveTopicValue = (topicTypeName) => {
  if (topicTypeName == null) return null
  if (typeof topicTypeName === 'number') return topicTypeName
  const found = TopicTypes.find((x) => x.enumName === topicTypeName)
  return found ? found.value : null
}

const getTribeTopicValues = (tr) => {
  const raw = tr.topicTypes || tr.TopicTypes || []
  const values = raw.map((tt) => resolveTopicValue(tt?.topicTypeName ?? tt?.TopicTypeName))
  return [...new Set(values.filter((v) => v != null))]
}

export default function TribesPage() {
  const { t } = useTranslation()

  // Area (TopicType) filters — multi-select
  const [activeAreas, setActiveAreas] = useState([])

  // Areas strip horizontal navigation
  const areasStripRef = useRef(null)
  const [areasArrows, setAreasArrows] = useState({ canLeft: false, canRight: false })

  const updateAreasArrows = useCallback(() => {
    const el = areasStripRef.current
    if (!el) return
    setAreasArrows({
      canLeft: el.scrollLeft > 4,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    updateAreasArrows()
    const timer = setTimeout(updateAreasArrows, 300)
    window.addEventListener('resize', updateAreasArrows)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateAreasArrows)
    }
  }, [updateAreasArrows])

  const scrollAreas = (direction) => {
    const el = areasStripRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  // Active query parameters that trigger refetch
  const hasActiveFilter = activeAreas.length > 0

  // ─── Explore pool (Areas reference) ────────────────────────────────────────
  const { data: exploreTribes = [], isLoading: isExploreLoading } = useQuery({
    queryKey: ['tribesExplore'],
    queryFn: async () => {
      const pages = await Promise.all(
        Array.from({ length: EXPLORE_PAGE_COUNT }, (_, i) =>
          tribeApi
            .loadTribes(i + 1, '', 'Crowded', null, null, '')
            .then((res) => res.data?.data || [])
        )
      )
      return pages.flat()
    },
    enabled: !hasActiveFilter,
    staleTime: 60_000,
  })

  const featuredTribes = useMemo(() => exploreTribes.slice(0, 8), [exploreTribes])

  const areaSections = useMemo(() => {
    const map = new Map()
    exploreTribes.forEach((tr) => {
      getTribeTopicValues(tr).forEach((value) => {
        if (!map.has(value)) {
          const meta = TopicTypes.find((x) => x.value === value)
          map.set(value, {
            value,
            enumName: meta?.enumName,
            key: meta?.key,
            color: TopicColors[value] || 'var(--color-primary)',
            tribes: [],
          })
        }
        map.get(value).tribes.push(tr)
      })
    })
    return [...map.values()].sort((a, b) => b.tribes.length - a.tribes.length)
  }, [exploreTribes])

  // Explore sections: cards fill 2 rows per area (columns measured from width)
  const sectionsRef = useRef(null)
  const [sectionColumns, setSectionColumns] = useState(4)

  const computeSectionColumns = useCallback(() => {
    const el = sectionsRef.current
    if (!el) return
    const width = el.clientWidth
    const minCard = 280
    const gap = 12
    setSectionColumns(Math.max(1, Math.floor((width + gap) / (minCard + gap))))
  }, [])

  useEffect(() => {
    computeSectionColumns()
    const el = sectionsRef.current
    if (!el) return
    const observer = new ResizeObserver(computeSectionColumns)
    observer.observe(el)
    return () => observer.disconnect()
  }, [computeSectionColumns, hasActiveFilter, areaSections.length])

  const maxSectionCards = sectionColumns * 2

  // ─── Filtered / paginated list ─────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['tribesList', activeAreas],
    queryFn: ({ pageParam = 1 }) =>
      tribeApi
        .loadTribes(
          pageParam,
          '',
          '',
          null,
          null,
          activeAreas
            .map((value) => TopicTypes.find((x) => x.value === value)?.enumName)
            .filter(Boolean)
        )
        .then((res) => res.data?.data || []),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
    enabled: hasActiveFilter,
  })

  const allFetchedTribes = data?.pages.flatMap((p) => p) || []

  // Frontend simulated pagination state
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    setVisibleCount(20)
  }, [activeAreas])

  const visibleTribes = allFetchedTribes.slice(0, visibleCount)

  const loadMoreRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (visibleCount < allFetchedTribes.length) {
            setVisibleCount((prev) => prev + 20)
          } else if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage().then(() => {
              setVisibleCount((prev) => prev + 20)
            })
          }
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [visibleCount, allFetchedTribes.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleAreaToggle = (area) => {
    setActiveAreas((current) =>
      current.includes(area.value)
        ? current.filter((value) => value !== area.value)
        : [...current, area.value]
    )
  }

  const clearAreas = () => setActiveAreas([])

  const renderTribeCard = (tr) => (
    <TribeMinimalCard
      key={tr.tribeId || tr.TribeId}
      tribeId={tr.tribeId || tr.TribeId}
      tribeName={tr.tribeName || tr.TribeName}
      tribePoint={tr.tribePoint ?? tr.tribeActorPoint ?? tr.TribeActorPoint}
      imageUrl={tr.imageUrl || tr.ImageUrl}
      isDormant={tr.isDormant ?? tr.IsDormant ?? false}
    />
  )

  return (
    <div className="flex-col gap-4" style={{ paddingBottom: 60, width: '100%' }}>
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 12 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
          paddingBottom: 14,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Users size={22} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('tribes_page.explore_title', 'Keşfet')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'tribes_page.explore_desc',
              'Klanları keşfet, ilgini çeken topluluklara katıl.'
            )}
          </p>
        </div>
      </div>


      {/* Areas chips */}
      <div
        style={{
          marginBottom: 28,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            ref={areasStripRef}
            className="hscroll-strip tribes-areas-strip"
            onScroll={updateAreasArrows}
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 8,
              overflowX: 'auto',
            }}
          >
        <button
          type="button"
          onClick={clearAreas}
          style={{
            padding: '5px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeAreas.length === 0 ? 'var(--color-primary)' : 'transparent',
            color: activeAreas.length === 0 ? '#fff' : 'var(--color-text-secondary)',
            border: `1px solid ${activeAreas.length === 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
            transition: 'all 0.2s',
          }}
        >
          {t('tribes_page.all_areas', 'Tümü')}
        </button>
        {TopicTypes.map((topic) => {
          const color = TopicColors[topic.value] || 'var(--color-primary)'
          const isSelected = activeAreas.includes(topic.value)
          return (
            <button
              key={topic.value}
              type="button"
              onClick={() => handleAreaToggle(topic)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                background: isSelected ? color : `${color}18`,
                color: isSelected ? '#fff' : color,
                border: `1px solid ${isSelected ? color : `${color}55`}`,
                transition: 'all 0.2s',
              }}
            >
              {t(`topics.${topic.key || topic.enumName?.toLowerCase()}`, topic.label)}
            </button>
          )
        })}
          </div>

          {areasArrows.canLeft && (
            <>
              <span className="tribes-areas-fade tribes-areas-fade--left" aria-hidden="true" />
              <button
                type="button"
                className="tribes-areas-nav tribes-areas-nav--left"
                onClick={() => scrollAreas(-1)}
                aria-label={t('common.previous', 'Önceki')}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  aria-hidden="true"
                  style={{ display: 'block', transform: 'rotate(90deg)' }}
                >
                  <path d="M1 2.2 L9 2.2 L5 8 Z" fill="currentColor" />
                </svg>
              </button>
            </>
          )}
          {areasArrows.canRight && (
            <>
              <span className="tribes-areas-fade tribes-areas-fade--right" aria-hidden="true" />
              <button
                type="button"
                className="tribes-areas-nav tribes-areas-nav--right"
                onClick={() => scrollAreas(1)}
                aria-label={t('common.next', 'Sonraki')}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  aria-hidden="true"
                  style={{ display: 'block', transform: 'rotate(-90deg)' }}
                >
                  <path d="M1 2.2 L9 2.2 L5 8 Z" fill="currentColor" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {hasActiveFilter ? (
        <>
          {/* Active areas header */}
          {activeAreas.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {activeAreas.map((value) => (
                <TopicTag key={value} topicType={value} size="md" />
              ))}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearAreas}
              >
                <X size={14} />
                {t('tribes_page.clear_area', 'Temizle')}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center" style={{ padding: 60 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : visibleTribes.length === 0 ? (
            <p className="empty-state">{t('tribes_page.empty', 'Henüz klan bulunmuyor.')}</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {visibleTribes.map(renderTribeCard)}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={loadMoreRef} style={{ height: 20 }} />
          {isFetchingNextPage && (
            <div className="flex justify-center" style={{ padding: 20 }}>
              <div className="spinner spinner-md" />
            </div>
          )}
        </>
      ) : isExploreLoading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : exploreTribes.length === 0 ? (
        <p className="empty-state">{t('tribes_page.empty', 'Henüz klan bulunmuyor.')}</p>
      ) : (
        <div ref={sectionsRef}>
          {/* Featured */}
          {featuredTribes.length > 0 && (
            <section className="tribes-explore-section">
              <div className="tribes-explore-section-header">
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {t('tribes_page.featured', 'Öne Çıkanlar')}
                </h2>
              </div>
              <div
                className="tribes-explore-grid"
                style={{ gridTemplateColumns: `repeat(${sectionColumns}, minmax(0, 1fr))` }}
              >
                {featuredTribes.slice(0, maxSectionCards).map(renderTribeCard)}
              </div>
            </section>
          )}

          {/* Area sections */}
          {areaSections.map((section) => (
            <section key={section.value} className="tribes-explore-section">
              <div className="tribes-explore-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <TopicTag topicType={section.value} size="md" />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {t('tribes_page.tribes_count', '{{count}} klan', {
                      count: section.tribes.length,
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveAreas([section.value])}
                >
                  {t('tribes_page.see_all', 'Tümünü Gör')}
                </button>
              </div>
              <div
                className="tribes-explore-grid"
                style={{ gridTemplateColumns: `repeat(${sectionColumns}, minmax(0, 1fr))` }}
              >
                {section.tribes.slice(0, maxSectionCards).map(renderTribeCard)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
