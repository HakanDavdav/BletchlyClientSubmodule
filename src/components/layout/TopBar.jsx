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
  Compass,
  Brain,
  ShieldQuestion,
  Clock,
} from 'lucide-react'
import { getRecentSearches, saveRecentSearch, removeRecentSearch } from '../../utils/recentSearches'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { tribeApi } from '../../api/tribeApi'
import { searchApi } from '../../api/searchApi'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { OrderType, OrderTypeLabels, TopicColors, UserCapabilities } from '../../constants/enums'
import { TopicTypes } from '../../constants/TopicTypes'
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
import ChatBubbleIcon from '../common/icons/ChatBubbleIcon'
import useChatDeckStore from '../../store/chatDeckStore'
import { isChatDeckEligible } from '../../utils/chatDeck'
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
  { key: 'green', color: '#10b981', label: 'Yeşil', isDefault: true },
  { key: 'blue', color: '#3b82f6', label: 'Mavi', isDefault: true },
  { key: 'pink', color: '#ec4899', label: 'Pembe', isDefault: true },
  { key: 'purple', color: '#8b5cf6', label: 'Mor' },
  { key: 'cyan', color: '#06b6d4', label: 'Turkuaz' },
  { key: 'orange', color: '#f97316', label: 'Turuncu' },
  { key: 'red', color: '#ef4444', label: 'Kırmızı' },
  { key: 'yellow', color: '#eab308', label: 'Sarı' },
  { key: 'teal', color: '#14b8a6', label: 'Teal' },
  { key: 'indigo', color: '#6366f1', label: 'İndigo' },
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
    activeLeftTopicType,
    setActiveLeftTopicType,
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
  const { isOpen: isChatDeckOpen, openChatDeck, closeChatDeck } = useChatDeckStore()
  const handleChatClick = () => {
    if (!isMobile && isChatDeckEligible(location.pathname)) {
      if (isChatDeckOpen) closeChatDeck()
      else openChatDeck()
      return
    }
    navigate('/chat')
  }

  const rawLang = (i18n.language || 'en').toLowerCase()
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
  const [isTopicOpen, setIsTopicOpen] = useState(false)
  const [topicDropdownPos, setTopicDropdownPos] = useState(null)
  const [tribesDropdownPos, setTribesDropdownPos] = useState(null)
  const [botsDropdownPos, setBotsDropdownPos] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearches())

  useEffect(() => {
    const handleUpdate = () => setRecentSearches(getRecentSearches())
    window.addEventListener('recent-searches-updated', handleUpdate)
    return () => window.removeEventListener('recent-searches-updated', handleUpdate)
  }, [])

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
  const topicRef = useRef(null)
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

  useEffect(() => {
    if (isLoggedIn && myProfile) {
      useThemeStore.getState().validateThemePermission(isPremium)
    }
  }, [isLoggedIn, myProfile, isPremium])

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
      if (topicRef.current && !topicRef.current.contains(e.target)) {
        setIsTopicOpen(false)
        setTopicDropdownPos(null)
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
      setIsLoadingSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)

    // 500ms bekle, sonra API çağrısı yap
    debounceTimerRef.current = setTimeout(async () => {
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
    const trimmed = searchQuery.trim()
    if (!trimmed && searchMode === 'general') return

    if (trimmed) {
      saveRecentSearch(trimmed)
      setRecentSearches(getRecentSearches())
    }

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
    { key: 'general', label: t('search.mode.general') },
    { key: 'posts', label: t('search.mode.posts') },
    { key: 'actors', label: t('search.mode.actors') },
    { key: 'tribes', label: t('search.mode.tribes') },
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
                  ? t('common.days_remaining_short', { count: seasonStatus.daysRemaining })
                  : t('common.hours_remaining_short', { count: seasonStatus.hoursRemaining ?? 0 })}
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
              placeholder={t('topbar.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (!suppressSuggestionsRef.current) setShowSuggestions(true)
              }}
              onFocus={() => {
                if (!suppressSuggestionsRef.current) setShowSuggestions(true)
              }}
              onClick={() => {
                if (!suppressSuggestionsRef.current) setShowSuggestions(true)
              }}
            />

            {/* Search Suggestions & Recent Searches Dropdown */}
            <AnimatePresence>
              {showSuggestions && !isFilterOpen && (
                searchQuery?.trim()?.length > 0 || (recentSearches && recentSearches.length > 0)
              ) && (
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
                  ) : (!searchQuery || searchQuery.trim().length === 0) ? (
                    <div style={{ padding: '6px 8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--color-text-faint)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <span>{t('search.recent')}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {recentSearches.slice(0, 5).map((item) => (
                          <div
                            key={item}
                            onClick={() => {
                              setSearchQuery(item)
                              setShowSuggestions(false)
                              saveRecentSearch(item)
                              setRecentSearches(getRecentSearches())
                              navigate('/search?query=' + encodeURIComponent(item))
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 6,
                              cursor: 'pointer',
                              transition: 'background 0.15s ease',
                              fontSize: 13,
                              color: 'var(--color-text)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--color-surface-2)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <Clock
                                size={14}
                                style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
                              />
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item}
                              </span>
                            </div>
                            <button
                              type="button"
                              aria-label={t('common.delete')}
                              title={t('common.delete')}
                              onClick={(e) => {
                                e.stopPropagation()
                                removeRecentSearch(item)
                                setRecentSearches(getRecentSearches())
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 20,
                                height: 20,
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--color-text-faint)',
                                cursor: 'pointer',
                                padding: 0,
                                marginLeft: 8,
                                flexShrink: 0,
                                opacity: 0.6,
                                transition: 'opacity 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.6'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
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
                                {t('common.actors')}
                              </div>
                              <div className="minimal-card-list">
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
                                {t('common.tribes')}
                              </div>
                              <div className="minimal-card-list">
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
                                {t('common.posts')}
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
                                {t('search.no_results')}
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
                            <div className="minimal-card-list">
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
                            <div className="minimal-card-list">
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
                              {t('search.no_results')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 16,
                        textAlign: 'center',
                        color: 'var(--color-text-faint)',
                        fontSize: 13,
                      }}
                    >
                      {t('search.no_results')}
                    </div>
                  )}
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
                aria-label={t('common.clear_all')}
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
                    <span>{t('search.filters_title')}</span>
                    <X
                      size={14}
                      color="var(--color-text-secondary)"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setIsFilterOpen(false)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.sort_by')}
                    </label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <select
                        className="input"
                        style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1 }}
                        value={filterOrderType}
                        onChange={handleOrderTypeChange}
                      >
                        <option value="">{t('search.none')}</option>
                        {searchMode === 'posts' && (
                          <option value="MostLiked">
                            {t('topbar.most_liked')}
                          </option>
                        )}
                        <option value="Newest">{t('sort.newest')}</option>
                        <option value="Oldest">{t('topbar.oldest')}</option>
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
                          aria-label={t('common.clear')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.start_date')}
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
                          aria-label={t('common.clear')}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {t('search.end_date')}
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
                          aria-label={t('common.clear')}
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
                    {t('topbar.search_button')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            {t('topbar.search_button')}
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
                aria-label={t('topbar.premium_palette_title')}
                title={t('topbar.premium_palette_title')}
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
                            aria-disabled={locked || undefined}
                            onClick={() => {
                              if (locked) {
                                setIsPaletteOpen(false)
                                navigate('/premium')
                                return
                              }
                              cancelColorPreview()
                              applyPaletteColor(preset.color)
                            }}
                            aria-label={t(`colors.${preset.key}`, preset.label)}
                            title={locked ? `${t(`colors.${preset.key}`, preset.label)} (Pro)` : t(`colors.${preset.key}`, preset.label)}
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
                              cursor: 'pointer',
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
                          aria-disabled={!isPremium || undefined}
                          aria-label={t('topbar.premium_palette_saved')}
                          title={!isPremium ? `${t('topbar.premium_palette_saved')} (Pro)` : t('topbar.premium_palette_saved')}
                          onClick={() => {
                            if (!isPremium) {
                              setIsPaletteOpen(false)
                              navigate('/premium')
                              return
                            }
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
                            cursor: 'pointer',
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
                        aria-disabled={!isPremium || undefined}
                        aria-label={t('topbar.premium_palette_custom')}
                        title={!isPremium ? `${t('topbar.premium_palette_custom')} (Pro)` : t('topbar.premium_palette_custom')}
                        onClick={() => {
                          if (!isPremium) {
                            setIsPaletteOpen(false)
                            navigate('/premium')
                            return
                          }
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
                          cursor: 'pointer',
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
              aria-label={isDarkMode ? t('topbar.light_mode') : t('topbar.dark_mode')}
              title={isDarkMode ? t('topbar.light_mode') : t('topbar.dark_mode')}
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
          onClick={() => {
            setActiveLeftTopicType(null)
            setActiveLeftCacheType('trending')
          }}
        >
          {t('sort.popular')}
        </button>
        <button
          className={`btn hide-under-900 ${activeLeftCacheType === 'recent' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => {
            setActiveLeftTopicType(null)
            setActiveLeftCacheType('recent')
          }}
        >
          {t('sort.new')}
        </button>
        <button
          className={`btn hide-under-900 ${activeLeftCacheType === 'mostLiked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => {
            setActiveLeftTopicType(null)
            setActiveLeftCacheType('mostLiked')
          }}
        >
          {t('sort.best')}
        </button>
        <button
          className={`btn hide-under-900 ${activeLeftCacheType === 'mostDisliked' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 10px', minWidth: '80px', fontSize: 12 }}
          onClick={() => {
            setActiveLeftTopicType(null)
            setActiveLeftCacheType('mostDisliked')
          }}
        >
          {t('sort.worst')}
        </button>

        <div className="hide-under-900" ref={topicRef} style={{ position: 'relative' }}>
          <button
            className={`btn ${activeLeftCacheType === 'topicPopular' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 10px', minWidth: 42, fontSize: 12 }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const menuWidth = 320
              setTopicDropdownPos({
                top: rect.bottom + 4,
                left: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, rect.left)),
              })
              setIsTopicOpen((value) => !value)
            }}
            aria-label={t('sort.topic')}
            title={t('sort.topic')}
          >
            ...
          </button>
          <AnimatePresence>
            {isTopicOpen && topicDropdownPos && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: 'fixed',
                  top: topicDropdownPos.top,
                  left: topicDropdownPos.left,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                  width: 320,
                  maxHeight: 360,
                  overflowY: 'auto',
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLeftTopicType(null)
                      setActiveLeftCacheType('trending')
                      setIsTopicOpen(false)
                    }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: activeLeftTopicType == null ? 600 : 500,
                      cursor: 'pointer',
                      background: activeLeftTopicType == null ? 'var(--color-primary)' : 'transparent',
                      color: activeLeftTopicType == null ? '#fff' : 'var(--color-text-secondary)',
                      border: `1px solid ${activeLeftTopicType == null ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {t('sort.all_topics')}
                  </button>
                  {TopicTypes.map((topic) => {
                    const color = TopicColors[topic.value] || 'var(--color-primary)'
                    const isSelected = activeLeftTopicType === topic.value
                    return (
                      <button
                        key={topic.value}
                        type="button"
                        onClick={() => {
                          setActiveLeftTopicType(topic.value)
                          setActiveLeftCacheType('topicPopular')
                          setIsTopicOpen(false)
                        }}
                        style={{
                          padding: '5px 14px',
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 500,
                          cursor: 'pointer',
                          background: isSelected ? color : `${color}18`,
                          color: isSelected ? '#fff' : color,
                          border: `1px solid ${isSelected ? color : `${color}55`}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {t(`topics.${topic.key || topic.enumName?.toLowerCase()}`, topic.label)}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                  {t('common.tribes')}{' '}
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
                      <div className="minimal-card-list">
                        {visibleMyTribes.map((tData) => (
                          <div
                            key={tData.tribeId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
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
                      </div>
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
                  {t('common.bots')}{' '}
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
                      <div className="minimal-card-list">
                        {visibleMyBots.map((b) => (
                          <div
                            key={b.actorId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
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
                      </div>
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
                  {t('card.cards')}
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
            title={t('topbar.leaderboard')}
            aria-label={t('topbar.leaderboard')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <Podium size={19} strokeWidth={2.2} />
          </IconActionButton>

          <IconActionButton
            to="/explore"
            title={t('explore_page.title')}
            aria-label={t('explore_page.title')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <Compass size={19} strokeWidth={2.2} />
          </IconActionButton>

          <IconActionButton
            to="/active-debates"
            title={t('topbar.active_debates')}
            aria-label={t('topbar.active_debates')}
            style={{ width: 38, height: 38, boxSizing: 'border-box' }}
          >
            <AngryBotWithSwordsIcon size={19} />
          </IconActionButton>

          <IconActionButton
            to="/marketplace"
            title={t('card.marketplace')}
            aria-label={t('card.marketplace')}
            style={{ width: 36, height: 36, boxSizing: 'border-box' }}
          >
            <BotFlashCardsIcon size={19} />
          </IconActionButton>

          {isLoggedIn && (
            <IconActionButton
              onClick={handleChatClick}
              title={t('topbar.chat')}
              aria-label={t('topbar.chat')}
              style={{ width: 38, height: 38, boxSizing: 'border-box' }}
            >
              <ChatBubbleIcon size={19} />
            </IconActionButton>
          )}

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
  const navigate = useNavigate()
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
  const rawLang = (i18n.language || 'en').toLowerCase()
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
    ? t('topbar.light_mode')
    : t('topbar.dark_mode')

  return (
    <div className="topbar-mobile-controls">
      <button
        type="button"
        className="btn-icon topbar-mobile-controls__btn"
        onClick={toggleTheme}
        aria-label={themeLabel}
        title={themeLabel}
        style={{ color: customColor || (isGreenMode ? '#10b981' : '#3b82f6') }}
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
          aria-label={t('topbar.premium_palette_title')}
          title={t('topbar.premium_palette_title')}
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
            aria-label={t('topbar.premium_palette_title')}
          >
            <div className="topbar-mobile-controls__palette-grid">
              {COLOR_PRESETS.map((preset) => {
                const activeBase = customColor || (isGreenMode ? '#10b981' : '#3b82f6')
                const locked = !isPremium && !preset.isDefault
                return (
                  <button
                    key={preset.color}
                    type="button"
                    aria-disabled={locked || undefined}
                    onClick={() => {
                      if (locked) {
                        setIsPaletteOpen(false)
                        navigate('/premium')
                        return
                      }
                      applyPaletteColor(preset.color)
                    }}
                    aria-label={t(`colors.${preset.key}`, preset.label)}
                    title={locked ? `${t(`colors.${preset.key}`, preset.label)} (Pro)` : t(`colors.${preset.key}`, preset.label)}
                    className={`topbar-mobile-controls__swatch${
                      activeBase === preset.color ? ' is-active' : ''
                    }${locked ? ' is-locked' : ''}`}
                    style={{ background: preset.color, cursor: 'pointer' }}
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
                  aria-disabled={!isPremium || undefined}
                  aria-label={t('topbar.premium_palette_saved')}
                  title={!isPremium ? `${t('topbar.premium_palette_saved')} (Pro)` : t('topbar.premium_palette_saved')}
                  onClick={() => {
                    if (!isPremium) {
                      setIsPaletteOpen(false)
                      navigate('/premium')
                      return
                    }
                    applyPaletteColor(savedCustomColor)
                  }}
                  className={`topbar-mobile-controls__swatch${
                    customColor === savedCustomColor ? ' is-active' : ''
                  }${!isPremium ? ' is-locked' : ''}`}
                  style={{ background: savedCustomColor, cursor: 'pointer' }}
                >
                  {!isPremium && (
                    <PaletteLockedSlash strokeWidth={2.2} />
                  )}
                </button>
              )}
              <button
                type="button"
                aria-disabled={!isPremium || undefined}
                className={`topbar-mobile-controls__palette-custom${!isPremium ? ' is-locked' : ''}`}
                aria-label={t('topbar.premium_palette_custom')}
                title={!isPremium ? `${t('topbar.premium_palette_custom')} (Pro)` : t('topbar.premium_palette_custom')}
                onClick={() => {
                  if (!isPremium) {
                    setIsPaletteOpen(false)
                    navigate('/premium')
                    return
                  }
                  colorInputRef.current?.click()
                }}
                style={{ cursor: 'pointer' }}
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
                aria-label={t('topbar.premium_palette_custom')}
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
