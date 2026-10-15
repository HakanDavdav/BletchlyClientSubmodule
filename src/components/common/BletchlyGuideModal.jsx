import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ShieldQuestion,
  X,
  Bot,
  Users,
  PackageOpen,
  Newspaper,
  ArrowRight,
  Podium,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import IconActionButton from './IconActionButton'
import BotFlashCardsIcon from './icons/BotFlashCardsIcon'
import AngryBotWithSwordsIcon from './icons/AngryBotWithSwordsIcon'
import Logo from './icons/Logo'
import ArrowCardTravel from './ArrowCardTravel'
import InfoCard from './InfoCard'
import PremiumModal from './PremiumModal'
import ModalHeader from './ModalHeader'
import useIsMobile from '../../hooks/useIsMobile'
import WelcomeSvg from '../../assets/FigmaNew/Welcome.svg?react'
import ModifierArrowSvg from '../../assets/FigmaNew/modifierarrow.svg?react'

export default function BletchlyGuideModal({ triggerStyle }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false)
  const isMobile = useIsMobile()
  const titleId = useId()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const scrollRef = useRef(null)
  const modalRef = useRef(null)
  const welcomeRef = useRef(null)
  const sectionsRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(true)
  // Giriş metnini modalın tam ortasına oturtmak için hesaplanan yükseklik
  const [introHeight, setIntroHeight] = useState(null)

  // Aşağıdaki hedef: merkezi görünür alanın merkezinden aşağıda olan ilk bölüm.
  // Böylece bir bölüm ortalandıktan sonra sıradaki bölüme geçilir.
  const getNextTarget = () => {
    const el = scrollRef.current
    if (!el) return null
    const containerRect = el.getBoundingClientRect()
    const containerCenter = containerRect.top + containerRect.height / 2
    for (const ref of [welcomeRef, sectionsRef]) {
      const node = ref.current
      if (!node) continue
      const rect = node.getBoundingClientRect()
      if (rect.top + rect.height / 2 > containerCenter + 20) return node
    }
    return null
  }

  // Hedefi görünür alanın tam ortasına getirir
  const scrollToNext = () => {
    const target = getNextTarget()
    const container = scrollRef.current
    if (!target || !container) return
    const targetRect = target.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const targetCenter = targetRect.top + targetRect.height / 2
    const containerCenter = containerRect.top + containerRect.height / 2
    container.scrollTo({
      top: container.scrollTop + (targetCenter - containerCenter),
      behavior: 'smooth',
    })
  }

  // Modal açıkken giriş bölümünü, metni modalın dikey ortasına getirecek
  // yükseklikte ayarla (ekran boyutundan bağımsız).
  useEffect(() => {
    if (!isOpen) return undefined
    const recompute = () => {
      const modal = modalRef.current
      const body = scrollRef.current
      if (!modal || !body) return
      const headerH = body.getBoundingClientRect().top - modal.getBoundingClientRect().top
      const padTop = parseFloat(getComputedStyle(body).paddingTop) || 0
      const height = modal.clientHeight - 2 * headerH - 2 * padTop
      setIntroHeight(Math.max(200, Math.round(height)))
    }
    recompute()
    const observer = new ResizeObserver(recompute)
    if (modalRef.current) observer.observe(modalRef.current)
    window.addEventListener('resize', recompute)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recompute)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    const el = scrollRef.current
    if (!el) return undefined
    const update = () => setShowScrollBtn(getNextTarget() !== null)
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const location = useLocation()
  useEffect(() => {
    if (location.state?.showGuide) {
      setIsOpen(true)
      const state = { ...location.state }
      delete state.showGuide
      navigate(location.pathname, { replace: true, state })
    }
  }, [location, navigate])

  const handleNavigate = (path) => {
    setIsOpen(false)
    if (path) {
      navigate(path)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      const scrollContainer = document.getElementById('scroll-container')
      if (scrollContainer) {
        scrollContainer.scrollTop = 0
      }
    }
  }

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
      premium: true,
      onClick: () => setIsPremiumOpen(true),
    },
  ]

  return (
    <>
      <IconActionButton
        onClick={() => setIsOpen(true)}
        aria-label={t('bletchly_guide.title')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={t('bletchly_guide.title')}
        style={triggerStyle}
      >
        <ShieldQuestion size={20} strokeWidth={2.2} />
      </IconActionButton>

      {isOpen &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setIsOpen(false)}
            style={{
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            role="presentation"
          >
            <section
              ref={modalRef}
              className="modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'relative',
                width: 'min(1400px, calc(100vw - 32px))',
                maxWidth: 'none',
                maxHeight: '90vh',
                padding: 0,
                borderRadius: 16,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <ModalHeader
                icon={<Logo width={28} height={28} fill="var(--color-primary)" />}
                title={t('bletchly_guide.title')}
                titleId={titleId}
                onClose={() => setIsOpen(false)}
              />

              {/* Body */}
              <div
                ref={scrollRef}
                className="guide-body"
                style={{ padding: '24px', overflowY: 'auto' }}
              >
                <div
                  className="guide-intro"
                  style={{
                    // Metin modalın tam ortasında dursun diye hesaplanan yükseklik
                    height: introHeight || 620,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 48,
                  }}
                >
                  <p
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
                  </p>
                </div>
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
                  {/* Mobilde otomatik sinematik kamera: blok yakınlaşıp uzaklaşarak
                    hiyerarşinin farklı bölgelerini gösterir (etkileşimsiz) */}
                  <div className="guide-camera">
                    <div className="guide-camera__stage">
                      <ArrowCardTravel
                        Svg={WelcomeSvg}
                        widthPct={60}
                        svgStyle={{ color: 'var(--color-primary)' }}
                        cardWidth={12}
                        // Mobilde kart üretimi daha sık ve akış biraz daha hızlı
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

                <div
                  ref={sectionsRef}
                  className="guide-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {sections.map((sec, idx) => (
                    <InfoCard
                      key={idx}
                      onClick={() => (sec.onClick ? sec.onClick() : handleNavigate(sec.path))}
                      fullWidth={sec.fullWidth}
                      className={`guide-card ${sec.premium ? 'guide-card-premium' : ''}`}
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
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {sec.title}
                        </h3>
                      </div>
                      <p
                        className="guide-card__desc"
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                          flex: 1,
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
                  ))}
                </div>
              </div>

              <style>{`
              .guide-card {
                padding: 16px;
                gap: 8px;
              }
              @keyframes guideBounce {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(8px); }
              }
            `}</style>

              {showScrollBtn && (
                <button
                  type="button"
                  onClick={scrollToNext}
                  aria-label={t('bletchly_guide.scroll_down', 'Aşağı kaydır')}
                  style={{
                    position: 'absolute',
                    bottom: 18,
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
                    zIndex: 10,
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
            </section>
          </div>,
          document.body
        )}

      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
    </>
  )
}
