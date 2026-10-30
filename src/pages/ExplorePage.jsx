import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { X, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { TopicTag } from '../components/topic/TopicTag'
import { tribeApi } from '../api/tribeApi'
import { actorApi } from '../api/actorApi'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import { TopicTypes } from '../constants/TopicTypes'
import { TopicColors } from '../constants/enums'

const EXPLORE_PAGE_COUNT = 4

const resolveTopicValue = (topicInput) => {
  if (topicInput == null) return null
  if (typeof topicInput === 'number') {
    const foundByVal = TopicTypes.find((x) => x.value === topicInput)
    return foundByVal ? foundByVal.value : null
  }
  const str = String(topicInput).trim()
  if (!str) return null
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10)
    const foundNum = TopicTypes.find((x) => x.value === num)
    if (foundNum) return foundNum.value
  }
  const lower = str.toLowerCase()
  const found = TopicTypes.find(
    (x) =>
      x.enumName?.toLowerCase() === lower ||
      x.key?.toLowerCase() === lower ||
      x.label?.toLowerCase() === lower
  )
  return found ? found.value : null
}

const getTribeTopicValues = (tr) => {
  const raw = tr.topicTypes || tr.TopicTypes || []
  const values = raw.map((tt) => resolveTopicValue(tt?.topicTypeName ?? tt?.TopicTypeName))
  return [...new Set(values.filter((v) => v != null))]
}

const getActorTopicValues = (actor) => {
  const raw = actor.topicTypes || actor.TopicTypes || []
  const values = raw.map((tt) => resolveTopicValue(tt?.topicTypeName ?? tt?.TopicTypeName ?? tt))
  return [...new Set(values.filter((v) => v != null))]
}

