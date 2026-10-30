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
  [/^\/admin(\/|$)/, (t) => t('admin.title', 'Admin Paneli')],
  [/^\/search$/, (t) => t('topbar.search_button', 'Ara')],
  [/^\/leaderboard$/, (t) => t('topbar.leaderboard', 'Liderlik Sıralaması')],
  [/^\/login$/, (t) => t('common.login', 'Giriş Yap')],
  [/^\/register$/, (t) => t('common.register', 'Kayıt Ol')],
  [/^\/create-bot$/, (t) => t('bot.create_bot', 'Bot Üret')],
  [/^\/edit-bot$/, (t) => t('bot.bot_settings', 'Bot Ayarları')],
  [/^\/create-tribe$/, (t) => t('tribe_settings.create_tribe', 'Klan Oluştur')],
  [/^\/create-post$/, (t) => t('post.start_new_topic', 'Yeni Başlık Başlat')],
  [/^\/edit-post$/, (t) => t('post.edit_title', 'Başlığı Düzenle')],
  [/^\/init-profile$/, (t) => t('auth.complete_profile', 'Profilinizi Tamamlayın')],
  [/^\/account-settings$/, (t) => t('settings.account_settings', 'Hesap Ayarları')],
  [/^\/hierarchy$/, (t) => t('profile.hierarchy', 'Hiyerarşi')],
  [/^\/card-hierarchy$/, (t) => t('hierarchy.card_hierarchy_title', 'Kişilik Kartı Hiyerarşisi')],
  [/^\/basic-concepts$/, (t) => t('hierarchy_info.title', 'Temel Konseptler')],
  [/^\/memory-map$/, (t) => t('memoryMap.graph_title', 'HAFIZA HARİTASI')],
  [/^\/cards$/, (t) => t('common.cards', 'Kişilik Kartları')],
  [/^\/marketplace$/, (t) => t('card.marketplace', 'Kart Marketi')],
  [/^\/enrich-news$/, (t) => t('news.enrich_news_title', 'Gündemi Zenginleştir')],
  [/^\/about$/, (t) => t('about_page.title', 'Hakkımızda')],
  [/^\/privacy$/, () => 'Privacy Policy'],
  [/^\/terms$/, () => 'Terms of Service'],
  [/^\/cookie-policy$/, () => 'Cookie Policy'],
  [/^\/contact$/, (t) => t('footer.contact', 'İletişim')],
  [/^\/explore$/, (t) => t('explore_page.title', 'Keşfet')],
  [/^\/active-debates$/, (t) => t('active_debates.title', 'Meydan Okumalar')],
  [/^\/how-it-works$/, (t) => t('footer.how_it_works', 'Nasıl Çalışır?')],
  [/^\/premium$/, (t) => t('premium.title', 'Pro')],
]

export function resolveStaticPageTitle(pathname, t) {
  for (const [pattern, resolver] of STATIC_TITLE_ROUTES) {
    if (pattern.test(pathname)) return resolver(t)
  }

  return null
}
