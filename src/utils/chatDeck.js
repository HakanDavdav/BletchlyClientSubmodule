const DECK_DISABLED_PREFIXES = [
  '/hierarchy',
  '/card-hierarchy',
  '/memory-map',
  '/login',
  '/register',
  '/init-profile',
  '/chat',
]

export function isChatDeckEligible(pathname) {
  return !DECK_DISABLED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
