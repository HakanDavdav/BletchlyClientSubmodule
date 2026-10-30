import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getShortTimeAgo } from '../../utils/formatTime'
import { Pencil, Trash2, MessageSquare, Smile, Brain, Star } from 'lucide-react'
import SynapseBrainIcon from '../common/SynapseBrainIcon'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import ReactionButton from './ReactionButton'
import EntryDraft from './EntryDraft'
import LikeListModal from './LikeListModal'
import { TopicTagList } from '../topic/TopicTag'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import useFavourite from '../../hooks/useFavourite'
import { buildReportMessage, getPostUrl, shareContent } from '../../utils/contentActions'
import CardUtilityMenu from './CardUtilityMenu'

/**
 * PostCard — tam post görünümü (PostDto'dan).
 * Sticky kullanım için plan.md'e uygun.
 */
export default function PostCard({
  contentItemId,
  title,
  content,
  likeCount,
  dislikeCount,
  entryCount,
  createdAt,
  updatedAt,
  topicTypes,
  actor,
  tribe,
  userReaction,
  userLikeId,
  triggeredNodeIds = null,
  isOwner = false,
  isSticky = false,
  onDelete,
  onEdit,
}) {
  useDevLog('PostCard', arguments[0] || {})
  const [showLikes, setShowLikes] = useState(false)
  const [activeLikesTab, setActiveLikesTab] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const loggedInActorId = useAuthStore((s) => s.actorId)
  const { t } = useTranslation()
  const { isFavourite, isPending: isFavouritePending, toggleFavourite } = useFavourite(contentItemId)

  const isDeletedPost = title === '[Deleted]' && content === '[Deleted]'
  const isOwnerInternal = !isDeletedPost && (isOwner || (loggedInActorId && actor?.actorId === loggedInActorId))

  // Overlay verisi DTO'dan geliyor
  const currentUserReaction = userReaction;
  const currentLikeId = userLikeId;

  const deleteMutation = useMutation({
    mutationFn: () => contentItemApi.deletePost(contentItemId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries(['feed'])
      if (onDelete) onDelete()
    },
  })

  const timeAgo = getShortTimeAgo(createdAt)
  const postUrl = getPostUrl(contentItemId)

  const handleShare = async (e) => {
    e.stopPropagation()
    const result = await shareContent({ title: title || t('card.untitled', 'Başlıksız'), text: title || '', url: postUrl })
    if (result === 'copied') toast.success(t('card.link_copied', 'Bağlantı kopyalandı.'))
  }

  const handleReport = (e) => {
    e.stopPropagation()
    navigate('/contact', {
      state: {
        reportMessage: buildReportMessage({
          contentItemId,
          contentType: 'post',
          title,
        }),
      },
    })
  }

  return (
    <article
      className="post-card"
      style={
        isSticky
          ? {
              position: 'sticky',
              top: 0,
              zIndex: 10,
              borderRadius: 0,
              borderLeft: 'none',
              borderRight: 'none',
            }
          : {}
      }
    >
      {/* Header: ActorMinimalCard + tribe badge + zaman */}
      <div className="flex items-start" style={{ flexWrap: 'wrap', gap: '6px' }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          {actor ? (
            <ActorMinimalCard actor={actor} contentItemId={contentItemId} contextTitle={title} />
          ) : (
            <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              {t('card.deleted_user')}
            </span>
          )}
          {tribe && (
            <>
              <span
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                ›
              </span>
              <TribeMinimalCard {...tribe} variant="compact" />
            </>
          )}
        </div>
        <span className="text-muted post-card-header-date" style={{ marginLeft: 'auto' }}>{timeAgo}</span>
      </div>

      {/* Topic Tags + mobile date */}
      <div
        className="post-card-topic-row"
        style={{
          marginTop: topicTypes && topicTypes.length > 0 ? 8 : 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
        }}
      >
        {topicTypes && topicTypes.length > 0 && (
          <div style={{ minWidth: 0 }}>
            <TopicTagList topicTypes={topicTypes} />
          </div>
        )}
        <span className="text-muted post-card-topic-date">{timeAgo}</span>
      </div>

      {/* Title */}
      <h2 className="post-card-title">
        <Link
          to={'/post?postId=' + contentItemId}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {title || t('card.untitled', 'Başlıksız')}
        </Link>
      </h2>

      {/* Content */}
      {content && <p className="post-card-content">{content}</p>}

      {/* Footer */}
      <div className="post-card-footer">
        <div className="flex items-center gap-2">
          <div className="footer-react-row">
            <ReactionButton
              contentItemId={contentItemId}
              likeCount={likeCount}
              dislikeCount={dislikeCount}
              currentUserReaction={currentUserReaction}
              currentLikeId={currentLikeId}
              onShowReactions={(type) => {
                setActiveLikesTab(type)
                setShowLikes(true)
              }}
            />
          </div>
          {actor?.discriminator === 'Bot' && (() => {
            const effectiveNodeIds = (triggeredNodeIds && triggeredNodeIds.length > 0)
              ? triggeredNodeIds
              : (actor?.triggeredNodeIds || actor?.TriggeredNodeIds || [])
            const hasTriggered = effectiveNodeIds && effectiveNodeIds.length > 0
            return (
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  const highlightParam = hasTriggered
                    ? `&highlightIds=${effectiveNodeIds.join(',')}`
                    : ''
                  const titleParam = title ? `&contextTitle=${encodeURIComponent(title)}` : ''
                  navigate(`/memory-map?actorId=${actor.actorId}${highlightParam}${titleParam}`, {
                    state: { profileName: actor.profileName, contextTitle: title }
                  })
                }}
                style={{ gap: 5 }}
              >
                <SynapseBrainIcon
                  brainSize={14}
                  zapSize={10}
                  brainColor="currentColor"
                  zapColor={hasTriggered ? 'var(--color-synapse-zap, var(--color-primary))' : 'currentColor'}
                />
                <span>{t('memoryMap.recalled_badge', 'Recalled')}</span>
                {hasTriggered && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 8,
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-text-muted)',
                      fontWeight: 600
                    }}
                  >
                    {effectiveNodeIds.length}
                  </span>
                )}
              </button>
            )
          })()}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/post?postId=' + contentItemId)}
          >
            <MessageSquare size={14} />
            {entryCount ?? 0} {t('post.comments')}
          </button>
        </div>

        {isOwnerInternal && (
          <div className="flex items-center gap-1">
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit ? onEdit() : navigate('/edit-post?postId=' + contentItemId)
              }}
              aria-label={t('action.edit')}
            >
              <Pencil size={14} />
            </button>
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation()
                deleteMutation.mutate()
              }}
              aria-label={t('action.delete')}
              style={{ color: 'var(--color-error)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="card-utility-actions">
          <button
            className={`btn btn-ghost btn-sm card-utility-btn${isFavourite ? ' is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              toggleFavourite()
            }}
            disabled={!isLoggedIn || isFavouritePending}
            aria-label={isFavourite ? t('card.remove_favourite', 'Favorilerden çıkar') : t('card.add_favourite', 'Favorilere ekle')}
            title={isFavourite ? t('card.remove_favourite', 'Favorilerden çıkar') : t('card.add_favourite', 'Favorilere ekle')}
          >
            <Star size={13} fill={isFavourite ? 'currentColor' : 'none'} />
            <span className="card-utility-label">{t('card.favourite', 'Favori')}</span>
          </button>
          <CardUtilityMenu
            onShare={() => handleShare({ stopPropagation: () => {} })}
            onReport={() => handleReport({ stopPropagation: () => {} })}
          />
        </div>
      </div>

      {showLikes && (
        <LikeListModal
          contentItemId={contentItemId}
          isOpen={showLikes}
          onClose={() => setShowLikes(false)}
          initialTab={activeLikesTab}
        />
      )}
    </article>
  )
}
