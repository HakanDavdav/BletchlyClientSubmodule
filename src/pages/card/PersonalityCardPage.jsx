import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { actorApi } from '../../api/actorApi'
import { Plus, HelpCircle, X, Check, Save } from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import { PageTopDockRow } from '../../components/layout/PageTopDock'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import CardSlots from '../../components/card/CardSlots'
import BotFlashCardsIcon from '../../components/common/icons/BotFlashCardsIcon'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import PersonalityCard from '../../components/card/PersonalityCard'
import CardEditComponent from '../../components/card/CardEditComponent'

export default function PersonalityCardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { actorId } = useAuthStore()

  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const lastHandledKeyRef = useRef(null)
  const [formData, setFormData] = useState({
    cardName: '',
    personalityPrompt: '',
    mentions: [],
    imageUrl: '',
    tags: [],
    personalityCardConfirmed: false,
  })

  const { data: myCards = [], isLoading: isCardsLoading } = useQuery({
    queryKey: ['myPersonalityCards', actorId],
    queryFn: () => personalityCardApi.getOwnedCards(actorId).then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  const { data: userProfile } = useQuery({
    queryKey: ['actor', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((res) => res.data?.data),
    enabled: Boolean(actorId),
  })

  const storeSettings = useMyEntitiesStore((state) => state.mySettings)
  const cardOwnershipLimit =
    userProfile?.userSettings?.cardOwnershipLimit ||
    storeSettings?.cardOwnershipLimit ||
    10
  const isCardLimitReached = myCards.length >= cardOwnershipLimit

  const { data: myBots = [], isLoading: isBotsLoading } = useQuery({
    queryKey: ['myBots', actorId],
    queryFn: () => actorApi.getMyBots().then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  const targetEditCardId = location.state?.editCardId || searchParams.get('editCardId')
  const passedCard = location.state?.editCard || null

  useEffect(() => {
    if (!targetEditCardId && !passedCard) return
    if (lastHandledKeyRef.current === location.key) return

    if (myCards.length > 0 && targetEditCardId) {
      const match = myCards.find((c) => {
        const id =
          c?.personalityCardId ||
          c?.cardId ||
          c?.card?.personalityCardId ||
          c?.card?.cardId ||
          c?.ownership?.originalCard?.personalityCardId
        return id && String(id).toLowerCase() === String(targetEditCardId).toLowerCase()
      })
      if (match) {
        lastHandledKeyRef.current = location.key
        setIsCreating(false)
        setEditingCard(match)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    if (!isCardsLoading && passedCard) {
      lastHandledKeyRef.current = location.key
      setIsCreating(false)
      setEditingCard(passedCard)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [targetEditCardId, passedCard, myCards, isCardsLoading, location.key])

  const createMutation = useMutation({
    mutationFn: (data) => personalityCardApi.createCard(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyCards()
      setIsCreating(false)
      setFormData({
        cardName: '',
        personalityPrompt: '',
        mentions: [],
        imageUrl: '',
        tags: [],
        personalityCardConfirmed: false,
      })
    },
  })

  const handlePersonalityCardChange = (field, value, mentions) => {
    setFormData((current) => ({
      ...current,
      cardName: field === 'cardName' ? value : current.cardName,
      personalityPrompt: field === 'prompt' ? value : current.personalityPrompt,
      mentions: field === 'prompt' ? mentions ?? [] : current.mentions,
      imageUrl: field === 'imageUrl' ? value : current.imageUrl,
      personalityCardConfirmed: false,
    }))
  }

  const handlePersonalityCardConfirm = () => {
    if (
      createMutation.isPending ||
      !formData.cardName.trim() ||
      !formData.personalityPrompt.trim()
    ) {
      return
    }

    setFormData((current) => ({ ...current, personalityCardConfirmed: true }))
    const { personalityCardConfirmed, ...payload } = formData
    createMutation.mutate(payload)
  }

  const handleStartEdit = (card) => {
    if (!card) return
    setIsCreating(false)
    setEditingCard(card)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isCardsLoading || isBotsLoading) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  return (
    <div className="flex-col gap-4">
      <PageTopDockRow
        left={
          <BackButton
            text={t('common.go_back')}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 0 }}
          />
        }
        right={
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              if (isCreating) {
                setIsCreating(false)
              } else {
                setEditingCard(null)
                setIsCreating(true)
              }
            }}
            style={{ borderRadius: 20, padding: '6px 14px' }}
          >
            {isCreating ? (
              t('common.cancel')
            ) : (
              <>
                <Plus size={16} /> {t('card.create_new')}
              </>
            )}
          </button>
        }
        style={{ marginBottom: 16 }}
      />

      <div className="card-page-header page-header-row page-header-row--lg">
        <div className="page-header-icon page-header-icon--card">
          <BotFlashCardsIcon size={30} color="#fff" />
        </div>
        <div className="page-header-body">
          <div className="page-header-title-row">
            <h1 className="page-header-title">{t('card.my_cards')}</h1>
            <span className="page-header-quota-pill">
              {myCards.length} / {cardOwnershipLimit}
            </span>
          </div>
          <p className="page-header-subtitle">{t('card.my_cards_desc')}</p>
        </div>
        <HowItWorksHelp
          title={t('card.how_it_works_title')}
          items={[
            t(
              'card.how_it_works_1'
            ),
            t(
              'card.how_it_works_2'
            ),
            t(
              'card.how_it_works_3'
            ),
            t(
              'card.how_it_works_4'
            ),
          ]}
          closeLabel={t('common.close')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {/* Card Creation Block */}
      {isCreating && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div>
            <PersonalityCard
              variant="editor"
              editorCardName={formData.cardName}
              editorPrompt={formData.personalityPrompt}
              editorImageUrl={formData.imageUrl}
              editorConfirmed={formData.personalityCardConfirmed}
              disabled={createMutation.isPending}
              onEditorChange={handlePersonalityCardChange}
              onEditorConfirm={handlePersonalityCardConfirm}
              onEditorEdit={() =>
                setFormData((current) => ({ ...current, personalityCardConfirmed: false }))
              }
            />
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
              {t('card.how_it_works_1')}
            </p>
          </div>
        </div>
      )}

      {/* Comprehensive Card Editing Block */}
      {editingCard && (
        <CardEditComponent
          card={editingCard}
          myBots={myBots}
          onClose={() => setEditingCard(null)}
          onSaved={() => setEditingCard(null)}
        />
      )}

      {/* Slots Section */}
      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 className="section-divider-title">
            {t('card.ownership_slots')} ({myCards.length} / {cardOwnershipLimit} {t('card.slots_label')})
          </h3>
          <CardSlots
            cards={myCards}
            slotCount={cardOwnershipLimit}
            showMark={false}
            onEditClick={handleStartEdit}
          />
        </div>
      </div>
    </div>
  )
}

