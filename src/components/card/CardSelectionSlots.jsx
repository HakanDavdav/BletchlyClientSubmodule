import { useTranslation } from 'react-i18next'
import PersonalityCard from './PersonalityCard'
import { buildOwnedCardIdSet, isCardOwned, normalizeCardId } from '../../utils/cardOwnership'

function getCardId(item) {
  return item?.cardId || item?.personalityCardId || item?.card?.personalityCardId || null
}

function getCard(item) {
  if (!item?.card) return item
  if (
    item.assignmentId ||
    item.botId ||
    item.tribeId ||
    item.assignedTribeId ||
    typeof item.isEffective === 'boolean'
  ) {
    return item
  }
  return {
    ...item.card,
    assignedBots: item.assignedBots || [],
    assignedTribes: item.assignedTribes || [],
  }
}

export default function CardSelectionSlots({
  cards = [],
  selectedCardIds = [],
  onToggle,
  maxSelections,
  disabled = false,
  showHeader = true,
  slotCount = 0,
  lockedCardIds = [],
  tribeAssigned = false,
  tribeBadgeLabel = null,
  assignLockedCardIds = [],
  onToggleAssignLock,
  ownedCardIds = null,
}) {
  const { t } = useTranslation()
  const ownedSet = ownedCardIds ? buildOwnedCardIdSet(ownedCardIds) : null
  const isOwned = (item) => (ownedSet ? isCardOwned(item, ownedSet) : true)

  const baseSelectableCards = cards
    .map((item) => ({ id: getCardId(item), card: getCard(item) }))
    .filter((item) => item.id && item.card)
  const selectableCards = ownedSet
    ? [...baseSelectableCards].sort(
        (a, b) =>
          (ownedSet.has(normalizeCardId(a.id)) ? 0 : 1) -
          (ownedSet.has(normalizeCardId(b.id)) ? 0 : 1)
      )
    : baseSelectableCards

  const lockedSet = new Set((lockedCardIds || []).map(normalizeCardId))
  const selectedSet = new Set((selectedCardIds || []).map(normalizeCardId))
  const assignLockedSet = new Set((assignLockedCardIds || []).map(normalizeCardId))
  const isLockedCard = (item) => lockedSet.has(normalizeCardId(item.id))
  const selectedCount = selectableCards.filter((item) => selectedSet.has(normalizeCardId(item.id))).length
  const totalSlotCount = Math.max(selectableCards.length, slotCount)

  if (selectableCards.length === 0) {
    return (
      <div className="card-selection-slots">
        <p className="text-muted" style={{ margin: slotCount > 0 ? '0 0 12px' : 0 }}>
          {t('common.nothing_here_yet')}
        </p>
        {slotCount > 0 && (
          <div className="personality-card-slots" style={{ '--card-count': slotCount }}>
            {Array.from({ length: slotCount }, (_, index) => (
              <div
                key={index}
                className="personality-card-slot"
                style={{
                  '--slot-count': slotCount,
                  '--slot-index': index,
                  '--slot-rotation': `${slotCount === 1 ? 0 : ((index / (slotCount - 1)) * 2 - 1) * 8}deg`,
                  '--slot-z': slotCount - Math.abs(index - (slotCount - 1) / 2),
                }}
              >
                <PersonalityCard slotNumber={index + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card-selection-slots">
      {showHeader && (
        <div className="card-selection-slots__header">
          <span>{t('card.select_slots')}</span>
          <span className="card-selection-slots__count">
            {selectedCount}
            {maxSelections ? ` / ${maxSelections}` : ''}
          </span>
        </div>
      )}
      <div className="personality-card-slots" style={{ '--card-count': totalSlotCount }}>
        {selectableCards.map(({ id, card }, index) => {
          const locked = isLockedCard({ id })
          const owned = isOwned(card)
          return (
            <div
              key={id}
              className="personality-card-slot"
              style={{
                '--slot-count': totalSlotCount,
                '--slot-index': index,
                '--slot-rotation': `${totalSlotCount === 1 ? 0 : ((index / (totalSlotCount - 1)) * 2 - 1) * 8}deg`,
                '--slot-z': totalSlotCount - Math.abs(index - (totalSlotCount - 1) / 2),
              }}
            >
              <PersonalityCard
                slotNumber={index + 1}
                card={card}
                selectable={owned}
                selected={owned ? selectedSet.has(normalizeCardId(id)) : true}
                locked={false}
                selectionReadOnly={!owned}
                tribeAssigned={tribeAssigned}
                tribeBadgeLabel={tribeBadgeLabel}
                disabled={disabled}
                onSelect={owned ? () => onToggle(id) : undefined}
                maxSelections={maxSelections}
                selectedCount={selectedCount}
                lockable={owned && !!onToggleAssignLock}
                assignLocked={assignLockedSet.has(normalizeCardId(id))}
                onToggleLock={owned ? () => onToggleAssignLock?.(id) : undefined}
              />
            </div>
          )
        })}
        {Array.from({ length: totalSlotCount - selectableCards.length }, (_, emptyIndex) => {
          const index = selectableCards.length + emptyIndex

          return (
            <div
              key={`empty-${index}`}
              className="personality-card-slot"
              style={{
                '--slot-count': totalSlotCount,
                '--slot-index': index,
                '--slot-rotation': `${totalSlotCount === 1 ? 0 : ((index / (totalSlotCount - 1)) * 2 - 1) * 8}deg`,
                '--slot-z': totalSlotCount - Math.abs(index - (totalSlotCount - 1) / 2),
              }}
            >
              <PersonalityCard slotNumber={index + 1} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
