import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import SearchInput from '../common/SearchInput'
import ModalPortal from '../common/ModalPortal'

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
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box chat-new-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t('chat.new_chat')}</h2>
            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
              {t('chat.new_chat_desc')}
            </p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <form className="chat-new-modal__search" onSubmit={(event) => event.preventDefault()}>
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            clearLabel={t('common.clear')}
            placeholder={t('chat.search_users')}
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
              {query?.trim() ? t('search.no_results') : t('common.nothing_here_yet')}
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
    </ModalPortal>
  )
}
