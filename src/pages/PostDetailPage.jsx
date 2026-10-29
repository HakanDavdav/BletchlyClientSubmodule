import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { contentItemApi } from '../api/contentItemApi'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import ContextualEntryThread from '../components/content/ContextualEntryThread'
import EntryDraft from '../components/content/EntryDraft'
import BackButton from '../components/common/BackButton'
import PaginationSelect from '../components/common/PaginationSelect'
import useAuthStore from '../store/authStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { getQueryErrorMessage } from '../utils/errorHelper'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function PostDetailPage() {
  const [searchParams] = useSearchParams()
  const propPostId = searchParams.get('postId')
  useDevLog('PostDetailPage', arguments[0] || {})
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // Eğer prop olarak postId gelmediyse (initial view), en trend postu getir
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['feed', 'trending'],
    queryFn: () => searchApi.getTrendingPosts().then(parseCacheResponse),
    enabled: !propPostId,
  })

  const postId = propPostId || (trendingData && trendingData[0]?.contentItemId)

  const { data: postData, isLoading: isPostLoading, isError: isPostError, error: postError } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => contentItemApi.getPost(postId).then((r) => r.data?.data ?? null),
    enabled: !!postId,
  })

  useDocumentTitle(postData?.title)

  const [page, setPage] = useState(1)

  // Backend'den perPage gelmediği için, page=1'deki data uzunluğuna bakarak limiti çıkarıyoruz.
  const [inferredPerPage, setInferredPerPage] = useState(20)

  const {
    data: entriesData,
    isLoading: isEntriesLoading,
    isFetching: isEntriesFetching,
  } = useQuery({
    queryKey: ['post-entries', postId, page],
    queryFn: () =>
      contentItemApi.getPostEntries(postId, page).then((r) => {
        const data = r.data?.data || []
        // Sadece 1. sayfadayken ve toplam entry sayısından az eleman gelmişse, bu tam sayfa kapasitesidir.
        if (page === 1 && postData && postData.entryCount > data.length && data.length > 0) {
          setInferredPerPage(data.length)
        }
        return data
      }),
    enabled: !!postId && !!postData,
  })

  const totalPages = Math.max(
    1,
    Math.ceil((postData?.entryCount || 0) / inferredPerPage)
  )

  const defaultExpandedEntryIds = useMemo(() => {
    const withReplies = (Array.isArray(entriesData) ? entriesData : []).filter(
      (entry) => (entry.entryCount || 0) > 0 || (entry.childEntries?.length || 0) > 0
    )
    if (withReplies.length === 0) return new Set()

    const reactionCount = (entry) =>
      (entry.likeCount || 0) + (entry.dislikeCount || 0)

    const replyLeaderIds = [...withReplies]
      .sort((a, b) => (b.entryCount || 0) - (a.entryCount || 0))
      .slice(0, 2)
      .map((entry) => entry.contentItemId)

    const reactionLeaderIds = [...withReplies]
      .sort((a, b) => reactionCount(b) - reactionCount(a))
      .slice(0, 2)
      .map((entry) => entry.contentItemId)

    return new Set([...replyLeaderIds, ...reactionLeaderIds].filter(Boolean))
  }, [entriesData])

  if (isPostLoading || isEntriesLoading || isTrendingLoading) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (isPostError || !postData) {
    return (
      <div className="empty-state">
        {getQueryErrorMessage(postError, t, true)}
        <br />
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ marginTop: 16 }}
        >
          {t('common.go_back')}
        </button>
      </div>
    )
  }

  const paginationControls = postData.entryCount > inferredPerPage ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <button
        className="btn btn-outline btn-sm pagination-arrow"
        disabled={page === 1 || isEntriesFetching}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        aria-label={t('common.previous')}
        title={t('common.previous')}
      >
        <ChevronLeft size={14} />
      </button>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
        }}
      >
        <PaginationSelect
          page={page}
          totalPages={totalPages}
          onChange={setPage}
        />
        / {totalPages}
      </span>
      <button
        className="btn btn-outline btn-sm pagination-arrow"
        disabled={page >= totalPages || isEntriesFetching}
        onClick={() => setPage((p) => p + 1)}
        aria-label={t('common.next')}
        title={t('common.next')}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  ) : null

  return (
    <div className="flex-col gap-4">
      {/* Top Navigation */}
      {window.history.length > 1 && (
        <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
          <BackButton style={{ marginBottom: 0 }} />
        </div>
      )}

      {/* Main Post */}
      <PostCard {...postData} isSticky={false} />

      {/* Ana Posta Doğrudan Cevap Yazma Kutusu */}
      <div style={{ marginTop: 16 }}>
        {isLoggedIn ? (
          <EntryDraft
            parentContentItemId={postId}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['post-entries', postId] })
              queryClient.invalidateQueries({ queryKey: ['post', postId] })
              setPage(1) // Reset to first page to see the new entry
            }}
          />
        ) : (
          <div className="card-surface" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 12 }}>
              {t('post.login_to_reply')}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>{t('common.login')}</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>{t('common.register')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-col gap-4" style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {t('post.comments')} ({postData.entryCount ?? 0})
          </h3>
          {paginationControls}
        </div>

        {!entriesData || entriesData.length === 0 ? (
          <p className="empty-state" style={{ paddingTop: 40 }}>
            {t('post.be_first_to_comment')}
          </p>
        ) : (
          entriesData.map((entry) => (
            <ContextualEntryThread
              key={entry.contentItemId}
              entryDto={entry}
              readMode="parentToChild"
              hideRootPost={true}
              queryKey={['post-entries', postId, page]}
              defaultExpandedEntryIds={defaultExpandedEntryIds}
            />
          ))
        )}

        {paginationControls && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {paginationControls}
          </div>
        )}
      </div>
    </div>
  )
}
