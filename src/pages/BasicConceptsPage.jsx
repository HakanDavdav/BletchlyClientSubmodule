import { useCallback, useState } from 'react'
import {
  Binoculars,
  ClockAlert,
  ClockCheck,
  Crown,
  Feather,
  Fish,
  Flame,
  Info,
  Lock,
  Rabbit,
  ShieldQuestion,
  Snail,
  Waypoints,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useIsMobile from '../hooks/useIsMobile'
import BackButton from '../components/common/BackButton'
import BotIcon from '../components/common/icons/BotIcon'
import ElephantIcon from '../components/common/icons/ElephantIcon'
import SheepIcon from '../components/common/icons/SheepIcon'
import { getMemoryEmblems } from '../components/common/MemoryEmblems'
import CardContingencyIcon from '../components/common/icons/CardContingencyIcon'
import CardContingencyModifierIcon from '../components/common/icons/CardContingencyModifierIcon'
import CardIcon from '../components/common/icons/CardIcon'
import ArrowCardTravel from '../components/common/ArrowCardTravel'
import CardConveyor from '../components/common/CardConveyor'
import InfoCard from '../components/common/InfoCard'
import TutorialSvg from '../assets/FigmaNew/Tutorial.svg?react'
import TutorialBotSpreadSvg from '../assets/FigmaNew/TutorialBotSpread.svg?react'
import TutorialUserSpreadSvg from '../assets/FigmaNew/TutorialUserSpread.svg?react'
import TribeTutorialSvg from '../assets/FigmaNew/TribeTutorial.svg?react'
import CardBotBlockSvg from '../assets/FigmaNew/CardBotBlock.svg?react'
import CardBotBlockTallSvg from '../assets/FigmaNew/CardBotBlockTall.svg?react'
import CardSvg from '../assets/FigmaNew/Card.svg?react'
import HeartSvg from '../assets/FigmaNew/heart.svg?react'
import HierarchyGraphSvg from '../assets/FigmaNew/HierarchyGraph.svg?react'
import BotSvg from '../assets/FigmaNew/Bot.svg?react'

const themedStyle = { color: 'var(--color-primary)' }
const TUTORIAL_DORMANT_ARROWS = ['Arrow_3']
const TRIBE_DORMANT_ARROWS = ['Arrow_8', 'Arrow_9', 'Arrow_2', 'Arrow_3', 'Arrow']
const TUTORIAL_FOSSIL_BOTS = ['Bot_3']
const TRIBE_FOSSIL_BOTS = ['Bot_3', 'Bot_2', 'Bot_7']

const descriptionStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.7,
  color: 'var(--color-text-secondary)',
}

const sectionDividerStyle = {
  width: '100%',
  height: 1,
  background: 'var(--color-border)',
  margin: '28px 0',
}

function SectionHeader({ title }) {
  return (
    <h3
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '0 0 24px',
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Info size={16} color="var(--color-primary)" />
      </div>
      {title}
    </h3>
  )
}

function ConceptBlock({ title, children }) {
  return (
    <div style={{ width: '100%' }}>
      <SectionHeader title={title} />
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
      >
        {children}
      </div>
    </div>
  )
}

function VisualStage({ children, style }) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius: 10,
        background: 'transparent',
        border: '1px solid var(--color-border)',
        padding: '20px 16px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function TextColumn({ children }) {
  return <div style={{ width: '100%', flex: 1 }}>{children}</div>
}

function Description({ children, style }) {
  return <p style={{ ...descriptionStyle, ...style }}>{children}</p>
}

function InlineContingency({ label }) {
  const { t } = useTranslation()
  const text = label || t('hierarchy_info.contingency_badge')
  return (
    <>
      {text}
      <span
        title={text}
        aria-label={text}
        role="img"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          margin: '-2px 2px 0 3px',
          color: 'var(--color-primary)',
        }}
      >
        <CardContingencyIcon size={12} style={{ color: 'var(--color-primary)' }} />
      </span>
    </>
  )
}

