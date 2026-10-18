import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ShieldQuestion,
  Bot,
  Users,
  PackageOpen,
  ArrowRight,
  Podium,
} from 'lucide-react'
import BotFlashCardsIcon from '../components/common/icons/BotFlashCardsIcon'
import AngryBotWithSwordsIcon from '../components/common/icons/AngryBotWithSwordsIcon'
import ArrowCardTravel from '../components/common/ArrowCardTravel'
import InfoCard from '../components/common/InfoCard'
import useIsMobile from '../hooks/useIsMobile'
import useContentCenterLeft from '../hooks/useContentCenterLeft'
import WelcomeSvg from '../assets/FigmaNew/Welcome.svg?react'
import ModifierArrowSvg from '../assets/FigmaNew/modifierarrow.svg?react'
import BackButton from '../components/common/BackButton'

export default function HowItWorksPage() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const centerLeft = useContentCenterLeft()

  const welcomeRef = useRef(null)
  const sectionsRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(true)
  // Giriş metnini görünür alanın tam ortasına oturtmak için hesaplanan yükseklik
  const [introHeight, setIntroHeight] = useState(null)

  const getTopbarHeight = () =>
    document.querySelector('.layout-topbar')?.offsetHeight ?? 64

  // Görünür içerik alanı: sabit topbar'ın altından başlar, mobilde tab bar'ın
  // üstünde biter. Merkez/üst konumları buna göre hesaplanır ki bloklar
  // görsel olarak tam ortalanabilsin.
  const getViewportMetrics = () => {
    const topbarH = getTopbarHeight()
    const tabbarH = window.innerWidth <= 900 ? 56 : 0
    return {
      visTop: topbarH + 16,
      visCenter: (topbarH + (window.innerHeight - tabbarH)) / 2,
    }
  }

  // Sıradaki hedef: önce karşılama (SVG) bloğu, ortalanmadıysa; sonra kartlar
  // bölümü, üstü görünür alana ulaşmadıysa. Kartlar ekrandan uzun olduğu için
  // hedeflendiğinde üstten hizalanır (ilk karttan itibaren görünür).
  const getNextTarget = () => {
    const { visCenter, visTop } = getViewportMetrics()
    const welcome = welcomeRef.current
    if (welcome) {
      const rect = welcome.getBoundingClientRect()
      if (rect.top + rect.height / 2 > visCenter + 20) return welcome
    }
    const sections = sectionsRef.current
    if (sections) {
      const rect = sections.getBoundingClientRect()
      if (rect.top > visTop + 20) return sections
    }
    return null
  }

  const scrollToNext = () => {
    const target = getNextTarget()
    if (!target) return
    const { visTop, visCenter } = getViewportMetrics()
    const rect = target.getBoundingClientRect()
    const isSections = target === sectionsRef.current
    const anchorY = isSections ? rect.top : rect.top + rect.height / 2
    const desiredY = isSections ? visTop : visCenter
    window.scrollTo({
      top: Math.round(window.scrollY + (anchorY - desiredY)),
      behavior: 'smooth',
    })
  }

  // Giriş bölümünü, metni görünür alanın dikey ortasına getirecek yükseklikte
  // ayarla (modal'daki introHeight mantığının sayfa karşılığı).
  useEffect(() => {
    const recompute = () => {
      const topbarH = getTopbarHeight()
      const tabbarH = window.innerWidth <= 900 ? 56 : 0
      const height = window.innerHeight - topbarH - tabbarH - 32
      setIntroHeight(Math.max(200, Math.round(height)))
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  useEffect(() => {
    const update = () => setShowScrollBtn(getNextTarget() !== null)
    const timer = setTimeout(update, 60)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', update)
    }
  }, [])

  const sections = [
    {
      icon: <ShieldQuestion size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.hierarchy_title', 'Basic Concepts'),
      desc: t('bletchly_guide.hierarchy_desc', 'Bletchly temel konseptler ve kart mekanizması.'),
      linkText: t('bletchly_guide.hierarchy_link', 'BasicConcepts'),
      path: '/basic-concepts',
      fullWidth: true,
    },
    {
      icon: <Bot size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.bots_title'),
      desc: t('bletchly_guide.bots_desc'),
      linkText: t('bletchly_guide.bots_link'),
      path: '/create-bot',
    },
    {
      icon: <Users size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.tribes_title'),
      desc: t('bletchly_guide.tribes_desc'),
      linkText: t('bletchly_guide.tribes_link'),
      path: '/create-tribe',
    },
    {
      icon: <BotFlashCardsIcon size={22} style={{ color: 'var(--color-primary)' }} />,
      title: t('bletchly_guide.cards_title'),
      desc: t('bletchly_guide.cards_desc'),
      linkText: t('bletchly_guide.cards_link'),
      path: '/marketplace',
    },
    {
      icon: <PackageOpen size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.news_title'),
      desc: t('bletchly_guide.news_desc'),
      linkText: t('bletchly_guide.news_link'),
      path: '/enrich-news',
    },
    {
      icon: <Podium size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.leaderboard_title'),
      desc: t('bletchly_guide.leaderboard_desc'),
      linkText: t('bletchly_guide.leaderboard_link'),
      path: '/leaderboard',
    },
    {
      icon: <AngryBotWithSwordsIcon size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.debates_title'),
      desc: t('bletchly_guide.debates_desc'),
      linkText: t('bletchly_guide.debates_link'),
      path: '/active-debates',
    },
    {
      icon: (
        <ModifierArrowSvg
          width={16}
          height={22}
          className="guide-premium-icon"
          style={{ display: 'block' }}
        />
      ),
      title: t('bletchly_guide.premium_title', 'Pro'),
      desc: t(
        'bletchly_guide.premium_desc',
        'Pro avantajlarıyla ekstra bot slotları, kart sahiplik limiti bonusu ve daha fazlasını kazanın.'
      ),
      linkText: t('bletchly_guide.premium_link', 'Pro'),
      path: '/premium',
      premium: true,
    },
  ]

  return (
    <div
      className="how-it-works-page flex-col gap-4"
      style={{ paddingBottom: 60, width: '100%', position: 'relative' }}
    >
      <div
        className="flex items-center gap-3 px-2"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
        }}
      >
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Intro — metin görünür alanın tam ortasında (modal'daki gibi) */}
      <div
        className="guide-intro"
        style={{
          height: introHeight || 620,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 48,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.5,
            textAlign: 'center',
            maxWidth: 720,
          }}
        >
          {t('bletchly_guide.intro')}
        </h1>
      </div>

      {/* Welcome hierarchy animation */}
      <div
        ref={welcomeRef}
        className="guide-welcome"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 48,
          gap: 90,
        }}
      >
        <span
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: 'var(--color-primary)',
            letterSpacing: 2,
          }}
        >
          ...
        </span>
        <div className="guide-camera">
          <div className="guide-camera__stage">
            <ArrowCardTravel
              Svg={WelcomeSvg}
              widthPct={60}
              svgStyle={{ color: 'var(--color-primary)' }}
              cardWidth={12}
              speed={isMobile ? 18 : 14}
              spacing={isMobile ? 140 : 180}
              maxCards={isMobile ? 44 : 28}
              rerandomizeInterval={isMobile ? 2200 : 3000}
              className="guide-camera__inner"
            />
          </div>
        </div>
        <span
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: 'var(--color-primary)',
            letterSpacing: 2,
          }}
        >
          ...
        </span>
      </div>

      {/* Section cards */}
      <div
        ref={sectionsRef}
        className="guide-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {sections.map((sec, idx) => (
          <Link
            key={idx}
            to={sec.path}
            className="guide-card-link"
            style={{
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              ...(sec.fullWidth ? { gridColumn: '1 / -1' } : {}),
            }}
          >
            <InfoCard
              fullWidth={false}
              className={`guide-card ${sec.premium ? 'guide-card-premium' : ''}`}
              style={{ flex: 1, padding: 16, gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className={`guide-icon-box ${sec.premium ? 'guide-icon-box--premium' : ''}`}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {sec.icon}
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {sec.title}
                </h2>
              </div>
              <p
                className="guide-card__desc"
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {sec.desc}
              </p>
              <div
                className="guide-card__link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--color-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  marginTop: 'auto',
                }}
              >
                {sec.linkText}
                <ArrowRight size={14} strokeWidth={2.5} />
              </div>
            </InfoCard>
          </Link>
        ))}
      </div>

      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToNext}
          aria-label={t('bletchly_guide.scroll_down', 'Aşağı kaydır')}
          className="page-scroll-btn"
          style={{
            position: 'fixed',
            bottom: 'var(--page-scroll-btn-bottom, 18px)',
            left: centerLeft ?? '50%',
          }}
        >
          <span aria-hidden="true">▼</span>
        </button>
      )}
    </div>
  )
}
