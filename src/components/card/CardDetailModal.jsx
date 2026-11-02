import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Bot, CalendarFold, Hash, Tag, Users, X, Crown, Edit2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import BotFlashCardsIcon from '../common/icons/BotFlashCardsIcon'
import CardContingencyIcon from '../common/icons/CardContingencyIcon'
import IconActionButton from '../common/IconActionButton'
import ModalHeader from '../common/ModalHeader'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import { normalizeCardId } from '../../utils/cardOwnership'

import i18n from '../../i18n'

function normalizeTags(rawTags) {
  if (Array.isArray(rawTags)) return rawTags
  if (typeof rawTags !== 'string' || !rawTags.trim()) return []
  return rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const locale = (i18n.language && i18n.language.startsWith('en')) ? 'en-US' : 'tr-TR'
  const datePart = date.toLocaleDateString(locale)
  const timePart = date.toLocaleTimeString(locale, { hour12: false })
  return `${datePart} / ${timePart}`
}

function formatContingency(contingency, isEn) {
  if (contingency === null || contingency === undefined) return null
  const num = Number(contingency)
  if (Number.isNaN(num)) return null
  const percent = Number((num <= 1 ? num * 100 : num).toFixed(2))
  return isEn ? `${percent}%` : `%${percent}`
}

function DetailRow({ icon: Icon, label, value, multiline = false, iconSize = 14 }) {
  if (value === null || value === undefined || value === '') return null

  return (
    <div className="card-detail-row">
      <div className="card-detail-row__label">
        {Icon && <Icon size={iconSize} className="card-detail-row__icon" style={{ flexShrink: 0 }} />}
        <span>{label}</span>
      </div>
      <div className={`card-detail-row__value${multiline ? ' is-multiline' : ''}`}>
        {value}
      </div>
    </div>
  )
}

