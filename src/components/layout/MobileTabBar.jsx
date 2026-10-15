import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Home, Podium, Search, ShieldQuestion, User, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { useTranslation } from 'react-i18next'
import BotFlashCardsIcon from '../common/icons/BotFlashCardsIcon'
import AngryBotWithSwordsIcon from '../common/icons/AngryBotWithSwordsIcon'
import MobilBottomMiddleBotSvg from '../../assets/FigmaNew/MobilBottomMiddleBot.svg?react'

/**
 * MobileTabBar — yalnızca mobil (≤900px) ekranlarda görünen alt gezinme çubuğu.
 * layout.css içindeki `.mobile-tab-bar` kuralları ile gösterilir/gizlenir.
 * Sayfa içi geri butonları mobilde gizlendiği için geri, bu barın solunda yer alır.
 * Barın tam ortasındaki "v" butonu hızlı bağlantı dropdown'ını yukarı açar.
 */
export default function MobileTabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, actorId } = useAuthStore()
  const { closeDrawers } = useUIStore()
  const { t } = useTranslation()
  const path = location.pathname
  const [isQuickOpen, setIsQuickOpen] = useState(false)
  const quickRef = useRef(null)

  // Dışarı tıklayınca kapan
  useEffect(() => {
    if (!isQuickOpen) return undefined
    const handleClick = (e) => {
      if (quickRef.current && !quickRef.current.contains(e.target)) setIsQuickOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isQuickOpen])

  // Rota değişince kapan
  useEffect(() => {
    setIsQuickOpen(false)
  }, [path])

  const goBack = () => {
    closeDrawers()
    if (location.key !== 'default') {
      navigate(-1)
    } else if (path !== '/') {
      navigate('/')
    }
  }

  const isActive = (...paths) => paths.some((p) => path === p || path.startsWith(p + '/'))

  // Drawer'daki "Oturum Açık" altı butonların aynısı (mobilde üst bardan taşındı)
  const quickLinks = [
    {
      key: 'leaderboard',
      label: t('topbar.leaderboard', 'Liderlik Tablosu'),
      icon: <Podium size={19} strokeWidth={2.2} />,
      to: '/leaderboard?type=user',
    },
    {
      key: 'tribes',
      label: t('topbar.tribes', 'Klanlar'),
      icon: <Users size={19} strokeWidth={2.2} />,
      to: '/tribes',
    },
    {
      key: 'debates',
      label: t('topbar.active_debates', 'Aktif Meydan Okumalar'),
      icon: <AngryBotWithSwordsIcon size={19} />,
      to: '/active-debates',
    },
    {
      key: 'marketplace',
      label: t('card.marketplace', 'Kart Marketi'),
      icon: <BotFlashCardsIcon size={19} />,
      to: '/marketplace',
    },
    {
      key: 'guide',
      label: t('bletchly_guide.title'),
      icon: <ShieldQuestion size={19} strokeWidth={2.2} />,
      to: '/how-it-works',
    },
  ]

  const searchParams = new URLSearchParams(location.search)
  const queryActorId = searchParams.get('actorId')
  const isOwnProfile =
    Boolean(isLoggedIn && actorId) &&
    (path === '/profile' || path.startsWith('/profile/')) &&
    (!queryActorId || queryActorId === actorId)
  const isProfileActive = isOwnProfile || isActive('/account-settings', '/init-profile')

  const tabs = [
    {
      key: 'home',
      label: t('tab_bar.home', 'Ana Sayfa'),
      icon: (active) => <Home size={21} strokeWidth={active ? 2.65 : 2.0} />,
      active: path === '/',
      to: '/',
    },
    {
      key: 'search',
      label: t('tab_bar.search', 'Ara'),
      icon: (active) => <Search size={21} strokeWidth={active ? 2.65 : 2.0} />,
      active: isActive('/search'),
      to: '/search',
    },
    {
      key: 'profile',
      label: t('tab_bar.profile', 'Profil'),
      icon: (active) => <User size={21} strokeWidth={active ? 2.65 : 2.0} />,
      active: isProfileActive,
      to: isLoggedIn && actorId ? `/profile?actorId=${actorId}` : '/login',
    },
  ]

  return (
    <nav className="mobile-tab-bar" aria-label={t('tab_bar.nav_label', 'Mobil Gezinme')}>
      <button
        type="button"
        className="mobile-tab-bar__item mobile-tab-bar__item--back"
        onClick={goBack}
        aria-label={t('tab_bar.back', 'Geri')}
      >
        <ArrowLeft size={21} strokeWidth={2.0} />
      </button>
      {tabs.slice(0, 1).map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          className={`mobile-tab-bar__item${tab.active ? ' is-active' : ''}`}
          onClick={closeDrawers}
          aria-label={tab.label}
          aria-current={tab.active ? 'page' : undefined}
        >
          {typeof tab.icon === 'function' ? tab.icon(tab.active) : tab.icon}
        </Link>
      ))}

      {/* Tam ortada: hızlı bağlantı "v" butonu (dropdown yukarı açılır) */}
      <div className="mobile-tab-bar__quick" ref={quickRef}>
        <button
          type="button"
          className={`mobile-tab-bar__quick-btn${isQuickOpen ? ' is-open' : ''}`}
          onClick={() => setIsQuickOpen((v) => !v)}
          aria-label={t('topbar.quick_links', 'Hızlı Bağlantılar')}
          aria-expanded={isQuickOpen}
        >
          {/* Bütünleşik bot ikonu: yön ve renk layout.css ile yönetilir */}
          <span className="mobile-tab-bar__quick-bot" aria-hidden="true">
            <MobilBottomMiddleBotSvg
              width={20}
              height={26}
              style={{ display: 'block' }}
            />
          </span>
        </button>
        <AnimatePresence>
          {isQuickOpen && (
            <motion.div
              className="mobile-drawer-extras__quick mobile-tab-bar__quick-dropdown"
              initial={{ opacity: 0, y: 8, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 8, x: '-50%' }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {quickLinks.map((l) => (
                <Link
                  key={l.key}
                  to={l.to}
                  className="mobile-drawer-quick-link"
                  title={l.label}
                  aria-label={l.label}
                  onClick={() => {
                    setIsQuickOpen(false)
                    closeDrawers()
                  }}
                >
                  {l.icon}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {tabs.slice(1).map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          className={`mobile-tab-bar__item${tab.active ? ' is-active' : ''}`}
          onClick={closeDrawers}
          aria-label={tab.label}
          aria-current={tab.active ? 'page' : undefined}
        >
          {typeof tab.icon === 'function' ? tab.icon(tab.active) : tab.icon}
        </Link>
      ))}
    </nav>
  )
}
