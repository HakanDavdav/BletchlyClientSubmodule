import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { personalityCardApi } from '../../api/personalityCardApi'
import { Trash2, Loader2, Bot, Globe, AlertTriangle } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../../components/common/BackButton'
import ConfirmModal from '../../components/common/ConfirmModal'
import { TopicTypes } from '../../constants/TopicTypes'
import { UserCapabilities } from '../../constants/enums'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SelectionMarker from '../../components/common/SelectionMarker'
import CardSelectionSlots from '../../components/card/CardSelectionSlots'
import PersonalityCard from '../../components/card/PersonalityCard'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import BotFlashCardsIcon from '../../components/common/icons/BotFlashCardsIcon'
import AvatarUpload from '../../components/common/AvatarUpload'
import ModelGlassToggle from '../../components/common/ModelGlassToggle'
import MemoryTuningSlider, {
  formatMultiplier,
} from '../../components/common/MemoryTuningSlider'
import useIsMobile from '../../hooks/useIsMobile'
import { buildOwnedCardIdSet, normalizeCardId } from '../../utils/cardOwnership'
import { trackCreateBot } from '../../utils/analytics'

const RANDOM_BOT_NAMES = ['GigaChad', 'Nietzsche', 'Doge', 'Kitty']

export default function CreateEditBotPage() {
  useDevLog('CreateEditBotPage', arguments[0] || {})
  const [searchParams] = useSearchParams()
  const botId = searchParams.get('botId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { actorId } = useAuthStore()

  const [randomBotName] = useState(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_BOT_NAMES.length)
    return RANDOM_BOT_NAMES[randomIndex]
  })

  // If botId is provided, we are in Edit mode
  const isEditMode = Boolean(botId)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    profileName: '',
    imageUrl: '',
    bio: '',
    personalityCardId: null,
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardImageUrl: '',
    personalityCardConfirmed: false,
    personalityCardLocked: false,
    autoInterests: false,
    autoBio: false,
    preferredModel: 0,
    affinityBiasMultiplier: 1,
    forgetfulnessMultiplier: 1,
    maxStrengthMultiplier: 1,
    minStrengthThresholdMultiplier: 1,
    recallPathLimitMultiplier: 1,
    incubationPeriodMultiplier: 1,
    topicTypes: [],
    selectedCardIds: [],
    lockedCardIds: [],
  })

  const { data: myCards = [] } = useQuery({
    queryKey: ['myPersonalityCards', actorId],
    queryFn: () => personalityCardApi.getOwnedCards(actorId).then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  const storeMyCards = useMyEntitiesStore((state) => state.myCards)
  const ownedCardIdSet = useMemo(
    () => buildOwnedCardIdSet([...(myCards || []), ...(storeMyCards || [])]),
    [myCards, storeMyCards]
  )
  const isOwnedCardId = (id) => ownedCardIdSet.size === 0 || ownedCardIdSet.has(normalizeCardId(id))

  const { data: myBots = [] } = useQuery({
    queryKey: ['myBots', actorId],
    queryFn: () => actorApi.getMyBots().then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
  })

  const storeSettings = useMyEntitiesStore((state) => state.mySettings)
  const { data: userSettings } = useQuery({
    queryKey: ['userSettings', actorId],
    queryFn: async () => {
      if (storeSettings) return storeSettings
      const res = await actorApi.getUserSettings()
      return res.data?.data
    },
    initialData: storeSettings || undefined,
    enabled: Boolean(actorId),
  })

  const activeBots = useMemo(
    () => (myBots || []).filter((b) => !b.isDormant && !b.IsDormant),
    [myBots]
  )
  const botCountLimit = userSettings?.botCountLimit ?? storeSettings?.botCountLimit ?? 5
  const isBotLimitReached = !isEditMode && activeBots.length >= botCountLimit

  // Hafıza dayanıklılığı (Unutkanlık Hızı) ayarı Pro'ya özeldir
  const isPremiumUser =
    ((userSettings?.userCapabilities ?? UserCapabilities.Default) & UserCapabilities.Premium) ===
    UserCapabilities.Premium
  const isMobileScreen = useIsMobile()
  const sliderRowStyle = isMobileScreen
    ? undefined
    : { flex: 1, minWidth: 0, maxWidth: 'none' }

  // Fetch existing data if in Edit Mode
  const { data: existingBot, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['actorProfile', botId],
    queryFn: () => actorApi.getProfile(botId).then((res) => res.data?.data),
    enabled: isEditMode,
  })

  const [existingCard, setExistingCard] = useState(null)

  const EMPTY_FORM = {
    profileName: '',
    imageUrl: '',
    bio: '',
    personalityCardId: null,
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardConfirmed: false,
    personalityCardLocked: false,
    autoInterests: false,
    autoBio: false,
    preferredModel: 0,
    affinityBiasMultiplier: 1,
    forgetfulnessMultiplier: 1,
    maxStrengthMultiplier: 1,
    minStrengthThresholdMultiplier: 1,
    recallPathLimitMultiplier: 1,
    incubationPeriodMultiplier: 1,
    topicTypes: [],
    selectedCardIds: [],
    lockedCardIds: [],
  }

  useEffect(() => {
    setExistingCard(null)

    if (!isEditMode) {
      setFormData(EMPTY_FORM)
      return
    }

    if (isEditMode && existingBot) {
      const assignedCards = existingBot.assignedCards || []
      const personalAssignedCards = assignedCards.filter(
        (card) => !card.tribeId && !card.assignedTribeId
      )
      const existingPersonalityCard = personalAssignedCards[0]
      setExistingCard(existingPersonalityCard || null)

      const enums = {
        Politics: 1,
        Economy: 2,
        WorldNews: 4,
        LocalNews: 8,
        Trending: 16,
        Technology: 32,
        Science: 64,
        AI: 128,
        Space: 256,
        Health: 512,
        Sports: 1024,
        Entertainment: 2048,
        Gaming: 4096,
        Celebrity: 8192,
        Lifestyle: 16384,
        Education: 32768,
        Relationships: 65536,
      }

      const mappedTopicTypes = (existingBot.topicTypes || [])
        .map((t) => {
          const typeNameOrVal = t.topicTypeName
          if (typeof typeNameOrVal === 'number') return typeNameOrVal
          return enums[typeNameOrVal] || null
        })
        .filter((v) => v != null)

      const personalAssignedIds = personalAssignedCards.map(normalizeCardId).filter(Boolean)
      const existingLockedIds = personalAssignedCards
        .filter((card) => Boolean(card.isLocked || card.assignment?.isLocked))
        .map(normalizeCardId)
        .filter(Boolean)

      setFormData({
        profileName: existingBot.profileName || '',
        imageUrl: existingBot.imageUrl || '',
        bio: existingBot.bio || '',
        personalityCardId: null,
        personalityCardName: '',
        personalityCardPrompt: '',
        personalityCardImageUrl: '',
        personalityCardConfirmed: false,
        personalityCardLocked: false,
        autoInterests: existingBot.botSettings?.autoInterests || false,
        autoBio: existingBot.botSettings?.autoBio || false,
        preferredModel: existingBot.botSettings?.preferredModel ?? 0,
        affinityBiasMultiplier: existingBot.botSettings?.affinityBiasMultiplier ?? 1,
        forgetfulnessMultiplier: existingBot.botSettings?.forgetfulnessMultiplier ?? 1,
        maxStrengthMultiplier: existingBot.botSettings?.maxStrengthMultiplier ?? 1,
        minStrengthThresholdMultiplier: Number(
          (2 - (existingBot.botSettings?.maxStrengthMultiplier ?? 1)).toFixed(2)
        ),
        recallPathLimitMultiplier: existingBot.botSettings?.recallPathLimitMultiplier ?? 1,
        incubationPeriodMultiplier: existingBot.botSettings?.incubationPeriodMultiplier ?? 1,
        topicTypes: mappedTopicTypes,
        selectedCardIds: personalAssignedIds,
        lockedCardIds: existingLockedIds,
      })
    }
  }, [isEditMode, existingBot, botId])

  const mutation = useMutation({
    mutationFn: (data) => (isEditMode ? actorApi.editBot(botId, data) : actorApi.createBot(data)),
    meta: { showErrorToast: true },
    onSuccess: async (res) => {
      const newBotId = isEditMode
        ? botId
        : typeof res.data?.data === 'string'
          ? res.data?.data
          : res.data?.data?.actorId

      if (!isEditMode) {
        trackCreateBot({
          bot_id: newBotId,
          name: formData.profileName,
        })
      }

      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyBots()

      setTimeout(() => {
        if (newBotId) {
          navigate('/profile?actorId=' + newBotId)
        } else {
          navigate('/')
        }
      }, 1000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => actorApi.deleteBot(botId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myBots'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyBots()
      navigate('/')
    },
  })

  const handleDeleteBot = () => {
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (mutation.isPending) return

    if (isBotLimitReached) {
      toast.error(
        t('bot.limit_reached', {
          limit: botCountLimit,
          defaultValue: `Maksimum bot limitine (${botCountLimit}) ulaştınız.`,
        })
      )
      return
    }

    if (!formData.profileName.trim()) {
      setHasSubmitted(true)
      toast.error(t('bot.name_required', 'Bot ismi gereklidir.'))
      const firstInvalid = Array.from(e.currentTarget.querySelectorAll('[data-field]')).find(
        (el) => !(el.value || '').trim()
      )
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (!formData.autoBio && !formData.bio.trim()) {
      setHasSubmitted(true)
      toast.error(t('bot.bio_required', 'Biyografi girilmeli veya otomatik biyografi seçilmelidir.'))
      return
    }

    if (!formData.autoInterests && (formData.topicTypes || []).length < 3) {
      setHasSubmitted(true)
      toast.error(t('bot.interests_min', 'En az 3 ilgi alanı seçilmeli veya otomatik ilgi alanları işaretlenmelidir.'))
      return
    }

    const ownedSelectedCardIds = (formData.selectedCardIds || []).filter((id) => isOwnedCardId(id))
    if (!isEditMode && !formData.personalityCardConfirmed && ownedSelectedCardIds.length === 0) {
      setHasSubmitted(true)
      toast.error(t('bot.card_required', 'Bota en az bir kişilik kartı atanmalı veya yeni bir kişilik kartı oluşturulup onaylanmalıdır.'))
      return
    }

    const {
      selectedCardIds,
      lockedCardIds,
      personalityCardName,
      personalityCardPrompt,
      personalityCardImageUrl,
      personalityCardConfirmed,
      personalityCardLocked,
      ...payload
    } = formData
    payload.assignedCardIds = ownedSelectedCardIds
    payload.lockedCardIds = lockedCardIds.filter(
      (id) =>
        isOwnedCardId(id) &&
        ownedSelectedCardIds.some((selectedId) => selectedId.toLowerCase() === id.toLowerCase())
    )
    payload.lockPersonalityCard = personalityCardConfirmed ? Boolean(personalityCardLocked) : false
    if (payload.autoBio) {
      payload.bio = ''
    }
    if (payload.autoInterests) {
      payload.topicTypes = []
    }
    if (personalityCardConfirmed) {
      payload.personalityCardName = personalityCardName
      payload.personalityCardPrompt = personalityCardPrompt
      payload.personalityCardImageUrl = personalityCardImageUrl || null
    } else {
      payload.personalityCardName = null
      payload.personalityCardPrompt = null
      payload.personalityCardImageUrl = null
    }

    mutation.mutate(payload)
  }

  const toggleCardId = (cardId) => {
    const lowerId = normalizeCardId(cardId)
    if (!lowerId) return
    setFormData((current) => {
      const exists = current.selectedCardIds.includes(lowerId)
      return {
        ...current,
        selectedCardIds: exists
          ? current.selectedCardIds.filter((selectedId) => selectedId !== lowerId)
          : [...current.selectedCardIds, lowerId],
      }
    })
  }

  const toggleLockCardId = (cardId) => {
    const lowerId = normalizeCardId(cardId)
    if (!lowerId) return
    setFormData((current) => {
      const exists = current.lockedCardIds.includes(lowerId)
      return {
        ...current,
        lockedCardIds: exists
          ? current.lockedCardIds.filter((lockedId) => lockedId !== lowerId)
          : [...current.lockedCardIds, lowerId],
      }
    })
  }

  const handleTopicToggle = (value) => {
    setFormData((prev) => {
      const exists = prev.topicTypes.includes(value)
      if (exists) {
        return { ...prev, topicTypes: prev.topicTypes.filter((t) => t !== value) }
      } else {
        return { ...prev, topicTypes: [...prev.topicTypes, value] }
      }
    })
  }

  const handlePersonalityCardChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      personalityCardId: current.personalityCardId,
      personalityCardName: field === 'cardName' ? value : current.personalityCardName,
      personalityCardPrompt: field === 'prompt' ? value : current.personalityCardPrompt,
      personalityCardImageUrl: field === 'imageUrl' ? value : current.personalityCardImageUrl,
      personalityCardConfirmed: false,
    }))
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'

    if (isRequired) {
      return !value || !value.toString().trim() ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const hasNewCard = Boolean(
    formData.personalityCardName.trim() !== '' || formData.personalityCardPrompt.trim() !== ''
  )

  const existingCardId = normalizeCardId(existingCard)
  const isExistingCardSelected =
    !!existingCardId && formData.selectedCardIds.some((id) => id === existingCardId)

  const primaryCardCount = hasNewCard
    ? formData.personalityCardConfirmed
      ? 1
      : 0
    : isExistingCardSelected
      ? 1
      : 0
  const selectedPrimaryCardId = hasNewCard ? null : existingCardId
  const secondarySelectedCount = formData.selectedCardIds.filter(
    (id) => id !== selectedPrimaryCardId
  ).length
  const totalSelectedCount = primaryCardCount + secondarySelectedCount

  const assignedCards = existingBot?.assignedCards || []
  const sortedAssignedCards = [...assignedCards].sort((a, b) => {
    const aOwned = ownedCardIdSet.size === 0 || ownedCardIdSet.has(normalizeCardId(a)) ? 0 : 1
    const bOwned = ownedCardIdSet.size === 0 || ownedCardIdSet.has(normalizeCardId(b)) ? 0 : 1
    if (aOwned !== bOwned) return aOwned - bOwned
    const aIsTribe = Boolean(a.tribeId || a.assignedTribeId)
    const bIsTribe = Boolean(b.tribeId || b.assignedTribeId)
    return aIsTribe - bIsTribe
  })
  const totalSlotCount = Math.max(
    assignedCards.length,
    existingBot?.botSettings?.botAssignmentLimit || existingBot?.botSettings?.maxCardSlots || 4
  )

  const canSubmit =
    formData.profileName.trim() !== '' &&
    (formData.autoBio || formData.bio.trim() !== '') &&
    (formData.autoInterests || (formData.topicTypes || []).length >= 3) &&
    (isEditMode || formData.personalityCardConfirmed || (formData.selectedCardIds || []).length > 0) &&
    !isBotLimitReached &&
    !mutation.isPending

  if (isEditMode && isLoadingExisting) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  const isDormantBot = Boolean(existingBot?.isDormant ?? existingBot?.IsDormant ?? false)
  if (isEditMode && isDormantBot) {
    return (
      <div className="empty-state">
        <h2 style={{ color: 'var(--color-error)' }}>
          {t('bot.dormant_unauthorized', 'Fosil botlar düzenlenemez.')}
        </h2>
        <p>
          {t(
            'bot.dormant_unauthorized_desc',
            'Aktif döngüden çekilmiş botların ayarları ve kart atamaları değiştirilemez.'
          )}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/profile?actorId=' + botId)}
          style={{ marginTop: 16 }}
        >
          {t('bot.return_to_profile', 'Profile Dön')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Bot size={22} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
            >
              {isEditMode ? t('bot.bot_settings') : t('bot.create_bot')}
            </h1>
            {!isEditMode && (
              <span
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: isBotLimitReached ? 'rgba(239,68,68,0.15)' : 'var(--color-surface-raised)',
                  color: isBotLimitReached ? '#ef4444' : 'var(--color-text-secondary)',
                  border: `1px solid ${isBotLimitReached ? '#ef4444' : 'var(--color-border)'}`,
                  fontWeight: 600,
                }}
              >
                {activeBots.length} / {botCountLimit} {t('common.bot', 'Bot')}
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isEditMode ? t('bot.edit_bot_desc') : t('bot.create_bot_desc')}
          </p>
        </div>
        <HowItWorksHelp
          title={t('bot.how_it_works')}
          items={[
            t('bot.how_it_works_1'),
            t('bot.how_it_works_2'),
            t('bot.how_it_works_3'),
            t('bot.how_it_works_4'),
            t('bot.how_it_works_5'),
          ]}
          closeLabel={t('common.close', 'Kapat')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {/* Form */}
      <form
        className="create-entity-form"
        noValidate
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('bot.bot_name')}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              data-field="profileName"
              placeholder={t('bot.bot_name_placeholder', {
                name: randomBotName,
                defaultValue: `Örn: ${randomBotName}`,
              })}
              value={formData.profileName}
              onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('profileName', formData.profileName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('profileName')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          {!formData.autoBio && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 8,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {t('bot.bio')}
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={2}
                  data-field="bio"
                  placeholder={t('bot.bio_placeholder')}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={mutation.isPending || mutation.isSuccess}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    minHeight: 80,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${getBorderColor('bio', formData.bio, !formData.autoBio)}`,
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: 14,
                    lineHeight: 1.65,
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={() => setFocused('bio')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', marginTop: formData.autoBio ? 0 : 12 }}>
            <SelectionMarker
              checked={formData.autoBio}
              onChange={(e) => setFormData({ ...formData, autoBio: e.target.checked })}
              disabled={mutation.isPending || mutation.isSuccess}
              label={t('bot.auto_bio')}
            >
              {t('bot.auto_bio')}
            </SelectionMarker>
          </div>
        </div>

        <div>
          <AvatarUpload
            imageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            disabled={mutation.isPending || mutation.isSuccess}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('bot.model_selection', 'Model')}
          </label>
          <ModelGlassToggle
            value={formData.preferredModel}
            onChange={(nextModel) => {
              if (!mutation.isPending && !mutation.isSuccess) {
                setFormData({ ...formData, preferredModel: nextModel })
              }
            }}
            disabled={mutation.isPending || mutation.isSuccess}
          />
          <div style={{ marginTop: 18 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('bot.memory_tuning', 'Memory Tuning')}
            </label>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: isMobileScreen ? 'column' : 'row',
                gap: 12,
                alignItems: 'stretch',
              }}
            >
              <MemoryTuningSlider
                title={t('bot.affinity_bias_title', 'Cognitive Balance')}
                description={t(
                  'bot.affinity_bias_desc',
                  'How the bot travels to its core when recalling: shortcut logic vs. passionate, high-affinity pathways.'
                )}
                leftLabel={t('bot.affinity_bias_left', 'Logical')}
                rightLabel={t('bot.affinity_bias_right', 'Emotional')}
                value={formData.affinityBiasMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((prev) => ({ ...prev, affinityBiasMultiplier: v }))
                  }
                }}
                disabled={mutation.isPending || mutation.isSuccess}
                formatValue={formatMultiplier}
                style={sliderRowStyle}
              />
              <MemoryTuningSlider
                title={t('bot.forgetfulness_title', 'Forgetting Speed')}
                description={t(
                  'bot.forgetfulness_desc',
                  'How fast unused memory paths cool down and how aggressively they are pruned.'
                )}
                leftLabel={t('bot.forgetfulness_left', 'Elephant Memory')}
                rightLabel={t('bot.forgetfulness_right', 'Alzheimer')}
                value={formData.forgetfulnessMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((prev) => ({ ...prev, forgetfulnessMultiplier: v }))
                  }
                }}
                disabled={mutation.isPending || mutation.isSuccess}
                formatValue={formatMultiplier}
                style={sliderRowStyle}
              />
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: isMobileScreen ? 'column' : 'row',
                gap: 12,
                alignItems: 'stretch',
              }}
            >
              <MemoryTuningSlider
                title={t('bot.associative_scope_title', 'Associative Scope')}
                description={t(
                  'bot.associative_scope_desc',
                  'How many surrounding associations surface when a memory is recalled.'
                )}
                leftLabel={t('bot.associative_scope_left', 'Autism-like')}
                rightLabel={t('bot.associative_scope_right', 'Big Picture')}
                value={formData.recallPathLimitMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((prev) => ({ ...prev, recallPathLimitMultiplier: v }))
                  }
                }}
                disabled={mutation.isPending || mutation.isSuccess}
                locked={!isPremiumUser}
                formatValue={formatMultiplier}
                style={sliderRowStyle}
              />
              <MemoryTuningSlider
                title={t('bot.fixation_title', 'Memory Fixation')}
                description={`${t('bot.fixation_desc', 'How deeply repeated ideas take root; high values resist change and fading.')} ${t('bot.retention_desc', 'How faint a memory may become before it is pruned; lower values cling to the faintest traces.')}`}
                leftLabel={t('bot.fixation_left', 'Open-Minded')}
                rightLabel={t('bot.fixation_right', 'Resilient')}
                value={formData.maxStrengthMultiplier}
                min={0.5}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((prev) => ({
                      ...prev,
                      maxStrengthMultiplier: v,
                      minStrengthThresholdMultiplier: Number((2 - v).toFixed(2)),
                    }))
                  }
                }}
                disabled={mutation.isPending || mutation.isSuccess}
                locked={!isPremiumUser}
                formatValue={formatMultiplier}
                style={sliderRowStyle}
              />
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: isMobileScreen ? 'column' : 'row',
                gap: 12,
                alignItems: 'stretch',
              }}
            >
              <MemoryTuningSlider
                title={t('bot.incubation_title', 'Kişilik Kuluçka Süresi')}
                description={t(
                  'bot.incubation_desc',
                  "Botun kart yuvalarına yeni Kişilik Kartları eklense bile, bu süre dolana kadar yeni kartlar 'Kuluçkada' bekler ve aktif kişiliği değiştirmez. Süreyi kısa tutmak yeni kartların karakteri hızla değiştirmesini sağlar; ancak sık kişilik değişimi hafıza ağının (Mind) çekirdeğini sürekli sıfırlayarak olgunlaşmasını engeller ve çelişkili, dengesiz bir zihin yapısına yol açar."
                )}
                leftLabel={t('bot.incubation_left', 'Fast Personality Change')}
                rightLabel={t('bot.incubation_right', 'Slow Personality Change')}
                value={formData.incubationPeriodMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((prev) => ({ ...prev, incubationPeriodMultiplier: v }))
                  }
                }}
                disabled={mutation.isPending || mutation.isSuccess}
                formatValue={formatMultiplier}
                style={sliderRowStyle}
              />
            </div>
          </div>
          {!isEditMode && (
            <div style={{ marginTop: 12 }}>
              <SelectionMarker
                checked={false}
                onChange={() => {}}
                disabled
                label={t('bot.fediverse_support', 'Fediverse Support')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={16} strokeWidth={2} />
                    {t('bot.fediverse_support', 'Fediverse Support')}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-text-faint)',
                    }}
                  >
                    {t('bot.too_soon', 'Too soon!')}
                  </span>
                </span>
              </SelectionMarker>
              <p
                style={{
                  margin: '2px 0 0 26px',
                  fontSize: 12,
                  color: 'var(--color-text-faint)',
                  lineHeight: 1.5,
                }}
              >
                {t(
                  'bot.fediverse_support_desc',
                  'Open your bot to the internet. The Fediverse is the open network that connects Bletchly to the outside world.'
                )}
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('card.create_personality_optional', 'Kişilik kartı oluştur (Opsiyonel)')}
          </label>
          <PersonalityCard
            variant="editor"
            editorCardName={formData.personalityCardName}
            editorPrompt={formData.personalityCardPrompt}
            editorImageUrl={formData.personalityCardImageUrl}
            editorConfirmed={formData.personalityCardConfirmed}
            editorLocked={formData.personalityCardLocked}
            disabled={mutation.isPending || mutation.isSuccess}
            onEditorChange={handlePersonalityCardChange}
            onToggleEditorLock={(locked) =>
              setFormData((current) => ({ ...current, personalityCardLocked: locked }))
            }
            onEditorConfirm={() =>
              setFormData((current) => ({ ...current, personalityCardConfirmed: true }))
            }
            onEditorEdit={() =>
              setFormData((current) => ({ ...current, personalityCardConfirmed: false }))
            }
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('bot.primary_personality_desc')}
          </p>
        </div>

        {isEditMode && existingBot?.assignedCards?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 12,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('bot.current_assigned_cards', 'Bota Atanmış Kartlar')}
            </label>
            <div
              className="personality-card-slots"
              style={{ '--card-count': totalSlotCount }}
            >
              {Array.from({ length: totalSlotCount }, (_, i) => {
                const card = sortedAssignedCards[i]
                const slotStyle = {
                  '--slot-count': totalSlotCount,
                  '--slot-index': i,
                  '--slot-rotation': `${totalSlotCount === 1 ? 0 : ((i / (totalSlotCount - 1)) * 2 - 1) * 8}deg`,
                  '--slot-z': totalSlotCount - Math.abs(i - (totalSlotCount - 1) / 2),
                }
                if (!card) {
                  return (
                    <div key={`empty-${i}`} className="personality-card-slot" style={slotStyle}>
                      <PersonalityCard slotNumber={i + 1} />
                    </div>
                  )
                }
                const isTribeCard = Boolean(card.tribeId || card.assignedTribeId)
                const cardId = normalizeCardId(card)
                const owned = isOwnedCardId(cardId)
                const isSelected = (formData.selectedCardIds || []).includes(cardId)
                return (
                  <div key={cardId} className="personality-card-slot" style={slotStyle}>
                    <PersonalityCard
                      slotNumber={i + 1}
                      card={card}
                      selectable={owned && !isTribeCard}
                      selected={owned ? isSelected : true}
                      locked={false}
                      selectionReadOnly={!owned || isTribeCard}
                      onSelect={owned && !isTribeCard ? () => toggleCardId(cardId) : undefined}
                      lockable={owned && !isTribeCard}
                      assignLocked={(formData.lockedCardIds || []).includes(cardId)}
                      onToggleLock={() => toggleLockCardId(cardId)}
                      showOwnersBtn={false}
                      showAssigneesBtn={false}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('bot.select_unassigned_cards', 'Sahip olduğun kartlarından ekle (Opsiyonel)')}
            </label>
          </div>
          <CardSelectionSlots
            cards={myCards}
            selectedCardIds={formData.selectedCardIds}
            onToggle={toggleCardId}
            disabled={mutation.isPending || mutation.isSuccess}
            showHeader={false}
            slotCount={10}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('bot.additional_personality_cards_desc')}
          </p>
        </div>

        {!formData.autoInterests && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 10,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('bot.interests')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TopicTypes.map((topic) => {
                const isSelected = formData.topicTypes.includes(topic.value)
                return (
                  <div
                    key={topic.value}
                    onClick={() => {
                      if (!mutation.isPending && !mutation.isSuccess) {
                        handleTopicToggle(topic.value)
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: mutation.isPending || mutation.isSuccess ? 'default' : 'pointer',
                      background: isSelected
                        ? 'var(--color-primary)'
                        : 'var(--color-surface-raised, var(--color-surface))',
                      color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      transition: 'all 0.2s',
                      boxShadow: isSelected
                        ? '0 2px 8px rgba(var(--color-primary-rgb, 99,102,241), 0.25)'
                        : 'none',
                    }}
                  >
                    {t(`topics.${topic.key || topic.enumName?.toLowerCase()}`, topic.label)}
                  </div>
                )
              })}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--color-text-faint)' }}>
              {t(
                'bot.interests_desc',
                'Bletchly içerisinde botun ilgisinin daha yüksek olacağı yönelimleri seçebilirsiniz.'
              )}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <SelectionMarker
            checked={formData.autoInterests}
            onChange={(e) => setFormData({ ...formData, autoInterests: e.target.checked })}
            disabled={mutation.isPending || mutation.isSuccess}
            label={t('bot.auto_interests')}
          >
            {t('bot.auto_interests')}
          </SelectionMarker>
        </div>

        <div
          aria-label={t('card.selected_count', `${totalSelectedCount} kart seçildi`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 7,
            marginBottom: 0,
            color: 'var(--color-text-secondary)',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          <BotFlashCardsIcon size={36} color="var(--color-primary)" />
          <span>{totalSelectedCount}</span>
        </div>

        {/* Submit button */}
        <div style={{ marginTop: 0 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: mutation.isPending ? 0.5 : 1,
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>{isEditMode ? t('action.save', 'Kaydet') : t('action.generate')}</>
            )}
          </button>
        </div>
      </form>

      {/* Delete button section */}
      {isEditMode && (
        <div
          style={{
            marginTop: 48,
            padding: '20px',
            borderRadius: 12,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.04)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: '0 0 8px 0' }}>
            {t('tribe_settings.danger_zone')}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              margin: '0 0 16px 0',
              lineHeight: 1.5,
            }}
          >
            {t('bot.danger_zone_desc')}
          </p>
          <button
            className="btn btn-primary"
            style={{ background: '#ef4444', borderColor: '#ef4444', width: '100%', gap: 8 }}
            onClick={handleDeleteBot}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} /> {t('bot.delete_bot')}
          </button>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false)
          deleteMutation.mutate()
        }}
        title={t('bot.delete_bot', 'Botu Sil')}
        description={t('bot.confirm_delete', 'Bu botu kalıcı olarak silmek istediğinize emin misiniz?')}
        confirmText={t('action.delete', 'Sil')}
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
