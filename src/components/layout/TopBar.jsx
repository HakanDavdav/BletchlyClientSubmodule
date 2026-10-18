import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Settings,
  User,
  Bell,
  LogOut,
  PenLine,
  Filter,
  ThumbsUp,
  Podium,
  Sun,
  Moon,
  Bot,
  CirclePlus,
  PaintbrushVertical,
  Edit2,
  Lock,
  X,
  Users,
  Brain,
  ShieldQuestion,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { tribeApi } from '../../api/tribeApi'
import { searchApi } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { OrderType, OrderTypeLabels, UserCapabilities } from '../../constants/enums'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import PostMinimalCard from '../content/PostMinimalCard'
import ActorAvatar from '../actor/ActorAvatar'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import useThemeStore from '../../store/themeStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useIsMobile from '../../hooks/useIsMobile'
import useDevLog from '../../utils/useDevLog'
import BotFlashCardsIcon from '../common/icons/BotFlashCardsIcon'
import IconActionButton from '../common/IconActionButton'
import AngryBotWithSwordsIcon from '../common/icons/AngryBotWithSwordsIcon'
import Logo from '../common/icons/Logo'
import FossilTogglePill from '../common/FossilTogglePill'
import { applyCustomColorVars, clearCustomColorVars, normalizeHex } from '../../utils/themeColor'

function PaletteLockedSlash({ size = '100%', strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55))',
      }}
    >
      <line
        x1="2.5"
        y1="21.5"
        x2="21.5"
        y2="2.5"
        stroke="var(--color-warning)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}