function InlineContingencyModifier({ label }) {
  const { t } = useTranslation()
  const text = label || t('hierarchy_info.contingency_modifier_badge')
  return (
    <>
      {text}
      <span
        title={text}
        aria-label={text}
        role="img"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          margin: '-2px 2px 0 3px',
          color: 'var(--color-primary)',
        }}
      >
        <CardContingencyModifierIcon size={20} style={{ color: 'var(--color-primary)' }} />
      </span>
    </>
  )
}

function InlineMemoryPair({ LowIcon, HighIcon, lowTitle, highTitle }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        verticalAlign: 'middle',
        margin: '-2px 4px 0 3px',
      }}
    >
      <span
        className="bot-capability-emblem bot-capability-emblem--memory"
        style={{ width: 20, height: 20 }}
        title={lowTitle}
        aria-label={lowTitle}
        role="img"
      >
        <LowIcon size={12} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span
        className="bot-capability-emblem bot-capability-emblem--memory"
        style={{ width: 20, height: 20 }}
        title={highTitle}
        aria-label={highTitle}
        role="img"
      >
        <HighIcon size={12} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </span>
  )
}

function InlineCreatorCrown() {
  const { t } = useTranslation()
  const label = t('card.tooltip_creator')
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        margin: '-2px 2px 0 3px',
        color: 'var(--color-warning)',
        filter: 'drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.35))',
      }}
    >
      <Crown size={15} strokeWidth={2.5} aria-hidden="true" />
    </span>
  )
}

function InlinePurchasedCrown() {
  const { t } = useTranslation()
  const label = t('card.tooltip_purchased')
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
        margin: '-2px 3px 0 3px',
        color: '#b87333',
        filter: 'drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.35))',
      }}
    >
      <Crown size={14} strokeWidth={2.5} aria-hidden="true" />
      <span
        style={{
          marginLeft: '-2.5px',
          marginTop: '2px',
          fontSize: '14px',
          fontWeight: 900,
          fontFamily: '"Arial Black", Impact, system-ui, sans-serif',
          lineHeight: 1,
          color: '#22c55e',
          textShadow: '0 0 2px rgba(34, 197, 94, 0.35), 0 1px 1px rgba(0,0,0,0.8)',
          WebkitTextStroke: '0.4px #052e16',
        }}
      >
        $
      </span>
    </span>
  )
}

function InlineClockAlert() {
  const { t } = useTranslation()
  const label = t('card.tooltip_incubating')
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        margin: '-2px 3px 0 3px',
        color: '#ffffff',
        filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
      }}
    >
      <ClockAlert size={15} strokeWidth={2.6} aria-hidden="true" />
    </span>
  )
}

function InlineClockCheck() {
  const { t } = useTranslation()
  const label = t('card.tooltip_effective')
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        margin: '-2px 3px 0 3px',
        color: 'var(--color-warning)',
        filter: 'drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.35))',
      }}
    >
      <ClockCheck size={15} strokeWidth={2.6} aria-hidden="true" />
    </span>
  )
}

function LockedCards() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: 'relative' }}>
          <CardIcon
            width={64}
            locked={i === 1}
            crownSize={20}
            crownTop={-5}
            crownLeft={-6}
          />
        </div>
      ))}
    </div>
  )
}

function IncubationCards() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: 'relative' }}>
          <CardIcon
            width={64}
            effective={i >= 2}
            incubating={i < 2}
            crownSize={20}
            crownTop={-5}
            crownLeft={-6}
          />
        </div>
      ))}
    </div>
  )
}

const MATCH_ROWS = 5
const MATCH_LINKS = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [0, 1],
  [2, 1],
  [4, 1],
  [1, 2],
  [3, 2],
]
const MATCH_TOPICS = ['ai', 'space', 'sports', 'science', 'gaming']

