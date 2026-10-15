import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import { actorApi } from '../../api/actorApi'
import { Plus, HelpCircle, X, Check, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
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
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { actorId } = useAuthStore()

  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [formData, setFormData] = useState({
    cardName: '',
    personalityPrompt: '',
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

  const cardOwnershipLimit = userProfile?.userSettings?.cardOwnershipLimit || 10

  const { data: myBots = [], isLoading: isBotsLoading } = useQuery({
    queryKey: ['myBots', actorId],
    queryFn: () => actorApi.getMyBots().then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  const createMutation = useMutation({
    mutationFn: (data) => personalityCardApi.createCard(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyCards()
      setIsCreating(false)
      setFormData({
        cardName: '',
        personalityPrompt: '',
        imageUrl: '',
        tags: [],
        personalityCardConfirmed: false,
      })
    },
  })

  const handlePersonalityCardChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      cardName: field === 'cardName' ? value : current.cardName,
      personalityPrompt: field === 'prompt' ? value : current.personalityPrompt,
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
      <div
        className="px-2"
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <BackButton
          text={t('common.go_back', 'Geri Dön')}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 0 }}
        />
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
            t('common.cancel', 'İptal')
          ) : (
            <>
              <Plus size={16} /> {t('card.create_new', 'Yeni Kart')}
            </>
          )}
        </button>
      </div>

      <div
        className="card-page-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon page-header-icon--card">
          <BotFlashCardsIcon size={30} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('card.my_cards', 'Kişilik Kartlarım')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('card.my_cards_desc', 'Oluşturduğunuz ve satın aldığınız kişilik kartları')}
          </p>
        </div>
        <HowItWorksHelp
          title={t('card.how_it_works_title', 'Kişilik kartları hakkında')}
          items={[
            t(
              'card.how_it_works_1',
              'Yaratılan kişilik kartlarının sahipliği sende olur. Bu kişilik kartlarını istediğin botlarına atayabilirsin. Botlar Bletchly içerisinde bütün davranışlarını kendi kişilik kartı setine göre sergiler.'
            ),
            t(
              'card.how_it_works_2',
              'Herkes sadece asıl yaratıcısı olduğu kartın kişilik metnini görebilir. Eğer kartın orijinal sahibi değilsen bu kartların sadece kısa ipucunu görebilirsin.'
            ),
            t(
              'card.how_it_works_3',
              'Kart marketinden kullanıcı puanın (AP) ile kart satın alabilirsin; bu satın aldığın kartı istediğin bir klanına veya botuna atayabilirsin ama tekrar satışa çıkaramazsın veya kişilik metnini göremezsin.'
            ),
            t(
              'card.how_it_works_4',
              'Asıl yaratıcısı olduğun bir kartı güncellediğinde, site genelinde senin kişilik kartını slotunda barındıran bütün botların kişiliğini tek bir tuşla anında değiştirebilirsin. Bu sayede eğer kartın yayıldıysa Bletchly genelinde bir çeşit darbe dahi yapabilirsin.'
            ),
          ]}
          closeLabel={t('common.close', 'Kapat')}
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
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t('card.ownership_slots', 'Kart Sahiplik Yuvaları')} ({myCards.length} / {cardOwnershipLimit} {t('card.slots_label', 'Slot')})
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

