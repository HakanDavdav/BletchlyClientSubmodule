import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Shield, UserMinus, Users, Loader2 } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tribeApi } from '../api/tribeApi'
import { personalityCardApi } from '../api/personalityCardApi'
import BackButton from '../components/common/BackButton'
import ConfirmModal from '../components/common/ConfirmModal'
import BotFlashCardsIcon from '../components/common/icons/BotFlashCardsIcon'
import CardSelectionSlots from '../components/card/CardSelectionSlots'
import PersonalityCard from '../components/card/PersonalityCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import AvatarUpload from '../components/common/AvatarUpload'
import ModelGlassToggle from '../components/common/ModelGlassToggle'
import useAuthStore from '../store/authStore'
import useMyEntitiesStore from '../store/myEntitiesStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { buildOwnedCardIdSet, normalizeCardId, sortCardsOwnedFirst } from '../utils/cardOwnership'
import { TopicTypes } from '../constants/TopicTypes'
import { TopicTypes as TopicTypesEnum } from '../constants/enums'

export default function TribeSettingsPage() {
  const [searchParams] = useSearchParams()
  const tribeId = searchParams.get('tribeId')
  useDevLog('TribeSettingsPage', arguments[0] || {})
  const { actorId: currentUserId } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // Form states
  const [formData, setFormData] = useState({
    tribeName: '',
    imageUrl: '',
    mission: '',
    preferredModel: 0,
    topicTypes: [],
    personalityCardName: '',
    personalityCardPrompt: '',
    personalityCardConfirmed: false,
    personalityCardLocked: false,
  })
  const [selectedCardIds, setSelectedCardIds] = useState([])
  const [lockedCardIds, setLockedCardIds] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)
  const [isDeleteTribeModalOpen, setIsDeleteTribeModalOpen] = useState(false)
  const [expelTargetMember, setExpelTargetMember] = useState(null)

  // Fetch Tribe
  const { data: tribe, isLoading } = useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: () => tribeApi.getTribe(tribeId).then((r) => r.data?.data ?? null),
    enabled: !!tribeId,
  })

  const { data: myCards = [] } = useQuery({
    queryKey: ['myPersonalityCards', currentUserId],
    queryFn: () =>
      personalityCardApi.getOwnedCards(currentUserId).then((res) => res.data?.data || []),
    enabled: Boolean(currentUserId),
    meta: { showErrorToast: true },
  })

  const storeMyCards = useMyEntitiesStore((state) => state.myCards)

  const ownedCardIdSet = useMemo(
    () => buildOwnedCardIdSet([...(myCards || []), ...(storeMyCards || [])]),
    [myCards, storeMyCards]
  )
  const isOwnedCardId = (id) => ownedCardIdSet.size === 0 || ownedCardIdSet.has(normalizeCardId(id))
  const sortedTribeAssignedCards = useMemo(
    () => sortCardsOwnedFirst(tribe?.personalityCards || [], ownedCardIdSet),
    [tribe, ownedCardIdSet]
  )

  // Populate form
  useEffect(() => {
    if (tribe) {
      const mappedTopicTypes = (tribe.topicTypes || [])
        .map((tt) => {
          const typeNameOrVal = tt.topicTypeName
          if (typeof typeNameOrVal === 'number') return typeNameOrVal
          return TopicTypesEnum[typeNameOrVal] || null
        })
        .filter((v) => v != null)
      setFormData({
        tribeName: tribe.tribeName || '',
        imageUrl: tribe.imageUrl || '',
        mission: tribe.mission || '',
        preferredModel: tribe.preferredModel ?? 0,
        topicTypes: mappedTopicTypes,
      })
      const assignedCards = tribe.personalityCards || []
      setSelectedCardIds(assignedCards.map(normalizeCardId).filter(Boolean))
      // Assignments already locked on the tribe (IsLocked) start locked in the local pending set;
      // the save payload is authoritative for the operator's own rows (backend locks AND unlocks).
      setLockedCardIds(
        assignedCards
          .filter((card) => Boolean(card.isLocked || card.assignment?.isLocked))
          .map(normalizeCardId)
          .filter(Boolean)
      )
    }
  }, [tribe])

  // Mutations
  const editMutation = useMutation({
    mutationFn: (dto) => tribeApi.editTribe(tribeId, dto),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('tribe_settings.success_update', 'Değişiklikler kaydedildi'))
      queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      setTimeout(() => {
        navigate('/tribe?tribeId=' + tribeId)
      }, 1000)
    },
  })

  const expelMutation = useMutation({
    mutationFn: (memberActorId) => tribeApi.expelMember(tribeId, memberActorId),
    meta: { showErrorToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] }),
  })

  const rankMutation = useMutation({
    mutationFn: ({ memberActorId, promotionType }) =>
      tribeApi.changeRank(tribeId, memberActorId, promotionType),
    meta: { showErrorToast: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => tribeApi.deleteTribe(tribeId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'))
      queryClient.invalidateQueries({ queryKey: ['tribe'] })
      queryClient.invalidateQueries({ queryKey: ['myTribes'] })
      useMyEntitiesStore.getState().fetchMyTribes()
      navigate('/')
    },
  })

  if (isLoading)
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  if (!tribe) return <div className="empty-state">{t('tribe_settings.not_found')}</div>

  const isDormantTribe = Boolean(tribe.isDormant ?? tribe.IsDormant ?? false)
  if (isDormantTribe) {
    return (
      <div className="empty-state">
        <h2 style={{ color: 'var(--color-error)' }}>
          {t('tribe_settings.dormant_unauthorized', 'Fosil klanlar düzenlenemez.')}
        </h2>
        <p>
          {t(
            'tribe_settings.dormant_unauthorized_desc',
            'Aktif döngüden çekilmiş klanların ayarları değiştirilemez.'
          )}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/tribe?tribeId=' + tribeId)}
          style={{ marginTop: 16 }}
        >
          {t('tribe_settings.return_to_tribe')}
        </button>
      </div>
    )
  }

  const TRIBE_ROLE_HIERARCHY = {
    TribeMember: 1,
    TribeSenior: 2,
    TribeAssistantLeader: 3,
    TribeCoLeader: 4,
    TribeLeader: 5,
  }
  const myTribeMembership = tribe.tribeMemberships?.find(
    (m) => m.actor?.actorId === currentUserId
  )
  const myRoleName = myTribeMembership?.roleName
  const myHierarchy = TRIBE_ROLE_HIERARCHY[myRoleName] || 0
  // Backend TribeService.EditTribe allows TribeAssistantLeader and above; CoLeader/Leader rank
  // higher. This UI gate mirrors that (previously locked to TribeLeader only — legacy bug).
  const canManageTribe = myHierarchy >= TRIBE_ROLE_HIERARCHY.TribeAssistantLeader
  const isLeader = myRoleName === 'TribeLeader'
  if (!canManageTribe) {
    return (
      <div className="empty-state">
        <h2 style={{ color: 'var(--color-error)' }}>{t('tribe_settings.unauthorized')}</h2>
        <p>{t('tribe_settings.unauthorized_desc')}</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/tribe?tribeId=' + tribeId)}
          style={{ marginTop: 16 }}
        >
          {t('tribe_settings.return_to_tribe')}
        </button>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePersonalityCardChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      personalityCardName: field === 'cardName' ? value : current.personalityCardName,
      personalityCardPrompt: field === 'prompt' ? value : current.personalityCardPrompt,
      personalityCardConfirmed: false,
    }))
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

  const toggleLockCard = (cardId) => {
    const lowerId = normalizeCardId(cardId)
    if (!lowerId) return
    setLockedCardIds((current) =>
      current.includes(lowerId)
        ? current.filter((lockedId) => lockedId !== lowerId)
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

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'

    if (isRequired) {
      return !value || !value.trim() ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const canSubmit =
    formData.tribeName.trim() !== '' &&
    (formData.topicTypes || []).length >= 3 &&
    !editMutation.isPending

  const handleSave = (e) => {
    e.preventDefault()

    if (!canSubmit) {
      setHasSubmitted(true)
      if (!formData.tribeName.trim()) {
        toast.error(t('tribe_settings.name_required', 'Klan adı gereklidir.'))
      } else if ((formData.topicTypes || []).length < 3) {
        toast.error(t('tribe.interests_min', 'En az 3 ilgi alanı seçilmelidir.'))
      }
      return
    }

    const {
      personalityCardName,
      personalityCardPrompt,
      personalityCardConfirmed,
      personalityCardLocked,
      ...base
    } = formData

    const ownedSelectedCardIds = selectedCardIds.filter((id) => isOwnedCardId(id))
    editMutation.mutate({
      ...base,
      assignedCardIds: ownedSelectedCardIds,
      lockedCardIds: lockedCardIds.filter(
        (id) =>
          isOwnedCardId(id) &&
          ownedSelectedCardIds.some((selectedId) => selectedId === normalizeCardId(id))
      ),
      personalityCardName: personalityCardConfirmed ? personalityCardName : null,
      personalityCardPrompt: personalityCardConfirmed ? personalityCardPrompt : null,
      lockPersonalityCard: personalityCardConfirmed ? Boolean(personalityCardLocked) : false,
    })
  }

  const handleDeleteTribe = () => {
    setIsDeleteTribeModalOpen(true)
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 8,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton
          onClick={() => navigate('/tribe?tribeId=' + tribeId)}
          style={{ marginBottom: 0 }}
        />
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
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('tribe_settings.title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'tribe_settings.title_desc',
              'Klanınızın genel ayarlarını ve üyelerini buradan yönetebilirsiniz.'
            )}
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        noValidate
        onSubmit={handleSave}
        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div>
          <AvatarUpload
            imageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
            disabled={editMutation.isPending}
          />
        </div>
        <div>
          <label style={labelStyle}>
            {t('tribe_settings.tribe_name')}{' '}
            <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="tribeName"
              value={formData.tribeName}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={{
                ...inputStyle,
                borderColor: getBorderColor('tribeName', formData.tribeName, true),
              }}
              onFocus={() => setFocused('tribeName')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{t('tribe_settings.mission')}</label>
          <div style={{ position: 'relative' }}>
            <textarea
              name="mission"
              rows={3}
              value={formData.mission}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 100,
                lineHeight: 1.65,
                borderColor: getBorderColor('mission', formData.mission, false),
              }}
              onFocus={() => setFocused('mission')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {t('card.create_personality_optional', 'Kişilik kartı oluştur (Opsiyonel)')}
          </label>
          <PersonalityCard
            variant="editor"
            editorCardName={formData.personalityCardName}
            editorPrompt={formData.personalityCardPrompt}
            editorConfirmed={formData.personalityCardConfirmed}
            editorLocked={formData.personalityCardLocked}
            disabled={editMutation.isPending}
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
          <label style={labelStyle}>{t('bot.model_selection', 'Model')}</label>
          <ModelGlassToggle
            value={formData.preferredModel}
            disabled={editMutation.isPending}
            onChange={(nextModel) => setFormData((current) => ({ ...current, preferredModel: nextModel }))}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('tribe_settings.model_selection_desc', 'Klan hafızası ve kişilik işlemlerinde kullanılır.')}
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            {t('card.personality_cards', 'KLANA ATANMIŞ KOLEKTİF KİŞİLİK KARTLARI')}
          </label>
          {tribe.personalityCards?.length > 0 ? (
            <CardSelectionSlots
              cards={sortedTribeAssignedCards}
              selectedCardIds={selectedCardIds}
              onToggle={toggleCard}
              maxSelections={4}
              disabled={editMutation.isPending}
              showHeader={false}
              slotCount={tribe.personalityCards.length}
              tribeAssigned
              tribeBadgeLabel="KLAN"
              assignLockedCardIds={lockedCardIds}
              onToggleAssignLock={toggleLockCard}
              ownedCardIds={ownedCardIdSet}
            />
          ) : (
            <p className="text-muted" style={{ fontSize: 13 }}>
              {t('card.no_assigned_cards', 'Henüz klana kart atanmamış.')}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            {t(
              'bot.select_unassigned_cards',
              'Sahip olduğun kartlarından ekle (Opsiyonel)'
            )}
          </label>
          <CardSelectionSlots
            cards={myCards}
            selectedCardIds={selectedCardIds}
            onToggle={toggleCard}
            disabled={editMutation.isPending}
            showHeader={false}
            slotCount={10}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-faint)' }}>
            {t('tribe_settings.additional_personality_cards_desc')}
          </p>
        </div>

        <div>
          <label style={labelStyle}>{t('tribe.interests', 'Alanlar')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TopicTypes.map((topic) => {
              const isSelected = formData.topicTypes.includes(topic.value)
              return (
                <div
                  key={topic.value}
                  onClick={() => {
                    if (!editMutation.isPending) {
                      handleTopicToggle(topic.value)
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: editMutation.isPending ? 'default' : 'pointer',
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
        <div style={{ marginTop: 16 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={editMutation.isPending}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: !canSubmit ? 0.5 : 1,
              cursor: !canSubmit ? 'not-allowed' : 'pointer',
            }}
          >
            {editMutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>{t('action.save', 'Kaydet')}</>
            )}
          </button>
        </div>
      </form>

      {/* Member Management */}
      <div style={{ marginTop: 48 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: 'var(--color-text-primary)',
              }}
            >
              {t('tribe_settings.member_management')}
            </h2>
          </div>
        </div>

        <div className="flex-col gap-2">
          {tribe.tribeMemberships?.map((member, index) =>
            member.actor ? (
              <div
                key={member.actor.actorId}
                className="lb-card flex items-center justify-between"
                style={{ padding: '8px 16px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActorMinimalCard actor={member.actor} />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="badge"
                    style={{ background: 'var(--color-surface-raised)', marginRight: 8 }}
                  >
                    {member.roleName === 'TribeLeader'
                      ? t('tribe_settings.leader')
                      : member.roleName === 'TribeAssistantLeader'
                        ? t('tribe_settings.assistant_leader', 'Yardımcı Lider')
                        : member.roleName === 'TribeCoLeader'
                          ? t('tribe_settings.co_leader', 'Eş Lider')
                          : member.roleName === 'TribeSenior'
                            ? t('tribe_settings.senior', 'Kıdemli')
                            : member.roleName || t('tribe_settings.member')}
                  </span>

                  {member.actor.actorId !== currentUserId &&
                    (TRIBE_ROLE_HIERARCHY[member.roleName] || 0) < myHierarchy && (
                      <>
                        {member.roleName === 'Member' || !member.roleName ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              rankMutation.mutate({
                                memberActorId: member.actor.actorId,
                                promotionType: 1,
                              })
                            }
                            disabled={rankMutation.isPending}
                          >
                            <Shield size={14} /> {t('tribe_settings.promote')}
                          </button>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              rankMutation.mutate({
                                memberActorId: member.actor.actorId,
                                promotionType: 2,
                              })
                            }
                            disabled={rankMutation.isPending}
                          >
                            <Shield size={14} /> {t('tribe_settings.demote')}
                          </button>
                        )}

                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => setExpelTargetMember(member)}
                          disabled={expelMutation.isPending}
                        >
                          <UserMinus size={14} /> {t('tribe_settings.expel')}
                        </button>
                      </>
                    )}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Danger Zone — yalnızca TribeLeader (backend DeleteTribe eşiği) */}
      {isLeader && (
        <div
          style={{
            marginTop: 48,
            padding: '24px',
            borderRadius: 16,
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
            margin: '0 0 20px 0',
            lineHeight: 1.5,
          }}
        >
          {t('tribe_settings.danger_zone_desc')}
        </p>
        <button
          className="btn btn-primary"
          style={{
            background: '#ef4444',
            borderColor: '#ef4444',
            width: '100%',
            gap: 8,
            padding: '13px 24px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 12,
          }}
          onClick={handleDeleteTribe}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={16} /> {t('tribe_settings.delete_tribe')}
        </button>
        </div>
      )}
      <ConfirmModal
        isOpen={Boolean(expelTargetMember)}
        onClose={() => setExpelTargetMember(null)}
        onConfirm={() => {
          if (expelTargetMember?.actor?.actorId) {
            expelMutation.mutate(expelTargetMember.actor.actorId)
            setExpelTargetMember(null)
          }
        }}
        title={t('tribe_settings.expel', 'Üyeyi Çıkar')}
        description={t(
          'tribe_settings.confirm_expel',
          'Bu üyeyi klandan çıkarmak istediğinize emin misiniz?'
        )}
        confirmText={t('action.delete', 'Çıkar')}
        confirmVariant="danger"
        isLoading={expelMutation.isPending}
      />
      <ConfirmModal
        isOpen={isDeleteTribeModalOpen}
        onClose={() => setIsDeleteTribeModalOpen(false)}
        onConfirm={() => {
          setIsDeleteTribeModalOpen(false)
          deleteMutation.mutate()
        }}
        title={t('tribe_settings.delete_tribe', 'Klanı Sil')}
        description={t(
          'tribe_settings.confirm_delete',
          'Bu klanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
        )}
        confirmText={t('action.delete', 'Sil')}
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