function MatchPill({ cx, cy, label, selected }) {
  const width = Math.min(70, 22 + label.length * 5)
  const height = 20
  return (
    <g transform={`translate(${cx - width / 2} ${cy - height / 2})`}>
      <rect
        width={width}
        height={height}
        rx={height / 2}
        fill={selected ? 'var(--color-primary)' : 'var(--color-surface)'}
        stroke={selected ? 'var(--color-primary)' : 'var(--color-border)'}
        strokeWidth={1}
      />
      <text
        x={width / 2}
        y={height / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8.5}
        fontWeight={600}
        fill={selected ? '#ffffff' : 'var(--color-text-secondary)'}
      >
        {label}
      </text>
    </g>
  )
}

function MatchDiagram({ kind }) {
  const { t } = useTranslation()
  const leftX = 50
  const rightX = 210
  const ys = Array.from({ length: MATCH_ROWS }, (_, i) => 40 + i * 36)
  const botW = 30
  const botH = 27
  const isPill = kind === 'pill'
  const pad = isPill ? 36 : botW / 2 + 2
  const labels = MATCH_TOPICS.map((key) => t(`topics.${key}`))

  return (
    <svg
      viewBox="0 0 260 219"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="match-diagram"
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        aspectRatio: '260 / 219',
        color: 'var(--color-primary)',
      }}
    >
      <defs>
        <marker
          id={`match-arrow-${kind}`}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path
            d="M0 0L9 5L0 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {MATCH_LINKS.map(([li, ri], idx) => (
        <line
          key={idx}
          x1={leftX + pad}
          y1={ys[li]}
          x2={rightX - pad}
          y2={ys[ri]}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeDasharray="3 3"
          markerEnd={`url(#match-arrow-${kind})`}
          opacity={0.9}
        />
      ))}

      {ys.map((y, i) =>
        isPill ? (
          <MatchPill key={`l-${i}`} cx={leftX} cy={y} label={labels[i]} selected={i % 2 === 0} />
        ) : (
          <BotSvg
            key={`l-${i}`}
            x={leftX - botW / 2}
            y={y - botH / 2}
            width={botW}
            height={botH}
            style={{ color: 'var(--color-primary)' }}
          />
        )
      )}

      {ys.map((y, i) =>
        isPill ? (
          <MatchPill
            key={`r-${i}`}
            cx={rightX}
            cy={y}
            label={labels[(i + 3) % MATCH_ROWS]}
            selected={i % 2 === 1}
          />
        ) : (
          <BotSvg
            key={`r-${i}`}
            x={rightX - botW / 2}
            y={y - botH / 2}
            width={botW}
            height={botH}
            style={{ color: 'var(--color-primary)' }}
          />
        )
      )}
    </svg>
  )
}

