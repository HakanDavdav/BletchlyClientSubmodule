import { useInfiniteQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ThumbsUp, ThumbsDown, Skull } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ModalHeader from '../common/ModalHeader'
import SynapseBrainIcon from '../common/SynapseBrainIcon'
import PostCard from '../content/PostCard'
import ContextualEntryThread from '../content/ContextualEntryThread'
import { ReactionEmojis, ReactionType } from '../../constants/enums'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function ProfileLikesModal({ actorId, isOpen, onClose }) {
  useDevLog('ProfileLikesModal', arguments[0] || {})
  const navigate = useNavigate()
  const { isLoggedIn, actorId: currentUserId } = useAuthStore()
  const { t, i18n } = useTranslation()

  const ReactionIcons = {
    [ReactionType.Like]: <ThumbsUp size={14} />,
    [ReactionType.Dislike]: <ThumbsDown size={14} />,
    [ReactionType.BrutallyDislike]: <Skull size={14} />,
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['profile-likes', actorId],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = await actorApi.getProfileLikes(actorId, pageParam)
        return {
          items: res.data?.data || [],
          nextPage: res.data?.data?.length === 2 ? pageParam + 1 : undefined,
        }
      } catch (err) {
        return { items: [], nextPage: undefined }
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: isOpen && !!actorId,
  })

  // Bütün sayfaların içeriğini tek array'de topla
  const items = data?.pages?.flatMap((page) => page.items) || []

  // Infinite scroll için onScroll handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }

  const isOwner = (item) => isLoggedIn && item?.actor?.actorId === currentUserId

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 800,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 20px',
          borderRadius: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <ModalHeader
          title={t('profile.reaction_history', 'Reaksiyon Geçmişi')}
          onClose={onClose}
          style={{ padding: '0 0 12px 0', marginBottom: 16 }}
        />

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }} onScroll={handleScroll}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div className="spinner spinner-md" />
            </div>
          ) : items.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet', 'Henüz burada hiçbir şey yok')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((like) => {
                const isPost = !!like.post
                const isEntry = !!like.entry

                return (
                  <div
                    key={like.likeId}
                    className="card flex flex-col gap-3"
                    style={{ padding: 16 }}
                  >
                    <div
                      className="flex items-center justify-between"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isPost ? t('profile.reacted_post_start', 'Ana başlığa') : t('profile.reacted_entry_start', 'Bir yanıta')} {ReactionIcons[like.reactionType]}{' '}
                        {t('profile.reacted_action', 'attı')}
                      </span>
                      <div className="flex items-center" style={{ gap: 8 }}>
                        {(() => {
                          const isBot = (like.actor?.discriminator || '').toLowerCase() === 'bot'
                          if (!isBot) return null
                          const effectiveNodeIds = like.triggeredNodeIds || []
                          const hasTriggered = effectiveNodeIds.length > 0
                          const highlightParam = hasTriggered
                            ? `&highlightIds=${effectiveNodeIds.join(',')}`
                            : ''
                          return (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/memory-map?actorId=${like.actor?.actorId}${highlightParam}`)
                              }}
                              style={{ gap: 5 }}
                            >
                              <SynapseBrainIcon
                                brainSize={13}
                                zapSize={9}
                                brainColor="currentColor"
                                zapColor={
                                  hasTriggered
                                    ? 'var(--color-synapse-zap, var(--color-primary))'
                                    : 'currentColor'
                                }
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
                                    fontWeight: 600,
                                  }}
                                >
                                  {effectiveNodeIds.length}
                                </span>
                              )}
                            </button>
                          )
                        })()}
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {new Date(like.createdAt).toLocaleDateString(i18n.language)}
                        </span>
                      </div>
                    </div>

                    {isPost && (
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--color-primary)',
                            marginBottom: 6,
                            paddingLeft: 4,
                          }}
                        >
                          {t('profile.focused_topic', 'ODAKLANAN BAŞLIK')}
                        </p>
                        <div
                          style={{
                            borderLeft: '3px solid var(--color-primary)',
                            borderRadius: '0 8px 8px 0',
                            background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
                            paddingLeft: 12,
                          }}
                        >
                          <PostCard {...like.post} isOwner={isOwner(like.post)} />
                        </div>
                      </div>
                    )}

                    {isEntry && <ContextualEntryThread entryDto={like.entry} hideCardStyle />}
                  </div>
                )
              })}

              {isFetchingNextPage && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="spinner spinner-sm" />
                </div>
              )}
              {!isFetchingNextPage && !hasNextPage && items.length > 0 && (
                <p
                  className="text-muted"
                  style={{ textAlign: 'center', fontSize: 13, marginTop: 8 }}
                >
                  {t('common.no_more_results', 'No more results.')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
