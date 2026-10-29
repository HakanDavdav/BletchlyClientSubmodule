import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarFold,
  Bot,
  Brain,
  ShieldCheck,
  Edit2,
  Check,
  X,
  Settings,
  UserPlus,
  UserMinus,
  Sliders,
  Users,
} from 'lucide-react'
import { MODEL_GLASS_ITEMS } from '../components/common/ModelGlassToggle'
import PaginationSelect from '../components/common/PaginationSelect'
import { getMemoryEmblems } from '../components/common/MemoryEmblems'
import KingIcon from '../components/common/icons/KingIcon'
import FossilIcon from '../components/common/icons/FossilIcon'
import AngryBotWithSwordsIcon from '../components/common/icons/AngryBotWithSwordsIcon'
import AmbientBots from '../components/common/ambiances/AmbientBots'
import WelcomeAmbience from '../components/common/ambiances/WelcomeAmbience'
import MemoryMapAmbience from '../components/common/ambiances/MemoryMapAmbience'
import RainbowCardsAmbience from '../components/common/ambiances/RainbowCardsAmbience'
import BotFlashCardsIcon from '../components/common/icons/BotFlashCardsIcon'
import CardContingencyIcon from '../components/common/icons/CardContingencyIcon'
import CardContingencyModifierIcon from '../components/common/icons/CardContingencyModifierIcon'
import toast from 'react-hot-toast'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { actorApi } from '../api/actorApi'
import { personalityCardApi } from '../api/personalityCardApi'
import { UserCapabilities, Theme } from '../constants/enums'
import TriggerDebateModal from '../components/profile/TriggerDebateModal'
import { trackDebate } from '../utils/analytics'
import BackButton from '../components/common/BackButton'
import ActorAvatar from '../components/actor/ActorAvatar'
import CardSlots from '../components/card/CardSlots'
import { TopicTagList } from '../components/topic/TopicTag'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import ContextualEntryThread from '../components/content/ContextualEntryThread'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import FossilTogglePill from '../components/common/FossilTogglePill'
import FollowListModal from '../components/profile/FollowListModal'
import ProfileLikesModal from '../components/profile/ProfileLikesModal'
import ProfileModifiersModal from '../components/profile/ProfileModifiersModal'
import ProfileActivitiesPanel from '../components/profile/ProfileActivitiesPanel'
import useAuthStore from '../store/authStore'
import useMyEntitiesStore from '../store/myEntitiesStore'
import useUIStore from '../store/uiStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { getQueryErrorMessage } from '../utils/errorHelper'
import AvatarUpload from '../components/common/AvatarUpload'
import PremiumModal from '../components/common/PremiumModal'
import ModifierArrowSvg from '../assets/FigmaNew/modifierarrow.svg?react'
import TRexSkullIcon from '../assets/t-rex-skull-svgrepo-com.svg?react'
import { buildOwnedCardIdSet, sortCardsOwnedFirst } from '../utils/cardOwnership'
import { TopicTypes } from '../constants/TopicTypes'

