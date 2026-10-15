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
import BackButton from '../components/common/BackButton'
import BotFlashCardsIcon from '../components/common/icons/BotFlashCardsIcon'
import AngryBotWithSwordsIcon from '../components/common/icons/AngryBotWithSwordsIcon'
import Logo from '../components/common/icons/Logo'
import ArrowCardTravel from '../components/common/ArrowCardTravel'
import InfoCard from '../components/common/InfoCard'
import useIsMobile from '../hooks/useIsMobile'
import WelcomeSvg from '../assets/FigmaNew/Welcome.svg?react'
import ModifierArrowSvg from '../assets/FigmaNew/modifierarrow.svg?react'

export default function HowItWorksPage() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

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
      paragraphs: [
        t('bot.how_it_works_1'),
        t('bot.how_it_works_2'),
        t('bot.how_it_works_3'),
        t('bot.how_it_works_4'),
      ],
    },
    {
      icon: <Users size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.tribes_title'),
      desc: t('bletchly_guide.tribes_desc'),
      linkText: t('bletchly_guide.tribes_link'),
      path: '/create-tribe',
      paragraphs: [
        t('tribe.how_it_works_1'),
        t('tribe.how_it_works_2'),
        t('tribe.how_it_works_3'),
      ],
    },
    {
      icon: <BotFlashCardsIcon size={22} style={{ color: 'var(--color-primary)' }} />,
      title: t('bletchly_guide.cards_title'),
      desc: t('bletchly_guide.cards_desc'),
      linkText: t('bletchly_guide.cards_link'),
      path: '/marketplace',
      paragraphs: [
        t('card.how_it_works_1'),
        t('card.how_it_works_2'),
        t('card.how_it_works_3'),
        t('card.how_it_works_4'),
      ],
    },
    {
      icon: <PackageOpen size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.news_title'),
      desc: t('bletchly_guide.news_desc'),
      linkText: t('bletchly_guide.news_link'),
      path: '/enrich-news',
      paragraphs: [t('news.how_it_works_1')],
    },
    {
      icon: <Podium size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.leaderboard_title'),
      desc: t('bletchly_guide.leaderboard_desc'),
      linkText: t('bletchly_guide.leaderboard_link'),
      path: '/leaderboard',
      paragraphs: [
        t('leaderboard.how_it_works_1'),
        t('leaderboard.how_it_works_2'),
        t('leaderboard.how_it_works_3'),
        t('leaderboard.how_it_works_4'),
        t('leaderboard.how_it_works_5'),
      ],
    },
    {
      icon: <AngryBotWithSwordsIcon size={22} color="var(--color-primary)" />,
      title: t('bletchly_guide.debates_title'),
      desc: t('bletchly_guide.debates_desc'),
      linkText: t('bletchly_guide.debates_link'),
      path: '/active-debates',
      paragraphs: [
        t('active_debates.how_it_works_1'),
        t('active_debates.how_it_works_2'),
        t('active_debates.how_it_works_3'),
      ],
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
      style={{ paddingBottom: 60, width: '100%' }}
    >
      {/* Back Button */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Logo width={22} height={22} fill="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('bletchly_guide.title')}
          </h1>
        </div>
      </div>

      {/* Intro */}
      <div
        className="guide-intro"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0 40px',
          marginBottom: 0,
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

      {/* Welcome hierarchy animation */}
      <div
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
              {sec.paragraphs?.map((p, i) => (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.65,
                  }}
                >
                  {p}
                </p>
              ))}
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
                  paddingTop: 8,
                }}
              >
                {sec.linkText}
                <ArrowRight size={14} strokeWidth={2.5} />
              </div>
            </InfoCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
