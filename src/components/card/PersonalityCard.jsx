import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Check,
  Info,
  Edit2,
  Users,
  Crown,
  Pencil,
  Lock,
  LockOpen,
  Network,
  AlertTriangle,
} from 'lucide-react'
import CardActorListModal from './CardActorListModal'
import CardDetailModal from './CardDetailModal'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import SelectionMarker from '../common/SelectionMarker'
import IconActionButton from '../common/IconActionButton'
import FossilTogglePill from '../common/FossilTogglePill'
import BotIcon from '../common/icons/BotIcon'
import AvatarUpload from '../common/AvatarUpload'
import ImageWithLoader from '../common/ImageWithLoader'
import ConfirmModal from '../common/ConfirmModal'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useAuthStore from '../../store/authStore'

export default function PersonalityCard({
  card,
  actor,
  slotNumber,
  onClick,
  disabled = false,
  selectable = false,
  selected = false,
  onSelect,
  showMark = true,
  showStats = true,
  locked = false,
  tribeAssigned = false,
  tribeBadgeLabel = null,
  maxSelections,
  selectedCount = 0,
  variant = 'default',
  editorCardName = '',
  editorPrompt = '',
  editorImageUrl = '',
  editorConfirmed = false,
  showValidation = false,
  onEditorChange,
  onEditorConfirm,
  onEditorEdit,
  onEditClick = null,
  lockable = false,
  assignLocked = false,
  onToggleLock,
  selectionReadOnly = false,
  editorLocked = false,
  onToggleEditorLock,
  interactive = true,
  style = undefined,
  className = '',
  imageStyle = undefined,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const myOwnedCards = useMyEntitiesStore((s) => s.myCards)
  const currentActorId = useAuthStore((s) => s.actorId)
  const storeSettings = useMyEntitiesStore((s) => s.mySettings)
  const [modalType, setModalType] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [showFossilSources, setShowFossilSources] = useState(false)
  const [showFossilTargets, setShowFossilTargets] = useState(false)
  const [showFossilAssigned, setShowFossilAssigned] = useState(false)
  const [isEditorConfirmModalOpen, setIsEditorConfirmModalOpen] = useState(false)

  const cardOwnershipLimit = storeSettings?.cardOwnershipLimit || 10

  const oldestOwnedCard = useMemo(() => {
    if (!myOwnedCards || myOwnedCards.length === 0) return null
    return [...myOwnedCards].sort((a, b) => {
      const dateA = new Date(a.acquiredAt || a.card?.createdAt || 0).getTime()
      const dateB = new Date(b.acquiredAt || b.card?.createdAt || 0).getTime()
      return dateA - dateB
    })[0]
  }, [myOwnedCards])

  const oldestCardName =
    oldestOwnedCard?.card?.cardName ||
    oldestOwnedCard?.cardName ||
    t('card.oldest_card', 'En eski kartınız')

  const isCardLimitReached = (myOwnedCards || []).length >= cardOwnershipLimit

  if (variant === 'distribute') {
    const actorData = actor || card?.actor || card?.winnerActor || {}
    const actorName =
      actorData.name || actorData.profileName || card?.cardName || t('card.card', 'Kart')

    return (
      <div
        className="personality-card personality-card--filled personality-card--distribute"
        style={{
          width: '88px',
          minWidth: '88px',
          maxWidth: '88px',
          height: '120px',
          minHeight: 'unset',
          maxHeight: 'unset',
          padding: '10px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(145deg, var(--color-surface), color-mix(in srgb, var(--color-primary) 15%, var(--color-surface)))',
          border: '1.5px solid var(--color-primary)',
          borderRadius: 12,
          boxShadow:
            '0 0 20px color-mix(in srgb, var(--color-primary) 60%, transparent), 0 8px 16px rgba(0,0,0,0.3)',
          cursor: 'default',
          userSelect: 'none',
          pointerEvents: 'none',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Topline Card Title */}
        <span
          className="personality-card__title"
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: 'var(--color-primary)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {card?.cardName || t('card.personality_card', 'Kişilik Kartı')}
        </span>

        {/* Center Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0',
          }}
        >
          <ActorAvatar
            profileName={actorName}
            imageUrl={actorData.imageUrl}
            discriminator={actorData.discriminator}
            actorId={actorData.actorId || actorData.id}
            size="md"
            clickable={false}
          />
        </div>

        {/* Bottom Actor Name */}
        <span
          className="personality-card__hint"
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: 'var(--color-text)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {actorName}
        </span>
      </div>
    )
  }

  if (variant === 'editor') {
    const canConfirm = editorCardName.trim() !== '' && editorPrompt.trim() !== ''

    const handleEditorConfirmTrigger = () => {
      if (editorConfirmed) {
        onEditorEdit?.()
        return
      }
      if (!canConfirm) return

      if (isCardLimitReached) {
        setIsEditorConfirmModalOpen(true)
      } else {
        onEditorConfirm?.()
      }
    }

    return (
      <div
        className={`personality-card personality-card--filled personality-card--editor${editorConfirmed ? ' personality-card--editor-confirmed' : ''}`}
        style={{ position: 'relative', ...style }}
      >
        {/* Background Image Layer if present */}
        {editorImageUrl && (
          <div className="personality-card__bg-image-wrap" aria-hidden="true">
            <ImageWithLoader
              src={editorImageUrl}
              alt=""
              className="personality-card__bg-image"
              style={imageStyle}
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
            opacity: editorImageUrl ? 0.22 : 0.08,
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BotIcon size={120} />
        </div>

        <div className="personality-card-editor__body" style={{ position: 'relative', zIndex: 2 }}>
          {/* Onaylandıktan sonra da düzen yeri değişmez; alanlar sadece kilitlenir */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ flexShrink: 0 }}>
                <AvatarUpload
                  imageUrl={editorImageUrl}
                  onImageUploaded={(url) => onEditorChange?.('imageUrl', url)}
                  disabled={disabled || editorConfirmed}
                  size={44}
                  shape="rect"
                  compact={true}
                  aspectRatio={3 / 4}
                />
              </div>
              <input
                className={`input personality-card__title personality-card-editor__name${showValidation && !editorCardName.trim() ? ' error' : ''}`}
                type="text"
                value={editorCardName}
                onChange={(event) => onEditorChange?.('cardName', event.target.value)}
                placeholder={t('card.card_name_placeholder', 'Kişilik kart adı')}
                disabled={disabled}
                readOnly={editorConfirmed}
                maxLength={100}
                aria-label={t('card.card_name', 'Kart adı')}
                style={{
                  flex: 1,
                  minWidth: 0,
                  margin: 0,
                  // Onaylanınca kutu görsel olarak kaybolur, yazı aynı yerde kalır
                  ...(editorConfirmed
                    ? { borderColor: 'transparent', background: 'transparent', boxShadow: 'none' }
                    : null),
                }}
              />
              {typeof onToggleEditorLock === 'function' && (
                <IconActionButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleEditorLock(!editorLocked)
                  }}
                  aria-label={
                    editorLocked
                      ? t('card.locked_assignment', 'Bu atama kilitli')
                      : t('card.lock_assignment', 'Bu atamayı kilitle')
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    // Hover'da bulut butonuyla aynı efekt için CSS değişkenleriyle geçersiz kılınabilir
                    border: '2px solid var(--editor-box-border, var(--color-border))',
                    background: editorLocked
                      ? 'var(--color-primary-light, rgba(99, 102, 241, 0.12))'
                      : 'var(--color-surface-raised)',
                    zIndex: 3,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: editorLocked
                      ? 'var(--color-primary)'
                      : 'var(--editor-box-color, var(--color-text-secondary))',
                    transition: 'all 0.25s ease',
                    boxShadow: 'var(--editor-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.06))',
                  }}
                >
                  {editorLocked ? (
                    <Lock size={18} strokeWidth={2.2} />
                  ) : (
                    <LockOpen size={18} strokeWidth={2.2} />
                  )}
                </IconActionButton>
              )}
              <div style={{ flexShrink: 0, display: 'flex' }}>
                <SelectionMarker
                  checked={editorConfirmed}
                  onChange={
                    editorConfirmed
                      ? () => onEditorEdit?.()
                      : canConfirm
                        ? handleEditorConfirmTrigger
                        : undefined
                  }
                  disabled={disabled}
                  size="box"
                  label={
                    editorConfirmed
                      ? t('card.personality_confirmed', 'Kişilik kartı onaylandı')
                      : t('card.personality_pending', 'Kişilik kartı bekliyor')
                  }
                />
              </div>
          </div>

          <textarea
            className={`input textarea personality-card-editor__prompt${showValidation && !editorPrompt.trim() ? ' error' : ''}`}
            value={editorPrompt}
            onChange={(event) => onEditorChange?.('prompt', event.target.value)}
            placeholder={t('card.personality_prompt_placeholder', 'Bu kişiliği tanımlayın...')}
            disabled={disabled}
            readOnly={editorConfirmed}
            maxLength={2000}
            aria-label={t('card.personality_prompt', 'Kişilik tanımı')}
            style={
              editorConfirmed
                ? {
                    borderColor: 'transparent',
                    background: 'transparent',
                    boxShadow: 'none',
                    resize: 'none',
                  }
                : undefined
            }
          />
        </div>

        <div
          className="personality-card-editor__footer personality-card__stats"
          style={{ position: 'relative', zIndex: 2 }}
        >
          <button
            type="button"
            className="btn btn-primary btn-sm personality-card-editor__confirm"
            onClick={handleEditorConfirmTrigger}
            disabled={disabled || (!editorConfirmed && !canConfirm)}
          >
            {editorConfirmed ? (
              <>
                <Pencil size={14} /> {t('action.edit', 'Düzenle')}
              </>
            ) : (
              <>
                <Check size={14} /> {t('card.confirm_personality', 'Kişilik kartını onayla')}
              </>
            )}
          </button>
        </div>

        <ConfirmModal
          isOpen={isCardLimitReached && isEditorConfirmModalOpen}
          onClose={() => setIsEditorConfirmModalOpen(false)}
          onConfirm={() => {
            setIsEditorConfirmModalOpen(false)
            onEditorConfirm?.()
          }}
          title={t('card.create_confirm_title', 'Kart Oluşturma Onayı')}
          description={t('card.create_confirm_desc', {
            cardName: editorCardName,
            defaultValue: `"${editorCardName}" adlı yeni bir kişilik kartı oluşturmak istediğinize emin misiniz?`,
          })}
          warning={t('card.create_limit_reached_warning', {
            limit: cardOwnershipLimit,
            oldestCard: oldestCardName,
            defaultValue: `Kart limitinize (${cardOwnershipLimit}) ulaştınız! Bu kartı oluşturduğunuzda, en eski sahip olduğunuz kart olan "${oldestCardName}" otomatik ve kalıcı olarak silinecektir.`,
          })}
          confirmText={t('card.confirm_create_btn', 'Evet, Oluştur')}
          cancelText={t('common.cancel', 'İptal')}
          confirmVariant="danger"
          isLoading={disabled}
        />
      </div>
    )
  }

  const cardName =
    card?.cardName !== undefined
      ? card.cardName
      : card?.card?.cardName ||
        card?.ownership?.cardName ||
        card?.ownership?.originalCard?.cardName ||
        t('card.card', 'Kart')
  const hint =
    card?.cardHint ||
    card?.personalityPrompt ||
    card?.card?.cardHint ||
    card?.card?.personalityPrompt ||
    card?.ownership?.originalCard?.cardHint ||
    card?.ownership?.originalCard?.personalityPrompt ||
    ''
  const rawTags =
    card?.cardTags ||
    card?.tags ||
    card?.card?.cardTags ||
    card?.card?.tags ||
    card?.originalCard?.cardTags ||
    card?.originalCard?.tags ||
    ''
  const tags = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string' && rawTags.trim()
      ? rawTags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  const cardImageUrl =
    card?.imageUrl ||
    card?.card?.imageUrl ||
    card?.ownership?.imageUrl ||
    card?.ownership?.card?.imageUrl ||
    card?.ownership?.originalCard?.imageUrl ||
    card?.originalCard?.imageUrl ||
    card?.image ||
    ''
  const filled =
    card?.filled !== undefined
      ? card.filled
      : !!card?.cardName ||
        !!card?.card?.cardName ||
        !!card?.ownership ||
        !!card?.personalityCardId ||
        !!card?.cardId

  const ownershipCount =
    card?.ownershipCount ??
    card?.card?.ownershipCount ??
    card?.ownership?.ownershipCount ??
    card?.ownership?.originalCard?.ownershipCount ??
    card?.owners?.length ??
    card?.card?.owners?.length ??
    0
  const assignmentCount =
    card?.assignmentCount ??
    card?.card?.assignmentCount ??
    card?.ownership?.assignmentCount ??
    card?.ownership?.originalCard?.assignmentCount ??
    card?.assignments?.length ??
    card?.card?.assignments?.length ??
    0
  const personalityCardId =
    card?.personalityCardId ??
    card?.card?.personalityCardId ??
    card?.ownership?.originalCard?.personalityCardId ??
    card?.cardId ??
    null

  const storeMatch =
    personalityCardId && Array.isArray(myOwnedCards)
      ? myOwnedCards.find((mc) => {
          const mId =
            mc?.cardId ||
            mc?.personalityCardId ||
            mc?.id ||
            (typeof mc === 'string' ? mc : null)
          return mId && String(mId).toLowerCase() === String(personalityCardId).toLowerCase()
        })
      : null

  const isAssignedCard = Boolean(
    card?.assignmentId || card?.botId || card?.tribeId || card?.assignedTribeId || tribeAssigned
  )
  const ownerActor = card?.ownership?.actor ?? card?.actor ?? null
  const ownershipId =
    card?.ownershipId ||
    card?.ownership?.ownershipId ||
    (card?.ownership ? card.ownership.ownershipId : null) ||
    null
  const ownerActorId =
    card?.ownership?.actorId ||
    card?.ownership?.actor?.actorId ||
    card?.actorId ||
    ownerActor?.actorId ||
    null

  const isDirectOwner = Boolean(
    ownerActorId &&
    currentActorId &&
    String(ownerActorId).toLowerCase() === String(currentActorId).toLowerCase()
  )

  let currentAcqType = null
  if (storeMatch) {
    currentAcqType = storeMatch?.acquisitionType ?? 0
  } else if (isDirectOwner) {
    currentAcqType =
      card?.acquisitionType ??
      card?.card?.acquisitionType ??
      card?.ownership?.acquisitionType ??
      0
  } else if (card?.isOwned && card?.acquisitionType != null) {
    currentAcqType = card.acquisitionType
  }

  const rawAssignments = Array.isArray(card?.assignments) ? card.assignments : []
  const rawAssignedBots =
    card?.assignedBots && card.assignedBots.length > 0
      ? card.assignedBots
      : rawAssignments.map((a) => a.bot).filter(Boolean)
  const rawAssignedTribes =
    card?.assignedTribes && card.assignedTribes.length > 0
      ? card.assignedTribes
      : rawAssignments.map((a) => a.tribe).filter(Boolean)

  const isEntityDormant = (nodeOrEntity) => {
    if (!nodeOrEntity) return false
    const target = nodeOrEntity.data ? nodeOrEntity.data : nodeOrEntity
    return Boolean(target.isDormant ?? target.IsDormant ?? false)
  }

  const sortByDormantStatus = (list) => {
    if (!list || !list.length) return []
    return [...list].sort((a, b) => {
      const aDormant = isEntityDormant(a) ? 1 : 0
      const bDormant = isEntityDormant(b) ? 1 : 0
      return aDormant - bDormant
    })
  }

  const assignedBots = sortByDormantStatus(rawAssignedBots)
  const assignedTribes = sortByDormantStatus(rawAssignedTribes)
  const assignedNodes = sortByDormantStatus([
    ...rawAssignedBots.map((b) => ({ type: 'actor', data: b })),
    ...rawAssignedTribes.map((tr) => ({ type: 'tribe', data: tr })),
  ])
  const hasAssigned = assignedNodes.length > 0

  // Assignment-merkezli mod için tüm assignment'ları normalize et:
  // her öğe kaynak (SourceActor / SourceTribe) + hedef (Bot / Tribe) taşıyabilir.
  const assignmentItems =
    rawAssignments.length > 0
      ? rawAssignments.filter((a) => !a.isDeleted)
      : isAssignedCard
        ? [card]
        : []

  const resolveSourceNode = (item) => {
    if (item?.sourceTribe) return { type: 'tribe', data: item.sourceTribe }
    const src = item?.sourceActor || null
    if (!src) return null
    const srcId = String(src.actorId || src.id || '').toLowerCase()
    const ownId = String(ownerActorId || '').toLowerCase()
    if (ownId && srcId && srcId === ownId) return null
    return { type: 'actor', data: src }
  }

  const resolveTargetNode = (item) => {
    if (item?.bot) return { type: 'actor', data: item.bot }
    if (item?.botId) {
      const fallback = item?.actor || actor || null
      if (fallback) return { type: 'actor', data: fallback }
      return { type: 'actor', data: { actorId: item.botId } }
    }
    if (item?.tribe) return { type: 'tribe', data: item.tribe }
    if (item?.tribeId) return { type: 'tribe', data: { tribeId: item.tribeId } }
    return null
  }

  const collectAssignmentNodes = (resolver) => {
    const nodes = []
    const seen = new Set()
    for (const item of assignmentItems) {
      const node = resolver(item)
      if (!node) continue
      const key = `${node.type}:${String(
        node.data?.actorId || node.data?.tribeId || node.data?.id || ''
      ).toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      nodes.push(node)
    }
    return nodes
  }

  const assignmentSources = sortByDormantStatus(collectAssignmentNodes(resolveSourceNode))
  const assignmentTargets = sortByDormantStatus(collectAssignmentNodes(resolveTargetNode))
  const hasAssignmentFlow = assignmentSources.length > 0 || assignmentTargets.length > 0

  const countDormantNodes = (nodes) => nodes.filter((node) => isEntityDormant(node)).length
  const fossilSourceCount = countDormantNodes(assignmentSources)
  const fossilTargetCount = countDormantNodes(assignmentTargets)
  const fossilAssignedCount = countDormantNodes(assignedNodes)
  const visibleAssignmentSources = showFossilSources
    ? assignmentSources
    : assignmentSources.filter((node) => !isEntityDormant(node))
  const visibleAssignmentTargets = showFossilTargets
    ? assignmentTargets
    : assignmentTargets.filter((node) => !isEntityDormant(node))
  const visibleAssignedNodes = showFossilAssigned
    ? assignedNodes
    : assignedNodes.filter((node) => !isEntityDormant(node))

  const renderAssignedNodeColumn = (
    nodes,
    fossilCount,
    showFossils,
    onToggleFossils,
    keyPrefix,
    renderCard
  ) => {
    const pill = (
      <FossilTogglePill
        count={fossilCount}
        open={showFossils}
        onToggle={onToggleFossils}
        small
        title={t('card.show_fossil_assignments', 'Fosilleşmiş atamaları göster')}
        titleOpen={t('card.hide_fossil_assignments', 'Fosilleşmiş atamaları gizle')}
      />
    )
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          flex: 1,
          minWidth: 0,
        }}
      >
        {nodes.map((node, index) => {
          const nodeKey = `${keyPrefix}-${node.type}-${node.data?.actorId || node.data?.tribeId}`
          const cardNode = renderCard(node, nodeKey)
          if (index !== 0) return cardNode
          return (
            <div
              key={`${nodeKey}-fossil-toggle`}
              className="personality-card__assignment-node-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                maxWidth: '100%',
                minWidth: 0,
              }}
            >
              {cardNode}
              {pill}
            </div>
          )
        })}
        {nodes.length === 0 && pill}
      </div>
    )
  }

  // Effective lock state: either the explicit `locked` prop or the assignment data's own
  // IsLocked flag (CardAssignmentProjectionDto.isLocked) coming from assignment-centric renders.
  const effectiveLocked = Boolean(
    locked ||
    card?.isLocked ||
    card?.assignment?.isLocked ||
    card?.card?.isLocked ||
    card?.ownership?.originalCard?.isLocked
  )
  // Pending lock intent for cards about to be assigned (not yet persisted).
  const showLockToggle = typeof onToggleLock === 'function' && lockable !== false
  const lockToggleActive = Boolean(assignLocked)
  const isAssignmentLocked = showLockToggle ? lockToggleActive : effectiveLocked || lockToggleActive

  const isSelectionDisabled =
    disabled ||
    selectionReadOnly ||
    (selectable && !selected && maxSelections != null && selectedCount >= maxSelections)

  const handleCardClick = () => {
    if (!interactive) {
      onClick?.()
      return
    }
    if (selectable) {
      if (!isSelectionDisabled) onSelect?.()
      return
    }

    onClick?.()
    if (filled) setIsDetailOpen(true)
  }

  const handleCardKeyDown = (event) => {
    if (!interactive) return
    if ((event.key === 'Enter' || event.key === ' ') && filled) {
      event.preventDefault()
      if (selectable) {
        if (!isSelectionDisabled) onSelect?.()
        return
      }
      onClick?.()
      setIsDetailOpen(true)
    }
  }

  return (
    <div
      className={`personality-card ${filled ? 'personality-card--filled' : 'personality-card--empty'}${selectable ? ' personality-card--selectable' : ''}${selected ? ' personality-card--selected' : ''}${isSelectionDisabled ? ' personality-card--selection-disabled' : ''}${selectionReadOnly ? ' personality-card--selection-readonly' : ''}${isAssignedCard ? ' personality-card--owner-assigned' : ''}${className ? ` ${className}` : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={filled && interactive ? 'button' : undefined}
      tabIndex={filled && interactive ? 0 : undefined}
      aria-pressed={selectable ? selected : undefined}
      aria-disabled={disabled || selectionReadOnly}
      style={{
        ...(interactive ? {} : { cursor: 'default' }),
        ...style,
      }}
    >
      {/* Background Image Layer if present */}
      {cardImageUrl && (
        <div className="personality-card__bg-image-wrap" aria-hidden="true">
          <ImageWithLoader
            src={cardImageUrl}
            alt=""
            className="personality-card__bg-image"
            style={imageStyle}
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
          opacity: cardImageUrl ? 0.22 : 0.08,
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BotIcon size={120} />
      </div>

      {(currentAcqType === 0 || currentAcqType === 1 || isAssignmentLocked) && (
        <span
          className="personality-card__corner-badges"
          style={{
            position: 'absolute',
            top: -14,
            left: -8,
            zIndex: 3,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          {currentAcqType === 0 && (
            <span
              style={{
                color: 'var(--color-warning)',
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                transform: 'rotate(-25deg)',
                pointerEvents: 'auto',
              }}
            >
              <Crown size={28} strokeWidth={2.5} />
            </span>
          )}
          {currentAcqType === 1 && (
            <span
              style={{
                color: '#b87333',
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
                transform: 'rotate(-18deg)',
                pointerEvents: 'auto',
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
          )}
          {isAssignmentLocked && (
            <span
              aria-label={t('card.locked_assignment', 'Bu atama kilitli')}
              onClick={
                showLockToggle
                  ? (e) => {
                      e.stopPropagation()
                      onToggleLock(personalityCardId ?? card)
                    }
                  : undefined
              }
              style={{
                color: '#ffffff',
                filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))',
                pointerEvents: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-22deg)',
                cursor: showLockToggle ? 'pointer' : 'default',
              }}
            >
              <Lock size={26} strokeWidth={3} />
            </span>
          )}
        </span>
      )}
      <div className="personality-card__topline">
        <span className="personality-card__eyebrow">{slotNumber ? String(slotNumber) : ''}</span>
        <span className="personality-card__title">
          {cardName.length > 40 ? cardName.substring(0, 40) + '...' : cardName}
        </span>
        {showLockToggle && filled && (
          <IconActionButton
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock(personalityCardId ?? card)
            }}
            aria-label={
              lockToggleActive
                ? t('card.locked_assignment', 'Bu atama kilitli')
                : t('card.lock_assignment', 'Bu atamayı kilitle')
            }
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              zIndex: 3,
              flexShrink: 0,
              color: lockToggleActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
            }}
          >
            {lockToggleActive ? (
              <Lock size={13} strokeWidth={2.2} />
            ) : (
              <LockOpen size={13} strokeWidth={2.2} />
            )}
          </IconActionButton>
        )}
        {filled && (onEditClick || currentAcqType === 0 || currentAcqType === 1) && !selectable ? (
          <IconActionButton
            className="personality-card__edit-action"
            onClick={(e) => {
              e.stopPropagation()
              if (onEditClick) {
                onEditClick(card)
              } else {
                const targetId =
                  personalityCardId ||
                  card?.cardId ||
                  card?.personalityCardId ||
                  innerCard?.personalityCardId ||
                  innerCard?.cardId
                navigate('/cards', { state: { editCardId: targetId, editCard: card } })
              }
            }}
            aria-label={t('action.edit', 'Düzenle')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              // Bulut/kilit butonlarıyla aynı tarz (hover için CSS değişkenleri)
              border: '2px solid var(--card-box-border, var(--color-border))',
              background: 'var(--color-surface-raised)',
              color: 'var(--card-box-color, var(--color-text-secondary))',
              boxShadow: 'var(--card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.06))',
              transition: 'all 0.25s ease',
              zIndex: 3,
              flexShrink: 0,
            }}
          >
            <Edit2 size={18} strokeWidth={2.2} />
          </IconActionButton>
        ) : showMark ? (
          <span className="personality-card__mark">
            <SelectionMarker
              checked={selectionReadOnly ? true : selectable ? selected : filled}
              size="sm"
              locked={false}
              disabled={selectionReadOnly}
              label={
                selectable
                  ? selected
                    ? t('card.selected', 'Seçili kart')
                    : t('card.select', 'Kartı seç')
                  : filled
                    ? t('card.selected', 'Seçili kart')
                    : t('card.empty', 'Boş kart yuvası')
              }
            />
          </span>
        ) : (
          <span
            className="personality-card__mark personality-card__mark--placeholder"
            aria-hidden="true"
          />
        )}
      </div>

      {hint && <p className="personality-card__hint">{hint}</p>}

      {tags.length > 0 && (
        <div className="personality-card__tags">
          {tags.map((tag) => (
            <span
              key={typeof tag === 'string' ? tag : tag?.cardTagId}
              className="personality-card__tag"
            >
              {typeof tag === 'string' ? tag : tag?.tagName || tag?.name}
            </span>
          ))}
        </div>
      )}

      {filled && showStats && (
        <div
          className="personality-card__footer"
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--color-primary-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {(isAssignedCard ? ownerActor || hasAssignmentFlow : ownerActor || hasAssigned) && (
            <div className="personality-card__assignment-sources" style={{ margin: 0 }}>
              {/* 1. Top Row: Owner */}
              {ownerActor && (
                <div className="personality-card__assignment-row personality-card__assignment-row--owner">
                  <span className="personality-card__assignment-label personality-card__assignment-label--owner">
                    {t('card.owner_label', 'Sahip')}:
                  </span>
                  <ActorMinimalCard
                    actor={ownerActor}
                    showHierarchyBtn={false}
                    showMindBtn={false}
                    showEditBtn={false}
                    showPoint={false}
                    clickable={true}
                    variant="compact"
                  />
                </div>
              )}

              {isAssignedCard ? (
                <>
                  {/* 2. Assigned bloğu (1. katman - Kaynaklar):
                      "Assigned:" etiketi; sağında kaynak (SourceActor/SourceTribe) ögeleri
                      bitişik (flush) alt alta dizilir. */}
                  {assignmentSources.length > 0 && (
                    <div
                      className={`personality-card__assignment-row personality-card__assignment-row--branch personality-card__assignment-row--assigned personality-card__assignment-row--source-layer${assignmentTargets.length > 0 ? ' personality-card__assignment-row--has-target-layer' : ''}`}
                      style={{ alignItems: 'flex-start' }}
                    >
                      <span
                        className="personality-card__assignment-label personality-card__assignment-label--assigned"
                        style={{ marginTop: '5px' }}
                      >
                        {t('card.assigned_label', 'Assigned')}:
                      </span>
                      {renderAssignedNodeColumn(
                        visibleAssignmentSources,
                        fossilSourceCount,
                        showFossilSources,
                        () => setShowFossilSources((value) => !value),
                        'src',
                        (node, nodeKey) =>
                          node.type === 'tribe' ? (
                            <TribeMinimalCard
                              key={nodeKey}
                              tribeId={node.data.tribeId}
                              tribeName={node.data.tribeName}
                              tribePoint={node.data.tribePoint}
                              imageUrl={node.data.imageUrl}
                              isDormant={node.data.isDormant ?? node.data.IsDormant}
                              variant="compact"
                              clickable={true}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                            />
                          ) : (
                            <ActorMinimalCard
                              key={nodeKey}
                              actor={node.data}
                              showHierarchyBtn={false}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                              clickable={true}
                              variant="compact"
                            />
                          )
                      )}
                    </div>
                  )}

                  {/* 3. Assigned bloğu (2. katman - Hedefler):
                      kaynak katmanından inen dal; sağında Bot/Tribe ögeleri bitişik (flush) dizilir. */}
                  {assignmentTargets.length > 0 && (
                    <div
                      className={`personality-card__assignment-row personality-card__assignment-row--branch personality-card__assignment-row--assigned personality-card__assignment-row--target-layer${assignmentSources.length > 0 ? ' personality-card__assignment-row--has-source-layer' : ''}`}
                      style={{ alignItems: 'flex-start' }}
                    >
                      <span
                        className="personality-card__assignment-label personality-card__assignment-label--assigned"
                        style={{ marginTop: '5px' }}
                      >
                        {t('card.assigned_label', 'Assigned')}:
                      </span>
                      {renderAssignedNodeColumn(
                        visibleAssignmentTargets,
                        fossilTargetCount,
                        showFossilTargets,
                        () => setShowFossilTargets((value) => !value),
                        'tgt',
                        (node, nodeKey) =>
                          node.type === 'tribe' ? (
                            <TribeMinimalCard
                              key={nodeKey}
                              tribeId={node.data.tribeId}
                              tribeName={node.data.tribeName}
                              tribePoint={node.data.tribePoint}
                              imageUrl={node.data.imageUrl}
                              isDormant={node.data.isDormant ?? node.data.IsDormant}
                              variant="compact"
                              clickable={true}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                            />
                          ) : (
                            <ActorMinimalCard
                              key={nodeKey}
                              actor={node.data}
                              showHierarchyBtn={false}
                              showMindBtn={false}
                              showEditBtn={false}
                              showPoint={false}
                              clickable={true}
                              variant="compact"
                            />
                          )
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Ownership Card Mode */
                hasAssigned && (
                  <div
                    className="personality-card__assignment-row personality-card__assignment-row--branch personality-card__assignment-row--assigned"
                    style={{ alignItems: 'flex-start' }}
                  >
                    <span
                      className="personality-card__assignment-label personality-card__assignment-label--assigned"
                      style={{ marginTop: '5px' }}
                    >
                      {t('card.assigned_label', 'Assigned')}:
                    </span>
                    {renderAssignedNodeColumn(
                      visibleAssignedNodes,
                      fossilAssignedCount,
                      showFossilAssigned,
                      () => setShowFossilAssigned((value) => !value),
                      'assigned',
                      (node, nodeKey) =>
                        node.type === 'tribe' ? (
                          <TribeMinimalCard
                            key={nodeKey}
                            {...node.data}
                            isDormant={node.data.isDormant ?? node.data.IsDormant}
                            variant="compact"
                            clickable={true}
                            showMindBtn={false}
                            showEditBtn={false}
                            showPoint={false}
                          />
                        ) : (
                          <ActorMinimalCard
                            key={nodeKey}
                            actor={node.data}
                            showHierarchyBtn={false}
                            showMindBtn={false}
                            showPoint={false}
                            showEditBtn={false}
                            clickable={true}
                            variant="compact"
                          />
                        )
                    )}
                  </div>
                )
              )}
            </div>
          )}

          <div
            className="personality-card__stats"
            style={{
              marginTop: 0,
              paddingTop: 0,
              borderTop: 'none',
              ...(interactive ? {} : { pointerEvents: 'none' }),
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsDetailOpen(true)
              }}
              className="personality-card__stat"
              aria-label={t('card.details', 'Kart Detayları')}
            >
              <Info size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (personalityCardId) setModalType('owners')
              }}
              className="personality-card__stat"
              aria-label={t('card.owners', 'Sahipler')}
            >
              <Crown size={12} />
              {ownershipCount}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (personalityCardId) setModalType('assignees')
              }}
              className="personality-card__stat"
              aria-label={t('card.assignees', 'Atanmış Botlar')}
            >
              <Bot size={12} />
              {assignmentCount}
            </button>
          </div>

          {personalityCardId && (
            <button
              type="button"
              className="personality-card__hierarchy-btn"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/card-hierarchy?cardId=${personalityCardId}`)
              }}
              aria-label={t('card.view_hierarchy', 'Kart Hiyerarşisi')}
            >
              <Network size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      <CardActorListModal
        cardId={personalityCardId}
        type={modalType}
        isOpen={!!modalType && !!personalityCardId}
        onClose={() => setModalType(null)}
      />

      {isDetailOpen && (
        <CardDetailModal
          card={card}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onEditClick={onEditClick}
        />
      )}
    </div>
  )
}
