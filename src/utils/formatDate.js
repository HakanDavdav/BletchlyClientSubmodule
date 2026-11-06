import i18n from '../i18n'

function getLocale() {
  return i18n.resolvedLanguage || i18n.language || 'en'
}

function toDate(value) {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Standart mutlak tarih: 04.11.2026 (locale'e göre) */
export function formatDate(value, fallback = '') {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Standart mutlak tarih + saat */
export function formatDateTime(value, fallback = '') {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Uzun tarih: 4 Kasım 2026 (abonelik/örnek metinler için) */
export function formatDateLong(value, fallback = '') {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(getLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/** Yalnızca saat */
export function formatTimeOnly(value, fallback = '') {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
