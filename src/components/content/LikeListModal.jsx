import { useState, useMemo, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { ThumbsUp, ThumbsDown, Skull } from 'lucide-react'
import { contentItemApi } from '../../api/contentItemApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ModalHeader from '../common/ModalHeader'
import FossilTogglePill from '../common/FossilTogglePill'
import InfiniteScrollStatus from '../common/InfiniteScrollStatus'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import { ReactionType } from '../../constants/enums'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

const ReactionIcons = {
  [ReactionType.Like]: <ThumbsUp size={16} />,
  [ReactionType.Dislike]: <ThumbsDown size={16} />,
  [ReactionType.BrutallyDislike]: <Skull size={16} />,
}

/**
 * LikeListModal — plan.md Component #17
 * İçeriği beğenenlerin listesi, paginated.
 */
export default function LikeListModal({ contentItemId, isOpen, onClose, initialTab = null }) {
  useDevLog('LikeListModal', arguments[0] || {})
  const { t } = useTranslation()
  const [showFossils, setShowFossils] = useState(false)

  const activeTab = initialTab

  const getTitle = () => {
    if (activeTab === ReactionType.Like) {
      return t('reaction.likes')
    }
    if (activeTab === ReactionType.Dislike) {
      return t('reaction.dislikes')
    }
    if (activeTab === ReactionType.BrutallyDislike) {
      return t('reaction.brutal_dislikes')
    }
    return t('reaction.reactions')
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['likes', contentItemId, activeTab, showFossils],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = await contentItemApi.getContentItemLikes(contentItemId, pageParam, activeTab, showFossils)
        return {
          items: res.data?.data || [],
          nextPage: res.data?.data?.length === 10 ? pageParam + 1 : undefined,
        }
      } catch (err) {
        return { items: [], nextPage: undefined }
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: isOpen && !!contentItemId,
  })

  // Bütün sayfaların içeriğini tek array'de topla
  const items = data?.pages?.flatMap((page) => page.items) || []

  const isDormantLike = (like) => {
    const actor = like?.actor
    return Boolean(actor?.isDormant ?? actor?.IsDormant ?? false)
  }
  const fossilCount = useMemo(() => items.filter(isDormantLike).length, [items])
  const visibleItems = useMemo(() => {
    if (!showFossils) {
      return items.filter((l) => !isDormantLike(l))
    }
    return [...items].sort((a, b) => (isDormantLike(a) ? 1 : 0) - (isDormantLike(b) ? 1 : 0))
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

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
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
          title={getTitle()}
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

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div className="spinner spinner-md" />
            </div>
          ) : visibleItems.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet')}</p>
          ) : (
            <div className="minimal-card-list" style={{ padding: '4px 4px 8px 4px' }}>
              {visibleItems.map((like) => (
                <div
                  key={like.likeId}
                  className="lb-card flex items-center justify-between"
                  style={{ padding: '8px 16px' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={like.actor} showHierarchyBtn={false} clickable={true} triggeredNodeIds={like.triggeredNodeIds} />
                  </div>
                  <span
                    style={{
                      fontSize: 18,
                      display: 'flex',
                      alignItems: 'center',
                      color:
                        like.reactionType === ReactionType.Like
                          ? 'var(--color-success)'
                          : like.reactionType === ReactionType.Dislike
                            ? 'var(--color-error)'
                            : '#991b1b',
                    }}
                  >
                    {ReactionIcons[like.reactionType]}
                  </span>
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
    </div>,
    document.body
  )
}