const COLOR_PRESETS = [
  { color: '#3b82f6', label: 'Mavi', isDefault: true },
  { color: '#10b981', label: 'Yeşil', isDefault: true },
  { color: '#ec4899', label: 'Pembe', isDefault: true },
  { color: '#8b5cf6', label: 'Mor' },
  { color: '#06b6d4', label: 'Turkuaz' },
  { color: '#f97316', label: 'Turuncu' },
  { color: '#ef4444', label: 'Kırmızı' },
  { color: '#eab308', label: 'Sarı' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#6366f1', label: 'İndigo' },
]

export default function TopBar({ pendingInvitation = null, onOpenInvitation }) {
  useDevLog('TopBar', arguments[0] || {})
  const hasPendingInvitation = Boolean(pendingInvitation)
  const [inviteSecondsLeft, setInviteSecondsLeft] = useState(null)

  useEffect(() => {
    if (!pendingInvitation) {
      setInviteSecondsLeft(null)
      return
    }
    const computeRemaining = () => {
      const createdMs = pendingInvitation.createdAt
        ? new Date(pendingInvitation.createdAt).getTime()
        : Date.now()
      const elapsed = Number.isNaN(createdMs) ? 0 : Math.floor((Date.now() - createdMs) / 1000)
      return Math.max(0, 120 - elapsed)
    }
    setInviteSecondsLeft(computeRemaining())
    const interval = setInterval(() => setInviteSecondsLeft(computeRemaining()), 1000)
    return () => clearInterval(interval)
  }, [pendingInvitation])
  const { actorId, isLoggedIn, isAdmin, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: seasonStatus } = useQuery({
    queryKey: ['seasonStatus'],
    queryFn: async () => {
      try {
        const res = await searchApi.getSeasonStatus()
        return res.data?.data || null
      } catch (err) {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
  const {
    setSearchMode,
    searchMode,
    activeLeftCacheType,
    setActiveLeftCacheType,
  } = useUIStore()
  const langs = [
    { code: 'tr', label: 'Türkçe', flagUrl: 'https://flagcdn.com/tr.svg' },
    { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/us.svg' },
    { code: 'ja', label: '日本語', flagUrl: 'https://flagcdn.com/jp.svg' },
    { code: 'hi', label: 'हिन्दी', flagUrl: 'https://flagcdn.com/in.svg' },
    { code: 'de', label: 'Deutsch', flagUrl: 'https://flagcdn.com/de.svg' },
    { code: 'fr', label: 'Français', flagUrl: 'https://flagcdn.com/fr.svg' },
    { code: 'ar', label: 'العربية', flagUrl: 'https://flagcdn.com/sa.svg' },
  ]

  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
  const rawLang = (i18n.language || 'tr').toLowerCase()
  const activeLangObj =
    langs.find((l) => l.code === rawLang || l.code === rawLang.split('-')[0]) || langs[0]
  const currentLang = activeLangObj.code

  const { isDarkMode, toggleTheme, isGreenMode, customColor, selectThemeColor, savedCustomColor, setSavedCustomColor } =
    useThemeStore()
  const [isBotShaking, setIsBotShaking] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [langDropdownPos, setLangDropdownPos] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMyTribesOpen, setIsMyTribesOpen] = useState(false)
  const [searchModeDropdown, setSearchModeDropdown] = useState(false)
  const [isMyBotsOpen, setIsMyBotsOpen] = useState(false)
  // Fosil (dormant) klan/botlar varsayılan olarak dropdownlarda gizli;
  // butonla açılınca listelenir.
  const [showFossilTribes, setShowFossilTribes] = useState(false)
  const [showFossilBots, setShowFossilBots] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [tribesDropdownPos, setTribesDropdownPos] = useState(null)
  const [botsDropdownPos, setBotsDropdownPos] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  const [filterOrderType, setFilterOrderType] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  const handleOrderTypeChange = (e) => {
    const val = e.target.value
    setFilterOrderType(val)
  }

  const handleBotClick = () => {
    setIsBotShaking(true)
    setTimeout(() => setIsBotShaking(false), 500)
    setIsPaletteOpen((v) => !v)
  }

  const applyPaletteColor = useCallback(
    (color) => {
      selectThemeColor(color)
    },
    [selectThemeColor]
  )

  const queryClient = useQueryClient()
  const myTribesRef = useRef(null)
  const myBotsRef = useRef(null)
  const filterRef = useRef(null)
  const searchRef = useRef(null)
  const langRef = useRef(null)
  const paletteRef = useRef(null)
  const colorInputRef = useRef(null)
  const colorRafRef = useRef(null)
  const pendingPreviewColorRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const suppressSuggestionsRef = useRef(false)

  // My Tribes & Bots from Global State
  const {
    myTribes,
    myBots,
    fetchMyTribes,
    fetchMyBots,
    fetchMyFollowData,
    fetchMyCards,
    fetchMySettings,
    hasFetchedOnce,
    clear: clearEntities,
  } = useMyEntitiesStore()

  const sortedMyTribes = useMemo(() => {
    if (!myTribes || !myTribes.length) return []
    return [...myTribes].sort((a, b) => {
      const aDormant = Boolean(a?.isDormant ?? a?.IsDormant ?? false) ? 1 : 0
      const bDormant = Boolean(b?.isDormant ?? b?.IsDormant ?? false) ? 1 : 0
      return aDormant - bDormant
    })
  }, [myTribes])

  const sortedMyBots = useMemo(() => {
    if (!myBots || !myBots.length) return []
    return [...myBots].sort((a, b) => {
      const aDormant = Boolean(a?.isDormant ?? a?.IsDormant ?? false) ? 1 : 0
      const bDormant = Boolean(b?.isDormant ?? b?.IsDormant ?? false) ? 1 : 0
      return aDormant - bDormant
    })
  }, [myBots])

  // Varsayılan: fosil klan/botlar gizli. Buton açıkken tümü listelenir.
  const visibleMyTribes = useMemo(
    () =>
      showFossilTribes
        ? sortedMyTribes
        : sortedMyTribes.filter((t) => !(t?.isDormant ?? t?.IsDormant ?? false)),
    [sortedMyTribes, showFossilTribes]
  )

  const visibleMyBots = useMemo(
    () =>
      showFossilBots
        ? sortedMyBots
        : sortedMyBots.filter((b) => !(b?.isDormant ?? b?.IsDormant ?? false)),
    [sortedMyBots, showFossilBots]
  )

  const fossilTribeCount = useMemo(
    () => sortedMyTribes.filter((t) => t?.isDormant ?? t?.IsDormant ?? false).length,
    [sortedMyTribes]
  )

  const fossilBotCount = useMemo(
    () => sortedMyBots.filter((b) => b?.isDormant ?? b?.IsDormant ?? false).length,
    [sortedMyBots]
  )

  useEffect(() => {
    if (isLoggedIn && !hasFetchedOnce) {
      fetchMyTribes()
      fetchMyBots()
      fetchMyFollowData()
      fetchMyCards()
      fetchMySettings()
    }
  }, [isLoggedIn, hasFetchedOnce, fetchMyTribes, fetchMyBots, fetchMyFollowData, fetchMyCards, fetchMySettings])

  // Current user profile
  const { data: myProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((r) => r.data?.data ?? null),
    enabled: !!actorId && isLoggedIn,
  })

  const userCapabilities = Number(
    myProfile?.userSettings?.userCapabilities ?? UserCapabilities.Default
  )
  const isPremium = (userCapabilities & UserCapabilities.Premium) === UserCapabilities.Premium

  // Renk seçici sürüklenirken store'a yazmadan CSS değişkenlerini doğrudan DOM'a
  // rAF ile yazar (en fazla çerçeve başına bir kez); seçim bırakılınca store'a commit edilir.
  const cancelColorPreview = useCallback(() => {
    if (colorRafRef.current) {
      cancelAnimationFrame(colorRafRef.current)
      colorRafRef.current = null
    }
    pendingPreviewColorRef.current = null
  }, [])

  const previewCustomColor = useCallback(
    (color) => {
      pendingPreviewColorRef.current = color
      if (colorRafRef.current) return
      colorRafRef.current = requestAnimationFrame(() => {
        colorRafRef.current = null
        applyCustomColorVars(pendingPreviewColorRef.current, isDarkMode)
      })
    },
    [isDarkMode]
  )

  const commitCustomColor = useCallback(
    (color) => {
      if (colorRafRef.current) {
        cancelAnimationFrame(colorRafRef.current)
        colorRafRef.current = null
      }
      pendingPreviewColorRef.current = null
      const normalized = normalizeHex(color)
      if (!normalized) return
      if (normalized === '#10b981') {
        clearCustomColorVars(true)
      } else if (normalized === '#3b82f6') {
        clearCustomColorVars(false)
      } else {
        applyCustomColorVars(normalized, isDarkMode)
        setSavedCustomColor(normalized)
      }
      applyPaletteColor(normalized)
    },
    [applyPaletteColor, isDarkMode, setSavedCustomColor]
  )

  useEffect(() => {
    const input = colorInputRef.current
    if (!input || !isPaletteOpen || !isPremium) return undefined
    const handleInput = (event) => previewCustomColor(event.target.value)
    const handleCommit = (event) => commitCustomColor(event.target.value)
    input.addEventListener('input', handleInput)
    input.addEventListener('change', handleCommit)
    input.addEventListener('blur', handleCommit)
    return () => {
      input.removeEventListener('input', handleInput)
      input.removeEventListener('change', handleCommit)
      input.removeEventListener('blur', handleCommit)
      if (colorRafRef.current) {
        cancelAnimationFrame(colorRafRef.current)
        colorRafRef.current = null
      }
    }
  }, [isPaletteOpen, isPremium, previewCustomColor, commitCustomColor])

  useEffect(() => {
    const input = colorInputRef.current
    if (!input || pendingPreviewColorRef.current) return
    const next = customColor || (isGreenMode ? '#10b981' : '#3b82f6')
    if (input.value !== next) input.value = next
  }, [customColor, isGreenMode, isPaletteOpen])

  // Palet kapanırken (dışarı tıklama vb.) yerel değişkenlere yazılmış ama
  // store'a commit edilmemiş önizleme rengi varsa kalıcı hale getir.
  useEffect(() => {
    if (isPaletteOpen || !pendingPreviewColorRef.current) return
    commitCustomColor(pendingPreviewColorRef.current)
  }, [isPaletteOpen, commitCustomColor])

  const logoutMutation = useMutation({
    mutationFn: () => identityApi.logout(),
    meta: { showErrorToast: true },
    onSuccess: () => {
      storeLogout()
      clearEntities()
      queryClient.clear()
      navigate('/')
    },
  })

  // Clear MostLiked filter when switching to actors or tribes mode
  useEffect(() => {
    if ((searchMode === 'actors' || searchMode === 'tribes') && filterOrderType === 'MostLiked') {
      setFilterOrderType('')
    }
  }, [searchMode, filterOrderType])

  // Dışarı tıklayınca kapan
  useEffect(() => {
    const handler = (e) => {
      if (myTribesRef.current && !myTribesRef.current.contains(e.target)) {
        setIsMyTribesOpen(false)
        setTribesDropdownPos(null)
      }
      if (myBotsRef.current && !myBotsRef.current.contains(e.target)) {
        setIsMyBotsOpen(false)
        setBotsDropdownPos(null)
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setIsLangOpen(false)
      }
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setIsPaletteOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sayfa değiştiğinde arama önerilerini kapat
  useEffect(() => {
    setShowSuggestions(false)
  }, [location.pathname, location.search])

  // Debounced search suggestions
  useEffect(() => {
    // Önceki timer'ı temizle
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Eğer query boş veya çok kısaysa suggestions'ı temizle
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions(null)
      setShowSuggestions(false)
      setIsLoadingSuggestions(false)
      return
    }

    // 500ms bekle, sonra API çağrısı yap
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        let result
        switch (searchMode) {
          case 'posts':
            result = await searchApi.filterPosts({
              query: searchQuery,
              orderType: filterOrderType || 'None',
              startDate: filterStartDate || null,
              endDate: filterEndDate || null,
            })
            setSuggestions({ posts: result.data?.data || [] })
            break
          case 'actors':
            result = await searchApi.filterActors({
              query: searchQuery,
              orderType: filterOrderType || 'None',
              startDate: filterStartDate || null,
              endDate: filterEndDate || null,
            })
            setSuggestions({ actors: result.data?.data || [] })
            break
          case 'tribes':
            result = await searchApi.filterTribes({
              query: searchQuery,
              orderType: filterOrderType || 'None',
              startDate: filterStartDate || null,
              endDate: filterEndDate || null,
            })
            setSuggestions({ tribes: result.data?.data || [] })
            break
          default: // general
            result = await searchApi.general(searchQuery)
            const data = result.data?.data
            console.log('General search response:', data)
            setSuggestions({
              posts: data?.posts || data?.Posts || [],
              actors: data?.actors || data?.Actors || [],
              tribes: data?.tribes || data?.Tribes || [],
            })
            break
        }
        if (!suppressSuggestionsRef.current) setShowSuggestions(true)
      } catch (error) {
        console.error('Suggestion error:', error)
        setSuggestions(null)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, searchMode, filterOrderType, filterStartDate, filterEndDate])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim() && searchMode === 'general') return

    console.log('handleSearch - filterOrderType:', filterOrderType)

    const params =
      searchMode === 'general'
        ? { query: searchQuery, mode: searchMode }
        : {
            query: searchQuery,
            mode: searchMode,
            orderType: filterOrderType || 'None',
            startDate: filterStartDate || null,
            endDate: filterEndDate || null,
          }

    console.log('handleSearch - params:', params)

    // Transform search parameters to URL query params
    const searchParams = new URLSearchParams()
    if (params.query) searchParams.append('query', params.query)
    if (params.mode) searchParams.append('mode', params.mode)
    if (params.orderType) searchParams.append('orderType', params.orderType)
    if (params.startDate) searchParams.append('startDate', params.startDate)
    if (params.endDate) searchParams.append('endDate', params.endDate)
    navigate('/search?' + searchParams.toString())
    // setSearchQuery('') // keep query after search
    setShowSuggestions(false)
    setIsFilterOpen(false)
  }

  const searchModeOptions = [
    { key: 'general', label: t('search.mode.general', 'Genel') },
    { key: 'posts', label: t('search.mode.posts', 'Başlıklar') },
    { key: 'actors', label: t('search.mode.actors', 'Kişiler') },
    { key: 'tribes', label: t('search.mode.tribes', 'Klanlar') },
  ]

  return (
    <header className="layout-topbar">
      {/* ─── Row 1 ─── */}
      <div
        className="topbar-row topbar-row-1"
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          borderBottom: '1px solid var(--color-border-light)',
        }}
      >
        {/* Bletchly Logo Resized & Season Countdown */}
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0, // Sıfır boşluk
              cursor: 'pointer',
              flexShrink: 0,
              position: 'relative',
              zIndex: 3,
              transform: 'scale(0.85)',
              transformOrigin: 'left center',
              textDecoration: 'none',
            }}
          >
            <Logo width={36} height={48} fill="var(--color-primary)" />
            {!isMobile && (
              <span
                className="topbar-brand-text"
                style={{
                  fontWeight: 800,
                  fontSize: 26,
                  color: 'var(--color-primary)',
                  marginTop: 4,
                  marginLeft: -2,
                }}
              >
                letchly
              </span>
            )}
          </Link>

          {seasonStatus && typeof seasonStatus.daysRemaining === 'number' && (
            <Link
              to="/leaderboard"
              className="season-remaining-badge season-remaining-badge--floating"
              style={{ textDecoration: 'none' }}
            >
              <span>
                {seasonStatus.daysRemaining > 0
                  ? t('common.days_remaining_short', { count: seasonStatus.daysRemaining, defaultValue: `${seasonStatus.daysRemaining} GÜN!` })
                  : t('common.hours_remaining_short', { count: seasonStatus.hoursRemaining ?? 0, defaultValue: `${seasonStatus.hoursRemaining ?? 0} SAAT!` })}
              </span>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <form
          className="topbar-search-form"
          onSubmit={handleSearch}
          style={{
            flex: 1,
            display: 'flex',
            gap: 6,
            maxWidth: 540,
            margin: '0 auto',
            // transform yerine relative/left: transform stacking context yaratıp
            // öneri dropdown'ını Klanlar/Botlar dropdown'ının altına düşürüyordu
            position: 'relative',
            left: 8,
          }}
        >
          {/* Mode selector */}
          <div className="topbar-search-mode" style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSearchModeDropdown((v) => !v)}
              style={{ gap: 4, whiteSpace: 'nowrap' }}
            >
              {searchModeOptions.find((o) => o.key === searchMode)?.label}
              <span
                style={{
                  fontSize: 9,
                  display: 'inline-block',
                  transform: searchModeDropdown ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                ▼
              </span>
            </button>
            <AnimatePresence>
              {searchModeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 200,
                    minWidth: 110,
                  }}
                >
                  {searchModeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        fontSize: 13,
                      }}
                      onClick={() => {
                        setSearchMode(opt.key)
                        setSearchModeDropdown(false)
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flex: 1, position: 'relative' }} ref={searchRef}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-faint)',
                zIndex: 1,
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder={t('topbar.search', 'Ara')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => {
                if (suggestions && !suppressSuggestionsRef.current) setShowSuggestions(true)
              }}
            />

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && !isFilterOpen && (suggestions || isLoadingSuggestions) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 300,
                    maxHeight: 400,
                    overflowY: 'auto',
                  }}
                >
                  {isLoadingSuggestions ? (
                    <div style={{ padding: 16, textAlign: 'center' }}>
                      <div className="spinner spinner-sm" />
                    </div>
                  ) : suggestions ? (
                    <div style={{ padding: 8 }}>
                      {searchMode === 'general' ? (
                        <>
                          {suggestions.actors?.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'var(--color-text-faint)',
                                  padding: '4px 8px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {t('common.actors', 'Kişiler')}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {suggestions.actors.slice(0, 3).map((actor) => (
                                  <div
                                    key={actor.actorId}
                                    className="lb-card"
                                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                                    onClick={() => {
                                      setSearchQuery('')
                                      setShowSuggestions(false)
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <ActorMinimalCard actor={actor} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestions.tribes?.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'var(--color-text-faint)',
                                  padding: '4px 8px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {t('common.tribes', 'Klanlar')}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {suggestions.tribes.slice(0, 3).map((tribe) => (
                                  <div
                                    key={tribe.tribeId}
                                    onClick={() => {
                                      setSearchQuery('')
                                      setShowSuggestions(false)
                                    }}
                                  >
                                    <TribeMinimalCard {...tribe} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestions.posts?.length > 0 && (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'var(--color-text-faint)',
                                  padding: '4px 8px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {t('common.posts', 'Başlıklar')}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {suggestions.posts.slice(0, 4).map((post) => (
                                  <div
                                    key={post.contentItemId}
                                    onClick={() => {
                                      setSearchQuery('')
                                      setShowSuggestions(false)
                                    }}
                                  >
                                    <PostMinimalCard {...post} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(!suggestions.posts || suggestions.posts.length === 0) &&
                            (!suggestions.actors || suggestions.actors.length === 0) &&
                            (!suggestions.tribes || suggestions.tribes.length === 0) && (
                              <div
                                style={{
                                  padding: 16,
                                  textAlign: 'center',
                                  color: 'var(--color-text-faint)',
                                  fontSize: 13,
                                }}
                              >
                                {t('search.no_results', 'Sonuç bulunamadı')}
                              </div>
                            )}
                        </>
                      ) : (
                        <>
                          {/* Specific mode suggestions */}
                          {searchMode === 'posts' && suggestions.posts?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {suggestions.posts.map((post) => (
                                <div
                                  key={post.contentItemId}
                                  onClick={() => {
                                    setSearchQuery('')
                                    setShowSuggestions(false)
                                  }}
                                >
                                  <PostMinimalCard {...post} />
                                </div>
                              ))}
                            </div>
                          )}

                          {searchMode === 'actors' && suggestions.actors?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {suggestions.actors.map((actor) => (
                                <div
                                  key={actor.actorId}
                                  className="lb-card"
                                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                                  onClick={() => {
                                    setSearchQuery('')
                                    setShowSuggestions(false)
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <ActorMinimalCard actor={actor} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {searchMode === 'tribes' && suggestions.tribes?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {suggestions.tribes.map((tribe) => (
                                <div
                                  key={tribe.tribeId}
                                  onClick={() => {
                                    setSearchQuery('')
                                    setShowSuggestions(false)
                                  }}
                                >
                                  <TribeMinimalCard {...tribe} />
                                </div>
                              ))}
                            </div>
                          )}

                          {((searchMode === 'posts' &&
                            (!suggestions.posts || suggestions.posts.length === 0)) ||
                            (searchMode === 'actors' &&
                              (!suggestions.actors || suggestions.actors.length === 0)) ||
                            (searchMode === 'tribes' &&
                              (!suggestions.tribes || suggestions.tribes.length === 0))) && (
                            <div
                              style={{
                                padding: 16,
                                textAlign: 'center',
                                color: 'var(--color-text-faint)',
                                fontSize: 13,
                              }}
                            >
                              {t('search.no_results', 'Sonuç bulunamadı')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter button */}
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              type="button"
              className="btn btn-outline btn-sm btn-icon"
              disabled={searchMode === 'general'}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                borderColor:
                  filterOrderType || filterStartDate || filterEndDate
                    ? 'var(--color-primary)'
                    : undefined,
              }}
              aria-label={
                searchMode === 'general'
                  ? t('topbar.general_search_no_filter')
                  : t('topbar.search_filters')
              }
            >
              <Filter
                size={14}
                color={
                  filterOrderType || filterStartDate || filterEndDate
                    ? 'var(--color-primary)'
                    : 'currentColor'
                }
                fill={
                  filterOrderType || filterStartDate || filterEndDate
                    ? 'var(--color-primary)'
                    : 'none'
                }
              />
            </button>
            {(filterOrderType || filterStartDate || filterEndDate) && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  suppressSuggestionsRef.current = true
                  setTimeout(() => {
                    suppressSuggestionsRef.current = false
                  }, 300)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setFilterOrderType('')
                  setFilterStartDate('')
                  setFilterEndDate('')
                  setShowSuggestions(false)
                }}
                aria-label={t('common.clear_all', 'Tümünü Temizle')}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  transform: 'none',
                  marginTop: 0,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 14,
                  height: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  zIndex: 10,
                }}
              >
                <X size={10} strokeWidth={3} />
              </button>
            )}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 200,
                    minWidth: 220,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      borderBottom: '1px solid var(--color-border-light)',
                      paddingBottom: 6,
                    }}
                  >
                    <span>{t('search.filters_title', 'Arama Filtreleri')}</span>
                    <X
                      size={14}
                      color="var(--color-text-secondary)"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setIsFilterOpen(false)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.sort_by', 'Sıralama')}
                    </label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <select
                        className="input"
                        style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                        value={filterOrderType}
                        onChange={handleOrderTypeChange}
                      >
                        <option value="">{t('search.none', 'Yok')}</option>
                        {searchMode === 'posts' && (
                          <option value="MostLiked">
                            {t('topbar.most_liked', 'En Çok Beğenilen')}
                          </option>
                        )}
                        <option value="Newest">{t('sort.newest')}</option>
                        <option value="Oldest">{t('topbar.oldest', 'En Eski')}</option>
                      </select>
                      {filterOrderType && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                          onClick={() => {
                            // Using the same manual change event pattern if needed, but direct state update might be enough.
                            // The select uses handleOrderTypeChange, let's just create a synthetic event or call it if it takes an event,
                            // or just do handleOrderTypeChange({ target: { value: '' } })
                            handleOrderTypeChange({ target: { value: '' } })
                          }}
                          aria-label={t('common.clear', 'Temizle')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.start_date', 'Başlangıç Tarihi')}
                    </label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="date"
                        className="input"
                        style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                      />
                      {filterStartDate && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                          onClick={() => setFilterStartDate('')}
                          aria-label={t('common.clear', 'Temizle')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.end_date', 'Bitiş Tarihi')}
                    </label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="date"
                        className="input"
                        style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                      />
                      {filterEndDate && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                          onClick={() => setFilterEndDate('')}
                          aria-label={t('common.clear', 'Temizle')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ara butonu */}
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', marginTop: 4, paddingTop: 7, paddingBottom: 7 }}
                  >
                    {t('topbar.search_button', 'Ara')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            {t('topbar.search_button', 'Ara')}
          </button>
        </form>

        {/* Mobil arama ikonu (≤900px) */}
        <Link
          to="/search"
          className="btn-icon topbar-search-icon-btn"
          style={{ textDecoration: 'none' }}
          aria-label={t('topbar.search')}
        >
          <Search size={20} />
        </Link>

        {/* Right: user info */}
        <div
          className="topbar-right-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            marginLeft: 'auto',
          }}
        >
          {/* Hakan Davdav Linkleri */}
          <div
            className="hide-under-900"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {/* 1355px altında gizlenir */}
            <div
              className="hide-under-1355"
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Hakan Davdav
            </span>
            <a
              href="https://www.linkedin.com/in/hakan-davdav-0ba19629a/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                transform: 'translateY(-1px)',
              }}
              aria-label="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href="https://github.com/HakanDavdav"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                transform: 'translateY(-1px)',
              }}
              aria-label="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
                <path d="M9 18c-4.5 1.5-5-2.5-7-3" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/hakandavdav/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                transform: 'translateY(-1px)',
              }}
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            </div>
            <div
              style={{ width: 1, height: 28, background: 'var(--color-border)', margin: '0 4px' }}
            />

            <div style={{ position: 'relative' }} ref={paletteRef}>
              <button
                className={`btn-icon ${isBotShaking ? 'theme-toggle-shake' : ''}`}
                onClick={handleBotClick}
                aria-label={t('topbar.premium_palette_title', 'Özel Renk Paleti')}
                title={t('topbar.premium_palette_title', 'Özel Renk Paleti')}
                style={{ color: 'var(--color-primary)', height: 30, padding: '0 2px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <Bot size={18} strokeWidth={2.4} />
                  <PaintbrushVertical size={15} strokeWidth={2.2} style={{ marginLeft: -5 }} />
                </span>
              </button>

              <AnimatePresence>
                {isPaletteOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 6,
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 250,
                      width: 152,
                      padding: 8,
                    }}
                  >
                    <div
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}
                    >
                      {COLOR_PRESETS.map((preset) => {
                        const activeBase = customColor || (isGreenMode ? '#10b981' : '#3b82f6')
                        const locked = !isPremium && !preset.isDefault
                        return (
                          <button
                            key={preset.color}
                            type="button"
                            disabled={locked}
                            aria-disabled={locked || undefined}
                            onClick={() => {
                              if (locked) return
                              cancelColorPreview()
                              applyPaletteColor(preset.color)
                            }}
                            aria-label={preset.label}
                            style={{
                              position: 'relative',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: preset.color,
                              border: `2px solid ${
                                activeBase === preset.color
                                  ? 'var(--color-text-primary)'
                                  : 'transparent'
                              }`,
                              cursor: locked ? 'not-allowed' : 'pointer',
                              opacity: locked ? 0.6 : 1,
                              padding: 0,
                            }}
                          >
                            {locked && (
                              <PaletteLockedSlash strokeWidth={2.2} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                      {savedCustomColor && (
                        <button
                          type="button"
                          disabled={!isPremium}
                          aria-disabled={!isPremium || undefined}
                          aria-label={t('topbar.premium_palette_saved', 'Kayıtlı renk')}
                          title={t('topbar.premium_palette_saved', 'Kayıtlı renk')}
                          onClick={() => {
                            if (!isPremium) return
                            cancelColorPreview()
                            applyPaletteColor(savedCustomColor)
                          }}
                          style={{
                            position: 'relative',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: savedCustomColor,
                            border: `2px solid ${
                              customColor === savedCustomColor
                                ? 'var(--color-text-primary)'
                                : 'transparent'
                            }`,
                            cursor: !isPremium ? 'not-allowed' : 'pointer',
                            opacity: !isPremium ? 0.6 : 1,
                            padding: 0,
                          }}
                        >
                          {!isPremium && (
                            <PaletteLockedSlash strokeWidth={2.2} />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!isPremium}
                        aria-disabled={!isPremium || undefined}
                        aria-label={t('topbar.premium_palette_custom', 'Custom')}
                        title={t('topbar.premium_palette_custom', 'Custom')}
                        onClick={() => {
                          if (!isPremium) return
                          colorInputRef.current?.click()
                        }}
                        style={{
                          position: 'relative',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: !isPremium ? 'not-allowed' : 'pointer',
                          opacity: !isPremium ? 0.65 : 1,
                          padding: 0,
                        }}
                      >
                        <Edit2 size={12} />
                        {!isPremium && (
                          <PaletteLockedSlash strokeWidth={2.2} />
                        )}
                      </button>
                      <input
                        ref={colorInputRef}
                        type="color"
                        defaultValue={customColor || (isGreenMode ? '#10b981' : '#3b82f6')}
                        style={{
                          position: 'absolute',
                          width: 0,
                          height: 0,
                          opacity: 0,
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              className="btn-icon"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Açık Tema' : 'Koyu Tema'}
              style={{
                color: customColor || (isGreenMode ? '#10b981' : '#3b82f6'),
                width: 30,
                height: 30,
                padding: 0,
              }}
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language Selector */}
            <div style={{ position: 'relative' }} ref={langRef}>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setIsLangOpen((v) => !v)}
                style={{
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 5px',
                  height: 30,
                }}
              >
                {activeLangObj.flagUrl ? (
                  <img
                    src={activeLangObj.flagUrl}
                    alt={activeLangObj.code}
                    style={{ width: 19, height: 14, borderRadius: 2 }}
                  />
                ) : (
                  <span style={{ fontSize: 14 }}>{activeLangObj.fallbackEmoji || '🇹🇷'}</span>
                )}
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 200,
                      minWidth: 115,
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {langs.map((l) => (
                      <button
                        key={l.code}
                        className={`btn ${currentLang === l.code ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '5px 10px',
                          gap: 7,
                        }}
                        onClick={() => {
                          i18n.changeLanguage(l.code)
                          setIsLangOpen(false)
                        }}
                      >
                        {l.flagUrl ? (
                          <img
                            src={l.flagUrl}
                            alt={l.code}
                            style={{ width: 19, height: 14, borderRadius: 2 }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 14,
                              display: 'inline-block',
                              width: 19,
                              textAlign: 'center',
                            }}
                          >
                            {l.fallbackEmoji}
                          </span>
                        )}
                        <span style={{ fontSize: 12.5 }}>{l.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{ width: 1, height: 28, background: 'var(--color-border)', margin: '0 4px' }}
            />
          </div>

          {/* Mobil: tema (koyu/açık, mavi/yeşil) ve dil kontrolleri avatarın solunda */}
          {isMobile && <MobileTopbarControls />}

          {isLoggedIn ? (
            <>
              <div
                className={hasPendingInvitation ? 'topbar-invite-chip' : undefined}
                style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
                onClickCapture={
                  hasPendingInvitation
                    ? (event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onOpenInvitation?.()
                      }
                    : undefined
                }
              >
                {isMobile ? (
                  <ActorAvatar
                    profileName={myProfile?.profileName}
                    imageUrl={myProfile?.imageUrl}
                    discriminator={myProfile?.discriminator}
                    actorId={myProfile?.actorId || actorId}
                    size="md"
                    hideBadge={hasPendingInvitation}
                    onClick={
                      location.pathname !== '/init-profile'
                        ? () => navigate(`/profile?actorId=${myProfile?.actorId || actorId}`)
                        : undefined
                    }
                  />
                ) : (
                  <ActorMinimalCard
                    actor={myProfile}
                    showHierarchyBtn={false}
                    clickable={location.pathname !== '/init-profile'}
                    showEditBtn={location.pathname !== '/init-profile'}
                    chipStyle={{ minWidth: 110, maxWidth: 255, fontSize: 12.5 }}
                  />
                )}
                {hasPendingInvitation && (
                  <>
                    <span
                      className="topbar-invite-badge"
                    >
                      !
                    </span>
                    <span
                      className="season-remaining-badge season-remaining-badge--subtle topbar-invite-counter"
                    >
                      <span>{inviteSecondsLeft ?? 120}s</span>
                    </span>
                  </>
                )}
              </div>

              <button
                className="btn-icon"
                onClick={() => logoutMutation.mutate()}
                aria-label={t('topbar.logout')}
                style={{ width: 30, height: 30, padding: 0 }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 5 }}>
              <Link
                to="/login"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12.5, padding: '4px 10px', height: 30, textDecoration: 'none' }}
              >
                {t('topbar.login')}
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{ fontSize: 12.5, padding: '4px 10px', height: 30, textDecoration: 'none' }}
              >
                {t('topbar.register')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 2 ─── */}
      <div
        className="topbar-row topbar-row-2"
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 6,
          overflowX: 'auto',
        }}
      >
        {/* Cache buttons — mobilde sol drawer'a taşındı */}
        <button
          className={`btn hide-under-900 ${activeLeftCacheType === 'trending' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('trending')}
        >
          {t('sort.popular', 'Popüler')}
        </button>
        <button
          className={`btn hide-under-900 ${activeLeftCacheType === 'recent' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('recent')}
        >
          {t('sort.new')}
        </button>
        <button
          className={`btn hide-under-900 ${activeLeftCacheType === 'mostLiked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('mostLiked')}
        >
          {t('sort.best', 'En İyiler')}
        </button>
        <button
          className={`btn hide-under-900 ${activeLeftCacheType === 'mostDisliked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => setActiveLeftCacheType('mostDisliked')}
        >
          {t('sort.worst', 'En Kötüler')}
        </button>

        <div
          className="hide-under-900"
          style={{ width: 1, height: 32, background: 'var(--color-border)', margin: '0 8px' }}
        />

        {/* My Tribes & My Bots dropdowns — mobilde de görünür */}
        {isLoggedIn && (
          <>
            <div
              className="topbar-my-entities"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: isMobile ? 10 : 6,
                flexShrink: 0,
                height: isMobile ? 32 : 36,
              }}
            >
              {/* My Tribes */}
              <div style={{ position: 'relative' }} ref={myTribesRef}>
                <button
                  className="btn btn-outline topbar-my-entity-btn"
                  style={{
                    width: isMobile ? 104 : 84,
                    padding: isMobile ? '3px 6px' : '3px 6px',
                    fontSize: isMobile ? 12.5 : 11,
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTribesDropdownPos({ top: rect.bottom + 4, left: rect.left })
                    setIsMyTribesOpen((v) => !v)
                    setIsMyBotsOpen(false)
                    setBotsDropdownPos(null)
                  }}
                >
                  {t('common.tribes', 'Tribes')}{' '}
                  <span
                    style={{
                      fontSize: 9,
                      display: 'inline-block',
                      transform: isMyTribesOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform var(--transition-fast)',
                    }}
                  >
                    ▼
                  </span>
                </button>
                <AnimatePresence>
                  {isMyTribesOpen && tribesDropdownPos && (
                    <motion.div
                      className="topbar-tribes-dropdown"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClickCapture={(e) => {
                        if (e.target.closest('[data-keep-dropdown-open]')) return
                        setIsMyTribesOpen(false)
                        setTribesDropdownPos(null)
                      }}
                      style={{
                        position: 'fixed',
                        top: tribesDropdownPos.top,
                        left: tribesDropdownPos.left,
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 12,
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 200,
                        minWidth: 600,
                        maxWidth: 600,
                        maxHeight: 320,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        padding: 8,
                      }}
                    >
                      <FossilTogglePill
                        count={fossilTribeCount}
                        open={showFossilTribes}
                        onToggle={() => setShowFossilTribes((v) => !v)}
                        keepDropdownOpen
                        wrapperStyle={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
                      />
                      {visibleMyTribes.map((tData) => (
                        <div
                          key={tData.tribeId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            margin: '4px 0',
                            cursor: 'pointer',
                            minWidth: 0,
                          }}
                          onClick={() => {
                            setIsMyTribesOpen(false)
                            setTribesDropdownPos(null)
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <TribeMinimalCard {...tData} />
                          </div>
                        </div>
                      ))}
                      {(!myTribes || myTribes.length === 0) && (
                        <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>
                          {t('common.nothing_here_yet')}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: 8,
                          marginBottom: 4,
                        }}
                      >
                        <Link
                          to="/create-tribe"
                          onClick={() => {
                            setIsMyTribesOpen(false)
                            setTribesDropdownPos(null)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                          aria-label={t('topbar.new_tribe')}
                        >
                          <CirclePlus size={19} strokeWidth={2.4} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* My Bots */}
              <div style={{ position: 'relative' }} ref={myBotsRef}>
                <button
                  className="btn btn-outline topbar-my-entity-btn"
                  style={{
                    width: isMobile ? 104 : 84,
                    padding: isMobile ? '3px 6px' : '3px 6px',
                    fontSize: isMobile ? 12.5 : 11,
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setBotsDropdownPos({ top: rect.bottom + 4, left: rect.left })
                    setIsMyBotsOpen((v) => !v)
                    setIsMyTribesOpen(false)
                    setTribesDropdownPos(null)
                  }}
                >
                  {t('common.bots', 'Bots')}{' '}
                  <span
                    style={{
                      fontSize: 9,
                      display: 'inline-block',
                      transform: isMyBotsOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform var(--transition-fast)',
                    }}
                  >
                    ▼
                  </span>
                </button>
                <AnimatePresence>
                  {isMyBotsOpen && botsDropdownPos && (
                    <motion.div
                      className="topbar-bots-dropdown"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClickCapture={(e) => {
                        if (e.target.closest('[data-keep-dropdown-open]')) return
                        setIsMyBotsOpen(false)
                        setBotsDropdownPos(null)
                      }}
                      style={{
                        position: 'fixed',
                        top: botsDropdownPos.top,
                        left: botsDropdownPos.left,
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 12,
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 200,
                        minWidth: 450,
                        maxWidth: 450,
                        maxHeight: 320,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        padding: 8,
                      }}
                    >
                      <FossilTogglePill
                        count={fossilBotCount}
                        open={showFossilBots}
                        onToggle={() => setShowFossilBots((v) => !v)}
                        keepDropdownOpen
                        wrapperStyle={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
                      />
                      {visibleMyBots.map((b) => (
                        <div
                          key={b.actorId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            margin: '4px 0',
                            cursor: 'pointer',
                            minWidth: 0,
                          }}
                          onClick={() => {
                            setIsMyBotsOpen(false)
                            setBotsDropdownPos(null)
                          }}
                        >
                          <div
                            className="lb-card"
                            style={{ flex: 1, padding: '8px 16px', minWidth: 0 }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <ActorMinimalCard actor={b} clickable={true} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!myBots || myBots.length === 0) && (
                        <p className="text-muted" style={{ padding: 8, textAlign: 'center' }}>
                          {t('common.nothing_here_yet')}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: 8,
                          marginBottom: 4,
                        }}
                      >
                        <Link
                          to="/create-bot"
                          onClick={() => {
                            setIsMyBotsOpen(false)
                            setBotsDropdownPos(null)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                          aria-label={t('topbar.new_bot')}
                        >
                          <CirclePlus size={19} strokeWidth={2.4} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cards */}
              <div style={{ position: 'relative' }}>
                <Link
                  to="/cards"
                  className="btn btn-outline topbar-my-entity-btn"
                  style={{
                    width: isMobile ? 104 : 84,
                    padding: isMobile ? '3px 6px' : '3px 6px',
                    fontSize: isMobile ? 12.5 : 11,
                    lineHeight: 'normal',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t('card.cards', 'Cards')}
                </Link>
              </div>

              {import.meta.env.VITE_IS_ADMIN_BUILD === 'true' && isAdmin && (
                <div style={{ position: 'relative' }}>
                  <Link
                    to="/admin/panel"
                    className="btn btn-outline topbar-my-entity-btn"
                    style={{
                      width: isMobile ? 104 : 84,
                      padding: isMobile ? '3px 6px' : '3px 6px',
                      fontSize: isMobile ? 12.5 : 11,
                      lineHeight: 'normal',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Admin
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {isLoggedIn && (
          <div
            className="hide-under-900"
            style={{ width: 1, height: 30, background: 'var(--color-border)', margin: '0 8px' }}
          />
        )}

        <div
          className="hide-under-900"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
            height: 38,
          }}
        >
          <IconActionButton
            to="/leaderboard?type=user"
            title={t('topbar.leaderboard', 'Liderlik Tablosu')}
            aria-label={t('topbar.leaderboard', 'Liderlik Tablosu')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <Podium size={19} strokeWidth={2.2} />
          </IconActionButton>

          <IconActionButton
            to="/tribes"
            title={t('topbar.tribes', 'Klanlar')}
            aria-label={t('topbar.tribes', 'Klanlar')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <Users size={19} strokeWidth={2.2} />
          </IconActionButton>

          <IconActionButton
            to="/active-debates"
            title={t('topbar.active_debates', 'Aktif Meydan Okumalar')}
            aria-label={t('topbar.active_debates', 'Aktif Meydan Okumalar')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <AngryBotWithSwordsIcon size={19} />
          </IconActionButton>

          <IconActionButton
            to="/marketplace"
            title={t('card.marketplace', 'Kart Marketi')}
            aria-label={t('card.marketplace', 'Kart Marketi')}
            style={{ width: 36, height: 36, boxSizing: 'border-box' }}
          >
            <BotFlashCardsIcon size={19} />
          </IconActionButton>

          <IconActionButton
            to="/how-it-works"
            title={t('bletchly_guide.title')}
            aria-label={t('bletchly_guide.title')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <ShieldQuestion size={20} strokeWidth={2.2} />
          </IconActionButton>
        </div>
      </div>
    </header>
  )
}

/**
 * Mobil üst bar kontrolleri: koyu/açık tema, mavi/yeşil tema ve dil seçici.
 * Daha önce sol drawer'ın alt bölümündeydi; avatarın soluna taşındı.
 */
function MobileTopbarControls() {
  const {
    isDarkMode,
    toggleTheme,
    isGreenMode,
    customColor,
    selectThemeColor,
    savedCustomColor,
    setSavedCustomColor,
  } = useThemeStore()
  const { t, i18n } = useTranslation()
  const { actorId, isLoggedIn } = useAuthStore()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isBotShaking, setIsBotShaking] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const langRef = useRef(null)
  const paletteRef = useRef(null)
  const colorInputRef = useRef(null)

  // Premium durumu (masaüstüyle aynı sorgu/anahtar; önbellekten okunur)
  const { data: myProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((r) => r.data?.data ?? null),
    enabled: !!actorId && isLoggedIn,
  })
  const userCapabilities = Number(
    myProfile?.userSettings?.userCapabilities ?? UserCapabilities.Default
  )
  const isPremium = (userCapabilities & UserCapabilities.Premium) === UserCapabilities.Premium

  const langs = [
    { code: 'tr', label: 'Türkçe', flagUrl: 'https://flagcdn.com/tr.svg' },
    { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/us.svg' },
    { code: 'ja', label: '日本語', flagUrl: 'https://flagcdn.com/jp.svg' },
    { code: 'hi', label: 'हिन्दी', flagUrl: 'https://flagcdn.com/in.svg' },
    { code: 'de', label: 'Deutsch', flagUrl: 'https://flagcdn.com/de.svg' },
    { code: 'fr', label: 'Français', flagUrl: 'https://flagcdn.com/fr.svg' },
    { code: 'ar', label: 'العربية', flagUrl: 'https://flagcdn.com/sa.svg' },
  ]
  const rawLang = (i18n.language || 'tr').toLowerCase()
  const activeLangObj =
    langs.find((l) => l.code === rawLang || l.code === rawLang.split('-')[0]) || langs[0]

  useEffect(() => {
    if (!isLangOpen) return undefined
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setIsLangOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isLangOpen])

  useEffect(() => {
    if (!isPaletteOpen) return undefined
    const handleClick = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setIsPaletteOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isPaletteOpen])

  const applyPaletteColor = useCallback(
    (color) => {
      selectThemeColor(color)
    },
    [selectThemeColor]
  )

  const commitCustomColor = (color) => {
    const normalized = normalizeHex(color)
    if (!normalized) return
    if (normalized === '#10b981') {
      clearCustomColorVars(true)
    } else if (normalized === '#3b82f6') {
      clearCustomColorVars(false)
    } else {
      applyCustomColorVars(normalized, isDarkMode)
      setSavedCustomColor(normalized)
    }
    applyPaletteColor(normalized)
  }

  // Palet herkese açılır; premium olmayanlarda yalnızca 3 varsayılan renk.
  const handleBotClick = () => {
    setIsBotShaking(true)
    setTimeout(() => setIsBotShaking(false), 500)
    setIsPaletteOpen((v) => !v)
  }

  const themeLabel = isDarkMode
    ? t('topbar.light_mode', 'Açık Tema')
    : t('topbar.dark_mode', 'Koyu Tema')

  return (
    <div className="topbar-mobile-controls">
      <button
        type="button"
        className="btn-icon topbar-mobile-controls__btn"
        onClick={toggleTheme}
        aria-label={themeLabel}
        title={themeLabel}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="topbar-mobile-controls__palette" ref={paletteRef}>
        <button
          type="button"
          className={`btn-icon topbar-mobile-controls__btn ${
            isBotShaking ? 'theme-toggle-shake' : ''
          }`}
          onClick={handleBotClick}
          aria-haspopup="dialog"
          aria-expanded={isPaletteOpen}
          aria-label={t('topbar.premium_palette_title', 'Özel Renk Paleti')}
          title={t('topbar.premium_palette_title', 'Özel Renk Paleti')}
        >
          <span
            className="mobile-drawer-paint-bot"
            style={{ color: customColor || (isGreenMode ? '#10b981' : 'var(--color-primary)') }}
          >
            <Bot size={18} strokeWidth={2.4} />
            <PaintbrushVertical size={15} strokeWidth={2.2} style={{ marginLeft: -5 }} />
          </span>
        </button>

        {isPaletteOpen && (
          <div
            className="topbar-mobile-controls__palette-menu"
            role="dialog"
            aria-label={t('topbar.premium_palette_title', 'Özel Renk Paleti')}
          >
            <div className="topbar-mobile-controls__palette-grid">
              {COLOR_PRESETS.map((preset) => {
                const activeBase = customColor || (isGreenMode ? '#10b981' : '#3b82f6')
                const locked = !isPremium && !preset.isDefault
                return (
                  <button
                    key={preset.color}
                    type="button"
                    disabled={locked}
                    aria-disabled={locked || undefined}
                    onClick={() => {
                      if (locked) return
                      applyPaletteColor(preset.color)
                    }}
                    aria-label={preset.label}
                    className={`topbar-mobile-controls__swatch${
                      activeBase === preset.color ? ' is-active' : ''
                    }${locked ? ' is-locked' : ''}`}
                    style={{ background: preset.color }}
                  >
                    {locked && (
                      <PaletteLockedSlash strokeWidth={2.2} />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="topbar-mobile-controls__palette-footer">
              {savedCustomColor && (
                <button
                  type="button"
                  disabled={!isPremium}
                  aria-disabled={!isPremium || undefined}
                  aria-label={t('topbar.premium_palette_saved', 'Kayıtlı renk')}
                  title={t('topbar.premium_palette_saved', 'Kayıtlı renk')}
                  onClick={() => {
                    if (!isPremium) return
                    applyPaletteColor(savedCustomColor)
                  }}
                  className={`topbar-mobile-controls__swatch${
                    customColor === savedCustomColor ? ' is-active' : ''
                  }${!isPremium ? ' is-locked' : ''}`}
                  style={{ background: savedCustomColor }}
                >
                  {!isPremium && (
                    <PaletteLockedSlash strokeWidth={2.2} />
                  )}
                </button>
              )}
              <button
                type="button"
                disabled={!isPremium}
                aria-disabled={!isPremium || undefined}
                className={`topbar-mobile-controls__palette-custom${!isPremium ? ' is-locked' : ''}`}
                aria-label={t('topbar.premium_palette_custom', 'Custom')}
                title={t('topbar.premium_palette_custom', 'Custom')}
                onClick={() => {
                  if (!isPremium) return
                  colorInputRef.current?.click()
                }}
              >
                <Edit2 size={13} />
                {!isPremium && (
                  <PaletteLockedSlash strokeWidth={2.2} />
                )}
              </button>
              <input
                ref={colorInputRef}
                type="color"
                value={customColor || (isGreenMode ? '#10b981' : '#3b82f6')}
                onChange={(e) => {
                  if (!isPremium) return
                  commitCustomColor(e.target.value)
                }}
                className="topbar-mobile-controls__color-input"
                aria-label={t('topbar.premium_palette_custom', 'Custom')}
              />
            </div>
          </div>
        )}
      </div>

      <div className="topbar-mobile-controls__lang" ref={langRef}>
        <button
          type="button"
          className="btn-icon topbar-mobile-controls__btn"
          onClick={() => setIsLangOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={isLangOpen}
          aria-label={activeLangObj.label}
          title={activeLangObj.label}
        >
          <img
            src={activeLangObj.flagUrl}
            alt={activeLangObj.code}
            style={{ width: 21, height: 16, borderRadius: 2 }}
          />
          <span
            aria-hidden="true"
            className={`topbar-mobile-controls__caret${isLangOpen ? ' is-open' : ''}`}
          >
            ▼
          </span>
        </button>

        {isLangOpen && (
          <div className="topbar-mobile-controls__lang-menu" role="listbox">
            {langs.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={activeLangObj.code === l.code}
                className={`topbar-mobile-controls__lang-option${
                  activeLangObj.code === l.code ? ' is-active' : ''
                }`}
                onClick={() => {
                  i18n.changeLanguage(l.code)
                  setIsLangOpen(false)
                }}
              >
                <img
                  src={l.flagUrl}
                  alt={l.code}
                  style={{ width: 20, height: 15, borderRadius: 2 }}
                />
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
