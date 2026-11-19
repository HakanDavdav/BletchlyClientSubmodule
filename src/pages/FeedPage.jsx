import { useInfiniteQuery } from '@tanstack/react-query'
import { contentItemApi } from '../api/contentItemApi'
import { Clock8 } from 'lucide-react'
import PostCard from '../components/content/PostCard'
import BackButton from '../components/common/BackButton'
import InfiniteScrollStatus from '../components/common/InfiniteScrollStatus'
import useInfiniteScroll from '../hooks/useInfiniteScroll'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { getQueryErrorMessage } from '../utils/errorHelper'

const PAGE_SIZE = 4

export default function FeedPage() {
  useDevLog('FeedPage', arguments[0] || {})
  const { t } = useTranslation()

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', 'newPosts'],
    queryFn: ({ pageParam = 1 }) =>
      contentItemApi.getNewPosts(pageParam).then((res) => {
        const list = res?.data?.data || res?.data
        return Array.isArray(list) ? list : []
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  })

  const { sentinelRef: loadMoreRef, isWaiting } = useInfiniteScroll({
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  })

  const posts = data?.pages?.flatMap((page) => page) || []

  if (isLoading) {
    return (
      <div className="flex justify-center" style={{ padding: '40px 0' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  if (isError) {
    return <div className="empty-state">{getQueryErrorMessage(error, t)}</div>
  }

  if (posts.length === 0) {
    return <div className="empty-state">{t('common.nothing_here_yet')}</div>
  }

  return (
    <div className="flex-col gap-4">
      {/* Back Button */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-icon">
          <Clock8 size={22} color="#fff" />
        </div>
        <div>
          <h1 className="page-header-title">{t('feed.recent')}</h1>
          <p className="page-header-subtitle">{t('feed.recent_desc')}</p>
        </div>
      </div>

      <div className="flex-col gap-4" style={{ marginTop: 16 }}>
        {posts.map((item) => (
          <PostCard key={item.contentItemId} {...item} />
        ))}
      </div>

      <div ref={loadMoreRef} style={{ height: 1 }} />
      <InfiniteScrollStatus
        isFetching={isFetchingNextPage || isWaiting}
        hasNextPage={Boolean(hasNextPage)}
        hasItems={posts.length > 0}
      />
    </div>
  )
}
