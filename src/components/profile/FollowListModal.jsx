import { useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ModalHeader from '../common/ModalHeader'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function FollowListModal({ actorId, type, isOpen, onClose }) {
  useDevLog('FollowListModal', arguments[0] || {})
  const { t } = useTranslation()
  // type is 'followers' or 'following'
  
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['follow-list', actorId, type],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = type === 'followers'
          ? await actorApi.getProfileFollowers(actorId, pageParam)
          : await actorApi.getProfileFollowing(actorId, pageParam)
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

  // Infinite scroll için onScroll handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }

  if (!isOpen) return null

  return (
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
          title={type === 'followers' ? t('profile.followers', 'Takipçiler') : t('profile.following', 'Takip Edilenler')}
          onClose={onClose}
          style={{ padding: '0 0 12px 0', marginBottom: 14 }}
        />

        <div 
          style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div className="spinner spinner-md" />
            </div>
          ) : items.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet', 'Henüz burada hiçbir şey yok')}</p>
          ) : (
            <div className="flex flex-col gap-2" style={{ padding: '4px 4px 8px 4px' }}>
              {items.map((actor) => (
                <div key={actor.actorId} className="lb-card" style={{ padding: '8px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={actor} showHierarchyBtn={false} clickable={true} />
                  </div>
                </div>
              ))}
              
              {isFetchingNextPage && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="spinner spinner-sm" />
                </div>
              )}
              {!isFetchingNextPage && !hasNextPage && items.length > 0 && (
                <p className="text-muted" style={{ padding: 16, textAlign: 'center', fontSize: 13 }}>
                  {t('common.no_more_results')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
