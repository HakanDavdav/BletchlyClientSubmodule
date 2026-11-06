import { useState, useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { searchApi } from '../../api/searchApi'
import { ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../../components/common/BackButton'
import ConfirmModal from '../../components/common/ConfirmModal'
import PersonalityCard from '../../components/card/PersonalityCard'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import BotFlashCardsIcon from '../../components/common/icons/BotFlashCardsIcon'
import SearchFilterBar from '../../components/common/SearchFilterBar'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import InfiniteScrollStatus from '../../components/common/InfiniteScrollStatus'
import ActorMinimalCard from '../../components/actor/ActorMinimalCard'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import { triggerConfetti } from '../../utils/confetti'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isLoggedIn } = useAuthStore()
  const myCards = useMyEntitiesStore((s) => s.myCards)
  const storeSettings = useMyEntitiesStore((s) => s.mySettings)
  const cardOwnershipLimit = storeSettings?.cardOwnershipLimit || 10
  const isLimitReached = (myCards || []).length >= cardOwnershipLimit

  const [buyModal, setBuyModal] = useState({ isOpen: false, cardId: null, price: null, cardName: '' })

  // Active query parameters that trigger refetch
  const [activeParams, setActiveParams] = useState({ query: '', orderType: '', startDate: null, endDate: null })
  const hasActiveSearch = Boolean(
    activeParams.query ||
    (activeParams.orderType && activeParams.orderType !== 'None') ||
    activeParams.startDate ||
    activeParams.endDate
  )

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['marketplaceCards', activeParams],
    queryFn: ({ pageParam = 1 }) =>
      personalityCardApi
        .getMarketplaceCards(
          pageParam,
          activeParams.query,
          activeParams.orderType,
          activeParams.startDate,
          activeParams.endDate
        )
        .then((res) => res.data?.data || []),
    getNextPageParam: (lastPage, allPages) => {
      // If there's a search query, backend returns all 100 results on page 1. No need to paginate further on backend.
      if (activeParams.query) return undefined
      // Otherwise, standard DB pagination 20 per page
      return lastPage.length === 20 ? allPages.length + 1 : undefined
    },
  })

  const allFetchedCards = data?.pages.flatMap((p) => p) || []

  // Frontend simulated pagination state
  const [visibleCount, setVisibleCount] = useState(20)

  // Reset visible count when search parameters change
  useEffect(() => {
    setVisibleCount(20)
  }, [activeParams])

  const visibleCards = allFetchedCards.slice(0, visibleCount)
  const canLoadMore = hasNextPage || visibleCount < allFetchedCards.length

  const { sentinelRef: loadMoreRef, isWaiting } = useInfiniteScroll({
    hasNextPage: canLoadMore,
    isFetchingNextPage,
    onIntersect: () => {
      if (visibleCount < allFetchedCards.length) {
        setVisibleCount((prev) => prev + 20)
      } else if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage().then(() => {
          setVisibleCount((prev) => prev + 20)
        })
      }
    },
    depsKey: `${visibleCount}:${allFetchedCards.length}`,
  })

  const buyMutation = useMutation({
    mutationFn: (cardId) => personalityCardApi.buyCard(cardId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      triggerConfetti()
      toast.success(t('card.buy_success'))
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyCards()
      refetch()
    },
  })

  const handleBuy = (cardId, price, cardName) => {
    if (!isLoggedIn) return;
    setBuyModal({ isOpen: true, cardId, price, cardName });
  }

  const confirmBuy = () => {
    if (buyModal.cardId) {
      buyMutation.mutate(buyModal.cardId)
    }
    setBuyModal({ isOpen: false, cardId: null, price: null, cardName: '' })
  }

  return (
    <div className="flex-col gap-4">
      <div className="px-2" style={{ marginBottom: 16 }}>
        <BackButton
          text={t('common.go_back')}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="page-header-icon">
          <BotFlashCardsIcon size={30} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('card.marketplace')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'card.marketplace_desc'
            )}
          </p>
        </div>
        <HowItWorksHelp
          title={t('card.marketplace_how_it_works_title')}
          items={[
            t(
              'card.marketplace_how_it_works_1'
            ),
            t(
              'card.marketplace_how_it_works_2'
            ),
          ]}
          closeLabel={t('common.close')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      <SearchFilterBar onSearch={setActiveParams} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
          gap: 16,
        }}
      >
        {isLoading && visibleCards.length === 0 ? (
          <div className="flex justify-center" style={{ padding: '40px 0', gridColumn: '1 / -1' }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : visibleCards.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            {hasActiveSearch ? t('search.no_results') : t('common.nothing_here_yet')}
          </div>
        ) : (
          visibleCards.map((card, index) => (
            <div
              key={`${card.personalityCardId || card.card?.personalityCardId || card.cardId || 'mc'}-${index}`}
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <PersonalityCard card={card} showMark={false} />

              {card.actor && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 8,
                    }}
                  >
                    {t('card.seller')}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, zoom: 0.75 }}>
                    <ActorMinimalCard
                      actor={card.actor}
                      showHierarchyBtn={false}
                      showMemoryMapBtn={false}
                      showPoint={false}
                      showEditBtn={false}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                }}
              >
                {/* Only show price if isListedOnMarketplace is true */}
                {card.card?.isListedOnMarketplace ? (
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {card.card?.price} AP
                  </span>
                ) : (
                  <span></span> /* Placeholder for space-between */
                )}
                <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                  {t('card.sales')}: {card.card?.ownershipCount || 0}
                </span>
              </div>

              <button
                className="btn btn-sm btn-primary w-full"
                onClick={() => handleBuy(card.cardId, card.card?.price, card.card?.cardName || card.cardName)}
                disabled={(() => {
                  if (!isLoggedIn || buyMutation.isPending || !card.card?.isListedOnMarketplace) return true
                  const cardId = card.cardId
                  if (!cardId || !myCards?.length) return false
                  return myCards.some((mc) => {
                    const mcId = typeof mc === 'string' ? mc : mc?.cardId || mc?.id
                    return mcId && mcId.toLowerCase() === cardId.toLowerCase()
                  })
                })()}
                title={
                  !isLoggedIn
                    ? t('card.login_to_buy')
                    : myCards?.some((mc) => {
                        const mcId = typeof mc === 'string' ? mc : mc?.cardId || mc?.id
                        return mcId && mcId.toLowerCase() === (card.cardId || '').toLowerCase()
                      })
                    ? t('card.already_owned')
                    : undefined
                }
              >
                <ShoppingCart size={14} style={{ marginRight: 4 }} /> {t('card.buy')}
              </button>
            </div>
          ))
        )}
      </div>

      <div ref={loadMoreRef} style={{ height: 1 }} />
      <InfiniteScrollStatus
        isFetching={isFetchingNextPage || isWaiting}
        hasNextPage={canLoadMore}
        hasItems={visibleCards.length > 0}
      />

      <ConfirmModal
        isOpen={buyModal.isOpen}
        onClose={() => setBuyModal({ isOpen: false, cardId: null, price: null, cardName: '' })}
        onConfirm={confirmBuy}
        title={t('card.buy_confirm_title')}
        description={t('card.buy_confirm_desc', {
          cardName: buyModal.cardName || t('card.card'),
          price: buyModal.price,
        })}
        warning={
          isLimitReached
            ? t('card.buy_limit_reached_warning', {
                limit: cardOwnershipLimit,
                oldestCard: t('card.oldest_card'),
              })
            : null
        }
        confirmText={t('card.confirm_buy_btn')}
        cancelText={t('common.cancel')}
        confirmVariant="primary"
        isLoading={buyMutation.isPending}
      />
    </div>
  )
}