function FramedThemeIcon({ type, isLocked, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Bütünsel Dış Çerçeve (Integrated Frame) */}
      <rect x="1.5" y="1.5" width="21" height="21" rx="4.5" strokeWidth="1.6" />

      {/* İkon Vektörü (Brain / Hierarchy (Network) / Bot) */}
      <g transform="translate(3.6, 3.6) scale(0.7)" opacity={isLocked ? 0.65 : 1}>
        {type === 'brain' && (
          <>
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M19.967 17.484A4 4 0 0 1 18 18" />
          </>
        )}
        {(type === 'hierarchy' || type === 'network') && (
          <>
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="9" y="2" width="6" height="6" rx="1" />
            <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
            <path d="M12 12V8" />
          </>
        )}
        {type === 'bot' && (
          <>
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </>
        )}
        {type === 'rainbow' && (
          <>
            <path d="M3 16.5 A 9 9 0 0 1 21 16.5" />
            <path d="M6.75 16.5 A 5.25 5.25 0 0 1 17.25 16.5" />
            <path d="M10.25 16.5 A 1.75 1.75 0 0 1 13.75 16.5" />
          </>
        )}
      </g>

      {/* Premium yoksa üstü çizili (1.5px Sarı Çizik) */}
      {isLocked && (
        <line
          x1="2.5"
          y1="21.5"
          x2="21.5"
          y2="2.5"
          stroke="var(--color-warning)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const actorId = searchParams.get('actorId')
  useDevLog('ProfilePage', arguments[0] || {})
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('bots')
  // Fosil (dormant) bot/klanlar bu sayfada varsayılan olarak gizli.
  const [showFossilProfileBots, setShowFossilProfileBots] = useState(false)
  const [showFossilProfileTribes, setShowFossilProfileTribes] = useState(false)
  const [postsPage, setPostsPage] = useState(1)
  const [entriesPage, setEntriesPage] = useState(1)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const inferredPerPage = 5
  // Profil sekmeleri: mobilde yatay kaydırma göstergesi (kaydıraç) durumu
  const profileTabGroupRef = useRef(null)
  const [tabScroll, setTabScroll] = useState({ scrollable: false, left: 0, width: 100 })
  const { t } = useTranslation()
  // Limitler & Miras paneli açma/kapama durumu (TribePage ile ORTAK global state)
  const { isLimitsExpanded, toggleLimits } = useUIStore()

  // Follow State & Debounce
  const myFollowData = useMyEntitiesStore((state) => state.myFollowData)
  const addFollowing = useMyEntitiesStore((state) => state.addFollowing)
  const removeFollowing = useMyEntitiesStore((state) => state.removeFollowing)

  const globalIsFollowing = myFollowData?.following?.includes(actorId)
  const [localIsFollowing, setLocalIsFollowing] = useState(globalIsFollowing)
  const debounceTimerRef = useRef(null)
  const [isBouncing, setIsBouncing] = useState(false)

  useEffect(() => {
    setLocalIsFollowing(globalIsFollowing)
  }, [globalIsFollowing])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // FollowListModal state
  const [followModalConfig, setFollowModalConfig] = useState({ isOpen: false, type: 'followers' })
  const [likesModalOpen, setLikesModalOpen] = useState(false)
  const [debateModalOpen, setDebateModalOpen] = useState(false)
  const [debatePending, setDebatePending] = useState(false)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false)
  const [modifiersModalOpen, setModifiersModalOpen] = useState(false)

  const handleTriggerDebate = async (proposition) => {
    try {
      setDebatePending(true)
      toast.loading(t('profile.triggering_debate', 'Meydan okuma başlatılıyor...'), {
        id: 'debate-trigger',
      })
      const res = await actorApi.triggerDebate({
        targetActorId: actorId,
        proposition: proposition,
      })
      const isBotTarget = profile?.discriminator === 'Bot'
      if (isBotTarget) {
        toast.success(
          t('profile.debate_triggered', 'Meydan okuma kabul edildi!'),
          {
            id: 'debate-trigger',
          }
        )
      } else {
        toast.success(
          t(
            'profile.debate_invitation_sent',
            'Meydan okuma kullanıcıya iletildi. Rakibin kabul etmesi bekleniyor...'
          ),
          {
            id: 'debate-trigger',
            duration: 6000,
          }
        )
      }
      setDebateModalOpen(false)

      const debateId = res?.data?.data || (typeof res?.data === 'string' ? res.data : null)
      if (debateId) {
        trackDebate('trigger', {
          debate_id: debateId,
          target_id: profile?.actorId || actorId,
          is_bot: isBotTarget,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['debates'] })
      if (debateId && isBotTarget) {
        navigate(`/debate?id=${debateId}`, {
          state: {
            proponent: {
              id: currentUserId,
              name: t('actor.you', 'Sen'),
              imageUrl: null,
              discriminator: 'User',
            },
            opponent: {
              id: profile?.actorId || actorId,
              name: profile?.profileName || 'Opponent',
              imageUrl: profile?.imageUrl || null,
              discriminator: profile?.discriminator || 'Bot',
            },
            proposition: proposition,
          },
        })
      }
    } catch (err) {
      const rawErrors = err.response?.data?.errors || err.response?.data?.Errors
      let errorMessages = []
      if (rawErrors) {
        if (Array.isArray(rawErrors)) {
          errorMessages = rawErrors.map(
            (e) => e.description || e.Description || e.message || e.Message || e
          )
        } else if (typeof rawErrors === 'object') {
          errorMessages = Object.values(rawErrors).flat()
        }
      }
      if (errorMessages.length === 0) {
        errorMessages = [
          err.response?.data?.message ||
            err.message ||
            t('profile.debate_error', 'Meydan okuma başlatılamadı.'),
        ]
      }

      errorMessages.forEach((msg, idx) => {
        toast.error(msg, {
          ...(idx === 0 ? { id: 'debate-trigger' } : {}),
          style: {
            borderRadius: '10px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        })
      })
    } finally {
      setDebatePending(false)
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    profileName: '',
    bio: '',
    imageUrl: '',
    topicTypes: [],
  })

  const toggleTopic = (value) => {
    setEditForm((prev) => ({
      ...prev,
      topicTypes: prev.topicTypes.includes(value)
        ? prev.topicTypes.filter((v) => v !== value)
        : [...prev.topicTypes, value],
    }))
  }

  const isOwnProfile = actorId === currentUserId
  const myBots = useMyEntitiesStore((state) => state.myBots)
  const myCards = useMyEntitiesStore((state) => state.myCards)

  const { data: profile, isLoading, isError: isProfileError, error: profileError } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((r) => r.data?.data ?? null),
    enabled: !!actorId,
  })

  useDocumentTitle(profile?.profileName)

  const sortedAssignedCards = useMemo(
    () => sortCardsOwnedFirst(profile?.assignedCards || [], buildOwnedCardIdSet(myCards || [])),
    [profile, myCards]
  )

  const isDormantItem = (item) => Boolean(item?.isDormant ?? item?.IsDormant ?? false)

  const visibleProfileBots = useMemo(
    () =>
      showFossilProfileBots
        ? profile?.bots || []
        : (profile?.bots || []).filter((b) => !isDormantItem(b)),
    [profile, showFossilProfileBots]
  )

  const visibleProfileTribes = useMemo(
    () =>
      showFossilProfileTribes
        ? profile?.tribes || []
        : (profile?.tribes || []).filter((t) => !isDormantItem(t)),
    [profile, showFossilProfileTribes]
  )

  const fossilProfileBotCount = useMemo(
    () => (profile?.bots || []).filter((b) => isDormantItem(b)).length,
    [profile]
  )

  const fossilProfileTribeCount = useMemo(
    () => (profile?.tribes || []).filter((t) => isDormantItem(t)).length,
    [profile]
  )

  // Mobilde yatay kaydırılabilen sekme grubu için kaydıraç konumunu takip et
  useEffect(() => {
    const el = profileTabGroupRef.current
    if (!el) return undefined
    const update = () => {
      const sw = el.scrollWidth
      const cw = el.clientWidth
      const scrollable = sw > cw + 1
      const width = scrollable ? Math.max(14, (cw / sw) * 100 * 0.8) : 100
      const maxScroll = sw - cw
      const left = scrollable && maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - width) : 0
      setTabScroll({ scrollable, left, width })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (ro) ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      if (ro) ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [
    activeTab,
    profile?.postCount,
    profile?.entryCount,
    visibleProfileBots.length,
    visibleProfileTribes.length,
  ])

  const isMyBot =
    profile?.discriminator === 'Bot' &&
    (profile?.parentActorId === currentUserId ||
      profile?.parentActor?.actorId === currentUserId ||
      myBots?.some((b) => (b.actorId || b.id) === actorId))

  const { data: currentUserProfile } = useQuery({
    queryKey: ['actorProfile', currentUserId],
    queryFn: () => actorApi.getProfile(currentUserId).then((r) => r.data?.data ?? null),
    enabled: !!currentUserId && !isOwnProfile && isMyBot,
    staleTime: 5 * 60 * 1000,
  })

  const currentUserCapabilities = isOwnProfile
    ? (profile?.userSettings?.userCapabilities ?? UserCapabilities.Default)
    : (currentUserProfile?.userSettings?.userCapabilities ?? UserCapabilities.Default)

  const isCurrentUserPremium =
    (currentUserCapabilities & UserCapabilities.Premium) === UserCapabilities.Premium

  const rawTheme = profile?.userSettings?.theme ?? profile?.botSettings?.theme
  const activeProfileTheme =
    typeof rawTheme === 'string' ? (Theme[rawTheme] ?? Theme.None) : (rawTheme ?? Theme.None)

  const themeMutation = useMutation({
    mutationFn: ({ theme, targetActorId }) => actorApi.selectTheme(theme, targetActorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
    onError: (err) => {
      const errMsgs = err.response?.data?.errors || [
        err.response?.data?.message || t('profile.error_occurred', 'Bir hata oluştu.'),
      ]
      if (Array.isArray(errMsgs)) {
        errMsgs.forEach((m) =>
          toast.error(
            typeof m === 'string' ? m : m.description || m.message || t('profile.error_occurred')
          )
        )
      } else {
        toast.error(typeof errMsgs === 'string' ? errMsgs : t('profile.error_occurred'))
      }
    },
  })

  const handleSelectTheme = (targetTheme) => {
    if (!isCurrentUserPremium) {
      navigate('/premium')
      return
    }

    const nextTheme = activeProfileTheme === targetTheme ? Theme.None : targetTheme
    themeMutation.mutate({
      theme: nextTheme,
      targetActorId: isOwnProfile ? null : actorId,
    })
  }

  const renderThemeSelector = () => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Link
        to="/premium"
        className={
          isCurrentUserPremium ? 'btn btn-sm' : 'btn btn-primary btn-sm profile-premium-btn'
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          background: 'var(--color-warning)',
          borderColor: '#000',
          color: '#fff',
          cursor: 'pointer',
          paddingTop: 6,
          paddingBottom: 6,
          textDecoration: 'none',
        }}
      >
        {isCurrentUserPremium ? (
          <Check size={14} strokeWidth={2.5} />
        ) : (
          <ModifierArrowSvg width={10} height={14} style={{ display: 'block' }} />
        )}
        {t('premium.button', 'Pro')}
      </Link>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          marginTop: -1,
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${activeProfileTheme === Theme.MemoryMap ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleSelectTheme(Theme.MemoryMap)}
          disabled={themeMutation.isPending}
          aria-label={t('topbar.memory_map_ambience', 'Memory Map Ambience')}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '4px 0',
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            position: 'relative',
            zIndex: activeProfileTheme === Theme.MemoryMap ? 2 : 1,
            ...(activeProfileTheme === Theme.MemoryMap
              ? {}
              : {
                  borderColor: 'var(--color-border-light)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface)',
                }),
          }}
        >
          <FramedThemeIcon type="brain" isLocked={!isCurrentUserPremium} size={20} />
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeProfileTheme === Theme.Welcome ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleSelectTheme(Theme.Welcome)}
          disabled={themeMutation.isPending}
          aria-label={t('topbar.welcome_ambience', 'Welcome Arka Planı')}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '4px 0',
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 0,
            marginLeft: -1,
            position: 'relative',
            zIndex: activeProfileTheme === Theme.Welcome ? 2 : 1,
            ...(activeProfileTheme === Theme.Welcome
              ? {}
              : {
                  borderColor: 'var(--color-border-light)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface)',
                }),
          }}
        >
          <FramedThemeIcon type="hierarchy" isLocked={!isCurrentUserPremium} size={20} />
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeProfileTheme === Theme.Rainbow ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleSelectTheme(Theme.Rainbow)}
          disabled={themeMutation.isPending}
          aria-label={t('topbar.rainbow_ambience', 'Gökkuşağı Arka Planı')}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '4px 0',
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 0,
            marginLeft: -1,
            position: 'relative',
            zIndex: activeProfileTheme === Theme.Rainbow ? 2 : 1,
            ...(activeProfileTheme === Theme.Rainbow
              ? {}
              : {
                  borderColor: 'var(--color-border-light)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface)',
                }),
          }}
        >
          <FramedThemeIcon type="rainbow" isLocked={!isCurrentUserPremium} size={20} />
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeProfileTheme === Theme.Bots ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleSelectTheme(Theme.Bots)}
          disabled={themeMutation.isPending}
          aria-label={t('topbar.ambient_bots', 'Bot Arka Planı')}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '4px 0',
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            marginLeft: -1,
            position: 'relative',
            zIndex: activeProfileTheme === Theme.Bots ? 2 : 1,
            ...(activeProfileTheme === Theme.Bots
              ? {}
              : {
                  borderColor: 'var(--color-border-light)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface)',
                }),
          }}
        >
          <FramedThemeIcon type="bot" isLocked={!isCurrentUserPremium} size={20} />
        </button>
      </div>
    </div>
  )

  const followMutation = useMutation({
    mutationFn: () => actorApi.follow(actorId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      addFollowing(actorId)
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
    onError: () => {
      setLocalIsFollowing(false)
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => actorApi.unfollow(actorId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      removeFollowing(actorId)
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
    onError: () => {
      setLocalIsFollowing(true)
    },
  })

  const handleFollowClick = () => {
    setIsBouncing(true)
    setTimeout(() => setIsBouncing(false), 200)

    const newStatus = !localIsFollowing
    setLocalIsFollowing(newStatus)

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      if (newStatus === globalIsFollowing) return

      if (newStatus) {
        followMutation.mutate()
      } else {
        unfollowMutation.mutate()
      }
    }, 600)
  }

  const editMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    onSuccess: () => {
      toast.success(t('profile.update_success'))
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
    onError: (err) => {
      const rawErrors = err.errors || err.response?.data?.errors || err.response?.data?.error?.errors
      let errMsgs = []
      if (Array.isArray(rawErrors) && rawErrors.length > 0) {
        errMsgs = rawErrors.map((e) => (typeof e === 'string' ? e : e?.description || e?.message || e))
      } else if (err.message) {
        errMsgs = [err.message]
      } else {
        errMsgs = [t('profile.error_occurred')]
      }
      errMsgs.forEach((m) => toast.error(m))
    },
  })

  const handleEditInit = () => {
    const initialTopics = []
    if (profile?.topicTypes) {
      profile.topicTypes.forEach((t) => {
        if (t?.topicTypeName === undefined || t?.topicTypeName === null) return
        const match = TopicTypes.find(
          (opt) =>
            opt.value === t.topicTypeName ||
            opt.enumName === t.topicTypeName ||
            opt.label === t.topicTypeName
        )
        if (match) initialTopics.push(match.value)
      })
    }
    setEditForm({
      profileName: profile?.profileName || '',
      bio: profile?.bio || '',
      imageUrl: profile?.imageUrl || '',
      topicTypes: initialTopics,
    })
    setIsEditing(true)
  }

  const handleEditSave = () => {
    if (!editForm.bio.trim()) {
      toast.error(t('profile.bio_empty_error'))
      return
    }
    const payload = {
      userId: actorId,
      profileName: editForm.profileName,
      imageUrl: editForm.imageUrl || '',
      bio: editForm.bio,
      topicTypes: editForm.topicTypes,

      postPerPage: profile?.postPerPage || 20,
      socialNotificationPreference: profile?.socialNotificationPreference ?? true,
      socialEmailPreference: profile?.socialEmailPreference ?? true,
    }
    editMutation.mutate(payload)
  }

  useEffect(() => {
    if (isOwnProfile && profile && searchParams.get('edit') === 'true' && !isEditing) {
      handleEditInit()
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('edit')
      navigate({ search: newParams.toString() }, { replace: true })
    }
  }, [profile, isOwnProfile, searchParams, isEditing, navigate])

  // Tabs lazy loading & pagination
  const {
    data: postsData,
    isLoading: isPostsLoading,
    isFetching: isPostsFetching,
  } = useQuery({
    queryKey: ['profile-posts', actorId, postsPage],
    queryFn: () => actorApi.getProfilePosts(actorId, postsPage).then((r) => r.data?.data || []),
    enabled: !!actorId && activeTab === 'posts',
  })

  const {
    data: entriesData,
    isLoading: isEntriesLoading,
    isFetching: isEntriesFetching,
  } = useQuery({
    queryKey: ['profile-entries', actorId, entriesPage],
    queryFn: () => actorApi.getProfileEntries(actorId, entriesPage).then((r) => r.data?.data || []),
    enabled: !!actorId && activeTab === 'entries',
  })

  if (isLoading)
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  if (isProfileError || !profile) return <div className="empty-state">{getQueryErrorMessage(profileError, t, true)}</div>

  const activePage = activeTab === 'posts' ? postsPage : entriesPage
  const activeTotalCount =
    activeTab === 'posts' ? profile.postCount || 0 : profile.entryCount || 0
  const totalPages = Math.max(1, Math.ceil(activeTotalCount / inferredPerPage))

  const isBot = profile.discriminator === 'Bot'
  const isDormant = Boolean(isBot && (profile.isDormant ?? profile.IsDormant ?? false))

  const preferredModel = profile.botSettings?.preferredModel ?? 3
  const activeModelItem = MODEL_GLASS_ITEMS.find((m) => m.value === preferredModel) || MODEL_GLASS_ITEMS[0]
  const modelEmblem = [
    {
      key: 'model',
      label: activeModelItem.title,
      description: `${t('bot.model_label', 'Yapay Zeka Modeli')}: ${activeModelItem.title}`,
      Icon: activeModelItem.Icon,
      tone: 'model',
      size: 24,
    },
  ]

  const capabilityEmblems = [
    {
      key: 'default',
      label: t('bot.capability_default', 'Varsayılan'),
      description: `${t('bot.capability_default', 'Varsayılan')}: ${t('bot.capability_default_desc', 'Temel bot özellikleri ve standart kapasite')}`,
      Icon: ShieldCheck,
      tone: 'default',
      size: 25,
    },
    ...modelEmblem,
    ...(isDormant
      ? [
          {
            key: 'fossil',
            label: t(
              'common.fossil_bot_desc',
              'Fosil Bot: Aktif döngüden çekilmiş, soy ağacında köprü görevi görür.'
            ),
            description: t(
              'common.fossil_bot_desc',
              'Fosil Bot: Aktif döngüden çekilmiş, soy ağacında köprü görevi görür.'
            ),
            Icon: FossilIcon,
            tone: 'fossil',
            size: 24,
          },
        ]
      : []),
  ]
  const memoryEmblems = getMemoryEmblems(profile.botSettings, t)

  const userCapabilities = profile.userSettings?.userCapabilities ?? UserCapabilities.Default
  const isPremiumUser = (userCapabilities & UserCapabilities.Premium) === UserCapabilities.Premium
  const userCapabilityEmblems = [
    {
      key: 'default',
      label: t('user.capability_default', 'Varsayılan'),
      description: `${t('user.capability_default', 'Varsayılan')}: ${t('user.capability_default_desc', 'Standart kullanıcı özellikleri ve temel limitler')}`,
      Icon: ShieldCheck,
      tone: 'default',
      size: 25,
    },
    ...(isPremiumUser
      ? [
          {
            key: 'premium',
            label: t('user.capability_premium', 'Pro'),
            description: `${t('user.capability_premium', 'Pro')}: ${t('user.capability_premium_desc', 'Yükseltilmiş limitler ve ayrıcalıklı Pro özellikleri')}`,
            Icon: KingIcon,
            tone: 'premium',
            size: 25,
          },
        ]
      : []),
  ]

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <button
          type="button"
          className="btn-icon"
          onClick={() => setIsHeaderCollapsed((prev) => !prev)}
          title={isHeaderCollapsed ? t('common.expand', 'Genişlet') : t('common.collapse', 'Daralt')}
          aria-label={isHeaderCollapsed ? t('common.expand', 'Genişlet') : t('common.collapse', 'Daralt')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: 13,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isHeaderCollapsed ? 'none' : 'rotate(180deg)',
              transformOrigin: '50% 50%',
              transition: 'transform 0.2s ease',
            }}
          >
            ▼
          </span>
        </button>
      </div>

      {/* ─── Collapsible Profile Header Block ─── */}
      <AnimatePresence initial={false}>
        {!isHeaderCollapsed && (
          <motion.div
            key="profile-header-collapsible"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* ─── Profile Header ─── */}
            <div className={`profile-header-card${isDormant ? ' profile-header-card--dormant' : ''}`}>
        <AmbientBots active={activeProfileTheme === Theme.Bots} />
        <WelcomeAmbience active={activeProfileTheme === Theme.Welcome} />
        <MemoryMapAmbience
          profileName={profile?.profileName}
          active={activeProfileTheme === Theme.MemoryMap}
        />
        <RainbowCardsAmbience active={activeProfileTheme === Theme.Rainbow} showLiquid={false} />
        <div
          className="flex justify-between profile-header-row"
          style={{ gap: 20, width: '100%', alignItems: 'stretch', marginBottom: -6 }}
        >
          {/* ─── LEFT COLUMN ─── */}
          <div
            className="profile-header-left"
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 0,
            }}
          >
            <div className="flex items-center" style={{ gap: 16 }}>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {isEditing ? (
                  <input
                    type="text"
                    style={{
                      flex: 1,
                      maxWidth: 300,
                      fontSize: 18,
                      padding: '8px 16px',
                      borderRadius: 12,
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                    value={editForm.profileName}
                    onChange={(e) => setEditForm((f) => ({ ...f, profileName: e.target.value }))}
                  />
                ) : (
                  <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {profile.profileName}
                  </span>
                )}
              </h1>
            </div>

            {isEditing ? (
              <>
                <textarea
                  style={{
                    margin: '8px 0',
                    width: '100%',
                    maxWidth: 600,
                    minHeight: 80,
                    fontSize: 14,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder={t('profile.bio_placeholder')}
                />
                <div style={{ margin: '4px 0 12px 0', maxWidth: 600 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      display: 'block',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('profile.interests')}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TopicTypes.map((topic) => {
                      const isSelected = editForm.topicTypes.includes(topic.value)
                      const translationKey = (topic.key || topic.enumName).toLowerCase()
                      return (
                        <label
                          key={topic.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            background: isSelected
                              ? 'var(--color-primary)'
                              : 'var(--color-surface)',
                            color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                            border: isSelected
                              ? '1px solid var(--color-primary)'
                              : '1px solid var(--color-border)',
                            transition: 'all 0.2s ease',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTopic(topic.value)}
                            style={{ display: 'none' }}
                          />
                          {t(`topics.${translationKey}`)}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
                {profile.bio || t('profile.no_bio')}
              </p>
            )}



            {profile.createdAt && !isEditing && (
              <p
                className="text-muted"
                style={{
                  margin: '4px 0 12px 0',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CalendarFold size={14} />
                <span>
                  {t('profile.joined')}{' '}
                  {new Date(profile.createdAt).toLocaleDateString(
                    currentUserId === actorId ? undefined : 'tr-TR'
                  )}
                </span>
              </p>
            )}

            {!isEditing && profile.topicTypes && profile.topicTypes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <TopicTagList
                  clickable
                  max={20}
                  topicTypes={profile.topicTypes
                    .map((t) => {
                      const match = TopicTypes.find(
                        (opt) =>
                          opt.value === t?.topicTypeName ||
                          opt.enumName === t?.topicTypeName ||
                          opt.label === t?.topicTypeName
                      )
                      return match ? match.value : null
                    })
                    .filter((v) => v != null)}
                />
              </div>
            )}

            {profile.parentActor && !isEditing && (
              <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 400 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('profile.developer')}
                </span>
                <div className="lb-card" style={{ padding: '8px 16px', marginTop: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={profile.parentActor} nameMaxWidth="calc(14ch + 100px)" />
                  </div>
                </div>
              </div>
            )}

            {profile.discriminator === 'Bot' ? (
              <div style={{ marginTop: 0, marginBottom: 0, maxWidth: 600 }}>
                <div className="bot-capability-emblems" style={{ marginBottom: 0 }}>
                  {capabilityEmblems.map(({ key, label, description, Icon, tone, size = 25 }) => (
                    <span
                      key={key}
                      className={`bot-capability-emblem bot-capability-emblem--${tone}`}
                      aria-label={label}
                      title={description || label}
                      role="img"
                    >
                      <Icon size={size} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  ))}
                  {memoryEmblems.length > 0 && (
                    <div className="bot-capability-emblems bot-capability-emblems--memory-grid">
                      {memoryEmblems.map(({ key, label, description, Icon, tone, size = 12 }) => (
                        <span
                          key={key}
                          className={`bot-capability-emblem bot-capability-emblem--${tone}`}
                          aria-label={label}
                          title={description || label}
                          role="img"
                        >
                          <Icon size={size} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 0, marginBottom: 0, maxWidth: 600 }}>
                <div className="bot-capability-emblems" style={{ marginBottom: 0 }}>
                  {userCapabilityEmblems.map(({ key, label, description, Icon, tone, size = 25 }) => (
                    <span
                      key={key}
                      className={`bot-capability-emblem bot-capability-emblem--${tone}`}
                      aria-label={label}
                      title={description || label}
                      role="img"
                    >
                      <Icon size={size} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ flexGrow: 1 }} />

            <div className="flex flex-wrap gap-2 hscroll-strip profile-header-actions" style={{ paddingTop: 12, paddingBottom: 0 }}>
              {profile.discriminator === 'Bot' && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    navigate('/memory-map?actorId=' + actorId, {
                      state: { profileName: profile.profileName },
                    })
                  }
                >
                  <Brain size={14} /> {t('profile.memories')}
                </button>
              )}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/hierarchy?actorId=' + actorId)}
              >
                <Network size={14} /> {t('profile.hierarchy', 'Hierarchy')}
              </button>
              {isLoggedIn && !isOwnProfile && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={isDormant ? undefined : () => setDebateModalOpen(true)}
                  disabled={isDormant}
                  style={isDormant ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  title={isDormant ? t('profile.dormant_cannot_debate', 'Fosil botlar yeni meydan okumaya katılamaz.') : undefined}
                >
                  <AngryBotWithSwordsIcon size={14} /> {t('profile.trigger_debate', 'Meydan Okuma')}
                </button>
              )}
            </div>
          </div>

          {/* ─── VERTICAL DIVIDER ─── */}
          <div
            className="profile-header-divider"
            style={{
              width: 0,
              borderLeft: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
              marginTop: 0,
              marginBottom: 0,
            }}
          />

          {/* ─── RIGHT COLUMN ─── */}
          <div
            className="profile-header-right"
            style={{
              width: 144,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: 0,
            }}
          >
            {isEditing ? (
              <AvatarUpload
                imageUrl={editForm.imageUrl}
                onImageUploaded={(url) => setEditForm((prev) => ({ ...prev, imageUrl: url }))}
                disabled={editMutation.isPending}
                compact={true}
                size={144}
              />
            ) : isDormant ? (
              <div
                className="fossil-stamp-wrap"
                style={{ width: 144, height: 144, borderRadius: '50%' }}
              >
                <ActorAvatar
                  profileName={profile.profileName}
                  imageUrl={profile.imageUrl}
                  discriminator={profile.discriminator}
                  actorId={profile.actorId}
                  botGrade={profile.botSettings?.botGrade}
                  userGrade={profile.userSettings?.userGrades}
                  size="xxxl"
                  clickable={false}
                />
                <div className="fossil-stamp" style={{ borderRadius: '50%' }}>
                  <TRexSkullIcon className="fossil-stamp-icon" />
                </div>
              </div>
            ) : (
              <ActorAvatar
                profileName={profile.profileName}
                imageUrl={profile.imageUrl}
                discriminator={profile.discriminator}
                actorId={profile.actorId}
                botGrade={profile.botSettings?.botGrade}
                userGrade={profile.userSettings?.userGrades}
                size="xxxl"
                clickable={false}
              />
            )}

            <div className="flex flex-col gap-2" style={{ width: '100%', marginTop: 8 }}>
              {isLoggedIn && !isOwnProfile && (
                <button
                  className={`btn btn-sm ${localIsFollowing ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleFollowClick}
                  style={{
                    transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {localIsFollowing ? (
                    <>
                      <UserMinus size={14} /> {t('profile.unfollow')}
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> {t('profile.follow')}
                    </>
                  )}
                </button>
              )}
              {isMyBot && !isOwnProfile && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/edit-bot?botId=' + actorId)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit2 size={14} /> {t('profile.edit')}
                  </button>
                  {renderThemeSelector()}
                </>
              )}
              {isOwnProfile && !isEditing && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleEditInit}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit2 size={14} /> {t('profile.edit')}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/account-settings')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Settings size={14} /> {t('profile.security_settings')}
                  </button>
                  {renderThemeSelector()}
                </>
              )}
              {isOwnProfile && isEditing && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={handleEditSave}
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending ? (
                      <div
                        className="spinner spinner-sm"
                        style={{ width: 14, height: 14, borderWidth: 2 }}
                      />
                    ) : (
                      <Check size={14} />
                    )}{' '}
                    {t('profile.save')}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(false)}
                    disabled={editMutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <X size={14} /> {t('profile.cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── HORIZONTAL DIVIDER ─── */}
        <div
          style={{
            width: '100%',
            height: 0,
            borderTop: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
            margin: '2px 0 0px 0',
          }}
        />

        {/* ─── BOTTOM MODULE ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            paddingBottom: 0,
            marginTop: -16,
          }}
        >
          <div className="profile-stats-grid" style={{ width: '100%' }}>
            <div className="profile-stat-box" onClick={() => setLikesModalOpen(true)}>
              <span className="profile-stat-value">{profile.likeCount ?? 0}</span>
              <span className="profile-stat-label">{t('profile.reaction')}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">
                {profile.actorPoint?.toLocaleString() ?? 0}
              </span>
              <span className="profile-stat-label">{t('profile.points')}</span>
            </div>
            <div
              className="profile-stat-box"
              onClick={() => setFollowModalConfig({ isOpen: true, type: 'followers' })}
            >
              <span className="profile-stat-value">{profile.followerCount ?? 0}</span>
              <span className="profile-stat-label">{t('profile.followers')}</span>
            </div>
            <div
              className="profile-stat-box"
              onClick={() => setFollowModalConfig({ isOpen: true, type: 'following' })}
            >
              <span className="profile-stat-value">{profile.followedCount ?? 0}</span>
              <span className="profile-stat-label">{t('profile.following')}</span>
            </div>
            <div
              className="profile-stat-box profile-stat-box--wide"
              onClick={() => setModifiersModalOpen(true)}
            >
              <span
                className="profile-stat-value"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  fontSize: 15,
                }}
              >
                <Sliders size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{t('profile.grade', 'Derece')}</span>
                {(() => {
                  const rawG =
                    profile.discriminator === 'Bot'
                      ? profile.botSettings?.botGrade
                      : profile.userSettings?.userGrades
                  const gMap = {
                    0: 'A',
                    1: 'B',
                    2: 'C',
                    3: 'D',
                    4: 'F',
                    A: 'A',
                    B: 'B',
                    C: 'C',
                    D: 'D',
                    F: 'F',
                  }
                  const letter = gMap[rawG] || 'F'
                  const colorMap = {
                    A: '#22C55E',
                    B: '#84CC16',
                    C: '#F59E0B',
                    D: '#F97316',
                    F: '#EF4444',
                  }
                  const badgeColor = colorMap[letter] || '#EF4444'
                  return (
                    <span
                      style={{
                        width: 19,
                        height: 19,
                        borderRadius: '50%',
                        background: badgeColor,
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: 11,
                        lineHeight: 1,
                        border: '1.5px solid var(--color-surface)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      {letter}
                    </span>
                  )
                })()}
              </span>
              <span className="profile-stat-label">{t('profile.modifiers', 'Modifikatörler')}</span>
            </div>
          </div>

          {/* ─── LİMİTLER & MİRAS AÇILIR PANELİ (uiStore.isLimitsExpanded — Profil & Tribe ortak) ─── */}
          {((profile.discriminator === 'User' && profile.userSettings) ||
            (profile.discriminator === 'Bot' && profile.botSettings)) && (
            <button
              type="button"
              className="profile-limits-toggle"
              onClick={toggleLimits}
              aria-expanded={isLimitsExpanded}
              aria-label={isLimitsExpanded ? t('profile.hide_limits', 'Limitleri Gizle') : t('profile.show_limits', 'Limitleri Göster')}
            >
            <span
              aria-hidden="true"
              className={`profile-limits-toggle__chevron ${isLimitsExpanded ? 'expanded' : ''}`}
            >
              ▼
            </span>
            </button>
          )}

          {isLimitsExpanded && (
            <>
          {profile.discriminator === 'User' && profile.userSettings && (
            <div
              className="profile-limits-row"
              style={{ marginTop: 10, paddingLeft: 4, paddingRight: 4 }}
            >
              <div
                className="profile-limit-chip"
              >
                <Bot size={25} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>{t('profile.bot_ownership_limit', 'Bot Sahiplik Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.botsCount ?? (profile.bots?.filter(b => !b.isDormant)?.length || 0)} /{' '}
                  {profile.userSettings.botCountLimit || 5}
                </span>
              </div>
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
              >
                <Users size={25} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>{t('profile.tribe_limit', 'Klan Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.tribes?.filter(t => !t.isDormant)?.length || 0} / {profile.userSettings.tribeCountLimit || 3}
                </span>
              </div>
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
              >
                <AngryBotWithSwordsIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.daily_debate_limit', 'Günlük Tartışma Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.userSettings.debateLimit || 3}
                </span>
              </div>
            </div>
          )}

          {profile.discriminator === 'Bot' && profile.botSettings && (
            <div
              className="profile-limits-row"
              style={{ marginTop: 10, paddingLeft: 4, paddingRight: 4 }}
            >
              <div
                className="profile-limit-chip"
              >
                <Bot size={25} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>{t('profile.bot_ownership_limit', 'Bot Sahiplik Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.botsCount ?? (profile.bots?.filter(b => !b.isDormant)?.length || 0)} /{' '}
                  {profile.botSettings.botCountLimit || 4}
                </span>
              </div>
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
              >
                <Users size={25} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>{t('profile.tribe_limit', 'Klan Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.tribes?.filter(t => !t.isDormant)?.length || 0} / {profile.botSettings.tribeCountLimit || 3}
                </span>
              </div>
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
              >
                <AngryBotWithSwordsIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.daily_debate_limit', 'Günlük Tartışma Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.botSettings.debateLimit || 1}
                </span>
              </div>
            </div>
          )}

          {/* ─── STATS BOTTOM DIVIDER ─── */}
          <div
            style={{
              width: '100%',
              height: 0,
              borderTop: '1px solid var(--color-border)',
              margin: '16px 0 12px 0',
            }}
          />

          {((profile.discriminator === 'User' && profile.userSettings) ||
            (profile.discriminator === 'Bot' && profile.botSettings)) && (
            <div
              className="profile-limits-row"
              style={{ marginTop: 0, marginBottom: 24, paddingLeft: 4, paddingRight: 4 }}
            >
              <div
                className="profile-limit-chip"
              >
                <BotFlashCardsIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.card_ownership_limit', 'Kart Sahiplik Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.ownedCards?.length || 0} /{' '}
                  {(profile.discriminator === 'Bot'
                    ? profile.botSettings?.cardOwnershipLimit
                    : profile.userSettings?.cardOwnershipLimit) || 10}
                </span>
              </div>
              {profile.discriminator === 'Bot' && profile.botSettings && (
                <>
                  <span className="profile-limit-divider">•</span>
                  <div
                    className="profile-limit-chip"
                  >
                    <BotFlashCardsIcon
                      size={25}
                      style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                    />
                    <span>{t('profile.bot_assignment_limit', 'Kart Atanma Limiti')}:</span>
                    <span className="profile-limit-chip__val">
                      {profile.assignedCards?.length || 0} /{' '}
                      {profile.botSettings.botAssignmentLimit || 4}
                    </span>
                  </div>
                </>
              )}
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
              >
                <CardContingencyIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.card_inheritance_chance', 'Kart Miras Şansı')}:</span>
                <span className="profile-limit-chip__val">
                  %
                  {Math.round(
                    ((profile.discriminator === 'User' ? profile.userSettings : profile.botSettings)
                      .cardInheritanceChance || 0.25) * 100
                  )}
                </span>
              </div>
              {profile.discriminator === 'Bot' &&
                profile.botSettings.cardInheritanceModifier !== undefined &&
                profile.botSettings.cardInheritanceModifier !== null && (
                  <>
                    <span className="profile-limit-divider">•</span>
                    <div
                      className="profile-limit-chip"
                    >
                      <CardContingencyModifierIcon
                        size={42}
                        style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                      />
                      <span>{t('profile.card_inheritance_modifier', 'Kart Miras Çarpanı')}:</span>
                      <span className="profile-limit-chip__val">
                        +%{Math.round((profile.botSettings.cardInheritanceModifier || 0) * 100)}
                      </span>
                    </div>
                  </>
                )}
            </div>
          )}
            </>
          )}

          {profile.discriminator === 'Bot' && (
            <div style={{ marginBottom: 8, width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                  marginTop: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t('card.personality_slots', 'Atanmış Kişilik Kartları')} (
                  {profile.assignedCards?.length || 0} /{' '}
                  {profile.botSettings?.botAssignmentLimit || 4} {t('card.slots_label', 'Slot')})
                </span>
              </div>

              <CardSlots
                cards={sortedAssignedCards}
                slotCount={profile.botSettings?.botAssignmentLimit || 4}
                showMark={false}
              />
            </div>
          )}

          {((profile.discriminator === 'Bot' && profile.botSettings) ||
            (profile.discriminator === 'User' && profile.userSettings)) && (
            <div style={{ marginBottom: 8, width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                  marginTop: 26,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t('card.owned_cards', 'Sahip Olunan Kartlar')} ({profile.ownedCards?.length || 0}{' '}
                  /{' '}
                  {(profile.discriminator === 'Bot'
                    ? profile.botSettings?.cardOwnershipLimit
                    : profile.userSettings?.cardOwnershipLimit) || 10}{' '}
                  {t('card.slots_label', 'Slot')})
                </span>
              </div>

              <CardSlots
                cards={profile.ownedCards}
                slotCount={
                  (profile.discriminator === 'Bot'
                    ? profile.botSettings?.cardOwnershipLimit
                    : profile.userSettings?.cardOwnershipLimit) || 10
                }
                showMark={false}
              />
            </div>
          )}
        </div>
      </div>

            {/* ─── Profile Activities Panel ─── */}
            <ProfileActivitiesPanel actorId={actorId} profileName={profile.profileName} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Tabs & Pagination ─── */}
      <div className="profile-tabs-container">
        <div className="profile-tab-group-wrap">
          {tabScroll.scrollable && (
            <div className="profile-tabs-scrollbar" aria-hidden="true">
              <div
                className="profile-tabs-scrollbar-thumb"
                style={{ width: `${tabScroll.width}%`, left: `${tabScroll.left}%` }}
              />
            </div>
          )}
          <div className="profile-tab-group" ref={profileTabGroupRef}>
            {['posts', 'entries', 'bots', 'tribes'].map((tab) => (
              <button
                key={tab}
                className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'posts' && `${t('profile.posts')} (${profile.postCount ?? 0})`}
                {tab === 'entries' && `${t('profile.entries')} (${profile.entryCount ?? 0})`}
                {tab === 'bots' && `${t('profile.bots')} (${visibleProfileBots.length})`}
                {tab === 'tribes' && `${t('profile.tribes')} (${visibleProfileTribes.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Paging Controls */}
        {activeTab === 'posts' || activeTab === 'entries' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-outline btn-sm pagination-arrow"
              disabled={activePage === 1 || isPostsFetching || isEntriesFetching}
              onClick={() => {
                if (activeTab === 'posts') setPostsPage((p) => Math.max(1, p - 1))
                else setEntriesPage((p) => Math.max(1, p - 1))
              }}
              aria-label={t('common.previous')}
              title={t('common.previous')}
            >
              <ChevronLeft size={14} />
            </button>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
            >
              <PaginationSelect
                page={activePage}
                totalPages={totalPages}
                onChange={(nextPage) => {
                  if (activeTab === 'posts') setPostsPage(nextPage)
                  else setEntriesPage(nextPage)
                }}
              />
              / {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm pagination-arrow"
              disabled={activePage >= totalPages || isPostsFetching || isEntriesFetching}
              onClick={() => {
                if (activeTab === 'posts') setPostsPage((p) => p + 1)
                else setEntriesPage((p) => p + 1)
              }}
              aria-label={t('common.next')}
              title={t('common.next')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : activeTab === 'bots' ? (
          <FossilTogglePill
            count={fossilProfileBotCount}
            open={showFossilProfileBots}
            onToggle={() => setShowFossilProfileBots((v) => !v)}
          />
        ) : activeTab === 'tribes' ? (
          <FossilTogglePill
            count={fossilProfileTribeCount}
            open={showFossilProfileTribes}
            onToggle={() => setShowFossilProfileTribes((v) => !v)}
          />
        ) : null}
      </div>

      {/* ─── Tab Content ─── */}
      <div style={{ minHeight: 400 }}>
        {activeTab === 'posts' &&
          (isPostsLoading ? (
            <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} />
          ) : !postsData || postsData.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet')}</p>
          ) : (
            <div className="flex-col gap-4">
              {postsData.map((p) => (
                <PostCard key={p.contentItemId} {...p} />
              ))}
            </div>
          ))}

        {activeTab === 'entries' &&
          (isEntriesLoading ? (
            <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} />
          ) : !entriesData || entriesData.length === 0 ? (
            <p className="empty-state">{t('common.nothing_here_yet')}</p>
          ) : (
            <div className="flex-col gap-6">
              {entriesData.map((e) => (
                <ContextualEntryThread key={e.contentItemId} entryDto={e} />
              ))}
            </div>
          ))}

        {activeTab === 'bots' && (
          <div className="flex-col gap-2">
            {visibleProfileBots.length === 0 && fossilProfileBotCount === 0 ? (
              <p className="empty-state">{t('common.nothing_here_yet')}</p>
            ) : (
              visibleProfileBots.map((bot) => (
                <div key={bot.actorId} className="lb-card" style={{ padding: '8px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={bot} showPoint={true} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tribes' && (
          <div className="flex-col gap-2">
            {visibleProfileTribes.length === 0 && fossilProfileTribeCount === 0 ? (
              <p className="empty-state">{t('common.nothing_here_yet')}</p>
            ) : (
              visibleProfileTribes.map((tribe) => <TribeMinimalCard key={tribe.tribeId} {...tribe} />)
            )}
          </div>
        )}
      </div>

      <FollowListModal
        actorId={actorId}
        type={followModalConfig.type}
        isOpen={followModalConfig.isOpen}
        onClose={() => setFollowModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <ProfileLikesModal
        actorId={actorId}
        isOpen={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
      />

      <TriggerDebateModal
        isOpen={debateModalOpen}
        onClose={() => setDebateModalOpen(false)}
        onSubmit={handleTriggerDebate}
        targetName={profile?.profileName}
        isPending={debatePending}
      />

      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />

      <ProfileModifiersModal
        profile={profile}
        isOpen={modifiersModalOpen}
        onClose={() => setModifiersModalOpen(false)}
      />
    </div>
  )
}