export default function BasicConceptsPage() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [pulseCount, setPulseCount] = useState(0)
  const handlePulse = useCallback(() => setPulseCount((c) => c + 1), [])
  const sampleMemoryEmblems = getMemoryEmblems(
    {
      affinityBiasMultiplier: 1.8,
      ebbinghausHalfLifePeriodMultiplier: 0.2,
      recallPathLimitMultiplier: 1.8,
      maxStrengthMultiplier: 0.5,
      incubationPeriodMultiplier: 0.2,
    },
    t
  )

  return (
    <div
      className="flex-col gap-4"
      style={{ paddingBottom: 60, maxWidth: 1200, margin: '0 auto', width: '100%' }}
    >
      <style>{`
        @keyframes heartBeat {
          0%, 30%, 60%, 100% { transform: scale(1); }
          15% { transform: scale(1.35); }
          45% { transform: scale(1.12); }
        }

        :root {
          --color-dormant: #000000;
        }
        :root.dark {
          --color-dormant: #64748b;
        }

        .dormant-tutorial-container #Arrow_3,
        .dormant-tutorial-container #Arrow_3 *,
        .dormant-tutorial-container #Bot_3,
        .dormant-tutorial-container #Bot_3 * {
          stroke: var(--color-dormant) !important;
          color: var(--color-dormant) !important;
        }

        .dormant-tribe-container #Arrow_8,
        .dormant-tribe-container #Arrow_8 *,
        .dormant-tribe-container #BotBlock,
        .dormant-tribe-container #BotBlock *,
        .dormant-tribe-container #Arrow_9,
        .dormant-tribe-container #Arrow_9 *,
        .dormant-tribe-container #BotBlock_2,
        .dormant-tribe-container #BotBlock_2 *,
        .dormant-tribe-container #Arrow,
        .dormant-tribe-container #Arrow *,
        .dormant-tribe-container #Bot_3,
        .dormant-tribe-container #Bot_3 *,
        .dormant-tribe-container #CardInterchange,
        .dormant-tribe-container #CardInterchange * {
          stroke: var(--color-dormant) !important;
          color: var(--color-dormant) !important;
        }

        .fossil-bot-overlay svg path {
          fill: var(--color-dormant);
        }

        .hierarchy-graph-node svg {
          color: var(--color-primary);
        }
        .hierarchy-graph-node .hg-node-1 { fill: #f97316; }
        .hierarchy-graph-node .hg-node-2 { fill: #eab308; }
        .hierarchy-graph-node .hg-node-3 { fill: #a855f7; }
        .hierarchy-graph-node .hg-node-4 { fill: var(--color-primary); }
        .hierarchy-graph-node .hg-node-5 { fill: #fb923c; }
        .hierarchy-graph-node .hg-node-6 { fill: #c084fc; }
      `}</style>

      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 12 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 28,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <ShieldQuestion size={24} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('hierarchy_info.title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'hierarchy_info.subtitle'
            )}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <InfoCard style={{ paddingBottom: 30 }}>
          <ConceptBlock
            title={t('hierarchy_info.section_bot_intro_title')}
          >
            <VisualStage>
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? 28 : 'clamp(24px, 6vw, 64px)',
                  width: '100%',
                  padding: '8px 0',
                }}
              >
                <div
                  style={{
                    flex: '1 1 0',
                    width: '100%',
                    maxWidth: 260,
                    aspectRatio: '260 / 219',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BotIcon
                    size="25%"
                    color="var(--color-primary)"
                    style={{ width: '25%', height: '25%' }}
                  />
                </div>
                <div
                  style={{
                    flex: '1 1 0',
                    width: '100%',
                    maxWidth: 260,
                    aspectRatio: '260 / 219',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MatchDiagram kind="bot" />
                </div>
              </div>
            </VisualStage>
            <TextColumn>
              <Description>
                {t(
                  'hierarchy_info.bot_intro_desc'
                )}
              </Description>
              <Description style={{ marginTop: 8 }}>
                {t(
                  'hierarchy_info.bot_intro_desc_2'
                )}
              </Description>
            </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t(
              'hierarchy_info.section_memory_intro_title'
            )}
          >
            <VisualStage>
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? 28 : 'clamp(16px, 4vw, 48px)',
                  width: '100%',
                  padding: '8px 0',
                }}
              >
                <div
                  style={{
                    flex: '1 1 0',
                    width: '100%',
                    maxWidth: 260,
                    aspectRatio: '260 / 219',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    className="bot-capability-emblems bot-capability-emblems--memory-grid"
                    style={{ transform: 'scale(2)', transformOrigin: 'center' }}
                  >
                    {sampleMemoryEmblems.map(({ key, label, description, Icon, tone, size = 14 }) => (
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
                <div
                  className="hierarchy-graph-node"
                  style={{
                    flex: '1 1 0',
                    width: '100%',
                    maxWidth: 260,
                    aspectRatio: '260 / 219',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HierarchyGraphSvg
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '160 / 135',
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: '1.15 1 0',
                    width: '100%',
                    maxWidth: 300,
                    aspectRatio: '260 / 219',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ width: '100%', transform: 'scale(1.16)', transformOrigin: 'center' }}>
                    <MatchDiagram kind="pill" />
                  </div>
                </div>
              </div>
            </VisualStage>
            <TextColumn>
              <Description>
                {t(
                  'hierarchy_info.memory_intro_desc'
                )}
              </Description>
              <Description style={{ marginTop: 8 }}>
                {t(
                  'hierarchy_info.memory_intro_desc_2_intro'
                )}{' '}
                {t('bot.affinity_bias_title')}
                <InlineMemoryPair
                  LowIcon={Zap}
                  HighIcon={Flame}
                  lowTitle={t('bot.memory_emblem.cognitive_low_label')}
                  highTitle={t('bot.memory_emblem.cognitive_high_label')}
                />
                {t(
                  'hierarchy_info.memory_intro_desc_2_affinity'
                )}{' '}
                {t('bot.forgetfulness_title')}
                <InlineMemoryPair
                  LowIcon={ElephantIcon}
                  HighIcon={Fish}
                  lowTitle={t('bot.memory_emblem.forget_low_label')}
                  highTitle={t('bot.memory_emblem.forget_high_label')}
                />
                {t(
                  'hierarchy_info.memory_intro_desc_2_forget'
                )}{' '}
                {t('bot.associative_scope_title')}
                <InlineMemoryPair
                  LowIcon={Binoculars}
                  HighIcon={Waypoints}
                  lowTitle={t('bot.memory_emblem.scope_low_label')}
                  highTitle={t('bot.memory_emblem.scope_high_label')}
                />
                {t(
                  'hierarchy_info.memory_intro_desc_2_scope'
                )}{' '}
                {t('bot.fixation_title')}
                <InlineMemoryPair
                  LowIcon={Feather}
                  HighIcon={SheepIcon}
                  lowTitle={t('bot.memory_emblem.fixation_low_label')}
                  highTitle={t('bot.memory_emblem.fixation_high_label')}
                />
                {t(
                  'hierarchy_info.memory_intro_desc_2_fixation'
                )}{' '}
                {t('bot.incubation_title')}
                <InlineMemoryPair
                  LowIcon={Rabbit}
                  HighIcon={Snail}
                  lowTitle={t('bot.memory_emblem.incubation_low_label')}
                  highTitle={t('bot.memory_emblem.incubation_high_label')}
                />
                {t(
                  'hierarchy_info.memory_intro_desc_2_incubation'
                )}
              </Description>
              <Description style={{ marginTop: 8 }}>
                {t(
                  'hierarchy_info.memory_intro_desc_3'
                )}
              </Description>
            </TextColumn>
          </ConceptBlock>
        </InfoCard>

        <InfoCard style={{ paddingBottom: 30 }}>
          <ConceptBlock
            title={t(
              'hierarchy_info.section_card_intro_title'
            )}
          >
            <VisualStage>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'clamp(32px, 6vw, 56px)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CardIcon width={80} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CardIcon crowned width={80} crownSize={24} crownTop={-6} crownLeft={-7} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CardIcon
                    crowned
                    purchased
                    width={80}
                    crownSize={24}
                    crownTop={-6}
                    crownLeft={-7}
                  />
                </div>
              </div>
            </VisualStage>
            <TextColumn>
              <Description>
                {t(
                  'hierarchy_info.card_intro_desc'
                )}
              </Description>
              <Description style={{ marginTop: 8 }}>
                {t(
                  'hierarchy_info.card_intro_desc_2_a'
                )}
                <InlineCreatorCrown />
                {t(
                  'hierarchy_info.card_intro_desc_2_b'
                )}
                <InlinePurchasedCrown />{' '}
                {t(
                  'hierarchy_info.card_intro_desc_2_c'
                )}
              </Description>
            </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_card_limit_title')}
          >
            <VisualStage>
              <CardConveyor
                Svg={CardBotBlockSvg}
                svgStyle={themedStyle}
                widthPct={isMobile ? 92 : 40}
              />
            </VisualStage>
            <TextColumn>
              <Description>
                {t(
                  'hierarchy_info.bot_card_block_desc'
                )}
              </Description>
            </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_lock_title')}
          >
            <VisualStage>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                }}
              >
                <LockedCards />
                <div
                  style={{
                    position: 'relative',
                    width: isMobile ? '86%' : '35%',
                    minWidth: 260,
                    maxWidth: 360,
                    flexShrink: 0,
                  }}
                >
                  <CardConveyor
                    Svg={CardBotBlockTallSvg}
                    svgStyle={themedStyle}
                    widthPct={100}
                    slotXs={[8, 19, 30, 41]}
                    rowY={65}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '22%',
                      top: '34%',
                      width: '12%',
                      transform: 'translate(-50%, -50%)',
                      color: 'var(--color-primary)',
                      pointerEvents: 'none',
                    }}
                  >
                    <CardSvg style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <Lock
                      style={{
                        position: 'absolute',
                        top: '-10%',
                        left: '-12%',
                        width: '36%',
                        height: 'auto',
                        color: '#ffffff',
                        filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
                        transform: 'rotate(-22deg)',
                        strokeWidth: 3,
                      }}
                    />
                  </div>
                </div>
              </div>
            </VisualStage>
            <TextColumn>
              <Description>
                {t(
                  'hierarchy_info.lock_cards_desc'
                )}
              </Description>
            </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_incubation_title')}
          >
            <VisualStage>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                }}
              >
                <IncubationCards />
                <CardConveyor
                  Svg={CardBotBlockSvg}
                  svgStyle={themedStyle}
                  widthPct={isMobile ? 92 : 40}
                  showIncubationBadges
                />
              </div>
            </VisualStage>
            <TextColumn>
              <Description>
                {t(
                  'hierarchy_info.incubation_desc_a'
                )}{' '}
                <InlineClockAlert />{' '}
                {t(
                  'hierarchy_info.incubation_desc_b'
                )}{' '}
                <InlineClockCheck />{' '}
                {t(
                  'hierarchy_info.incubation_desc_c'
                )}
              </Description>
            </TextColumn>
          </ConceptBlock>
        </InfoCard>

        <InfoCard style={{ paddingBottom: 30 }}>
          <ConceptBlock
            title={t('hierarchy_info.section_bot_spread_title')}
          >
            <VisualStage>
              <ArrowCardTravel
                Svg={TutorialBotSpreadSvg}
                widthPct={isMobile ? 72 : 24}
                svgStyle={themedStyle}
                matchDrawnCards={isMobile}
              />
            </VisualStage>
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.bot_spread_desc'
              )}{' '}
              <InlineContingency /> {t('hierarchy_info.bot_spread_desc_2')}
            </Description>
            <Description style={{ marginTop: 8 }}>
              {t(
                'hierarchy_info.bot_spread_desc_3'
              )}{' '}
              <InlineContingencyModifier />{' '}
              {t(
                'hierarchy_info.bot_spread_desc_4'
              )}{' '}
              {t(
                'hierarchy_info.bot_spread_desc_5'
              )}
            </Description>
          </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_user_spread_title')}
          >
          <VisualStage>
            <ArrowCardTravel
              Svg={TutorialUserSpreadSvg}
              widthPct={isMobile ? 88 : 44}
              svgStyle={themedStyle}
              matchDrawnCards={isMobile}
            />
          </VisualStage>
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.user_spread_desc'
              )}{' '}
              <InlineContingency />{' '}
              {t(
                'hierarchy_info.user_spread_desc_2'
              )}
            </Description>
          </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_tribe_title')}
          >
          <VisualStage>
            <ArrowCardTravel
              Svg={TribeTutorialSvg}
              widthPct={isMobile ? 92 : 50}
              svgStyle={themedStyle}
              matchDrawnCards={isMobile}
            />
          </VisualStage>
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.tribe_desc'
              )}
            </Description>
          </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_heartbeat_title')}
          >
          <VisualStage>
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(10px, 2vw, 20px)',
                width: '100%',
              }}
            >
              <div
                style={{
                  flex: '0 0 auto',
                  width: isMobile ? '100%' : 'min(24%, 146px)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ArrowCardTravel
                  Svg={TutorialBotSpreadSvg}
                  widthPct={isMobile ? 46 : 100}
                  svgStyle={themedStyle}
                  pulseInterval={4000}
                  onPulse={handlePulse}
                  matchDrawnCards={isMobile}
                />
              </div>
              <div
                style={{
                  flex: '1 1 0px',
                  minWidth: 0,
                  maxWidth: 420,
                  width: isMobile ? '100%' : undefined,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ArrowCardTravel
                  Svg={TribeTutorialSvg}
                  widthPct={isMobile ? 92 : 100}
                  svgStyle={themedStyle}
                  pulseInterval={4000}
                  matchDrawnCards={isMobile}
                />
              </div>
              <div
                key={pulseCount}
                style={{
                  width: 60,
                  height: 60,
                  color: 'var(--color-primary)',
                  animation: 'heartBeat 0.6s ease',
                  flexShrink: 0,
                }}
              >
                <HeartSvg
                  width={60}
                  height={60}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </VisualStage>
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.heartbeat_desc'
              )}{' '}
              <InlineContingency />{' '}
              {t(
                'hierarchy_info.heartbeat_desc_2'
              )}
            </Description>
            <Description style={{ marginTop: 8 }}>
              {t(
                'hierarchy_info.heartbeat_desc_3'
              )}
            </Description>
          </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_tutorial_title')}
          >
          <VisualStage>
            <ArrowCardTravel
              Svg={TutorialSvg}
              widthPct={isMobile ? 100 : 68}
              svgStyle={themedStyle}
              matchDrawnCards={isMobile}
            />
          </VisualStage>
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.tutorial_desc'
              )}
            </Description>
          </TextColumn>
          </ConceptBlock>

          <div style={sectionDividerStyle} />

          <ConceptBlock
            title={t('hierarchy_info.section_seasonal_reset_title')}
          >
          <VisualStage>
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(16px, 3vw, 36px)',
                width: '100%',
              }}
            >
              <div
                style={{
                  flex: '1.1 1 0px',
                  minWidth: 0,
                  maxWidth: 520,
                  width: isMobile ? '100%' : undefined,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ArrowCardTravel
                  Svg={TutorialSvg}
                  widthPct={100}
                  svgStyle={themedStyle}
                  className="dormant-tutorial-container"
                  dormantArrowIds={TUTORIAL_DORMANT_ARROWS}
                  fossilBotIds={TUTORIAL_FOSSIL_BOTS}
                  matchDrawnCards={isMobile}
                />
              </div>
              <div
                style={{
                  flex: '0.9 1 0px',
                  minWidth: 0,
                  maxWidth: 440,
                  width: isMobile ? '100%' : undefined,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ArrowCardTravel
                  Svg={TribeTutorialSvg}
                  widthPct={100}
                  svgStyle={themedStyle}
                  className="dormant-tribe-container"
                  dormantArrowIds={TRIBE_DORMANT_ARROWS}
                  fossilBotIds={TRIBE_FOSSIL_BOTS}
                  matchDrawnCards={isMobile}
                />
              </div>
            </div>
          </VisualStage>
          <TextColumn>
            <Description>
              {t(
                'hierarchy_info.seasonal_reset_desc'
              )}
            </Description>
            <Description style={{ marginTop: 8 }}>
              {t(
                'hierarchy_info.seasonal_reset_desc_2'
              )}
            </Description>
            <Description style={{ marginTop: 8 }}>
              {t(
                'hierarchy_info.seasonal_reset_desc_3'
              )}
            </Description>
          </TextColumn>
          </ConceptBlock>
        </InfoCard>
      </div>
    </div>
  )
}
