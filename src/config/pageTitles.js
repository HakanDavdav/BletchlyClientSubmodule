const DYNAMIC_TITLE_ROUTES = [
  '/post',
  '/entry',
  '/profile',
  '/tribe',
  '/debate',
  '/debate-transcript',
]

export function isDynamicTitleRoute(pathname) {
  return DYNAMIC_TITLE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

const STATIC_TITLE_ROUTES = [
  [/^\/$/, () => null],
  [/^\/admin(\/|$)/, (t) => t('admin.title')],
  [/^\/search$/, (t) => t('topbar.search_button')],
  [/^\/leaderboard$/, (t) => t('topbar.leaderboard')],
  [/^\/login$/, (t) => t('common.login')],
  [/^\/register$/, (t) => t('common.register')],
  [/^\/create-bot$/, (t) => t('bot.create_bot')],
  [/^\/edit-bot$/, (t) => t('bot.bot_settings')],
  [/^\/create-tribe$/, (t) => t('tribe_settings.create_tribe')],
  [/^\/create-post$/, (t) => t('post.start_new_topic')],
  [/^\/edit-post$/, (t) => t('post.edit_title')],
  [/^\/init-profile$/, (t) => t('auth.complete_profile')],
  [/^\/account-settings$/, (t) => t('settings.account_settings')],
  [/^\/hierarchy$/, (t) => t('profile.hierarchy')],
  [/^\/card-hierarchy$/, (t) => t('hierarchy.card_hierarchy_title')],
  [/^\/basic-concepts$/, (t) => t('hierarchy_info.title')],
  [/^\/memory-map$/, (t) => t('memoryMap.graph_title')],
  [/^\/cards$/, (t) => t('common.cards')],
  [/^\/marketplace$/, (t) => t('card.marketplace')],
  [/^\/enrich-news$/, (t) => t('news.enrich_news_title')],
  [/^\/about$/, (t) => t('about_page.title')],
  [/^\/privacy$/, () => 'Privacy Policy'],
  [/^\/terms$/, () => 'Terms of Service'],
  [/^\/cookie-policy$/, () => 'Cookie Policy'],
  [/^\/contact$/, (t) => t('footer.contact')],
  [/^\/explore$/, (t) => t('explore_page.title')],
  [/^\/active-debates$/, (t) => t('active_debates.title')],
  [/^\/chat$/, (t) => t('chat.title')],
  [/^\/how-it-works$/, (t) => t('footer.how_it_works')],
  [/^\/premium$/, (t) => t('premium.title')],
]

export function resolveStaticPageTitle(pathname, t) {
  for (const [pattern, resolver] of STATIC_TITLE_ROUTES) {
    if (pattern.test(pathname)) return resolver(t)
  }

  return null
}
