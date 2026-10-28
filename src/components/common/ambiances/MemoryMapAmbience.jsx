import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useUIStore from '../../../store/uiStore'
import useThemeStore from '../../../store/themeStore'
import { deriveAccentPalette } from '../../../utils/themeColor'

/**
 * MemoryMapPage'deki 4-5 nodeli biyolüminesans nöron ağını profil kartı arkasında
 * hafif blur'lu, organik sinaps akışlı ve süzülen parıltılı düğümlerle canlandıran ambiyans.
 */
export default function MemoryMapAmbience({ profileName, active }) {
  const { t } = useTranslation()
  const storeActive = useUIStore((s) => s.isMemoryMapAmbience)
  const isActive = active !== undefined ? active : storeActive
  const isGreen = useThemeStore((s) => s.isGreenMode)
  const isDark = useThemeStore((s) => s.isDarkMode)
  const customColor = useThemeStore((s) => s.customColor)

  const personaColors = useMemo(() => {
    const accent = deriveAccentPalette({ isGreenMode: isGreen, customColor })
    return isDark
      ? { core: accent.base, glow: accent.rootGlow, border: accent.activeCore }
      : { core: accent.activeCore, glow: accent.base, border: accent.activeBorder }
  }, [isGreen, isDark, customColor])

  if (!isActive) return null

  // 5 Nodelu Organik Nöron Ağı
  // Merkez: Persona
  // Çevrede: Tribe (Mor), GeneralThought (Sarı), Actor (Turuncu), Memory (Fuşya)
  const nodes = [
    {
      id: 'persona',
      x: 500,
      y: 92,
      r: 16,
      title: profileName ? (profileName.length > 14 ? profileName.substring(0, 14) + '...' : profileName) : t('memory_map.node_persona', 'Persona'),
      subtitle: 'Persona',
      core: personaColors.core,
      glow: personaColors.glow,
      border: personaColors.border,
      floatAnim: 'mindFloatCenter',
      duration: '4.8s',
    },
    {
      id: 'tribe',
      x: 210,
      y: 52,
      r: 13,
      title: t('memory_map.node_tribe', 'Klan'),
      subtitle: 'Tribe',
      core: '#c084fc',
      glow: '#a855f7',
      border: '#d8b4fe',
      floatAnim: 'mindFloatLeftTop',
      duration: '5.4s',
    },
    {
      id: 'thought',
      x: 260,
      y: 168,
      r: 12,
      title: t('memory_map.node_thought', 'Düşünceler'),
      subtitle: 'Thought',
      core: '#facc15',
      glow: '#eab308',
      border: '#fde047',
      floatAnim: 'mindFloatLeftBottom',
      duration: '4.2s',
    },
    {
      id: 'actor',
      x: 770,
      y: 56,
      r: 13,
      title: t('memory_map.node_actor', 'Kişiler'),
      subtitle: 'Person',
      core: '#f97316',
      glow: '#ea580c',
      border: '#fb923c',
      floatAnim: 'mindFloatRightTop',
      duration: '5.1s',
    },
    {
      id: 'memory',
      x: 740,
      y: 164,
      r: 12,
      title: t('memory_map.node_memory', 'Hafıza'),
      subtitle: 'Memory',
      core: '#e879f9',
      glow: '#d946ef',
      border: '#f0abfc',
      floatAnim: 'mindFloatRightBottom',
      duration: '4.5s',
    },
    {
      id: 'card',
      x: 132,
      y: 118,
      r: 12,
      title: t('memory_map.node_card', 'Kartlar'),
      subtitle: 'Card',
      core: '#2dd4bf',
      glow: '#0d9488',
      border: '#5eead4',
      floatAnim: 'mindFloatLeftTop',
      duration: '5.6s',
    },
    {
      id: 'chat',
      x: 868,
      y: 118,
      r: 12,
      title: t('memory_map.node_chat', 'Sohbet'),
      subtitle: 'Chat',
      core: '#fb7185',
      glow: '#e11d48',
      border: '#fda4af',
      floatAnim: 'mindFloatRightBottom',
      duration: '5.8s',
    },
    {
      id: 'award',
      x: 500,
      y: 212,
      r: 12,
      title: t('memory_map.node_award', 'Ödül'),
      subtitle: 'Award',
      core: '#fbbf24',
      glow: '#d97706',
      border: '#fcd34d',
      floatAnim: 'mindFloatLeftBottom',
      duration: '5.2s',
    },
    {
      id: 'shield',
      x: 322,
      y: 232,
      r: 10,
      title: t('memory_map.node_shield', 'Koruma'),
      subtitle: 'Shield',
      core: '#34d399',
      glow: '#059669',
      border: '#6ee7b7',
      floatAnim: 'mindFloatRightTop',
      duration: '6.1s',
    },
  ]

  // Sinaptik Bağlantı Yolları (Persona merkezli + çevresel çaprazlar - yukarı kaydırılmış)
  const links = [
    { id: 'link-p-tribe', d: 'M 500 92 Q 340 45 210 52', dur: '2.4s', begin: '0s' },
    { id: 'link-p-thought', d: 'M 500 92 Q 370 140 260 168', dur: '2.8s', begin: '0.6s' },
    { id: 'link-p-actor', d: 'M 500 92 Q 650 50 770 56', dur: '2.3s', begin: '0.3s' },
    { id: 'link-p-memory', d: 'M 500 92 Q 630 138 740 164', dur: '2.7s', begin: '0.9s' },
    { id: 'link-tribe-thought', d: 'M 210 52 Q 215 105 260 168', dur: '3.2s', begin: '1.2s' },
    { id: 'link-actor-memory', d: 'M 770 56 Q 775 105 740 164', dur: '3.0s', begin: '1.5s' },
    { id: 'link-p-card', d: 'M 500 92 Q 300 100 132 118', dur: '3.4s', begin: '2.0s' },
    { id: 'link-p-chat', d: 'M 500 92 Q 700 100 868 118', dur: '3.5s', begin: '1.8s' },
    { id: 'link-p-award', d: 'M 500 92 Q 505 150 500 212', dur: '3.2s', begin: '2.4s' },
    { id: 'link-p-shield', d: 'M 500 92 Q 430 170 322 232', dur: '3.6s', begin: '2.6s' },
    { id: 'link-card-thought', d: 'M 132 118 Q 180 160 260 168', dur: '3.8s', begin: '2.9s' },
    { id: 'link-chat-memory', d: 'M 868 118 Q 820 160 740 164', dur: '3.7s', begin: '3.1s' },
    { id: 'link-shield-award', d: 'M 322 232 Q 400 235 500 212', dur: '4.0s', begin: '3.4s' },
    { id: 'link-award-thought', d: 'M 500 212 Q 390 200 260 168', dur: '4.2s', begin: '3.7s' },
  ]

  return (
    <div
      className="mind-ambience"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        overflow: 'hidden',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        opacity: isDark ? 0.65 : 0.38,
        filter: isDark ? 'blur(2px)' : 'blur(3px)',
        zIndex: 0,
        maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
      }}
    >
      <style>{`
        @keyframes mindFloatCenter {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-7px) scale(1.02); }
        }
        @keyframes mindFloatLeftTop {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(-6px, -8px); }
        }
        @keyframes mindFloatLeftBottom {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(6px, 8px); }
        }
        @keyframes mindFloatRightTop {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(8px, -6px); }
        }
        @keyframes mindFloatRightBottom {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(-7px, 7px); }
        }
        @keyframes mindPulseHalo {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.38; transform: scale(1.15); }
        }
        @keyframes mindSynapseDash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -40; }
        }
      `}</style>

      <svg
        viewBox="0 0 1000 260"
        preserveAspectRatio="xMidYMin meet"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          overflow: 'visible',
          transform: 'translateY(64px)',
        }}
      >
        <defs>
          {/* Her düğüm için parıltılı radyal gradyanlar */}
          {nodes.map((node) => (
            <radialGradient key={`grad-${node.id}`} id={`grad-${node.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={node.core} stopOpacity="1" />
              <stop offset="45%" stopColor={node.glow} stopOpacity="0.65" />
              <stop offset="80%" stopColor={node.glow} stopOpacity="0.25" />
              <stop offset="100%" stopColor={node.glow} stopOpacity="0" />
            </radialGradient>
          ))}

          {/* Sinaptik Hat Filtresi */}
          <filter id="synapseGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ─── SİNAPTIK BAĞLANTILAR (Kılcal Damar / Neural Linkler) ─── */}
        <g className="synapse-links">
          {links.map((link) => (
            <g key={link.id}>
              {/* Dış yumuşak ışıma hattı */}
              <path
                d={link.d}
                fill="none"
                stroke={personaColors.glow}
                strokeWidth="4"
                strokeOpacity="0.15"
                strokeLinecap="round"
                filter="url(#synapseGlow)"
              />
              {/* İç ana hat */}
              <path
                d={link.d}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="1.6"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              {/* Akıcı nöral sinyal çizgisi */}
              <path
                d={link.d}
                fill="none"
                stroke={personaColors.border}
                strokeWidth="2"
                strokeOpacity="0.75"
                strokeDasharray="6 14"
                strokeLinecap="round"
                style={{ animation: 'mindSynapseDash 1.8s linear infinite' }}
              />

              {/* Hat üzerinde seyahat eden biyolüminesans sinyal darbesi (Pulse) */}
              <circle r="3.5" fill="#ffffff" filter="url(#synapseGlow)">
                <animateMotion
                  path={link.d}
                  dur={link.dur}
                  begin={link.begin}
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="7" fill={personaColors.core} opacity="0.45" filter="url(#synapseGlow)">
                <animateMotion
                  path={link.d}
                  dur={link.dur}
                  begin={link.begin}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </g>

        {/* ─── DÜĞÜMLER (Neuron Nodes) ─── */}
        {nodes.map((node) => (
          <g
            key={node.id}
            style={{
              transformOrigin: `${node.x}px ${node.y}px`,
              animation: `${node.floatAnim} ${node.duration} ease-in-out infinite`,
            }}
          >
            {/* 1. Dış en yumuşak ışıma */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r * 2.8}
              fill={`url(#grad-${node.id})`}
              style={{
                transformOrigin: `${node.x}px ${node.y}px`,
                animation: 'mindPulseHalo 3s ease-in-out infinite alternate',
              }}
            />

            {/* 2. Orta hale */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r * 1.6}
              fill={node.glow}
              opacity="0.32"
            />

            {/* 3. İç parlak çekirdek küresi */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={node.core}
              filter="url(#synapseGlow)"
            />

            {/* 4. Beyaz parlaklık merkezi */}
            <circle
              cx={node.x - node.r * 0.28}
              cy={node.y - node.r * 0.28}
              r={node.r * 0.32}
              fill="#ffffff"
              opacity="0.85"
            />

            {/* 5. Düğüm Başlık Kartı (MemoryMapPage Canvas Badge Formu) */}
            <g transform={`translate(${node.x}, ${node.y - node.r - 28})`}>
              {/* Koyu cam arka plan */}
              <rect
                x="-52"
                y="-13"
                width="104"
                height="26"
                rx="6"
                ry="6"
                fill="rgba(10, 5, 20, 0.88)"
                stroke={node.core}
                strokeWidth="1.2"
              />
              {/* Başlık */}
              <text
                x="0"
                y="-1"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
                letterSpacing="0.2px"
              >
                {node.title}
              </text>
              {/* Alt kategori etiketi */}
              <text
                x="0"
                y="8"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={node.glow}
                fontSize="7.5"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
                opacity="0.9"
              >
                {node.subtitle}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}
