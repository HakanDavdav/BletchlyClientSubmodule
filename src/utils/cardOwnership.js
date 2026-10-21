export function normalizeCardId(value) {
  if (value == null) return null
  if (typeof value === 'string') return value.toLowerCase()
  const raw =
    value.personalityCardId ??
    value.cardId ??
    value.card?.personalityCardId ??
    value.ownership?.originalCard?.personalityCardId ??
    value.id ??
    null
  return raw == null ? null : String(raw).toLowerCase()
}

export function buildOwnedCardIdSet(ownedCards) {
  const set = new Set()
  if (!ownedCards) return set
  for (const item of ownedCards) {
    const id = normalizeCardId(item)
    if (id) set.add(id)
  }
  return set
}

export function isCardOwned(card, ownedIdSet) {
  if (!card || !ownedIdSet) return false
  const id = normalizeCardId(card)
  return id ? ownedIdSet.has(id) : false
}

export function sortCardsOwnedFirst(cards, ownedIdSet) {
  const list = Array.isArray(cards) ? cards : []
  return [...list].sort((a, b) => {
    const aOwned = isCardOwned(a, ownedIdSet)
    const bOwned = isCardOwned(b, ownedIdSet)
    if (aOwned === bOwned) return 0
    return aOwned ? -1 : 1
  })
}
