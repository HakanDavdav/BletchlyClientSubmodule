import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import SearchInput from '../common/SearchInput'

export default function NewChatModal({
  open,
  onClose,
  onSelect,
  users,
  loading,
  query,
  setQuery,
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box chat-new-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t('chat.new_chat', 'Yeni sohbet')}</h2>
            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
              {t('chat.new_chat_desc', 'Mesajlaşmak istediğin kullanıcıyı seç.')}
            </p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('common.close', 'Kapat')}>
            <X size={18} />
          </button>
        </div>

        <form className="chat-new-modal__search" onSubmit={(event) => event.preventDefault()}>
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            clearLabel={t('common.clear', 'Temizle')}
            placeholder={t('chat.search_users', 'Kullanıcı ara')}
            autoFocus
          />
        </form>

        <div className="chat-new-modal__users minimal-card-list">
          {loading ? (
            <div className="chat-list__loading">
              <div className="spinner spinner-md" />
            </div>
          ) : users.length === 0 ? (
            <p className="empty-state" style={{ margin: 0 }}>
              {t('chat.no_users', 'Kullanıcı bulunamadı.')}
            </p>
          ) : (
            users.map((user) => (
              <button
                key={user.actorId}
                type="button"
                className="chat-new-modal__user"
                onClick={() => onSelect(user.actorId)}
              >
                <ActorMinimalCard
                  actor={user}
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
                  {user.bio && <small className="chat-new-modal__user-bio">{user.bio}</small>}
                </ActorMinimalCard>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
