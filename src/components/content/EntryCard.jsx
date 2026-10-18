import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, MessageSquare, Smile, CirclePlus, CircleMinus, Brain } from 'lucide-react'
import SynapseBrainIcon from '../common/SynapseBrainIcon'
import { getShortTimeAgo } from '../../utils/formatTime'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ReactionButton from './ReactionButton'
import LikeListModal from './LikeListModal'
import EntryDraft from './EntryDraft'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

/**
 * EntryCard — plan.md Component #9
 * depth prop'u ile iç içe girinti desteği.
 * Reply butonu inline EntryDraft toggle'lar.
 */
export default function EntryCard({
  contentItemId,
  content,
  likeCount,
  dislikeCount,
  entryCount,
  createdAt,
  actor,
  userReaction,
  userLikeId,
  depth = 0,
  isOwner = false,
  onDelete,
  onEdit,
  queryKey, // invalidation için
  childEntries,
  disableChildrenRendering = false,
  defaultExpanded = false,
  triggeredNodeIds = null,
  title = null,
}) {
  useDevLog('EntryCard', arguments[0] || {})
  const [showReplyDraft, setShowReplyDraft] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const [activeLikesTab, setActiveLikesTab] = useState(null)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const loggedInActorId = useAuthStore((s) => s.actorId)
  const [isEditing, setIsEditing] = useState(false)
  const [localContent, setLocalContent] = useState(content)
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  // Eğer entryCount > 0 ise veya halihazırda childEntries dizisi doluysa çocukları var demektir
  const hasChildren =
    !disableChildrenRendering && (entryCount > 0 || (childEntries && childEntries.length > 0))
  // Sadece çocuklar yüklenmemişse fetch işlemini tetikle
  const needsFetching = hasChildren && (!childEntries || childEntries.length === 0)

  // Overlay verisi DTO'dan geliyor
  const currentUserReaction = userReaction;
  const currentLikeId = userLikeId;

  const { data: fetchedChildEntriesRes, isLoading: isLoadingChildren } = useQuery({
    queryKey: ['entryEntries', contentItemId],
    queryFn: () => contentItemApi.getEntryEntries(contentItemId, 1, 2),
    enabled: !!(isExpanded && needsFetching),
  })

  const displayChildEntries =
    childEntries && childEntries.length > 0
      ? childEntries
      : fetchedChildEntriesRes?.data?.data || []

  const isDeletedEntry = content === '[Deleted]'
  const isOwnerInternal = !isDeletedEntry && (isOwner || (loggedInActorId && actor?.actorId === loggedInActorId))

  const deleteMutation = useMutation({
    mutationFn: () => contentItemApi.deleteEntry(contentItemId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      if (queryKey) queryClient.invalidateQueries({ queryKey })
      if (onDelete) onDelete()
    },
  })

  const timeAgo = getShortTimeAgo(createdAt)

  // Maksimum 5 seviye derinliğe kadar CSS sınıfı atanır (depth-1, depth-2, ..., depth-5)
  const depthClass = depth > 0 ? (depth >= 5 ? 'depth-5' : `depth-${depth}`) : ''

  const effectiveTitle = title || localContent?.slice(0, 60) || t('entry.comment', 'Yorum')

  return (
    <>
      <div className={`entry-card ${depthClass}`} style={{ animation: 'fadeIn 0.2s ease' }}>
        {/* Header */}
        <div className="flex items-start" style={{ marginBottom: 8, marginLeft: -4 }}>
          {actor ? (
            <ActorMinimalCard
              actor={actor}
              showHierarchyBtn={true}
              contextTitle={effectiveTitle}
            />
          ) : (
            <span
              className="text-muted"
              style={{ paddingLeft: 8, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}
            >
              {t('card.deleted_user')}
            </span>
          )}
          <span className="text-muted entry-card-header-date" style={{ marginLeft: 'auto' }}>
            {timeAgo}
          </span>
        </div>

        {/* Content */}
        {isEditing ? (
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <EntryDraft
              editContentItemId={contentItemId}
              initialContent={localContent}
              onSuccess={(newContent) => {
                setIsEditing(false)
                setLocalContent(newContent)
                if (queryKey) queryClient.invalidateQueries({ queryKey })
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <p className="entry-card-content">{localContent || '—'}</p>
        )}

        {/* Footer */}
        <div className="entry-card-footer">
          {/* Sol: Reaksiyon + yorum sayısı */}
          <div className="flex items-center gap-2">
            {hasChildren && (
              <>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 0,
                    paddingRight: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                  aria-label={isExpanded ? t('post.hide_replies') : t('post.show_replies')}
                >
                  {isExpanded ? (
                    <CircleMinus size={19} strokeWidth={2.4} />
                  ) : (
                    <CirclePlus size={19} strokeWidth={2.4} />
                  )}
                </button>
                {isLoadingChildren && (
                  <span className="text-muted" style={{ fontSize: 12, marginLeft: -4 }}>
                    ...
                  </span>
                )}
              </>
            )}
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
              {/* Mobilde tarih, reaksiyon satırının en sağında gösterilir */}
              <span className="footer-mobile-date text-muted">{timeAgo}</span>
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
                    const titleParam = effectiveTitle ? `&contextTitle=${encodeURIComponent(effectiveTitle)}` : ''
                    navigate(`/mind?actorId=${actor.actorId}${highlightParam}${titleParam}`, {
                      state: { profileName: actor.profileName, contextTitle: effectiveTitle }
                    })
                  }}
                  style={{ gap: 5 }}
                >
                  <SynapseBrainIcon
                    brainSize={13}
                    zapSize={9}
                    brainColor="currentColor"
                    zapColor={hasTriggered ? 'var(--color-synapse-zap, var(--color-primary))' : 'currentColor'}
                  />
                  <span>{t('mind.recalled_badge', 'Recalled')}</span>
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
            {isLoggedIn && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReplyDraft((v) => !v)}>
                <MessageSquare size={13} />
                {t('post.reply')}
              </button>
            )}
          </div>

          {/* Sağ: Owner actions */}
          {isOwnerInternal && (
            <div className="flex items-center gap-1 hide-under-1200">
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                aria-label={t('action.edit')}
              >
                <Pencil size={13} />
              </button>
              <button
                className="btn-icon"
                style={{ color: 'var(--color-error)' }}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteMutation.mutate()
                }}
                aria-label={t('action.delete')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Inline Reply Draft */}
        {showReplyDraft && (
          <div style={{ marginTop: 24 }}>
            <EntryDraft
              parentContentItemId={contentItemId}
              onSuccess={() => {
                setShowReplyDraft(false)
                if (queryKey) queryClient.invalidateQueries({ queryKey })
                queryClient.invalidateQueries({ queryKey: ['entryEntries', contentItemId] })
                // Otomatik olarak yanıtları genişlet
                setIsExpanded(true)
              }}
              onCancel={() => setShowReplyDraft(false)}
            />
          </div>
        )}

        {showLikes && (
          <LikeListModal
            contentItemId={contentItemId}
            isOpen={showLikes}
            onClose={() => setShowLikes(false)}
            initialTab={activeLikesTab}
          />
        )}
      </div>

      {!disableChildrenRendering &&
        displayChildEntries &&
        displayChildEntries.length > 0 &&
        (isExpanded
          ? displayChildEntries.map((child) => (
            <EntryCard
              key={child.contentItemId}
              {...child}
              queryKey={queryKey}
              depth={depth + 1}
            />
          ))
          : null)}
    </>
  )
}