export default function ExplorePage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('type') === 'persons' ? 'persons' : 'tribes'

  const setMode = (nextMode) => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextMode === 'persons') nextParams.set('type', 'persons')
    else nextParams.delete('type')
    setSearchParams(nextParams, { replace: true })
  }

  // Parse initial topic/area from search params
  const parseUrlTopics = useCallback(() => {
    const rawList = [
      ...searchParams.getAll('topic'),
      ...searchParams.getAll('area'),
      ...searchParams.getAll('topics'),
      ...searchParams.getAll('areas'),
    ]
    const values = []
    rawList.forEach((item) => {
      if (!item) return
      item.split(',').forEach((sub) => {
        const val = resolveTopicValue(sub)
        if (val != null && !values.includes(val)) {
          values.push(val)
        }
      })
    })
    return values
  }, [searchParams])

  // Area (TopicType) filters — multi-select
  const [activeAreas, setActiveAreas] = useState(() => parseUrlTopics())

  // Keep activeAreas in sync if URL search params change externally
  useEffect(() => {
    const fromUrl = parseUrlTopics()
    setActiveAreas((prev) => {
      const isSame =
        prev.length === fromUrl.length &&
        prev.every((v) => fromUrl.includes(v))
      return isSame ? prev : fromUrl
    })
  }, [parseUrlTopics])

  // Areas strip horizontal navigation
  const areasStripRef = useRef(null)
  const [areasArrows, setAreasArrows] = useState({ canLeft: false, canRight: false })

  // Auto-scroll selected topic into view in the horizontal strip
  useEffect(() => {
    if (activeAreas.length > 0 && areasStripRef.current) {
      const firstActiveVal = activeAreas[0]
      const targetBtn = areasStripRef.current.querySelector(
        `[data-topic-value="${firstActiveVal}"]`
      )
      if (targetBtn) {
        targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeAreas])

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
    enabled: !hasActiveFilter && mode === 'tribes',
    staleTime: 60_000,
  })

  const featuredTribes = useMemo(() => exploreTribes.slice(0, 12), [exploreTribes])

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

  const { data: exploreActors = [], isLoading: isExploreActorsLoading } = useQuery({
    queryKey: ['actorsExplore'],
    queryFn: async () => {
      const pages = await Promise.all(
        Array.from({ length: EXPLORE_PAGE_COUNT }, (_, i) =>
          actorApi
            .loadActors(i + 1, '', '', null, null, '')
            .then((res) => res.data?.data || [])
        )
      )
      return pages.flat()
    },
    enabled: !hasActiveFilter && mode === 'persons',
    staleTime: 60_000,
  })

  const featuredActors = useMemo(() => exploreActors.slice(0, 12), [exploreActors])

  const actorAreaSections = useMemo(() => {
    const map = new Map()
    exploreActors.forEach((actor) => {
      getActorTopicValues(actor).forEach((value) => {
        if (!map.has(value)) {
          const meta = TopicTypes.find((x) => x.value === value)
          map.set(value, {
            value,
            enumName: meta?.enumName,
            key: meta?.key,
            color: TopicColors[value] || 'var(--color-primary)',
            actors: [],
          })
        }
        map.get(value).actors.push(actor)
      })
    })
    return [...map.values()].sort((a, b) => b.actors.length - a.actors.length)
  }, [exploreActors])

  // Explore sections: cards fill 2 rows per area (3 columns on web = 6 cards)
  const sectionsRef = useRef(null)
  const [sectionColumns, setSectionColumns] = useState(3)

  const computeSectionColumns = useCallback(() => {
    const el = sectionsRef.current
    if (!el) return
    const width = el.clientWidth
    if (width <= 600 || window.innerWidth <= 600) {
      setSectionColumns(2)
      return
    }
    // Web version: 3 columns x 2 rows = 6 cards per block
    setSectionColumns(3)
  }, [])

  useEffect(() => {
    computeSectionColumns()
    const el = sectionsRef.current
    if (!el) return
    const observer = new ResizeObserver(computeSectionColumns)
    observer.observe(el)
    window.addEventListener('resize', computeSectionColumns)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', computeSectionColumns)
    }
  }, [computeSectionColumns, hasActiveFilter, areaSections.length, actorAreaSections.length])

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
    enabled: hasActiveFilter && mode === 'tribes',
  })

  const allFetchedTribes = data?.pages.flatMap((p) => p) || []

  const {
    data: actorsData,
    fetchNextPage: fetchNextActorPage,
    hasNextPage: hasNextActorPage,
    isFetchingNextPage: isFetchingNextActorPage,
    isLoading: isActorsLoading,
  } = useInfiniteQuery({
    queryKey: ['actorsList', activeAreas],
    queryFn: ({ pageParam = 1 }) =>
      actorApi
        .loadActors(
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
    enabled: hasActiveFilter && mode === 'persons',
  })

  const allFetchedActors = actorsData?.pages.flatMap((p) => p) || []

  // Frontend simulated pagination state
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    setVisibleCount(20)
  }, [activeAreas, mode])

  const visibleTribes = allFetchedTribes.slice(0, visibleCount)
  const visibleActors = allFetchedActors.slice(0, visibleCount)

  const loadMoreRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const activeFetchedCount = mode === 'persons' ? allFetchedActors.length : allFetchedTribes.length
          const activeHasNext = mode === 'persons' ? hasNextActorPage : hasNextPage
          const activeIsFetching = mode === 'persons' ? isFetchingNextActorPage : isFetchingNextPage
          const activeFetchNext = mode === 'persons' ? fetchNextActorPage : fetchNextPage

          if (visibleCount < activeFetchedCount) {
            setVisibleCount((prev) => prev + 20)
          } else if (activeHasNext && !activeIsFetching) {
            activeFetchNext().then(() => {
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
  }, [visibleCount, allFetchedTribes.length, allFetchedActors.length, hasNextPage, isFetchingNextPage, fetchNextPage, hasNextActorPage, isFetchingNextActorPage, fetchNextActorPage, mode])

  const updateUrlWithAreas = (nextAreas) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('topic')
    nextParams.delete('area')
    nextParams.delete('topics')
    nextParams.delete('areas')

    if (nextAreas.length === 1) {
      const topicObj = TopicTypes.find((x) => x.value === nextAreas[0])
      nextParams.set('topic', topicObj?.enumName || nextAreas[0])
    } else if (nextAreas.length > 1) {
      const names = nextAreas.map((val) => {
        const topicObj = TopicTypes.find((x) => x.value === val)
        return topicObj?.enumName || val
      })
      nextParams.set('topic', names.join(','))
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleAreaToggle = (area) => {
    setActiveAreas((current) => {
      const next = current.includes(area.value)
        ? current.filter((value) => value !== area.value)
        : [...current, area.value]
      updateUrlWithAreas(next)
      return next
    })
  }

  const clearAreas = () => {
    setActiveAreas([])
    updateUrlWithAreas([])
  }

  const selectSingleArea = (value) => {
    setActiveAreas([value])
    updateUrlWithAreas([value])
  }

  const renderTribeCard = (tr) => (
    <TribeMinimalCard
      key={tr.tribeId || tr.TribeId}
      tribe={tr}
      tribeId={tr.tribeId || tr.TribeId}
      tribeName={tr.tribeName || tr.TribeName}
      tribePoint={tr.tribePoint ?? tr.tribeActorPoint ?? tr.TribeActorPoint}
      imageUrl={tr.imageUrl || tr.ImageUrl}
      isDormant={tr.isDormant ?? tr.IsDormant ?? false}
      mission={tr.mission ?? tr.Mission}
      showMission={true}
    />
  )

  const renderActorCard = (actor) => (
    <ActorMinimalCard
      key={actor.actorId || actor.ActorId}
      actor={actor}
      variant="explore"
      showBio={true}
      showPoint={true}
      showHierarchyBtn={false}
      showEditBtn={false}
      showPremiumBtn={false}
    />
  )

  const isPersons = mode === 'persons'
  const activeIsLoading = isPersons ? isActorsLoading : isLoading
  const activeVisibleItems = isPersons ? visibleActors : visibleTribes
  const activeRenderCard = isPersons ? renderActorCard : renderTribeCard
  const activeIsExploreLoading = isPersons ? isExploreActorsLoading : isExploreLoading
  const activeExploreItems = isPersons ? exploreActors : exploreTribes
  const activeFeaturedItems = isPersons ? featuredActors : featuredTribes
  const activeAreaSections = (isPersons ? actorAreaSections : areaSections).map((section) => ({
    ...section,
    items: isPersons ? section.actors : section.tribes,
  }))
  const activeIsFetchingNextPage = isPersons ? isFetchingNextActorPage : isFetchingNextPage

  return (
    <div className="flex-col gap-4" style={{ paddingBottom: 60, width: '100%' }}>
      <div className="px-2" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <div className="hscroll-strip" style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn btn-sm ${mode === 'tribes' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('tribes')}
            style={{ borderRadius: 20, padding: '6px 14px' }}
          >
            {t('explore_page.tribes', 'Klanlar')}
          </button>
          <button
            className={`btn btn-sm ${mode === 'persons' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('persons')}
            style={{ borderRadius: 20, padding: '6px 14px' }}
          >
            {t('explore_page.persons', 'Kişiler')}
          </button>
        </div>
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
          <Compass size={22} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('tribes_page.explore_title', 'Keşfet')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {mode === 'persons'
              ? t('explore_page.persons_desc', 'Kişileri keşfet, ilgini çeken profillere göz at.')
              : t('tribes_page.explore_desc', 'Klanları keşfet, ilgini çeken topluluklara katıl.')}
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
              data-topic-value={topic.value}
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

          {activeIsLoading ? (
            <div className="flex justify-center" style={{ padding: 60 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : activeVisibleItems.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet')}</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
                alignItems: 'start',
              }}
            >
              {activeVisibleItems.map(activeRenderCard)}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={loadMoreRef} style={{ height: 20 }} />
          {activeIsFetchingNextPage && (
            <div className="flex justify-center" style={{ padding: 20 }}>
              <div className="spinner spinner-md" />
            </div>
          )}
        </>
      ) : activeIsExploreLoading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : activeExploreItems.length === 0 ? (
        <p className="empty-state">{t('common.nothing_here_yet')}</p>
      ) : (
        <div ref={sectionsRef}>
          {/* Featured */}
          {activeFeaturedItems.length > 0 && (
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
                {activeFeaturedItems.slice(0, maxSectionCards).map(activeRenderCard)}
              </div>
            </section>
          )}

          {/* Area sections */}
          {activeAreaSections.map((section) => (
            <section key={section.value} className="tribes-explore-section">
              <div className="tribes-explore-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <TopicTag topicType={section.value} size="md" />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {mode === 'persons'
                      ? t('explore_page.persons_count', '{{count}} kişi', { count: section.items.length })
                      : t('tribes_page.tribes_count', '{{count}} klan', { count: section.items.length })}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => selectSingleArea(section.value)}
                >
                  {t('tribes_page.see_all', 'Tümünü Gör')}
                </button>
              </div>
              <div
                className="tribes-explore-grid"
                style={{ gridTemplateColumns: `repeat(${sectionColumns}, minmax(0, 1fr))` }}
              >
                {section.items.slice(0, maxSectionCards).map(activeRenderCard)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
