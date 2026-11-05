import { useState, useMemo, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ModalHeader from '../common/ModalHeader'
import FossilTogglePill from '../common/FossilTogglePill'
import InfiniteScrollStatus from '../common/InfiniteScrollStatus'
import ModalPortal from '../common/ModalPortal'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function FollowListModal({ actorId, type, isOpen, onClose }) {
  useDevLog('FollowListModal', arguments[0] || {})
  const { t } = useTranslation()
  const [showFossils, setShowFossils] = useState(false)
  // type is 'followers' or 'following'
  
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['follow-list', actorId, type, showFossils],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = type === 'followers'
          ? await actorApi.getProfileFollowers(actorId, pageParam, showFossils)
          : await actorApi.getProfileFollowing(actorId, pageParam, showFossils)
        return {
          items: res.data?.data || [],
          nextPage: (res.data?.data?.length === 10) ? pageParam + 1 : undefined,
        }
      } catch (err) {
        return { items: [], nextPage: undefined }
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: isOpen && !!actorId,
  })

  // Bütün sayfaların içeriğini tek array'de topla
  const items = data?.pages?.flatMap(page => page.items) || []

  const isDormantItem = (actor) => Boolean(actor?.isDormant ?? actor?.IsDormant ?? false)
  const fossilCount = useMemo(() => items.filter(isDormantItem).length, [items])
  const visibleItems = useMemo(() => {
    if (!showFossils) {
      return items.filter((a) => !isDormantItem(a))
    }
    return [...items].sort((a, b) => (isDormantItem(a) ? 1 : 0) - (isDormantItem(b) ? 1 : 0))
  }, [items, showFossils])

  const scrollRef = useRef(null)
  const { sentinelRef: loadMoreRef, isWaiting } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootRef: scrollRef,
    rootMargin: '150px',
    enabled: isOpen,
  })

  if (!isOpen) return null

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          maxWidth: 420,
          height: '65vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 20px',
          borderRadius: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <ModalHeader
          title={type === 'followers' ? t('profile.followers') : t('profile.following')}
          onClose={onClose}
          actions={
            <FossilTogglePill
              count={fossilCount}
              open={showFossils}
              onToggle={() => setShowFossils((v) => !v)}
              loading={showFossils && isLoading}
            />
          }
          style={{ padding: '0 0 12px 0', marginBottom: 14 }}
        />

        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div className="spinner spinner-md" />
            </div>
          ) : visibleItems.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet')}</p>
          ) : (
            <div className="minimal-card-list" style={{ padding: '4px 4px 8px 4px' }}>
              {visibleItems.map((actor) => (
                <div key={actor.actorId} className="lb-card" style={{ padding: '8px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={actor} showHierarchyBtn={false} clickable={true} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={loadMoreRef} style={{ height: 1 }} />
          <InfiniteScrollStatus
            isFetching={isFetchingNextPage || isWaiting}
            hasNextPage={hasNextPage}
            hasItems={visibleItems.length > 0}
          />
        </div>
      </div>
      </div>
    </ModalPortal>
  )
}
