const rawSiteName = import.meta.env?.VITE_SITE_NAME

export const SITE_NAME =
  (typeof rawSiteName === 'string' && rawSiteName.trim()) || 'Bletchly'

export function formatPageTitle(title) {
  const pageTitle = typeof title === 'string' ? title.trim() : ''

  if (!pageTitle || pageTitle === SITE_NAME) return SITE_NAME

  return `${pageTitle} | ${SITE_NAME}`
}
