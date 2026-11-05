import { useState, useEffect } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import { contentItemApi } from '../api/contentItemApi'
import { Clock8, Flame, Heart, Skull } from 'lucide-react'
import PostCard from '../components/content/PostCard'
import BackButton from '../components/common/BackButton'
import useUIStore from '../store/uiStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { getQueryErrorMessage } from '../utils/errorHelper'

export default function FeedPage({ cacheType = 'recent' }) {
  useDevLog('FeedPage', arguments[0] || {})
  const { t } = useTranslation()

  const getFeedConfig = () => {
    switch (cacheType) {
      case 'trending':
        return {
          queryFn: () => searchApi.getTrendingPosts(),
          title: t('feed.trending'),
          icon: <Flame size={22} color="#fff" />,
          description: t('feed.trending_desc'),
        }
      case 'mostLiked':
        return {
          queryFn: () => searchApi.getMostLikedEntries(),
          title: t('feed.most_liked'),
          icon: <Heart size={22} color="#fff" />,
          description: t('feed.most_liked_desc'),
          isPost: false,
        }
      case 'mostDisliked':
        return {
          queryFn: () => searchApi.getMostDislikedEntries(),
          title: t('feed.most_disliked'),
          icon: <Skull size={22} color="#fff" />,
          description: t('feed.most_disliked_desc'),
          isPost: false,
        }
      case 'recent':
      default:
        return {
          queryFn: () => searchApi.getRecentPosts(),
          title: t('feed.recent'),
          icon: <Clock8 size={22} color="#fff" />,
          description: t('feed.recent_desc'),
          isPost: true,
        }
    }
  }

  const { queryFn, title, icon, description, isPost } = getFeedConfig()

  // 1. Önce Redis'ten (veya Cache'den) Minimal Listeyi Çek
  const { data: minimalData, isLoading: isListLoading, isError: isListError, error: listError } = useQuery({
    queryKey: ['feed', cacheType],
    queryFn: queryFn,
    select: parseCacheResponse,
  })

  // Sadece ilk 4 tanesini alacağız
  const itemsToFetch = minimalData ? minimalData.slice(0, 4) : []

  // 2. Alınan listedeki ID'leri kullanarak tek tek tam Post/Entry datasını çek
  const fullItemQueries = useQueries({
    queries: itemsToFetch.map((minimalItem) => ({
      queryKey: [isPost ? 'post' : 'entry', minimalItem.contentItemId],
      queryFn: () =>
        isPost
          ? contentItemApi.getPost(minimalItem.contentItemId).then((res) => res.data?.data)
          : contentItemApi.getEntry(minimalItem.contentItemId).then((res) => res.data?.data),
      enabled: !!minimalItem.contentItemId,
      staleTime: 1000 * 60 * 5, // 5 dk cache
    })),
  })

  const isLoadingDetails = fullItemQueries.some((q) => q.isLoading)
  const isErrorDetails = fullItemQueries.some((q) => q.isError)

  const fullData = fullItemQueries
    .map((q) => q.data)
    .filter(Boolean)

  if (isListLoading || (isLoadingDetails && itemsToFetch.length > 0)) {
    return (
      <div className="flex justify-center" style={{ padding: '40px 0' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    )
  }

  if (isListError || isErrorDetails) {
    const activeError = listError || fullItemQueries.find((q) => q.isError)?.error
    return <div className="empty-state">{getQueryErrorMessage(activeError, t)}</div>
  }

  if (!minimalData || minimalData.length === 0) {
    return <div className="empty-state">{t('common.nothing_here_yet')}</div>
  }

  return (
    <div className="flex-col gap-4">
      {/* Back Button */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          {icon}
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {title}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        </div>
      </div>

      <div className="flex-col gap-4" style={{ marginTop: 16 }}>
        {fullData.map((item) => (
          // Burada item artık backend'den gelen dolu PostDto veya EntryDto
          <PostCard key={item.contentItemId} {...item} />
        ))}
      </div>
    </div>
  )
}
