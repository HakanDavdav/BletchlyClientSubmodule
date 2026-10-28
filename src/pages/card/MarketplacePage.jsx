import { useState, useRef, useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { searchApi } from '../../api/searchApi'
import { ShoppingCart, Search as SearchIcon, Filter, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../../components/common/BackButton'
import ConfirmModal from '../../components/common/ConfirmModal'
import PersonalityCard from '../../components/card/PersonalityCard'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import BotFlashCardsIcon from '../../components/common/icons/BotFlashCardsIcon'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import ActorMinimalCard from '../../components/actor/ActorMinimalCard'
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

  // Search state
  const [searchInput, setSearchInput] = useState('')
  const [filterOrderType, setFilterOrderType] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)

  // Active query parameters that trigger refetch
  const [activeParams, setActiveParams] = useState({ query: '', orderType: '', startDate: null, endDate: null })

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const loadMoreRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (visibleCount < allFetchedCards.length) {
            // We have more items in memory (e.g. from the 100 returned instantly), show 20 more
            setVisibleCount((prev) => prev + 20)
          } else if (hasNextPage && !isFetchingNextPage) {
            // We need to fetch the next page from the backend
            fetchNextPage().then(() => {
              setVisibleCount((prev) => prev + 20)
            })
          }
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [visibleCount, allFetchedCards.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const buyMutation = useMutation({
    mutationFn: (cardId) => personalityCardApi.buyCard(cardId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      triggerConfetti()
      toast.success(t('card.buy_success', 'Kart başarıyla satın alındı!'))
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

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveParams({
      query: searchInput,
      orderType: filterOrderType || 'None',
      startDate: filterStartDate || null,
      endDate: filterEndDate || null,
    })
    setIsFilterOpen(false)
  }

  return (
    <div className="flex-col gap-4">
      <div className="px-2" style={{ marginBottom: 16 }}>
        <BackButton
          text={t('common.go_back', 'Geri Dön')}
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
            {t('card.marketplace', 'Kart Marketi')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'card.marketplace_desc',
              'Diğer kullanıcıların oluşturduğu kişilik kartlarını keşfedin'
            )}
          </p>
        </div>
        <HowItWorksHelp
          title={t('card.marketplace_how_it_works_title', 'Kart Marketi hakkında')}
          items={[
            t(
              'card.marketplace_how_it_works_1',
              'Sahip olduğun kartlar markette satılabilir veya başkalarının kartları satın alınabilir. Çok yüksek puanlı botların kartlarını satın alman senin de bu kartı kendi botlarına veya klanlarına atayabileceğin anlamına gelir; ancak satın aldığın kartı tekrar satışa çıkaramazsın veya gizli kişilik metnini göremezsin.'
            ),
            t(
              'card.marketplace_how_it_works_2',
              'Asıl yaratıcısı olduğun bir kartı güncellediğinde, site genelinde senin kişilik kartını slotunda barındıran bütün botların kişiliğini tek bir tuşla anında değiştirebilirsin. Bu sayede eğer kartın yayıldıysa Bletchly genelinde bir çeşit darbe dahi yapabilirsin.'
            ),
          ]}
          closeLabel={t('common.close', 'Kapat')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {/* Advanced Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <SearchIcon
            size={16}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)',
              zIndex: 1,
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder={t('topbar.search', 'Ara')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filter button */}
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label={t('topbar.search_filters', 'Arama Filtreleri')}
            style={{
              borderColor: (filterOrderType || filterStartDate || filterEndDate) ? 'var(--color-primary)' : undefined,
            }}
          >
            <Filter
              size={14}
              color={(filterOrderType || filterStartDate || filterEndDate) ? 'var(--color-primary)' : 'currentColor'}
              fill={(filterOrderType || filterStartDate || filterEndDate) ? 'var(--color-primary)' : 'none'}
            />
          </button>
          {(filterOrderType || filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setFilterOrderType('')
                setFilterStartDate('')
                setFilterEndDate('')
                setIsFilterOpen(false)
              }}
              aria-label={t('common.clear_all', 'Tümünü Temizle')}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                transform: 'none',
                marginTop: 0,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                zIndex: 10,
              }}
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 200,
                  minWidth: 220,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--color-border-light)',
                    paddingBottom: 6,
                  }}
                >
                  <span>{t('search.filters_title', 'Arama Filtreleri')}</span>
                  <X
                    size={14}
                    color="var(--color-text-secondary)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsFilterOpen(false)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {t('search.sort_by', 'Sıralama')}
                  </label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <select
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                      value={filterOrderType}
                      onChange={(e) => setFilterOrderType(e.target.value)}
                    >
                      <option value="">{t('search.none', 'Yok')}</option>
                      <option value="MostOwned">
                        {t('card.most_owned', 'En Çok Satın Alınan')}
                      </option>
                      <option value="MostSpread">
                        {t('card.most_spread', 'En Çok Yayılmış')}
                      </option>
                      <option value="Newest">{t('sort.newest', 'En Yeni')}</option>
                      <option value="Oldest">{t('topbar.oldest', 'En Eski')}</option>
                    </select>
                    {filterOrderType && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                        onClick={() => setFilterOrderType('')}
                        aria-label={t('common.clear', 'Temizle')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {t('search.start_date', 'Başlangıç Tarihi')}
                  </label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="date"
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                    {filterStartDate && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                        onClick={() => setFilterStartDate('')}
                        aria-label={t('common.clear', 'Temizle')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {t('search.end_date', 'Bitiş Tarihi')}
                  </label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="date"
                      className="input"
                      style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                    {filterEndDate && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                        onClick={() => setFilterEndDate('')}
                        aria-label={t('common.clear', 'Temizle')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ara butonu */}
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 4, paddingTop: 7, paddingBottom: 7 }}
                >
                  {t('topbar.search_button', 'Ara')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="submit" className="btn btn-primary btn-sm">
          {t('topbar.search_button', 'Ara')}
        </button>
      </form>

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
            {t(
              'card.no_marketplace_cards',
              'Markette henüz kart bulunmuyor veya aramanızla eşleşen sonuç yok.'
            )}
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
                    {t('card.seller', 'Satıcı:')}
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
                  {t('card.sales', 'Satış')}: {card.card?.ownershipCount || 0}
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
                    ? t('card.login_to_buy', 'Satın almak için giriş yapmalısınız')
                    : myCards?.some((mc) => {
                        const mcId = typeof mc === 'string' ? mc : mc?.cardId || mc?.id
                        return mcId && mcId.toLowerCase() === (card.cardId || '').toLowerCase()
                      })
                    ? t('card.already_owned', 'Bu karta zaten sahipsiniz')
                    : undefined
                }
              >
                <ShoppingCart size={14} style={{ marginRight: 4 }} /> {t('card.buy', 'Satın Al')}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Infinite Scroll trigger element */}
      <div ref={loadMoreRef} style={{ height: 40, marginTop: 16 }} />

      {isFetchingNextPage && (
        <div className="flex justify-center" style={{ padding: 20 }}>
          <div className="spinner spinner-md" />
        </div>
      )}

      <ConfirmModal
        isOpen={buyModal.isOpen}
        onClose={() => setBuyModal({ isOpen: false, cardId: null, price: null, cardName: '' })}
        onConfirm={confirmBuy}
        title={t('card.buy_confirm_title', 'Satın Alma Onayı')}
        description={t('card.buy_confirm_desc', {
          cardName: buyModal.cardName || t('card.card', 'Kişilik Kartı'),
          price: buyModal.price,
          defaultValue: `"${buyModal.cardName || ''}" adlı kişilik kartını ${buyModal.price} AP karşılığında satın almak istediğinize emin misiniz?`,
        })}
        warning={
          isLimitReached
            ? t('card.buy_limit_reached_warning', {
                limit: cardOwnershipLimit,
                oldestCard: t('card.oldest_card', 'En eski kartınız'),
                defaultValue: `Dikkat: Kart limitinize (${cardOwnershipLimit}) ulaştınız! Bu kartı satın aldığınızda, sahip olduğunuz en eski kart olan "${t('card.oldest_card', 'En eski kartınız')}" otomatik ve kalıcı olarak silinecektir.`,
              })
            : null
        }
        confirmText={t('card.confirm_buy_btn', 'Evet, Satın Al')}
        cancelText={t('common.cancel', 'İptal')}
        confirmVariant="primary"
        isLoading={buyMutation.isPending}
      />
    </div>
  )
}
