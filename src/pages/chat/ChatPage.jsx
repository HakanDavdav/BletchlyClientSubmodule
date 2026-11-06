import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import BackButton from '../../components/common/BackButton'
import ChatBubbleIcon from '../../components/common/icons/ChatBubbleIcon'
import ChatConversationList from '../../components/chat/ChatConversationList'
import ChatThread from '../../components/chat/ChatThread'
import NewChatModal from '../../components/chat/NewChatModal'
import { chatApi } from '../../api/chatApi'
import { useChatHub } from '../../hooks/useChatHub'
import useAuthStore from '../../store/authStore'
import './ChatPage.css'

function normalizeSignalMessage(signal) {
  return {
    chatMessageId: signal.messageId,
    chatConversationId: signal.conversationId,
    senderActorId: signal.senderId,
    content: signal.content,
    replyToChatMessageId: signal.replyToChatMessageId || null,
    replyToContent: signal.replyToContent || null,
    replyToSenderActorId: signal.replyToSenderActorId || null,
    replyToSenderProfileName: signal.replyToSenderProfileName || null,
    createdAt: signal.createdAt,
    isRead: false,
    isDeleted: false,
    isPinned: false,
    isFavorited: false,
  }
}

export default function ChatPage({ embedded = false, initialTargetActorId = null, onBack }) {
  const { t } = useTranslation()
  const { isLoggedIn, actorId } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedActorId, setSelectedActorId] = useState(
    initialTargetActorId || (!embedded ? searchParams.get('actorId') : null) || null
  )
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [debouncedUserQuery, setDebouncedUserQuery] = useState('')
  const selectedActorIdRef = useRef(selectedActorId)
  selectedActorIdRef.current = selectedActorId

  useEffect(() => {
    const queryActorId = initialTargetActorId || (!embedded ? searchParams.get('actorId') : null) || null
    if (queryActorId) setSelectedActorId(queryActorId)
  }, [initialTargetActorId, searchParams, embedded])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUserQuery(userQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [userQuery])

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatApi.loadConversations().then((response) => response.data?.data || []),
    enabled: isLoggedIn,
    staleTime: 15_000,
  })

  const threadQuery = useInfiniteQuery({
    queryKey: ['chat', 'thread', selectedActorId],
    queryFn: ({ pageParam = 1 }) =>
      chatApi.loadThread(selectedActorId, pageParam).then((response) => response.data?.data || null),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage?.hasMore ? allPages.length + 1 : undefined),
    enabled: isLoggedIn && Boolean(selectedActorId),
    staleTime: 10_000,
  })

  const thread = useMemo(() => {
    const pages = threadQuery.data?.pages
    if (!pages?.length) return null
    return {
      ...pages[0],
      messages: [...pages].reverse().flatMap((page) => page.messages || []),
    }
  }, [threadQuery.data])

  const usersQuery = useQuery({
    queryKey: ['chat', 'users', debouncedUserQuery],
    queryFn: () =>
      chatApi.loadUsers(debouncedUserQuery).then((response) => response.data?.data || []),
    enabled: isLoggedIn && newChatOpen,
    staleTime: 10_000,
  })

  const markRead = useCallback(
    (targetId) => {
      if (!targetId) return
      chatApi
        .markRead(targetId)
        .then(() => queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] }))
        .catch(() => {})
    },
    [queryClient]
  )

  useEffect(() => {
    if (selectedActorId && threadQuery.data?.pages?.[0]?.chatConversationId) {
      markRead(selectedActorId)
    }
  }, [selectedActorId, threadQuery.data?.pages, markRead])

  const appendMessage = useCallback(
    (message, otherActorId) => {
      queryClient.setQueryData(['chat', 'thread', otherActorId], (oldData) => {
        if (!oldData?.pages?.length) return oldData
        const exists = oldData.pages.some((page) =>
          page.messages?.some((item) => item.chatMessageId === message.chatMessageId)
        )
        if (exists) return oldData
        const pages = oldData.pages.map((page, index) =>
          index === 0 ? { ...page, messages: [...(page.messages || []), message] } : page
        )
        return { ...oldData, pages }
      })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
    [queryClient]
  )

  const handleSignal = useCallback(
    (signal) => {
      if (signal?.type === 'chat_message_action') {
        queryClient.invalidateQueries({ queryKey: ['chat', 'thread'] })
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
        return
      }

      const otherActorId = signal.senderId === actorId ? signal.recipientId : signal.senderId
      const message = normalizeSignalMessage(signal)
      if (selectedActorIdRef.current === otherActorId) {
        appendMessage(message, otherActorId)
        if (signal.senderId !== actorId) markRead(otherActorId)
      } else {
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      }
    },
    [actorId, appendMessage, markRead, queryClient]
  )

  const { sendMessage } = useChatHub(handleSignal)

  const handleSelect = (targetId) => {
    setSelectedActorId(targetId)
    setNewChatOpen(false)
    if (!embedded) {
      setSearchParams({ actorId: targetId })
    }
  }

  const handleThreadBack = () => {
    setSelectedActorId(null)
    if (!embedded) {
      setSearchParams({})
    }
  }

  const handleSend = async (content, replyToChatMessageId = null) => {
    const result = await sendMessage(selectedActorId, content, replyToChatMessageId)
    if (result?.succeeded === false) {
      const message = result.errors?.[0]?.description || t('chat.send_failed')
      throw new Error(message)
    }
    if (result?.data) {
      appendMessage(result.data, selectedActorId)
    }
  }

  const conversations = useMemo(
    () => conversationsQuery.data || [],
    [conversationsQuery.data]
  )

  if (!isLoggedIn) {
    return (
      <div className="chat-page chat-page--auth">
        <div className="chat-page__auth">
          <div className="chat-thread__empty-icon">
            <ChatBubbleIcon size={28} color="var(--color-primary)" />
          </div>
          <h2>{t('chat.login_required')}</h2>
          <p>{t('chat.login_required_desc')}</p>
          <Link className="btn btn-primary" to="/login">
            {t('common.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-page${embedded ? ' chat-page--embedded' : ''}`}>
      <div className="chat-page__header-row">
        <BackButton
          onClick={embedded ? onBack : undefined}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div className={`chat-shell${selectedActorId ? ' has-selection' : ''}`}>
        <ChatConversationList
          conversations={conversations}
          selectedActorId={selectedActorId}
          onSelect={handleSelect}
          onNewChat={() => setNewChatOpen(true)}
          loading={conversationsQuery.isLoading}
        />
        <ChatThread
          thread={thread}
          targetActorId={selectedActorId}
          currentActorId={actorId}
          loading={threadQuery.isLoading}
          hasMore={threadQuery.hasNextPage}
          loadingOlder={threadQuery.isFetchingNextPage}
          onLoadOlder={() => threadQuery.fetchNextPage()}
          onBack={handleThreadBack}
          onSend={handleSend}
        />
      </div>

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSelect={handleSelect}
        users={usersQuery.data || []}
        loading={usersQuery.isLoading}
        query={userQuery}
        setQuery={setUserQuery}
      />
    </div>
  )
}
