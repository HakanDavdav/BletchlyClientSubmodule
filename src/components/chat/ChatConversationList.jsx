import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import SearchInput from '../common/SearchInput'
import TwemojiText from '../common/TwemojiText'
import { getShortTimeAgo } from '../../utils/formatTime'

export default function ChatConversationList({
  conversations,
  selectedActorId,
  onSelect,
  onNewChat,
  loading,
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter((conversation) => {
      const name = conversation.otherActor?.profileName?.toLowerCase() || ''
      const last = conversation.lastMessageContent?.toLowerCase() || ''
      return name.includes(query) || last.includes(query)
    })
  }, [conversations, search])

  const renderPreview = (conversation) => {
    if (conversation.lastMessageIsDeleted) {
      return t('chat.message_deleted', 'Mesaj silindi')
    }
    if (conversation.lastMessageContent) return conversation.lastMessageContent
    return t('chat.no_messages_yet', 'Henüz mesaj yok')
  }

  return (
    <aside className="chat-list">
      <div className="chat-list__header">
        <div>
          <h2 className="chat-list__title">{t('chat.conversations', 'Sohbetler')}</h2>
          <p className="chat-list__subtitle">{t('chat.private_chat', 'Özel mesajlar')}</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm chat-list__new-btn" onClick={onNewChat}>
          <Plus size={14} />
          {t('chat.new_chat', 'Yeni')}
        </button>
      </div>

      <form className="chat-list__search" onSubmit={(event) => event.preventDefault()}>
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          clearLabel={t('common.clear', 'Temizle')}
          placeholder={t('chat.search_conversations', 'Sohbetlerde ara')}
        />
      </form>

      <div className="chat-list__items minimal-card-list">
        {loading ? (
          <div className="chat-list__loading">
            <div className="spinner spinner-md" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="empty-state" style={{ margin: 0 }}>
            {conversations.length === 0
              ? t('chat.no_conversations', 'Henüz sohbet yok. Yeni bir sohbet başlat.')
              : t('chat.no_conversation_match', 'Aramanla eşleşen sohbet yok.')}
          </p>
        ) : (
          filtered.map((conversation) => {
            const actor = conversation.otherActor
            const isSelected = actor?.actorId === selectedActorId
            return (
              <button
                key={conversation.chatConversationId}
                type="button"
                className={`chat-list__item${isSelected ? ' is-active' : ''}`}
                onClick={() => actor?.actorId && onSelect(actor.actorId)}
                aria-pressed={isSelected}
              >
                <ActorMinimalCard
                  actor={actor}
                  clickable={false}
                  showHierarchyBtn={false}
                  showMemoryMapBtn={false}
                  showEditBtn={false}
                  showPremiumBtn={false}
                  showPoint={false}
                  chipStyle={{
                    width: '100%',
                    maxWidth: '100%',
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="chat-list__item-meta">
                    <span className="chat-list__item-preview">
                      <TwemojiText text={renderPreview(conversation)} />
                    </span>
                    <span className="chat-list__item-time">
                      {getShortTimeAgo(conversation.lastMessageAt)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="chat-list__unread">{conversation.unreadCount}</span>
                    )}
                  </span>
                </ActorMinimalCard>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
