import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  Loader2,
  Bot,
  Lock,
  Users,
  Brain,
  Check,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Palette,
  Edit2,
  UploadCloud,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CardContingencyIcon from './icons/CardContingencyIcon'
import BotFlashCardsIcon from './icons/BotFlashCardsIcon'
import AngryBotWithSwordsIcon from './icons/AngryBotWithSwordsIcon'
import KingIcon from './icons/KingIcon'
import BotIcon from './icons/BotIcon'
import KingSvg from '../../assets/King.svg?react'
import ModalHeader from './ModalHeader'
import SelectionMarker from './SelectionMarker'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { paymentApi } from '../../api/paymentApi'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import useIsMobile from '../../hooks/useIsMobile'
import { derivePersonalityCardVars, derivePrimaryVars } from '../../utils/themeColor'
import PersonalityCard from '../card/PersonalityCard'
import { UserCapabilities } from '../../constants/enums'
import { trackBeginCheckout } from '../../utils/analytics'
import mindThemeImg from '../../assets/media_1789577512893.jpg'
import hierarchyThemeImg from '../../assets/media_1789577513208.jpg'
import botsThemeImg from '../../assets/media_1789577513370.jpg'
import fallenAngelImg from '../../assets/CardExamples/Alexandre_Cabanel_-_Fallen_Angel.jpg'
import adamCreationImg from '../../assets/CardExamples/Michelangelo_-_Creation_of_Adam_(cropped).jpg'
import cavalierImg from '../../assets/CardExamples/Cavalier_soldier_Hals-1624x.jpg'
import saturnImg from '../../assets/CardExamples/Francisco_de_Goya,_Saturno_devorando_a_su_hijo_(1819-1823).jpg'
import ducreuxImg from '../../assets/CardExamples/ducreux-yawning-edit.webp'
import jfif1Img from '../../assets/CardExamples/images (1).jfif'
import jfif2Img from '../../assets/CardExamples/images.jfif'
import ImageWithLoader from './ImageWithLoader'

function FramedThemeIcon({ type, size = 20 }) {
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
      <rect x="1.5" y="1.5" width="21" height="21" rx="4.5" strokeWidth="1.6" />
      <g transform="translate(3.6, 3.6) scale(0.7)">
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
      </g>
    </svg>
  )
}

const RAINBOW_THEME_CARDS = [
  { name: 'Red', color: '#f87171' },
  { name: 'RoseCoral', color: '#f97e68' },
  { name: 'Coral', color: '#fa8c5e' },
  { name: 'Terracotta', color: '#fb9b56' },
  { name: 'Tangerine', color: '#fca74e' },
  { name: 'Amber', color: '#fdb748' },
  { name: 'HoneyGold', color: '#fec644' },
  { name: 'Sunflower', color: '#fdd843' },
  { name: 'Chartreuse', color: '#d6e84e' },
  { name: 'Lime', color: '#9fe060' },
  { name: 'Emerald', color: '#6ee787' },
  { name: 'Mint', color: '#4be1a7' },
  { name: 'Seafoam', color: '#3ad5c6' },
  { name: 'Cyan', color: '#38c6dd' },
  { name: 'Sky', color: '#43b9ef' },
  { name: 'Cornflower', color: '#5ea8f8' },
  { name: 'Periwinkle', color: '#799bfb' },
  { name: 'Lavender', color: '#958ef8' },
  { name: 'Violet', color: '#b285f5' },
  { name: 'Orchid', color: '#d07df0' },
  { name: 'RosePink', color: '#f472b6' },
]

// Artistic masterpieces mapped onto selected cards in the rainbow spectrum.
// All images follow the same philosophy as user-assigned personality card visuals.
const RAINBOW_CARD_EXAMPLES = {
  1: {
    imageUrl: fallenAngelImg,
    imageStyle: { objectPosition: '35% 30%' },
  },
  4: {
    imageUrl: cavalierImg,
    imageStyle: { objectPosition: 'center 15%' },
  },
  7: {
    imageUrl: adamCreationImg,
    imageStyle: { objectPosition: '15% 45%' },
  },
  10: {
    imageUrl: saturnImg,
    imageStyle: { objectPosition: 'center center' },
  },
  13: {
    imageUrl: ducreuxImg,
    imageStyle: { objectPosition: 'center 20%' },
  },
  16: {
    imageUrl: jfif1Img,
    imageStyle: { objectPosition: 'center 20%' },
  },
  19: {
    imageUrl: jfif2Img,
    imageStyle: { objectPosition: 'center 20%' },
  },
}