export default function CardDetailModal({ card, isOpen, onClose, onEditClick = null }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !card) return null

  const cardData = card.card || card.originalCard || card
  const cardName = cardData.cardName || card.cardName || t('card.card', 'Kart')
  const personalityPrompt = cardData.personalityPrompt ?? card.personalityPrompt
  const cardHint = cardData.cardHint ?? card.cardHint
  const tags = normalizeTags(cardData.cardTags ?? cardData.tags ?? card.tags)
  const cardId = cardData.personalityCardId ?? card.cardId
  const ownershipId = card.ownershipId
  const actorId = card.actorId
  const myOwnedCards = useMyEntitiesStore((s) => s.myCards)
  const targetId = normalizeCardId(card) || normalizeCardId(cardData)
  const ownedMatch = useMemo(() => {
    if (!targetId || !Array.isArray(myOwnedCards)) return null
    return myOwnedCards.find((mc) => normalizeCardId(mc) === targetId) || null
  }, [targetId, myOwnedCards])

  const isOwnerCard = Boolean(ownedMatch)
  const effectiveAcqType = ownedMatch?.acquisitionType ?? (isOwnerCard ? (card.acquisitionType ?? cardData.acquisitionType) : null)
  const acquisitionType =
    effectiveAcqType === 0
      ? t('card.created', 'Oluşturuldu')
      : effectiveAcqType === 1
        ? t('card.purchased', 'Satın Alındı')
        : null
  const rawAssignedBots = card.assignedBots || cardData.assignedBots || []
  const rawAssignedTribes = card.assignedTribes || cardData.assignedTribes || []

  const assignedNodes = [
    ...rawAssignedBots.map((b) => ({ type: 'actor', data: b })),
    ...rawAssignedTribes.map((tr) => ({ type: 'tribe', data: tr })),
  ].sort((a, b) => {
    const aDormant = Boolean(a.data?.isDormant ?? a.data?.IsDormant ?? false) ? 1 : 0
    const bDormant = Boolean(b.data?.isDormant ?? b.data?.IsDormant ?? false) ? 1 : 0
    return aDormant - bDormant
  })

  const ownershipCount = cardData.ownershipCount ?? card.ownershipCount
  const assignmentCount = cardData.assignmentCount ?? card.assignmentCount
  const contingency =
    cardData.contingency ??
    card.contingency ??
    card?.ownership?.card?.contingency ??
    card?.ownership?.originalCard?.contingency ??
    null
  const isEn = Boolean(i18n.language && i18n.language.startsWith('en'))

  const detailRows = [
    {
      icon: BotFlashCardsIcon,
      iconSize: 15,
      label: t('card.prompt', 'Kişilik Promptu'),
      value: personalityPrompt || (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-danger)' }}>
          <Crown size={16} /> 
          {t('card.hidden_prompt', 'Gizli (Yalnızca Yaratıcı)')}
        </span>
      ),
      multiline: true,
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 15,
      label: t('card.hint', 'Kart Hint'),
      value: cardHint,
      multiline: true,
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 15,
      label: t('card.tags', 'Etiketler'),
      value: tags.length > 0 ? tags.join(', ') : null,
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 15,
      label: t('card.marketplace_status', 'Marketplace'),
      value:
        cardData.isListedOnMarketplace === null || cardData.isListedOnMarketplace === undefined
          ? null
          : cardData.isListedOnMarketplace
            ? t('common.yes', 'Evet')
            : t('common.no', 'Hayır'),
    },
    {
      icon: BotFlashCardsIcon,
      iconSize: 15,
      label: t('card.price', 'Fiyat'),
      value: cardData.price == null ? null : `${cardData.price} AP`,
    },
    { icon: Users, label: t('card.ownership_count', 'Sahiplik Sayısı'), value: ownershipCount },
    { icon: Bot, label: t('card.assignment_count', 'Atama Sayısı'), value: assignmentCount },
    {
      icon: CardContingencyIcon,
      iconSize: 12,
      label: t('card.initial_contingency', 'Başlangıç Miras Olasılığı'),
      value: formatContingency(contingency, isEn),
    },
    { icon: Hash, label: 'Card ID', value: cardId },
    { icon: Hash, label: 'Ownership ID', value: ownershipId },
    { icon: Hash, label: 'Actor ID', value: actorId },
    { icon: Hash, label: t('card.acquisition_type', 'Edinim Türü'), value: acquisitionType },
    {
      icon: CalendarFold,
      label: t('card.acquired_at', 'Edinilme'),
      value: formatDate(card.acquiredAt),
    },
    {
      icon: CalendarFold,
      label: t('card.created_at', 'Oluşturulma'),
      value: formatDate(cardData.createdAt),
    },
    {
      icon: CalendarFold,
      label: t('card.updated_at', 'Güncellenme'),
      value: formatDate(cardData.updatedAt),
    },
  ]


  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }} role="presentation">
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personality-card-detail-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          maxWidth: 680,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 20px',
          borderRadius: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <ModalHeader
          icon={<BotFlashCardsIcon size={28} style={{ color: 'var(--color-primary)' }} />}
          title={cardName}
          subtitle={t('card.details', 'Kart Detayları')}
          titleId="personality-card-detail-title"
          onClose={onClose}
          style={{ padding: '0 0 14px 0', marginBottom: 16 }}
          actions={
            isOwnerCard ? (
              <IconActionButton
                onClick={() => {
                  onClose()
                  if (onEditClick) {
                    onEditClick(card)
                  } else {
                    const targetId =
                      card?.personalityCardId ||
                      card?.cardId ||
                      card?.card?.personalityCardId ||
                      card?.card?.cardId ||
                      cardData?.personalityCardId ||
                      cardData?.cardId
                    navigate('/cards', { state: { editCardId: targetId, editCard: card } })
                  }
                }}
                aria-label={t('action.edit', 'Düzenle')}
                style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)' }}
              >
                <Edit2 size={17} strokeWidth={2.2} />
              </IconActionButton>
            ) : null
          }
        />

        <div className="card-detail-modal-body" style={{ flex: 1, padding: '0 4px 0 0', maxHeight: 'none' }}>
          <div>
            {detailRows.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </div>

          {assignedNodes.length > 0 && (
            <div style={{ paddingTop: 20 }}>
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: '0 0 10px',
                  color: 'var(--color-text-primary)',
                  fontSize: 14,
                }}
              >
                <Bot size={16} />
                {t('card.assignments', 'Atamalar')}
              </h3>
              <div className="minimal-card-list">
                {assignedNodes.map((node) =>
                  node.type === 'tribe' ? (
                    <TribeMinimalCard
                      key={`assigned-tribe-${node.data.tribeId}`}
                      tribe={node.data}
                      {...node.data}
                      isDormant={node.data.isDormant ?? node.data.IsDormant}
                      assignedCardIds={node.data.assignedCardIds || node.data.AssignedCardIds}
                      showPoint={false}
                      showMemoryMapBtn={false}
                      showEditBtn={false}
                      clickable={true}
                    />
                  ) : (
                    <ActorMinimalCard
                      key={`assigned-actor-${node.data.actorId}`}
                      actor={node.data}
                      showHierarchyBtn={false}
                      showMemoryMapBtn={false}
                      showEditBtn={false}
                      clickable={true}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
