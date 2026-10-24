import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import { personalityCardApi } from '../../api/personalityCardApi'
import { actorApi } from '../../api/actorApi'
import { useNavigate } from 'react-router-dom'
import { Users, Loader2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../../components/common/BackButton'
import CardSelectionSlots from '../../components/card/CardSelectionSlots'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SelectionMarker from '../../components/common/SelectionMarker'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import BotFlashCardsIcon from '../../components/common/icons/BotFlashCardsIcon'
import PersonalityCard from '../../components/card/PersonalityCard'
import AvatarUpload from '../../components/common/AvatarUpload'
import ModelGlassToggle from '../../components/common/ModelGlassToggle'
import MemoryTuningSlider, {
  formatMultiplier,
} from '../../components/common/MemoryTuningSlider'
import useIsMobile from '../../hooks/useIsMobile'
import { normalizeCardId } from '../../utils/cardOwnership'
import { TopicTypes } from '../../constants/TopicTypes'
import { UserCapabilities } from '../../constants/enums'

const RANDOM_TRIBE_NAMES = ['Comrades', 'Femboys', 'LGBT', 'Incels', 'Doomers']

export default function CreateTribePage() {
  useDevLog('CreateTribePage', arguments[0] || {})
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { actorId } = useAuthStore()

  const [randomTribeName] = useState(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_TRIBE_NAMES.length)
    return RANDOM_TRIBE_NAMES[randomIndex]
  })

  const [selectedCardIds, setSelectedCardIds] = useState([])

  const { data: myCards = [] } = useQuery({
    queryKey: ['myPersonalityCards', actorId],
    queryFn: () => personalityCardApi.getOwnedCards(actorId).then((res) => res.data?.data || []),
    enabled: Boolean(actorId),
    meta: { showErrorToast: true },
  })

  const storeMyTribes = useMyEntitiesStore((state) => state.myTribes)
  const { data: myTribes = storeMyTribes } = useQuery({
    queryKey: ['myTribes', actorId],
    queryFn: () => tribeApi.getMyTribes().then((res) => res.data?.data || []),
    initialData: storeMyTribes.length > 0 ? storeMyTribes : undefined,
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

  const activeTribes = useMemo(
    () => (myTribes || []).filter((t) => !t.isDormant && !t.IsDormant),
    [myTribes]
  )
  const tribeCountLimit = userSettings?.tribeCountLimit ?? storeSettings?.tribeCountLimit ?? 3
  const isTribeLimitReached = activeTribes.length >= tribeCountLimit

  // Hafıza dayanıklılığı (Unutkanlık Hızı) ayarı Pro'ya özeldir
  const isPremiumUser =
    ((userSettings?.userCapabilities ?? UserCapabilities.Default) & UserCapabilities.Premium) ===
    UserCapabilities.Premium
  const isMobileScreen = useIsMobile()
  const sliderRowStyle = isMobileScreen
    ? undefined
    : { flex: 1, minWidth: 0, maxWidth: 'none' }

  const [formData, setFormData] = useState({
    tribeName: '',
    imageUrl: '',
    mission: '',
    preferredModel: 0,
    affinityBiasMultiplier: 1,
    forgetfulnessMultiplier: 1,
    maxStrengthMultiplier: 1,
    minStrengthThresholdMultiplier: 1,
    recallPathLimitMultiplier: 1,
    incubationPeriodMultiplier: 1,
    topicTypes: [],
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardImageUrl: '',
    personalityCardConfirmed: false,
    personalityCardLocked: false,
  })

  const mutation = useMutation({
    mutationFn: (data) => tribeApi.createTribe(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myTribes'] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      useMyEntitiesStore.getState().fetchMyTribes()
      setTimeout(() => {
        const newTribeId =
          typeof res.data?.data === 'string'
            ? res.data?.data
            : res.data?.data?.tribeId || res.data?.data?.id
        if (newTribeId) {
          navigate('/tribe?tribeId=' + newTribeId)
        } else {
          navigate('/')
        }
      }, 1000)
    },
  })

  const hasAtLeastOneCard =
    formData.personalityCardConfirmed || selectedCardIds.length > 0

  const canSubmit =
    formData.tribeName.trim() !== '' &&
    formData.mission.trim() !== '' &&
    (formData.topicTypes || []).length >= 3 &&
    hasAtLeastOneCard &&
    !isTribeLimitReached &&
    !mutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()

    if (mutation.isPending) return

    if (isTribeLimitReached) {
      toast.error(
        t('tribe.limit_reached', {
          limit: tribeCountLimit,
          defaultValue: `Maksimum klan limitine (${tribeCountLimit}) ulaştınız.`,
        })
      )
      return
    }

    if (!canSubmit) {
      setHasSubmitted(true)
      if (!formData.tribeName.trim()) {
        toast.error(t('tribe_settings.name_required', 'Klan adı gereklidir.'))
      } else if (!formData.mission.trim()) {
        toast.error(t('tribe_settings.mission_required', 'Klan misyonu gereklidir.'))
      } else if ((formData.topicTypes || []).length < 3) {
        toast.error(
          t('tribe.interests_min', 'En az 3 ilgi alanı seçilmelidir.')
        )
      } else if (!hasAtLeastOneCard) {
        toast.error(
          t('tribe_settings.card_required', 'En az bir kişilik kartı onaylanmalı veya seçilmelidir.')
        )
      }
      const firstInvalid = Array.from(e.currentTarget.querySelectorAll('[data-field]')).find(
        (el) => !(el.value || '').trim()
      )
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const {
      personalityCardName,
      personalityCardPrompt,
      personalityCardImageUrl,
      personalityCardConfirmed,
      personalityCardLocked,
      ...payload
    } = formData
    mutation.mutate({
      ...payload,
      assignedCardIds: selectedCardIds,
      personalityCardName: personalityCardConfirmed ? personalityCardName : null,
      personalityCardPrompt: personalityCardConfirmed ? personalityCardPrompt : null,
      personalityCardImageUrl: personalityCardConfirmed ? personalityCardImageUrl : null,
      lockPersonalityCard: personalityCardConfirmed ? Boolean(personalityCardLocked) : false,
    })
  }

  const toggleCard = (cardId) => {
    const lowerId = normalizeCardId(cardId)
    if (!lowerId) return
    setSelectedCardIds((current) =>
      current.includes(lowerId)
        ? current.filter((selectedId) => selectedId !== lowerId)
        : [...current, lowerId]
    )
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
          <Users size={22} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
            >
              {t('tribe_settings.create_tribe')}
            </h1>
            <span
              style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 12,
                background: isTribeLimitReached ? 'rgba(239,68,68,0.15)' : 'var(--color-surface-raised)',
                color: isTribeLimitReached ? '#ef4444' : 'var(--color-text-secondary)',
                border: `1px solid ${isTribeLimitReached ? '#ef4444' : 'var(--color-border)'}`,
                fontWeight: 600,
              }}
            >
              {activeTribes.length} / {tribeCountLimit} {t('common.tribe', 'Klan')}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('tribe_settings.create_tribe_desc')}
          </p>
        </div>
        <HowItWorksHelp
          title={t('tribe.how_it_works')}
          items={[
            t('tribe.how_it_works_1'),
            t('tribe.how_it_works_2'),
            t('tribe.how_it_works_3'),
            t('tribe.how_it_works_4'),
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
            {t('tribe_settings.tribe_name')}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              data-field="tribeName"
              placeholder={t('tribe_settings.tribe_name_placeholder', {
                name: randomTribeName,
                defaultValue: `Örn: ${randomTribeName}`,
              })}
              value={formData.tribeName}
              onChange={(e) => setFormData({ ...formData, tribeName: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('tribeName', formData.tribeName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('tribeName')}
              onBlur={() => setFocused(null)}
            />
          </div>
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
            {t('tribe_settings.mission')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              data-field="mission"
              placeholder={t('tribe_settings.mission_placeholder')}
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 100,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('mission', formData.mission, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('mission')}
              onBlur={() => setFocused(null)}
            />
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
            {t('tribe_settings.primary_personality_desc')}
          </p>
        </div>


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
              {t('card.select_existing_cards', 'Mevcut kartlardan seçip ekle (Opsiyonel)')}
            </label>
          </div>
          <CardSelectionSlots
            cards={myCards}
            selectedCardIds={selectedCardIds}
            onToggle={toggleCard}
            disabled={mutation.isPending || mutation.isSuccess}
            showHeader={false}
            slotCount={10}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('tribe_settings.additional_personality_cards_desc')}
          </p>
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
            disabled={mutation.isPending || mutation.isSuccess}
            onChange={(nextModel) => setFormData((current) => ({ ...current, preferredModel: nextModel }))}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('tribe_settings.model_selection_desc', 'Klan hafızası ve kişilik işlemlerinde kullanılır.')}
          </p>
          <div style={{ marginTop: 18 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t('tribe.memory_tuning', 'Memory Tuning')}
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
                title={t('tribe.incubation_title', 'Kişilik Değişim Süresi')}
                description={t(
                  'tribe.incubation_desc',
                  'Yeni eklenen Kişilik Kartlarının klanın ortak karakterini değiştirmeden önce ne kadar süre bekleyeceğini belirler. Süre dolduğunda bekleyen kartlar etkinleşerek mevcut kart setinden doğrudan yeni bir ortak kişilik oluşturulur ve Hafıza Ağı bu yeni karaktere uyum sağlayacak şekilde güncellenir. Süreyi kısa tutmak yeni kartları hızla devreye sokar; ancak sık değişim anıların daha dengesiz ve çelişkili bir yapıya bürünmesine neden olarak ortak karakterin oturmasını zorlaştırır.'
                )}
                leftLabel={t('tribe.incubation_left', 'Fast Personality Change')}
                rightLabel={t('tribe.incubation_right', 'Slow Personality Change')}
                emblemField="incubationPeriodMultiplier"
                value={formData.incubationPeriodMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((current) => ({ ...current, incubationPeriodMultiplier: v }))
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
                title={t('tribe.affinity_bias_title', 'Emotionality')}
                description={t(
                  'tribe.affinity_bias_desc',
                  'Determines how the tribe links its past Memories to its Core character. Closer to Logical, it follows the shortest and most direct connections between memories. Closer to Emotional, even if the path is longer, it travels through the memories that left the strongest impression and reinforces them further.'
                )}
                leftLabel={t('tribe.affinity_bias_left', 'Logical')}
                rightLabel={t('tribe.affinity_bias_right', 'Emotional')}
                emblemField="affinityBiasMultiplier"
                value={formData.affinityBiasMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((current) => ({ ...current, affinityBiasMultiplier: v }))
                  }
                }}
                disabled={mutation.isPending || mutation.isSuccess}
                formatValue={formatMultiplier}
                style={sliderRowStyle}
              />
              <MemoryTuningSlider
                title={t('tribe.forgetfulness_title', 'Forgetting Speed')}
                description={t(
                  'tribe.forgetfulness_desc',
                  'Determines how quickly unvisited Memories fade over time and how frequently they are cleared from the Memory Network. Towards Elephant Memory, the tribe retains even its oldest experiences for a long time; towards Alzheimer, it quickly forgets unused old memories and focuses only on recent events.'
                )}
                leftLabel={t('tribe.forgetfulness_left', 'Elephant Memory')}
                rightLabel={t('tribe.forgetfulness_right', 'Alzheimer')}
                emblemField="forgetfulnessMultiplier"
                value={formData.forgetfulnessMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((current) => ({ ...current, forgetfulnessMultiplier: v }))
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
                title={t('tribe.associative_scope_title', 'Recall Scope')}
                description={t(
                  'tribe.associative_scope_desc',
                  'Determines how many related side memories and relationships are recalled together when a Memory is triggered. At the Autism-like end, the tribe focuses solely on the immediate topic and leaves out side details. At the Big Picture end, it brings many surrounding connections into focus at once, forming broad links across different topics.'
                )}
                leftLabel={t('tribe.associative_scope_left', 'Autism-like')}
                rightLabel={t('tribe.associative_scope_right', 'Big Picture')}
                emblemField="recallPathLimitMultiplier"
                value={formData.recallPathLimitMultiplier}
                min={0}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((current) => ({ ...current, recallPathLimitMultiplier: v }))
                  }
                }}
                disabled={mutation.isPending || mutation.isSuccess}
                locked={!isPremiumUser}
                formatValue={formatMultiplier}
                style={sliderRowStyle}
              />
              <MemoryTuningSlider
                title={t('tribe.fixation_title', 'Idea Fixation')}
                description={t(
                  'tribe.fixation_desc',
                  'Determines how strongly repeated ideas can solidify in the Memory Network and how easily fading memories are cleared. At the Open-Minded end, no idea becomes overly rigid and fading memories are easily cleared, allowing the tribe to adapt quickly to new ideas. At the Resilient end, repeated thoughts take deep root and even the faintest memories resist being forgotten.'
                )}
                leftLabel={t('tribe.fixation_left', 'Open-Minded')}
                rightLabel={t('tribe.fixation_right', 'Resilient')}
                emblemField="maxStrengthMultiplier"
                value={formData.maxStrengthMultiplier}
                min={0.5}
                max={2}
                onChange={(v) => {
                  if (!mutation.isPending && !mutation.isSuccess) {
                    setFormData((current) => ({
                      ...current,
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
          </div>
        </div>

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
            {t('tribe.interests', 'Alanlar')}
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
              'tribe.interests_desc',
              'Klanın odaklanacağı alanları seçebilirsiniz.'
            )}
          </p>
        </div>

        <div
          aria-label={`${selectedCardIds.length + (formData.personalityCardConfirmed ? 1 : 0)} ${t('card.selected_count', 'kart seçildi')}`}
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
          <span>{selectedCardIds.length + (formData.personalityCardConfirmed ? 1 : 0)}</span>
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
              <>{t('action.create')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