const PALETTE_PRESETS = [
  { color: '#3b82f6', label: 'Mavi' },
  { color: '#10b981', label: 'Yeşil' },
  { color: '#ec4899', label: 'Pembe' },
  { color: '#8b5cf6', label: 'Mor' },
  { color: '#06b6d4', label: 'Turkuaz' },
  { color: '#f97316', label: 'Turuncu' },
  { color: '#ef4444', label: 'Kırmızı' },
  { color: '#eab308', label: 'Sarı' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#6366f1', label: 'İndigo' },
]

export default function PremiumContent({ variant = 'modal', isOpen = true, onClose }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 400
  )

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const titleId = useId()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const actorId = useAuthStore((s) => s.actorId)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const isDarkMode = useThemeStore((s) => s.isDarkMode)
  const isGreenMode = useThemeStore((s) => s.isGreenMode)
  const customColor = useThemeStore((s) => s.customColor)
  const savedCustomColor = useThemeStore((s) => s.savedCustomColor)
  const selectThemeColor = useThemeStore((s) => s.selectThemeColor)
  const setSavedCustomColor = useThemeStore((s) => s.setSavedCustomColor)
  const modalColorInputRef = useRef(null)

  const [isLoading, setIsLoading] = useState(false)
  const [activeThemeIndex, setActiveThemeIndex] = useState(0)
  const [billingCycle, setBillingCycle] = useState('annual')
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  // Mobilde gökkuşağı kartına dokununca masaüstündeki hover önizlemesi gibi büyüsün
  const [activeRainbowIdx, setActiveRainbowIdx] = useState(null)

  // Aktif kullanıcı profil bilgisi (UserCapabilities.Premium kontrolü)
  const { data: userProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    enabled: !!actorId && (isOpen || variant === 'page'),
    staleTime: 30000,
  })

  // Güncel abonelik detayları
  const { data: subStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      const res = await paymentApi.getSubscriptionStatus()
      return res.data?.data
    },
    enabled: !!actorId && (isOpen || variant === 'page'),
    staleTime: 10000,
  })

  const isProfilePremium =
    ((userProfile?.userSettings?.userCapabilities ?? UserCapabilities.Default) &
      UserCapabilities.Premium) ===
    UserCapabilities.Premium

  const isPremiumActive =
    Boolean(subStatus?.isPremium) || isProfilePremium || subStatus?.status === 1

  const isCanceledAtPeriodEnd = Boolean(subStatus?.cancelAtPeriodEnd) || subStatus?.status === 3

  const scrollRef = useRef(null)
  const rainbowRef = useRef(null)
  const perksRef = useRef(null)
  const themesRef = useRef(null)
  const activeCardRef = useRef(null)
  const footerRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(true)
  const [footerHeight, setFooterHeight] = useState(100)

  const scrollToNext = () => {
    const el = scrollRef.current
    if (!el) return
    const totalScrollable = Math.max(0, el.scrollHeight - el.clientHeight)
    const scrollAmount = Math.max(700, Math.round(totalScrollable * 0.5))
    el.scrollBy({ top: scrollAmount, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const el = scrollRef.current
    if (!el) return undefined
    const update = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 35)
    const timer = setTimeout(update, 60)
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', update)
    }
  }, [isOpen, isPremiumActive, billingCycle])

  useEffect(() => {
    if (!isOpen) return undefined
    const updateFooterH = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight)
      }
    }
    updateFooterH()
    const ro = new ResizeObserver(updateFooterH)
    if (footerRef.current) ro.observe(footerRef.current)
    return () => ro.disconnect()
  }, [isOpen, isPremiumActive, isConfirmingCancel])

  // Abonelik iptal mutasyonu
  const cancelMutation = useMutation({
    mutationFn: () => paymentApi.cancelSubscription(),
    onSuccess: () => {
      toast.success(t('premium.cancel_success', 'Aboneliğiniz başarıyla iptal edildi.'))
      setIsConfirmingCancel(false)
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
    },
    onError: (err) => {
      const msg =
        err.response?.data?.errors?.[0]?.description ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        t('premium.cancel_failed', 'Abonelik iptal edilemedi.')
      toast.error(msg)
    },
  })

  // Stripe Portal mutasyonu
  const portalMutation = useMutation({
    mutationFn: () => paymentApi.createCustomerPortal(),
    onSuccess: (res) => {
      const portalUrl = res.data?.data?.portalUrl
      if (portalUrl) {
        window.location.href = portalUrl
      } else {
        toast.error(t('premium.portal_failed', 'Stripe müşteri paneline ulaşılamadı.'))
      }
    },
    onError: (err) => {
      const msg =
        err.response?.data?.errors?.[0]?.description ||
        err.response?.data?.errors?.[0]?.message ||
        t('premium.portal_failed', 'Stripe müşteri paneline ulaşılamadı.')
      toast.error(msg)
    },
  })

  const profileThemes = [
    {
      id: 'mind',
      title: t('premium.theme_mind_title', 'Mind Network'),
      desc: t('premium.theme_mind_desc', 'Dinamik nöron ağı ve bağlantı grafiği teması'),
      img: mindThemeImg,
    },
    {
      id: 'hierarchy',
      title: t('premium.theme_hierarchy_title', 'Hiyerarşi Ağacı'),
      desc: t('premium.theme_hierarchy_desc', 'Ağaç ve organizasyonel yapı grafiği teması'),
      img: hierarchyThemeImg,
    },
    {
      id: 'bots',
      title: t('premium.theme_bots_title', 'Yüzen Botlar'),
      desc: t('premium.theme_bots_desc', 'Etkileşimli süzülen bot parçacıkları ambiyansı'),
      img: botsThemeImg,
    },
  ]

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    try {
      setIsLoading(true)
      const isAnnual = billingCycle === 'annual'
      trackBeginCheckout({
        plan: isAnnual ? 'premium_annual' : 'premium_monthly',
        payment_type: 'subscription',
      })
      const res = await paymentApi.createCheckoutSession({ paymentType: isAnnual ? 1 : 0 })
      const checkoutUrl = res.data?.data?.checkoutUrl
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        toast.error(t('premium.checkout_failed', 'Ödeme oturumu başlatılamadı.'))
      }
    } catch (err) {
      console.error(err)
      toast.error(
        err.message ||
          err.response?.data?.errors?.[0]?.description ||
          err.response?.data?.errors?.[0]?.message ||
          t('premium.checkout_failed', 'Ödeme oturumu başlatılamadı.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingCancel(false)
      return undefined
    }
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const perks = [
    {
      icon: <Bot size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_bots_title', '+4 Bot Oluşturma Limiti'),
      desc: t('premium.perk_bots_desc', 'Ekstra 4 bot üretme ve yönetme kapasitesi.'),
    },
    {
      icon: <BotFlashCardsIcon size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_cards_title', '+4 Kart Sahiplik Limiti'),
      desc: t('premium.perk_cards_desc', 'Envanterde daha fazla kişilik kartı barındırma hakkı.'),
    },
    {
      icon: <Lock size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_locks_title', '+4 Kart Kilitleme Limiti'),
      desc: t(
        'premium.perk_locks_desc',
        'Kişilik kartı atamalarını otomatik tasfiyeden koruma hakkı.'
      ),
    },
    {
      icon: <Users size={16} color="var(--color-primary)" />,
      badge: '+4',
      title: t('premium.perk_tribes_title', '+4 Klan Kurma Limiti'),
      desc: t('premium.perk_tribes_desc', 'Topluluklar oluşturmak için ek klan slotları.'),
    },
    {
      icon: <AngryBotWithSwordsIcon size={18} style={{ color: 'var(--color-primary)' }} />,
      badge: '+4',
      title: t('premium.perk_debates_title', '+4 Günlük Meydan Okuma Limiti'),
      desc: t('premium.perk_debates_desc', 'Her gün eşzamanlı ek meydan okuma ve tartışma hakkı.'),
    },
    {
      icon: <CardContingencyIcon size={13} color="var(--color-primary)" />,
      badge: '+%4',
      title: t('premium.perk_inheritance_title', '+%4 Kart Miras Şansı'),
      desc: t(
        'premium.perk_inheritance_desc',
        'Etkileşimlerde yeni kart türeme ve kalıtım olasılığı artışı.'
      ),
    },
  ]

  const formattedPeriodEnd = subStatus?.currentPeriodEnd
    ? new Date(subStatus.currentPeriodEnd).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const isAnnualPlan = subStatus?.paymentType === 1
  const planName = isAnnualPlan
    ? t('premium.plan_annual_label', 'Yıllık Abonelik')
    : t('premium.plan_label', 'Aylık Abonelik')
  const planPriceText = isAnnualPlan ? '$42 / yıl' : '$5 / ay'

  const content = (
    <>
      {/* Header (yalnızca modal varyantında) */}
      {variant === 'modal' && (
        <ModalHeader
          icon={<Crown size={28} color="#F59E0B" />}
          title={t('premium.title', 'Pro')}
          subtitle={null}
          titleId={titleId}
          onClose={onClose}
        />
      )}

        {/* Body */}
        {isPremiumActive ? (
          /* ========================================================================= */
          /* PREMIUM AKTİF GÖRÜNÜMÜ                                                     */
          /* ========================================================================= */
          <div
            ref={scrollRef}
            className={variant === 'modal' ? 'premium-modal-body' : 'premium-page-body'}
            style={
              variant === 'modal'
                ? {
                    padding: '18px 24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    flex: 1,
                    minHeight: 0,
                  }
                : {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }
            }
          >
            {/* 1. KOCAMAN PREMIUM KING BOT SVG (Modalin En Üstünde) */}
            <div
              style={{
                borderRadius: 18,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                background:
                  'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.16) 0%, rgba(59, 130, 246, 0.08) 55%, var(--color-surface) 100%)',
                border:
                  '1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border))',
                boxShadow: '0 12px 36px -10px rgba(245, 158, 11, 0.22)',
              }}
            >
              {/* Arka Plan Işık Halkası */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  filter: 'blur(20px)',
                }}
              />

              {/* KOCAMAN KING BOT SVG */}
              <div
                style={{
                  position: 'relative',
                  filter: 'drop-shadow(0 10px 22px rgba(245, 158, 11, 0.32))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)'
                }}
              >
                <KingSvg
                  width={150}
                  height={205}
                  style={{
                    display: 'block',
                    width: 150,
                    height: 205,
                  }}
                />
              </div>
            </div>

            {/* 2. Güncel Abonelik Durum Kartı (Premium Bilgilendirme Bloğu) */}
            <div
              ref={activeCardRef}
              className="premium-active-card"
              style={{
                borderRadius: 16,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.15)',
                flexShrink: 0,
              }}
            >
              {/* Durum Rozeti ve Başlık */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isCanceledAtPeriodEnd
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isCanceledAtPeriodEnd ? (
                      <AlertTriangle size={20} color="#F59E0B" />
                    ) : (
                      <ShieldCheck size={20} color="var(--color-primary)" />
                    )}
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}
                    >
                      {t('premium.current_status', 'Abonelik Durumu')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {isCanceledAtPeriodEnd
                        ? t(
                            'premium.status_canceled_desc',
                            'Abonelik yenilenmesi durduruldu. Dönem sonuna kadar ayrıcalıklarınız geçerlidir.'
                          )
                        : t(
                            'premium.status_active_desc',
                            'Pro üyeliğiniz aktif. Otomatik yenilenme ve tüm ayrıcalıklar devrede.'
                          )}
                    </div>
                  </div>
                </div>

                {isCanceledAtPeriodEnd && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.14)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#F59E0B',
                        boxShadow: '0 0 8px #F59E0B',
                      }}
                    />
                    {t('premium.status_canceled', 'Dönem Sonunda İptal Olacak')}
                  </div>
                )}
              </div>

              {/* Detay Bilgi Blokları */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                  paddingTop: 8,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                {/* Plan Bilgisi */}
                <div
                  style={{
                    background: 'var(--color-surface-2)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {t('premium.plan', 'Plan')}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}
                  >
                    {planName}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>
                    {planPriceText}
                  </span>
                </div>

                {/* Bitiş / Yenilenme Tarihi */}
                <div
                  style={{
                    background: 'var(--color-surface-2)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {isCanceledAtPeriodEnd
                      ? t('premium.period_end_canceled', 'Bitiş Tarihi')
                      : t('premium.period_end_active', 'Sonraki Yenilenme')}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}
                  >
                    {formattedPeriodEnd || t('premium.active_period', 'Aktif Dönem')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {isCanceledAtPeriodEnd
                      ? t('premium.will_downgrade', 'Bu tarihte standart plana dönülür')
                      : t('premium.auto_renew', 'Otomatik yenilenir')}
                  </span>
                </div>

                {/* Ödeme Altyapısı */}
                <div
                  style={{
                    background: 'var(--color-surface-2)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {t('premium.provider', 'Ödeme Sağlayıcı')}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}
                  >
                    Stripe Checkout
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {subStatus?.stripeSubscriptionId
                      ? `${subStatus.stripeSubscriptionId.slice(0, 14)}...`
                      : t('premium.secure_active', 'Doğrulanmış & Korumalı')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STANDART SATIN ALMA AKIŞI (PREMIUM OLMAYANLAR İÇİN)                        */
          /* ========================================================================= */
          <div
            ref={scrollRef}
            className={variant === 'modal' ? 'premium-modal-body' : 'premium-page-body'}
            style={
              variant === 'modal'
                ? {
                    padding: '18px 24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    flex: 1,
                    minHeight: 0,
                  }
                : {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }
            }
          >
            {/* Billing Cycle Selection Cards (Monthly vs Annual with 30% discount) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {/* Monthly Card */}
              <div
                className="premium-plan-card"
                role="button"
                tabIndex={0}
                onClick={() => setBillingCycle('monthly')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setBillingCycle('monthly')
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '9px 16px',
                  borderRadius: 14,
                  background:
                    billingCycle === 'monthly'
                      ? 'color-mix(in srgb, var(--color-surface) 88%, var(--color-primary) 12%)'
                      : 'var(--color-surface)',
                  border:
                    billingCycle === 'monthly'
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                  boxShadow:
                    billingCycle === 'monthly'
                      ? '0 4px 18px -4px var(--color-primary-shadow, rgba(99, 102, 241, 0.25))'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 6,
                  position: 'relative',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SelectionMarker checked={billingCycle === 'monthly'} />
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}
                    >
                      {t('premium.plan_label', 'Aylık Abonelik')}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    width: 'calc(100% + 12px)',
                    margin: '0 -6px',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginTop: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>
                      $5
                    </span>
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}
                    >
                      / {t('premium.month', 'ay')}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    $60 / {t('premium.year', 'yıl')}
                  </span>
                </div>
              </div>

              {/* Annual Card (30% Discount) */}
              <div
                className="premium-plan-card"
                role="button"
                tabIndex={0}
                onClick={() => setBillingCycle('annual')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setBillingCycle('annual')
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '9px 16px',
                  borderRadius: 14,
                  background:
                    billingCycle === 'annual'
                      ? 'color-mix(in srgb, var(--color-surface) 86%, var(--color-primary) 14%)'
                      : 'var(--color-surface)',
                  border:
                    billingCycle === 'annual'
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                  boxShadow:
                    billingCycle === 'annual'
                      ? '0 4px 22px -4px var(--color-primary-shadow, rgba(99, 102, 241, 0.35))'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 6,
                  position: 'relative',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SelectionMarker checked={billingCycle === 'annual'} />
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}
                    >
                      {t('premium.plan_annual_label', 'Yıllık Abonelik')}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    width: 'calc(100% + 12px)',
                    margin: '0 -6px',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginTop: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>
                      $3.50
                    </span>
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}
                    >
                      / {t('premium.month', 'ay')}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    $42 / {t('premium.year', 'yıl')}
                  </span>
                </div>
              </div>
            </div>

            {/* Customazible site themes - Rainbow Personality Cards Set */}
            <div
              ref={rainbowRef}
              className="premium-rainbow-showcase-card"
              style={{
                marginTop: 2,
                marginBottom: isMobile ? 8 : 12,
              }}
            >
              <p className="premium-rainbow-showcase-desc">
                {t(
                  'premium.rainbow_customization_desc',
                  'Personalize your entire site with unique color palettes, and assign custom card visuals visible to everyone.'
                )}
              </p>

              {/* 1 Row Personality Card Set */}
              {(() => {
                const mobileScale = isMobile
                  ? Math.max(0.68, Math.min(1, (windowWidth - 32) / 360))
                  : 1
                const rotAngle = isMobile ? Math.round(34 + (mobileScale - 0.68) * 16) : 52
                // Mobilde daha az sayıda ve daha büyük gökkuşağı kartı
                const cardW = isMobile ? Math.round(43 * mobileScale) : 64
                const cardH = isMobile ? Math.round(84 * mobileScale) : 120
                const step = isMobile ? Math.round(12.5 * mobileScale * 10) / 10 : 20
                const cardMarginLeft = isMobile ? Math.round(-(cardW - step)) : -44
                const archDepth = isMobile ? Math.round(46 * mobileScale) : 105
                const archPeak = isMobile ? Math.round(34 * mobileScale) : 75
                const containerPaddingTop = isMobile ? Math.round(36 * mobileScale) : 88
                const containerPaddingBottom = isMobile ? Math.round(18 * mobileScale) : 55
                const containerMinH = isMobile ? Math.round(150 * mobileScale) : 248
                const sideCardW = isMobile ? Math.max(62, Math.round(70 * mobileScale)) : 148
                const sideCardMinH = isMobile ? Math.max(46, Math.round(52 * mobileScale)) : 80
                const imageCardW = isMobile ? Math.max(46, Math.round(52 * mobileScale)) : 80
                const imageCardH = isMobile ? Math.max(68, Math.round(78 * mobileScale)) : 116

                // Mobilde her ikinci kartı göster (21 -> 11), masaüstünde hepsi
                const renderedCards = isMobile
                  ? RAINBOW_THEME_CARDS.map((rc, origIdx) => ({ rc, origIdx })).filter(
                      ({ origIdx }) => origIdx % 2 === 0
                    )
                  : RAINBOW_THEME_CARDS.map((rc, origIdx) => ({ rc, origIdx }))

                return (
                  <div
                    className="premium-rainbow-showcase-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isMobile ? 6 : 20,
                      width: '100%',
                      position: 'relative',
                      marginTop: 2,
                      marginBottom: isMobile ? 8 : 16,
                    }}
                  >
                    {/* Sol Taraf: Renk Paleti (Theme Palette Card) */}
                    <div
                      className="premium-rainbow-side-card"
                      style={{
                        background: 'var(--color-surface-raised, var(--color-surface))',
                        border: isMobile
                          ? '1.5px solid var(--color-border)'
                          : '2px solid var(--color-border)',
                        borderRadius: isMobile ? 10 : 14,
                        boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.18))',
                        width: sideCardW,
                        minHeight: sideCardMinH,
                        padding: isMobile ? '6px 6px' : '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMobile ? 3 : 7,
                        flexShrink: 0,
                        zIndex: 35,
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                      aria-hidden="true"
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: isMobile ? 2.5 : 5,
                          width: isMobile ? 44 : '100%',
                          justifyItems: 'center',
                        }}
                      >
                        {PALETTE_PRESETS.map((preset) => (
                          <span
                            key={preset.color}
                            style={{
                              width: isMobile ? 6 : 16,
                              height: isMobile ? 6 : 16,
                              borderRadius: '50%',
                              background: preset.color,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: isMobile ? 3 : 7,
                          marginTop: isMobile ? 1 : 2,
                        }}
                      >
                        <span
                          style={{
                            width: isMobile ? 9 : 22,
                            height: isMobile ? 9 : 22,
                            borderRadius: '50%',
                            background: savedCustomColor || '#ef4444',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            width: isMobile ? 9 : 22,
                            height: isMobile ? 9 : 22,
                            borderRadius: '50%',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Edit2 size={isMobile ? 5.5 : 12} />
                        </span>
                      </div>
                    </div>

                    {/* Orta: Gökkuşağı Kişilik Kartları Yay Seti */}
                    <div
                      className="rainbow-slots-container"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        gap: 0,
                        overflow: 'visible',
                        userSelect: 'none',
                        padding: isMobile
                          ? `${containerPaddingTop}px 2px ${containerPaddingBottom}px`
                          : `${containerPaddingTop}px 8px ${containerPaddingBottom}px`,
                        border: 'none',
                        background: 'transparent',
                        minHeight: containerMinH,
                        boxShadow: 'none',
                        width: 'auto',
                        flex: '0 0 auto',
                        boxSizing: 'border-box',
                      }}
                    >
                      {renderedCards.map(({ rc, origIdx }, idx) => {
                        const cardVars = {
                          ...derivePersonalityCardVars(rc.color, isDarkMode),
                          ...derivePrimaryVars(rc.color, isDarkMode),
                          '--pc-filled-shadow': isMobile
                            ? '-2px 2px 4px rgba(0, 0, 0, 0.3)'
                            : '-3px 3px 8px rgba(0, 0, 0, 0.28)',
                        }
                        const total = renderedCards.length
                        const t = idx / (total - 1)
                        const x = (t - 0.5) * 2 // -1 to +1
                        const rot = Math.round(x * rotAngle * 10) / 10
                        const lift = Math.round((Math.pow(x, 2) * archDepth - archPeak) * 10) / 10
                        const baseZ = idx + 1
                        const exampleImage = RAINBOW_CARD_EXAMPLES[origIdx]

                        return (
                          <div
                            key={rc.name}
                            className="rainbow-card-wrapper"
                            tabIndex={-1}
                            style={{
                              flex: `0 0 ${cardW}px`,
                              width: `${cardW}px`,
                              minWidth: `${cardW}px`,
                              marginLeft: idx === 0 ? 0 : `${cardMarginLeft}px`,
                              display: 'flex',
                              position: 'relative',
                              zIndex: isMobile && activeRainbowIdx === idx ? 70 : baseZ,
                              transformOrigin: isMobile ? '50% 160%' : '50% 200%',
                              transform: `translateY(${lift}px) rotate(${rot}deg)${
                                isMobile && activeRainbowIdx === idx ? ' scale(1.05)' : ''
                              }`,
                              transition:
                                'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), z-index 0.22s ease',
                              cursor: 'pointer',
                              '--rainbow-card-w': `${cardW}px`,
                              '--rainbow-card-h': `${cardH}px`,
                              ...cardVars,
                            }}
                            onMouseEnter={
                              isMobile
                                ? undefined
                                : (e) => {
                                    e.currentTarget.style.transform = `translateY(${lift}px) rotate(${rot}deg) scale(1.05)`
                                    e.currentTarget.style.zIndex = '70'
                                  }
                            }
                            onMouseLeave={
                              isMobile
                                ? undefined
                                : (e) => {
                                    e.currentTarget.style.transform = `translateY(${lift}px) rotate(${rot}deg) scale(1)`
                                    e.currentTarget.style.zIndex = String(baseZ)
                                  }
                            }
                            onClick={(e) => {
                              // Prevent any browser auto-scroll or focus shift on tap
                              e.preventDefault()
                              // Mobilde dokununca masaüstü hover önizlemesi gibi büyüt/küçült
                              if (isMobile) {
                                setActiveRainbowIdx((current) => (current === idx ? null : idx))
                              }
                            }}
                          >
                            <PersonalityCard
                              className="rainbow-personality-card"
                              slotNumber={null}
                              card={{
                                cardName: '',
                                personalityPrompt: '',
                                filled: true,
                                personalityCardId: null,
                                imageUrl: exampleImage?.imageUrl,
                              }}
                              imageStyle={exampleImage?.imageStyle}
                              showMark={false}
                              showStats={false}
                              interactive={false}
                              style={cardVars}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Sağ Taraf: Create Bot Sayfasındaki Görsel Seç Ögesinin Dikey Versiyonu */}
                    <div
                      className="premium-rainbow-side-card"
                      style={{
                        background: 'var(--color-surface-raised, var(--color-surface))',
                        border: isMobile
                          ? '1.5px solid var(--color-border)'
                          : '2px solid var(--color-border)',
                        borderRadius: isMobile ? 10 : 14,
                        boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.18))',
                        width: imageCardW,
                        height: imageCardH,
                        minHeight: imageCardH,
                        padding: isMobile ? '6px 6px' : '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 35,
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        cursor: 'default',
                        overflow: 'hidden',
                      }}
                      aria-hidden="true"
                    >
                      <UploadCloud
                        size={isMobile ? 22 : 32}
                        style={{ color: 'var(--color-text-faint, var(--color-text-muted))' }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Perks & Highlights List */}
            <div ref={perksRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Extra Highlights (Gold Crown Badge & Extended Bot Memory) */}
              <div
                className="premium-highlight-card"
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: 'color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))',
                  border:
                    '1px solid color-mix(in srgb, var(--color-warning) 24%, var(--color-border))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <KingIcon size={16} style={{ flexShrink: 0 }} />
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    {t('premium.badge_highlight_title', 'Altın Taç Rozeti:')}
                  </strong>{' '}
                  {t('premium.badge_highlight_desc', 'Profilinizde özel rozet gösterilir.')}
                </div>
              </div>

              <div
                className="premium-highlight-card"
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  background: 'color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))',
                  border:
                    '1px solid color-mix(in srgb, var(--color-warning) 24%, var(--color-border))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Brain size={18} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <strong style={{ color: 'var(--color-text-primary)' }}>
                    {t('premium.memory_highlight_title', 'Genişletilmiş Bot Hafızası:')}
                  </strong>{' '}
                  {t('premium.memory_highlight_desc', '+30 gün uzatılmış bot hafıza süresi.')}
                </div>
              </div>

              {/* Perks List */}
              {perks.map((perk, index) => (
                <div
                  key={index}
                  className="premium-perk-card"
                  style={{
                    padding: '9px 14px',
                    borderRadius: 10,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {perk.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {perk.title}
                      {perk.desc && (
                        <span
                          className="premium-perk-desc"
                          style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: 'var(--color-text-muted)',
                            marginLeft: 8,
                          }}
                        >
                          — {perk.desc}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 3 Exclusive Profile Themes Showcase */}
            <div ref={themesRef} className="premium-themes-showcase-card">
              <div className="premium-themes-showcase-header">
                <div className="premium-themes-title-row">
                  <div className="premium-themes-title">
                    {t('premium.themes_section_title', '3 Farklı Profil Görsel Tasarımı')}
                  </div>

                  <div className="premium-themes-toggle-group">
                    <button
                      type="button"
                      className={`btn btn-sm ${activeThemeIndex === 0 ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setActiveThemeIndex(0)}
                      aria-label={t('topbar.mind_ambience', 'Mind Arka Planı')}
                      style={{
                        width: isMobile ? 33 : 38,
                        height: isMobile ? 26 : 30,
                        minWidth: 0,
                        padding: isMobile ? '3px 0' : '4px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        position: 'relative',
                        zIndex: activeThemeIndex === 0 ? 2 : 1,
                        ...(activeThemeIndex === 0
                          ? {}
                          : {
                              borderColor: 'var(--color-border-light)',
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-surface-2)',
                            }),
                      }}
                    >
                      <FramedThemeIcon type="brain" size={isMobile ? 17 : 20} />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${activeThemeIndex === 1 ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setActiveThemeIndex(1)}
                      aria-label={t('topbar.welcome_ambience', 'Welcome Arka Planı')}
                      style={{
                        width: isMobile ? 33 : 38,
                        height: isMobile ? 26 : 30,
                        minWidth: 0,
                        padding: isMobile ? '3px 0' : '4px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 0,
                        marginLeft: -1,
                        position: 'relative',
                        zIndex: activeThemeIndex === 1 ? 2 : 1,
                        ...(activeThemeIndex === 1
                          ? {}
                          : {
                              borderColor: 'var(--color-border-light)',
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-surface-2)',
                            }),
                      }}
                    >
                      <FramedThemeIcon type="hierarchy" size={isMobile ? 17 : 20} />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${activeThemeIndex === 2 ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setActiveThemeIndex(2)}
                      aria-label={t('topbar.ambient_bots', 'Bot Arka Planı')}
                      style={{
                        width: isMobile ? 33 : 38,
                        height: isMobile ? 26 : 30,
                        minWidth: 0,
                        padding: isMobile ? '3px 0' : '4px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        marginLeft: -1,
                        position: 'relative',
                        zIndex: activeThemeIndex === 2 ? 2 : 1,
                        ...(activeThemeIndex === 2
                          ? {}
                          : {
                              borderColor: 'var(--color-border-light)',
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-surface-2)',
                            }),
                      }}
                    >
                      <FramedThemeIcon type="bot" size={isMobile ? 17 : 20} />
                    </button>
                  </div>
                </div>

                <div className="premium-themes-desc">
                  {t(
                    'premium.themes_section_desc',
                    'Profiliniz ve botlarınız için herkes tarafından görülebilen\n3 benzersiz animasyonlu dinamik ambiyans başlık tasarımının kilidini açın.'
                  )}
                </div>
              </div>

              {/* Visual Image Preview */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  background: '#000',
                  width: '100%',
                  position: 'relative',
                  minHeight: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageWithLoader
                  src={profileThemes[activeThemeIndex].img}
                  alt={profileThemes[activeThemeIndex].title}
                  spinnerSize="md"
                  spinnerOpacity={0.45}
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'opacity 0.25s ease',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer (Aboneliği İptal Etme / Yönetim veya Satın Alma Butonu) */}
        <div
          ref={footerRef}
          style={{
            padding: '14px 24px 18px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {isPremiumActive ? (
            /* ========================================================================= */
            /* PREMIUM AKTİF FOOTER (ABONELİĞİ İPTAL ET BUTONU & YÖNETİM)               */
            /* ========================================================================= */
            isConfirmingCancel ? (
              /* İptal Onay Kutusu */
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background:
                    'color-mix(in srgb, var(--color-danger, #ef4444) 10%, var(--color-surface))',
                  border:
                    '1px solid color-mix(in srgb, var(--color-danger, #ef4444) 30%, var(--color-border))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <AlertTriangle
                    size={18}
                    color="var(--color-danger, #ef4444)"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}
                    >
                      {t(
                        'premium.cancel_confirm_title',
                        'Aboneliğinizi iptal etmek istediğinize emin misiniz?'
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {t(
                        'premium.cancel_confirm_desc',
                        'İptal ettiğinizde mevcut döneminizin sonuna kadar pro özellikleriniz devam edecek, ardından standart plana geçilecektir.'
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setIsConfirmingCancel(false)}
                    disabled={cancelMutation.isPending}
                    style={{ fontSize: 13, padding: '7px 14px' }}
                  >
                    {t('premium.cancel_abort_btn', 'Vazgeç')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    style={{
                      fontSize: 13,
                      padding: '7px 16px',
                      background: 'var(--color-danger, #ef4444)',
                      borderColor: 'var(--color-danger, #ef4444)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {cancelMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    {t('premium.cancel_confirm_btn', 'Evet, Aboneliği İptal Et')}
                  </button>
                </div>
              </div>
            ) : (
              /* Normal İptal & Yönet Butonları */
              <div
                className="premium-footer-actions"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {/* Stripe Portal Butonu (Faturalar, Kart Güncelleme) */}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    padding: '8px 14px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {portalMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ExternalLink size={14} />
                  )}
                  {t('premium.manage_portal', 'Fatura & Kartı Yönet')}
                </button>

                {/* EN ALTTADA ABONELİĞİ İPTAL ETME BUTONU */}
                {isCanceledAtPeriodEnd ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onClose}
                    style={{
                      fontSize: 13,
                      padding: '8px 20px',
                    }}
                  >
                    {t('common.close', 'Kapat')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setIsConfirmingCancel(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-danger, #ef4444)',
                      color: 'var(--color-danger, #ef4444)',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '8px 18px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-danger, #ef4444)'
                      e.currentTarget.style.color = '#FFFFFF'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--color-danger, #ef4444)'
                    }}
                  >
                    {t('premium.cancel_subscription', 'Aboneliği İptal Et')}
                  </button>
                )}
              </div>
            )
          ) : (
            /* ========================================================================= */
            /* STANDART CHECKOUT FOOTER (PREMIUM OLMAYANLAR İÇİN)                        */
            /* ========================================================================= */
            <>
              <button
                type="button"
                className="btn"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#FFFFFF',
                  background:
                    'linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 50%, var(--color-primary-gradient-end) 100%)',
                  boxShadow: '0 4px 14px 0 var(--color-primary-shadow)',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1.5px)'
                    e.currentTarget.style.boxShadow = '0 6px 18px 0 var(--color-primary-shadow)'
                    e.currentTarget.style.filter = 'brightness(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 var(--color-primary-shadow)'
                    e.currentTarget.style.filter = 'none'
                  }
                }}
                disabled={isLoading}
                onClick={handleCheckout}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Crown size={18} />}
                {isLoading
                  ? t('common.loading', 'Yükleniyor...')
                  : billingCycle === 'annual'
                    ? t('premium.checkout_cta_annual', "$42 / Yıl ile Pro'ya Yükselt")
                    : t('premium.checkout_cta', "$5 / Ay ile Pro'ya Yükselt")}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                <span>{t('premium.secure_payment', 'Güvenli Stripe Ödemesi')}</span>
              </div>
            </>
          )}
        </div>

        <style>{`
          @keyframes guideBounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(8px); }
          }
        `}</style>

        {variant === 'modal' && showScrollBtn && (
          <button
            type="button"
            onClick={scrollToNext}
            aria-label={t('bletchly_guide.scroll_down', 'Aşağı kaydır')}
            style={{
              position: 'absolute',
              bottom: footerHeight + 14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
              zIndex: 20,
              animation: 'guideBounce 2s ease-in-out infinite',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: 20,
                lineHeight: 1,
                display: 'inline-block',
                transform: 'translateY(1.5px)',
              }}
            >
              ▼
            </span>
          </button>
        )}
    </>
  )

  if (variant === 'page') {
    return (
      <div
        className="premium-page-content"
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {content}
      </div>
    )
  }

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
      }}
      role="presentation"
    >
      <section
        className="modal-box premium-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1000px, calc(100vw - 48px))',
          maxWidth: 'none',
          maxHeight: '92vh',
          padding: 0,
          borderRadius: 20,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {content}
      </section>
    </div>,
    document.body
  )
}
