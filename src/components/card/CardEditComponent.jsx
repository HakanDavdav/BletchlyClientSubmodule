import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personalityCardApi } from '../../api/personalityCardApi'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Edit2, X, Check, Crown, Bot, Loader2, Users, Trash2 } from 'lucide-react'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import SelectionMarker from '../common/SelectionMarker'
import BotIcon from '../common/icons/BotIcon'
import AvatarUpload from '../common/AvatarUpload'
import ImageWithLoader from '../common/ImageWithLoader'
import ConfirmModal from '../common/ConfirmModal'
import PremiumModal from '../common/PremiumModal'
import useAuthStore from '../../store/authStore'
import { UserCapabilities } from '../../constants/enums'

export default function CardEditComponent({ card, myBots = [], onClose, onSaved }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const cardData = card?.card || card?.originalCard || card
  const isCreator =
    card?.acquisitionType === 0 ||
    cardData?.acquisitionType === 0 ||
    card?.ownership?.acquisitionType === 0 ||
    card?.ownership?.originalCard?.acquisitionType === 0
  const cardId = cardData?.personalityCardId ?? card?.cardId

  const [editFormData, setEditFormData] = useState({
    cardName: '',
    personalityPrompt: '',
    imageUrl: '',
    isListedOnMarketplace: false,
    price: '',
    assignedBotIds: [],
  })
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)

  const storeSettings = useMyEntitiesStore((s) => s.mySettings)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const isPremiumUser =
    Boolean(isAdmin) ||
    ((storeSettings?.userCapabilities ?? UserCapabilities.Default) & UserCapabilities.Premium) ===
      UserCapabilities.Premium

  const [isConfirmed, setIsConfirmed] = useState(false)
  const isPriceValid =
    !editFormData.isListedOnMarketplace ||
    (editFormData.price !== '' && !isNaN(parseInt(editFormData.price, 10)) && parseInt(editFormData.price, 10) >= 0)
  const canConfirm =
    !isCreator ||
    (Boolean(editFormData.cardName.trim()) && Boolean(editFormData.personalityPrompt.trim()) && isPriceValid)

  useEffect(() => {
    if (!card) return
    const innerCardData = card.card || card.originalCard || card
    const rawAssignments = Array.isArray(card.assignments)
      ? card.assignments
      : Array.isArray(innerCardData.assignments)
        ? innerCardData.assignments
        : []
    const assignedBots =
      card.assignedBots ||
      innerCardData.assignedBots ||
      rawAssignments.map((a) => a.bot).filter(Boolean)
    const assignedBotIds = assignedBots.map((b) => b.actorId || b.id || b.botId).filter(Boolean)

    setEditFormData({
      cardName: innerCardData.cardName || card.cardName || '',
      personalityPrompt: isCreator
        ? innerCardData.personalityPrompt || card.personalityPrompt || ''
        : '',
      imageUrl: innerCardData.imageUrl || card.imageUrl || '',
      isListedOnMarketplace: Boolean(innerCardData.isListedOnMarketplace),
      price: innerCardData.price !== undefined && innerCardData.price !== null ? String(innerCardData.price) : (card.price !== undefined && card.price !== null ? String(card.price) : ''),
      assignedBotIds,
    })
    setIsConfirmed(false)
  }, [card])

  const editMutation = useMutation({
    mutationFn: (data) => personalityCardApi.editCard(cardId, data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      useMyEntitiesStore.getState().fetchMyBots()
      onSaved?.()
      onClose?.()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => personalityCardApi.deleteCard(cardId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['myPersonalityCards'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
      useMyEntitiesStore.getState().fetchMyBots()
      onSaved?.()
      onClose?.()
    },
  })

  const handleSave = () => {
    if (!cardId) return

    const payload = {
      assignedBotIds: editFormData.assignedBotIds,
    }

    if (isCreator) {
      if (editFormData.cardName.trim()) {
        payload.cardName = editFormData.cardName.trim()
      }
      if (editFormData.personalityPrompt.trim()) {
        payload.personalityPrompt = editFormData.personalityPrompt.trim()
      }
      payload.imageUrl = editFormData.imageUrl || ''
      payload.isListedOnMarketplace = editFormData.isListedOnMarketplace
      if (editFormData.isListedOnMarketplace) {
        const parsedPrice = parseInt(editFormData.price, 10)
        payload.price = isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice)
      } else {
        payload.price = null
      }
    }

    editMutation.mutate(payload)
  }

  const handleDelete = () => {
    if (!cardId) return
    setIsDeleteModalOpen(true)
  }

  if (!card) return null

  const ownershipCount = cardData?.ownershipCount ?? card?.ownershipCount ?? 0
  const assignmentCount = editFormData.assignedBotIds.length

  return (
    <div
      className="card-edit-component"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
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
          {t('card.edit_personality_card')}
        </label>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={onClose}
          style={{ borderRadius: 20, padding: '4px 10px', height: 'auto', fontSize: 12 }}
        >
          <X size={14} /> {t('common.cancel')}
        </button>
      </div>

      {/* The Unified Personality Card Box (.personality-card .personality-card--filled .personality-card--editor) */}
      <div
        className={`personality-card personality-card--filled personality-card--editor${isConfirmed ? ' personality-card--editor-confirmed' : ''}`}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Background Image Layer if present */}
        {editFormData.imageUrl && (
          <div className="personality-card__bg-image-wrap" aria-hidden="true">
            <ImageWithLoader
              src={editFormData.imageUrl}
              alt=""
              className="personality-card__bg-image"
              wrapperStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              spinnerSize="sm"
              spinnerOpacity={0.4}
            />
            <div className="personality-card__bg-image-overlay" />
            <div className="personality-card__bg-image-shade" />
          </div>
        )}

        {/* Background Bot Watermark */}
        <div
          className="personality-card__bg-bot"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
            opacity: editFormData.imageUrl ? 0.22 : 0.08,
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BotIcon size={120} />
        </div>

        {/* Creator / Purchaser Crown Badge on Top-Left */}
        {isCreator ? (
          <span
            className="personality-card__corner-badge"
            title={t('card.tooltip_creator')}
            aria-label={t('card.tooltip_creator')}
            style={{
              position: 'absolute',
              top: -14,
              left: -8,
              zIndex: 3,
            }}
          >
            <span
              style={{
                color: 'var(--color-warning)',
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                transform: 'rotate(-25deg)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Crown size={28} strokeWidth={2.5} />
            </span>
          </span>
        ) : (
          <span
            className="personality-card__corner-badge"
            title={t('card.tooltip_purchased')}
            aria-label={t('card.tooltip_purchased')}
            style={{
              position: 'absolute',
              top: -14,
              left: -8,
              zIndex: 3,
            }}
          >
            <span
              style={{
                color: '#b87333',
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                transform: 'rotate(-18deg)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Crown size={24} strokeWidth={2.5} />
              <span
                style={{
                  marginLeft: '-4px',
                  marginTop: '4px',
                  fontSize: '25px',
                  fontWeight: '900',
                  fontFamily: '"Arial Black", Impact, system-ui, sans-serif',
                  lineHeight: 1,
                  color: '#22c55e',
                  textShadow: '0 0 3px rgba(34, 197, 94, 0.35), 0 1px 2px rgba(0,0,0,0.8)',
                  WebkitTextStroke: '0.6px #052e16',
                }}
              >
                $
              </span>
            </span>
          </span>
        )}

        {/* Card Body: Name and Prompt/Hint */}
        <div className="personality-card-editor__body" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            {isCreator && (
              <div style={{ flexShrink: 0 }}>
                <AvatarUpload
                  imageUrl={editFormData.imageUrl}
                  onImageUploaded={(url) =>
                    setEditFormData((prev) => ({ ...prev, imageUrl: url }))
                  }
                  disabled={editMutation.isPending || deleteMutation.isPending || isConfirmed}
                  size={44}
                  shape="rect"
                  compact={true}
                  aspectRatio={3 / 4}
                  isLocked={!isPremiumUser}
                  onLockedClick={() => navigate('/premium')}
                />
              </div>
            )}
            <input
              className="input personality-card__title personality-card-editor__name"
              type="text"
              value={editFormData.cardName}
              onChange={(event) =>
                isCreator &&
                setEditFormData((prev) => ({ ...prev, cardName: event.target.value }))
              }
              placeholder={t('card.card_name_placeholder')}
              disabled={!isCreator || editMutation.isPending || deleteMutation.isPending}
              readOnly={isConfirmed || !isCreator}
              maxLength={100}
              aria-label={t('card.card_name')}
              style={{
                flex: 1,
                minWidth: 0,
                margin: 0,
                ...(!isCreator ? { opacity: 0.8, cursor: 'not-allowed' } : {}),
                ...(isConfirmed
                  ? { borderColor: 'transparent', background: 'transparent', boxShadow: 'none' }
                  : null),
              }}
            />
            <div style={{ flexShrink: 0, display: 'flex' }}>
              <SelectionMarker
                checked={isConfirmed}
                onChange={
                  isConfirmed
                    ? () => setIsConfirmed(false)
                    : canConfirm
                      ? () => setIsConfirmed(true)
                      : undefined
                }
                disabled={editMutation.isPending || deleteMutation.isPending}
                size="box"
                label={
                  isConfirmed
                    ? t('card.personality_confirmed')
                    : t('card.personality_pending')
                }
              />
            </div>
          </div>

          {isCreator ? (
            <textarea
              className="input textarea personality-card-editor__prompt"
              value={editFormData.personalityPrompt}
              onChange={(event) =>
                setEditFormData((prev) => ({ ...prev, personalityPrompt: event.target.value }))
              }
              placeholder={t('card.personality_prompt_placeholder')}
              disabled={editMutation.isPending || deleteMutation.isPending}
              readOnly={isConfirmed}
              maxLength={2000}
              aria-label={t('card.personality_prompt')}
              style={
                isConfirmed
                  ? {
                      borderColor: 'transparent',
                      background: 'transparent',
                      boxShadow: 'none',
                      resize: 'none',
                    }
                  : undefined
              }
            />
          ) : (
            <div
              className="personality-card-editor__preview"
              style={{
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                justifyContent: 'center',
                ...(isConfirmed
                  ? { borderColor: 'transparent', background: 'transparent', boxShadow: 'none' }
                  : null),
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--color-warning)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Crown size={14} />{' '}
                {t('card.prompt_creator_only')}
              </div>
              <p
                style={{
                  margin: 0,
                  fontStyle: 'italic',
                  color: 'var(--color-text-secondary)',
                  fontSize: 13,
                }}
              >
                "
                {cardData?.cardHint ||
                  card?.cardHint ||
                  t('card.hint_placeholder')}
                "
              </p>
            </div>
          )}
        </div>

        {/* Integrated Marketplace Listing Row (Creator Only) */}
        {isCreator && (
          <div
            onClick={() => {
              if (editMutation.isPending || deleteMutation.isPending) return
              setEditFormData((prev) => ({
                ...prev,
                isListedOnMarketplace: !prev.isListedOnMarketplace,
              }))
            }}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 8,
              background: editFormData.isListedOnMarketplace
                ? 'color-mix(in srgb, var(--color-primary) 14%, var(--color-surface-2) 86%)'
                : 'color-mix(in srgb, var(--color-surface-2) 72%, var(--color-surface-3) 28%)',
              border: editFormData.isListedOnMarketplace
                ? '1.5px solid var(--color-primary)'
                : '1px solid color-mix(in srgb, var(--color-border) 72%, var(--color-text) 18%)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              userSelect: 'none',
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {t('card.list_on_marketplace')}
              </span>
            </div>
            <SelectionMarker
              checked={editFormData.isListedOnMarketplace}
              size="sm"
              disabled={editMutation.isPending || deleteMutation.isPending}
              label={t('card.list_on_marketplace')}
            />
          </div>
        )}

        {/* Integrated Marketplace Price Input (Creator Only, when listed) */}
        {isCreator && editFormData.isListedOnMarketplace && (
          <div
            className="card-edit-price-section"
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'color-mix(in srgb, var(--color-surface-2) 72%, var(--color-surface-3) 28%)',
              border: '1px solid color-mix(in srgb, var(--color-border) 72%, var(--color-text) 18%)',
            }}
          >
            <label
              htmlFor="card-edit-price-input"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('card.price_label')}
            </label>
            <input
              id="card-edit-price-input"
              type="number"
              min="0"
              step="1"
              className="input"
              value={editFormData.price}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              placeholder={t('card.price_placeholder')}
              disabled={editMutation.isPending || deleteMutation.isPending}
              readOnly={isConfirmed}
              style={{
                margin: 0,
                width: '100%',
                ...(isConfirmed
                  ? { borderColor: 'transparent', background: 'transparent', boxShadow: 'none' }
                  : null),
              }}
            />
          </div>
        )}

        {/* Integrated Bot Assignment Section (Tiklenebilir ActorMinimalCard Listesi) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '12px 14px',
            borderRadius: 8,
            background:
              'color-mix(in srgb, var(--color-surface-2) 72%, var(--color-surface-3) 28%)',
            border:
              '1px solid color-mix(in srgb, var(--color-border) 72%, var(--color-text) 18%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              <Bot size={15} color="var(--color-primary)" />
              {t('card.assign_to_bots')}
            </label>
          </div>

          {myBots.length === 0 ? (
            <div
              style={{
                padding: '10px 0',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 12,
              }}
            >
              {t('common.nothing_here_yet')}
            </div>
          ) : (
            <div
              className="minimal-card-list"
              style={{
                maxHeight: 190,
                overflowY: 'auto',
                padding: '4px 6px 6px 4px',
                margin: '-2px -2px -2px -2px',
              }}
            >
              {myBots.map((bot) => {
                const isAssigned = editFormData.assignedBotIds.includes(bot.actorId)
                const isBotDormant = Boolean(bot.isDormant ?? bot.IsDormant ?? false)
                return (
                  <ActorMinimalCard
                    key={bot.actorId}
                    actor={bot}
                    selectable
                    selected={isAssigned}
                    onSelect={() => {
                      if (editMutation.isPending || deleteMutation.isPending) return
                      setEditFormData((prev) => ({
                        ...prev,
                        assignedBotIds: isAssigned
                          ? prev.assignedBotIds.filter((id) => id !== bot.actorId)
                          : [...prev.assignedBotIds, bot.actorId],
                      }))
                    }}
                    disabled={editMutation.isPending || deleteMutation.isPending || isBotDormant}
                    variant="compact"
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Danger Zone Section (Inside the Card) */}
        <div
          style={{
            marginTop: 4,
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ef4444',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={15} />
              {t('tribe_settings.danger_zone')}
            </h4>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {isCreator
              ? t(
                  'card.danger_zone_creator_desc'
                )
              : t(
                  'card.danger_zone_purchaser_desc'
                )}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              background: '#ef4444',
              borderColor: '#ef4444',
              width: '100%',
              gap: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              marginTop: 2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleDelete}
            disabled={deleteMutation.isPending || editMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                {t('common.deleting')}
              </>
            ) : (
              <>
                <Trash2 size={14} />
                {isCreator
                  ? t('card.delete_card')
                  : t('card.delete_ownership')}
              </>
            )}
          </button>
        </div>

        {/* Card Footer & Actions (Inside the Card) */}
        <div
          className="personality-card-editor__footer personality-card__stats"
          style={{
            marginTop: 'auto',
            paddingTop: 10,
            borderTop:
              '1px solid color-mix(in srgb, var(--color-border) 72%, var(--color-text) 18%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="personality-card__stat">
              <Users size={12} /> {ownershipCount}
            </span>
            <span className="personality-card__stat">
              <Bot size={12} /> {assignmentCount}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={editMutation.isPending || deleteMutation.isPending}
              style={{ borderRadius: 16, fontSize: 12 }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={
                editMutation.isPending ||
                deleteMutation.isPending ||
                (isCreator &&
                  (!editFormData.cardName.trim() || !editFormData.personalityPrompt.trim()))
              }
              style={{
                borderRadius: 16,
                fontSize: 12,
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {editMutation.isPending ? (
                <>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Check size={13} />
                  {t('action.save')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false)
          deleteMutation.mutate()
        }}
        title={
          isCreator
            ? t('card.delete_card')
            : t('card.delete_ownership')
        }
        description={
          isCreator
            ? t(
                'card.confirm_delete_creator'
              )
            : t(
                'card.confirm_delete_purchaser'
              )
        }
        confirmText={t('action.delete')}
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </div>
  )
}
