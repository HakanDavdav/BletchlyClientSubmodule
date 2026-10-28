import { useInfiniteQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { Crown } from 'lucide-react'
import { personalityCardApi } from '../../api/personalityCardApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ModalHeader from '../common/ModalHeader'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const locale = (i18n.language && i18n.language.startsWith('en')) ? 'en-US' : 'tr-TR'
  const datePart = date.toLocaleDateString(locale)
  const timePart = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return `${datePart} ${timePart}`
}

export default function CardActorListModal({ cardId, type, isOpen, onClose }) {
  useDevLog('CardActorListModal', arguments[0] || {})
  const { t } = useTranslation()
  // type is 'owners' or 'assignees'

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['card-actor-list', cardId, type],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res =
          type === 'owners'
            ? await personalityCardApi.getCardOwners(cardId, pageParam)
            : await personalityCardApi.getCardAssignees(cardId, pageParam)
        return {
          items: res.data?.data || [],
          nextPage: res.data?.data?.length === 10 ? pageParam + 1 : undefined,
        }
      } catch (err) {
        return { items: [], nextPage: undefined }
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: isOpen && !!cardId,
  })

  const items = data?.pages?.flatMap((page) => page.items) || []

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
      style={{ zIndex: 100000 }}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 560,
          height: '75vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 20px',
          borderRadius: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <ModalHeader
          title={type === 'owners' ? t('card.owners', 'Sahipler') : t('card.assignees', 'Atanmış Botlar')}
          onClose={onClose}
          style={{ padding: '0 0 12px 0', marginBottom: 14 }}
        />

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }} onScroll={handleScroll}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div className="spinner spinner-md" />
            </div>
          ) : items.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet', 'Henüz burada hiçbir şey yok')}</p>
          ) : (
            <div className="flex flex-col gap-2" style={{ padding: '4px 4px 8px 4px' }}>
              {items.map((item, idx) => {
                const isOwnerType = type === 'owners'
                const actor = isOwnerType ? (item.actor || item) : item
                const acqType = isOwnerType ? item.acquisitionType : null
                const acquiredAt = isOwnerType ? item.acquiredAt : null
                const key = item.ownershipId || item.actorId || actor?.actorId || idx

                return (
                  <div
                    key={key}
                    className="lb-card"
                    style={{
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <ActorMinimalCard actor={actor} showHierarchyBtn={false} clickable={true} />
                    </div>

                    {isOwnerType && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          flexShrink: 0,
                        }}
                      >
                        {acqType === 0 && (
                          <span
                            style={{
                              color: 'var(--color-warning)',
                              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Crown size={20} strokeWidth={2.5} />
                          </span>
                        )}
                        {acqType === 1 && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
                            }}
                          >
                            <Crown size={18} strokeWidth={2.5} color="#b87333" />
                            <span
                              style={{
                                marginLeft: '-3px',
                                marginTop: '3px',
                                fontSize: '18px',
                                fontWeight: '900',
                                fontFamily: '"Arial Black", Impact, system-ui, sans-serif',
                                lineHeight: 1,
                                color: '#22c55e',
                                textShadow: '0 0 3px rgba(34, 197, 94, 0.35), 0 1px 2px rgba(0,0,0,0.8)',
                                WebkitTextStroke: '0.5px #052e16',
                              }}
                            >
                              $
                            </span>
                          </span>
                        )}
                        {acquiredAt && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--color-text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDate(acquiredAt)}
                          </span>
                        )}
                      </div>
                    )}
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
                  style={{ padding: 16, textAlign: 'center', fontSize: 13 }}
                >
                  {t('common.no_more_results')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
