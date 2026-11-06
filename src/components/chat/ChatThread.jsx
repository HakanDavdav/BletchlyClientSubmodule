import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, MoreHorizontal, Pin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import ActorAvatar from '../actor/ActorAvatar'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ChatComposer from './ChatComposer'
import ChatMessageMenu from './ChatMessageMenu'
import InfiniteScrollStatus from '../common/InfiniteScrollStatus'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import TwemojiText from '../common/TwemojiText'
import ChatBubbleIcon from '../common/icons/ChatBubbleIcon'
import BotIcon from '../common/icons/BotIcon'
import { chatApi } from '../../api/chatApi'
import { buildReportMessage } from '../../utils/contentActions'
import { formatDateLong, formatTimeOnly } from '../../utils/formatDate'

function getActionErrorMessage(err, t) {
  return (
    err?.errors?.[0]?.description ||
    err?.response?.data?.errors?.[0]?.description ||
    err?.message ||
    t('chat.action_failed')
  )
}

function dayKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export default function ChatThread({
  thread,
  targetActorId,
  currentActorId,
  loading,
  hasMore,
  loadingOlder,
  onLoadOlder,
  onBack,
  onSend,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scrollRef = useRef(null)
  const previousScrollHeightRef = useRef(0)
  const previousScrollTopRef = useRef(0)
  const nearBottomRef = useRef(true)
  const previousTargetRef = useRef(null)
  const messages = thread?.messages || []
  const otherActor = thread?.otherActor
  const [replyTo, setReplyTo] = useState(null)
  const [menuState, setMenuState] = useState(null)

  const lastMessageId = messages[messages.length - 1]?.chatMessageId

  const { sentinelRef: loadOlderRef, isWaiting: isWaitingOlder } = useInfiniteScroll({
    hasNextPage: hasMore,
    isFetchingNextPage: loadingOlder,
    fetchNextPage: onLoadOlder,
    rootRef: scrollRef,
    rootMargin: '150px',
    enabled: Boolean(targetActorId) && messages.length > 0,
  })

  useEffect(() => {
    if (!loadingOlder) return
    const element = scrollRef.current
    if (!element) return
    previousScrollHeightRef.current = element.scrollHeight
    previousScrollTopRef.current = element.scrollTop
  }, [loadingOlder])

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    if (!previousScrollHeightRef.current) return
    const delta = element.scrollHeight - previousScrollHeightRef.current
    if (delta > 0) element.scrollTop = previousScrollTopRef.current + delta
    previousScrollHeightRef.current = 0
  }, [thread?.messages, loadingOlder])

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const targetChanged = previousTargetRef.current !== targetActorId
    previousTargetRef.current = targetActorId
    if (targetChanged || nearBottomRef.current) {
      element.scrollTop = element.scrollHeight
    }
  }, [lastMessageId, targetActorId])

  useEffect(() => {
    setReplyTo(null)
    setMenuState(null)
  }, [targetActorId])

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return
    nearBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 100
  }

  const invalidateThread = () => {
    queryClient.invalidateQueries({ queryKey: ['chat', 'thread', targetActorId] })
    queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
  }

  const closeMenu = () => setMenuState(null)

  const handleReply = (message) => {
    setReplyTo({
      chatMessageId: message.chatMessageId,
      senderActorId: message.senderActorId,
      senderProfileName:
        message.senderActorId === currentActorId
          ? t('chat.you')
          : otherActor?.profileName || t('chat.user'),
      content: message.isDeleted ? t('chat.message_deleted') : message.content,
    })
    closeMenu()
  }

  const handleCopy = async (message) => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success(t('chat.copy_success'))
    } catch {
      toast.error(t('chat.copy_failed'))
    }
    closeMenu()
  }

  const handleFavorite = async (message) => {
    try {
      const response = await chatApi.toggleFavorite(message.chatMessageId)
      const isFavorited = response?.data?.data
      toast.success(
        isFavorited
          ? t('chat.favorite_added')
          : t('chat.favorite_removed')
      )
      invalidateThread()
    } catch (err) {
      toast.error(getActionErrorMessage(err, t))
    }
    closeMenu()
  }

  const handlePin = async (message) => {
    try {
      const response = await chatApi.pinMessage(message.chatMessageId)
      const isPinned = response?.data?.data
      toast.success(
        isPinned
          ? t('chat.pinned')
          : t('chat.unpinned')
      )
      invalidateThread()
    } catch (err) {
      toast.error(getActionErrorMessage(err, t))
    }
    closeMenu()
  }

  const handleDelete = async (message) => {
    closeMenu()
    if (!window.confirm(t('chat.delete_confirm'))) return
    try {
      await chatApi.deleteMessage(message.chatMessageId)
      if (replyTo?.chatMessageId === message.chatMessageId) setReplyTo(null)
      toast.success(t('chat.deleted'))
      invalidateThread()
    } catch (err) {
      toast.error(getActionErrorMessage(err, t))
    }
  }

  const handleReport = (message) => {
    closeMenu()
    navigate('/contact', {
      state: {
        reportMessage: buildReportMessage({
          contentItemId: message.chatMessageId,
          contentType: 'chat',
        }),
      },
    })
  }

  const handleSend = async (content, replyToChatMessageId) => {
    nearBottomRef.current = true
    await onSend(content, replyToChatMessageId)
    setReplyTo(null)
  }

  if (!targetActorId) {
    return (
      <section className="chat-thread chat-thread--empty">
        <div className="chat-thread__empty-bot" aria-hidden="true">
          <BotIcon size={120} />
        </div>
      </section>
    )
  }

  return (
    <section className="chat-thread">
      <div className="chat-thread__bg-bot" aria-hidden="true">
        <BotIcon size={180} />
      </div>
      <header className="chat-thread__header">
        <button type="button" className="chat-thread__back" onClick={onBack} aria-label={t('common.go_back')}>
          <ArrowLeft size={18} />
        </button>
        {otherActor ? (
          <Link to={`/profile?actorId=${otherActor.actorId}`} className="chat-thread__identity">
            <ActorMinimalCard
              actor={otherActor}
              clickable={false}
              showHierarchyBtn={false}
              showMemoryMapBtn={false}
              showEditBtn={false}
              showPremiumBtn={false}
              showPoint={false}
              chipStyle={{ maxWidth: '100%' }}
              nameMaxWidth="24ch"
            />
            <span className="chat-thread__identity-sub">{t('chat.private_chat')}</span>
          </Link>
        ) : (
          <div className="chat-thread__identity">
            <span className="chat-thread__identity-sub">{t('chat.private_chat')}</span>
          </div>
        )}
      </header>

      <div className="chat-thread__messages" ref={scrollRef} onScroll={handleScroll}>
        {messages.length > 0 && (
          <>
            <div ref={loadOlderRef} style={{ height: 1 }} />
            <div className="chat-thread__older-status">
              <InfiniteScrollStatus
                isFetching={loadingOlder || isWaitingOlder}
                hasNextPage={hasMore}
                hasItems={messages.length > 0}
              />
            </div>
          </>
        )}
        {loading ? (
          <div className="chat-thread__loading">
            <div className="spinner spinner-md" />
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-thread__empty chat-thread__empty--inline">
            <div className="chat-thread__empty-icon">
              <ChatBubbleIcon size={24} color="var(--color-primary)" />
            </div>
            <h2>{t('common.nothing_here_yet')}</h2>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMine = message.senderActorId === currentActorId
            const previous = messages[index - 1]
            const showDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
            return (
              <div key={message.chatMessageId}>
                {showDay && (
                  <div className="chat-thread__day">
                    <span className="date-text">{formatDateLong(message.createdAt)}</span>
                  </div>
                )}
                <div className={`chat-message${isMine ? ' is-mine' : ''}${message.isDeleted ? ' is-deleted' : ''}`}>
                  {!isMine && otherActor && (
                    <ActorAvatar
                      profileName={otherActor.profileName}
                      imageUrl={otherActor.imageUrl}
                      discriminator={otherActor.discriminator || 'User'}
                      actorId={otherActor.actorId}
                      size="sm"
                      hideBadge
                    />
                  )}
                  <span className="chat-message__time date-text">{formatTimeOnly(message.createdAt)}</span>
                  <div className="chat-message__bubble-wrap">
                    {!message.isDeleted && (
                      <button
                        type="button"
                        className="chat-message__more"
                        onClick={(event) => {
                          event.stopPropagation()
                          setMenuState({
                            message,
                            isMine,
                            anchorRect: event.currentTarget.getBoundingClientRect(),
                          })
                        }}
                        aria-label={t('chat.message_actions')}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    )}
                    <div className={`chat-message__bubble${message.isPinned ? ' is-pinned' : ''}`}>
                      {message.isPinned && (
                        <span className="chat-message__pin" title={t('chat.pinned_message')}>
                          <Pin size={10} />
                        </span>
                      )}
                      {message.replyToChatMessageId && (
                        <div className="chat-message__reply-quote">
                          <strong>
                            {message.replyToSenderProfileName ||
                              (message.replyToSenderActorId === currentActorId
                                ? t('chat.you')
                                : t('chat.user'))}
                          </strong>
                          <span>
                            {message.replyToContent
                              ? <TwemojiText text={message.replyToContent} />
                              : t('chat.message_deleted')}
                          </span>
                        </div>
                      )}
                      {message.isDeleted ? (
                        <p className="chat-message__deleted-text">{t('chat.message_deleted')}</p>
                      ) : (
                        <p><TwemojiText text={message.content} /></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <ChatComposer
        targetActorId={targetActorId}
        onSend={handleSend}
        disabled={!targetActorId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      {menuState && (
        <ChatMessageMenu
          anchorRect={menuState.anchorRect}
          message={menuState.message}
          isMine={menuState.isMine}
          onClose={closeMenu}
          onReply={() => handleReply(menuState.message)}
          onCopy={() => handleCopy(menuState.message)}
          onFavorite={() => handleFavorite(menuState.message)}
          onPin={() => handlePin(menuState.message)}
          onDelete={() => handleDelete(menuState.message)}
          onReport={() => handleReport(menuState.message)}
        />
      )}

    </section>
  )
}
