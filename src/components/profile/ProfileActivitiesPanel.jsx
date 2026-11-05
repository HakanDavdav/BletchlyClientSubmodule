import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import ActivityItem from '../activity/ActivityItem'
import InfiniteScrollStatus from '../common/InfiniteScrollStatus'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import useDevLog from '../../utils/useDevLog'
import useAuthStore from '../../store/authStore'
import { useTranslation } from 'react-i18next'

export default function ProfileActivitiesPanel({ actorId, profileName }) {
  useDevLog('ProfileActivitiesPanel', arguments[0] || {})
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [activities, setActivities] = useState([])
  const [hasMore, setHasMore] = useState(true)

  const { data, isFetching } = useQuery({
    queryKey: ['profile-activities', actorId, page],
    queryFn: () =>
      actorApi
        .getActivities(actorId, page)
        .then((r) => r.data?.data || [])
        .catch((err) => {
          // Backend liste sonu için 404 döndürdüğünde, döngüyü kırmak için boş dizi dönüyoruz.
          return []
        }),
    enabled: !!actorId,
  })

  useEffect(() => {
    if (data) {
      if (data.length === 0) {
        setHasMore(false)
      } else {
        setActivities((prev) => {
          const newItems = data.filter((d) => !prev.some((p) => p.activityId === d.activityId))
          return [...prev, ...newItems]
        })
      }
    }
  }, [data])

  const scrollRef = useRef(null)
  const { sentinelRef: loadMoreRef, isWaiting } = useInfiniteScroll({
    hasNextPage: hasMore,
    isFetchingNextPage: isFetching,
    onIntersect: () => setPage((p) => p + 1),
    rootRef: scrollRef,
    rootMargin: '150px',
    enabled: !!actorId,
  })

  const { actorId: currentUserId } = useAuthStore()
  const forceRead = actorId !== currentUserId

  return (
    <div className="profile-activities-panel">
      <div className="profile-activities-header">{t('profile.activity_history')}</div>
      <div ref={scrollRef} className="profile-activities-list">
        {activities.map((a) => (
          <ActivityItem
            key={a.activityId}
            activity={a}
            currentProfileName={profileName}
            forceRead={forceRead}
            variant="profile"
          />
        ))}
        {!isFetching && activities.length === 0 && (
          <p className="empty-state">
            {t('common.nothing_here_yet')}
          </p>
        )}
        <div ref={loadMoreRef} style={{ height: 1 }} />
        <InfiniteScrollStatus
          isFetching={isFetching || isWaiting}
          hasNextPage={hasMore}
          hasItems={activities.length > 0}
        />
      </div>
    </div>
  )
}
