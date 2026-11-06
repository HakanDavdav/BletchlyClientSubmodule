import { useMemo, useState, useEffect, useRef, useId } from 'react'
import useThemeStore from '../../../store/themeStore'
import BotIcon from '../icons/BotIcon'
import RainbowLiquidCanvas from './RainbowLiquidCanvas'

/**
 * Profil kartının ve sayfaların arkasında iki katmanlı premium gökkuşağı ambiyansı:
 * 1. katman: WebGL shader ile çizilen rengarenk amipsel sıvı mesh.
 * 2. katman: Uçuşan içi boş personality kartları. Sıvı renk katmanı
 *    kart maskesiyle sınırlandırılmıştır; renk cümbüşü yalnızca
 *    bu içi boş uçuşan kartların pencerelerinden akar.
 */

const CARD_FLOAT_KEYS = ['rcFloatNW', 'rcFloatNE', 'rcFloatSW', 'rcFloatSE', 'rcFloatN', 'rcFloatS']

const SIZE_TIERS = {
  desktop: {
    small: { w: 18, h: 34, r: 3, iconSize: 9 },
    medium: { w: 26, h: 50, r: 4, iconSize: 13 },
    large: { w: 38, h: 72, r: 5.5, iconSize: 19 },
  },
  mobile: {
    small: { w: 13, h: 25, r: 2.2, iconSize: 7 },
    medium: { w: 19, h: 36, r: 3.2, iconSize: 10 },
    large: { w: 28, h: 52, r: 4.2, iconSize: 14 },
  },
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export default function RainbowCardsAmbience({
  active,
  fadeBottom = true,
  fullPage = false,
  cardCount,
  showLiquid = true,
}) {
  const instanceId = useId()
  const maskId = `rc-cards-mask-${instanceId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const isDark = useThemeStore((s) => s.isDarkMode)
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  const totalCards = cardCount ?? (fullPage ? 48 : 28)

  const cards = useMemo(
    () =>
      Array.from({ length: totalCards }, (_, i) => {
        const r = Math.random()
        const sizeTier = r < 0.35 ? 'small' : r < 0.75 ? 'medium' : 'large'
        const baseOpacity =
          sizeTier === 'small'
            ? 0.58 + Math.random() * 0.2
            : sizeTier === 'medium'
            ? 0.72 + Math.random() * 0.2
            : 0.88 + Math.random() * 0.12

        const zTier = sizeTier === 'large' ? 300 : sizeTier === 'medium' ? 200 : 100

        return {
          id: i,
          x: 2 + Math.random() * 96,
          y: 2 + Math.random() * 96,
          sizeTier,
          zIndex: zTier + i,
          rotation: Math.random() * 28 - 14,
          opacity: baseOpacity,
          anim: pick(CARD_FLOAT_KEYS),
          duration: 9 + Math.random() * 7,
          delay: -Math.random() * 16,
        }
      }),
    []
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const update = () => {
      setDims({ w: el.clientWidth, h: el.clientHeight })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [active])

  if (!active) return null

  const isMobile = dims.w > 0 && dims.w <= 640
  const tiers = isMobile ? SIZE_TIERS.mobile : SIZE_TIERS.desktop
  const baseW = dims.w || 660
  const baseH = dims.h || 800

  return (
    <div
      ref={containerRef}
      className={`rainbow-cards-ambience ${!showLiquid ? 'rainbow-cards-ambience--theme-only' : ''}`}
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
        opacity: isDark ? 0.95 : 0.9,
        filter: 'blur(1.4px)',
        zIndex: 0,
        maskImage: fadeBottom
          ? 'linear-gradient(to bottom, black 55%, transparent 100%)'
          : undefined,
        WebkitMaskImage: fadeBottom
          ? 'linear-gradient(to bottom, black 55%, transparent 100%)'
          : undefined,
      }}
    >
      <style>{`
        @keyframes rcFloatNW {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-12px, -9px); }
        }
        @keyframes rcFloatNE {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(12px, -9px); }
        }
        @keyframes rcFloatSW {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-12px, 9px); }
        }
        @keyframes rcFloatSE {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(12px, 9px); }
        }
        @keyframes rcFloatN {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0, -10px); }
        }
        @keyframes rcFloatS {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0, 10px); }
        }
      `}</style>

      {/* SVG Mask & Sıvı renk katmanı: Yalnızca showLiquid true olduğunda kart pencerelerinden akar */}
      {showLiquid && (
        <>
          <svg
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <defs>
              <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={baseW}
                height={baseH}
              >
                <rect width={baseW} height={baseH} fill="black" />
                {cards.map((card) => {
                  const x = (card.x / 100) * baseW
                  const y = (card.y / 100) * baseH
                  const { w, h, r } = tiers[card.sizeTier] || tiers.medium
                  return (
                    <g
                      key={card.id}
                      transform={`translate(${x}, ${y}) rotate(${card.rotation})`}
                    >
                      <g
                        style={{
                          animation: `${card.anim} ${card.duration}s ease-in-out ${card.delay}s infinite`,
                        }}
                      >
                        <rect
                          x={-w / 2}
                          y={-h / 2}
                          width={w}
                          height={h}
                          rx={r}
                          ry={r}
                          fill="white"
                        />
                      </g>
                    </g>
                  )
                })}
              </mask>
            </defs>
          </svg>

          <RainbowLiquidCanvas maskId={maskId} />
        </>
      )}

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {cards.map((card) => {
          const { w, h, r, iconSize } = tiers[card.sizeTier] || tiers.medium
          return (
            <div
              key={card.id}
              style={{
                position: 'absolute',
                left: `${card.x}%`,
                top: `${card.y}%`,
                zIndex: card.zIndex,
                transform: `translate(-50%, -50%) rotate(${card.rotation}deg)`,
              }}
            >
              <div
                className="rc-card"
                style={{
                  '--rc-w': `${w}px`,
                  '--rc-h': `${h}px`,
                  '--rc-r': `${r}px`,
                  width: `${w}px`,
                  height: `${h}px`,
                  borderRadius: `${r}px`,
                  opacity: card.opacity,
                  animation: `${card.anim} ${card.duration}s ease-in-out ${card.delay}s infinite`,
                }}
              >
                <BotIcon
                  size={iconSize}
                  color="currentColor"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45))' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

