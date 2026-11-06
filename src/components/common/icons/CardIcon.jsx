import { ClockAlert, ClockCheck, Crown, Lock } from 'lucide-react'
import CardSvg from '../../../assets/FigmaNew/Card.svg?react'

/**
 * Kişilik kartı görseli (Card.svg) üzerine kurulu mini kart ikonu.
 * - default: tek, eğik, ortasında bot gölgesi olan kart.
 * - crowned: kartın sol üstünde küçük altın taç.
 * - purchased: crowned ile birlikte; taç + $ ikilisi aynı eğimli container içinde (PersonalityCard stili).
 * - locked: kartın sol üstünde eğimli beyaz kilit ikonu (PersonalityCard stili).
 * - effective: kartın sol üstünde eğimli altın saat-onay ikonu (PersonalityCard stili).
 * - incubating: kartın sol üstünde eğimli beyaz saat-uyarı ikonu (PersonalityCard stili).
 */
export default function CardIcon({
  crowned = false,
  purchased = false,
  locked = false,
  effective = false,
  incubating = false,
  width = 21,
  height,
  color = 'var(--color-primary)',
  crownSize,
  crownTop,
  crownLeft,
  className,
  style,
  ...props
}) {
  const cardRatio = 122 / 105
  const renderedHeight = height ?? Math.round(width * cardRatio)

  const resolvedCrownSize =
    crownSize ??
    (width < 16
      ? Math.max(width * 0.6, 3)
      : Math.max(Math.round(width * 0.45), 8))

  // Taç çizgisi de kartla birlikte ölçeklenir (minik kartlarda kalın kalmasın)
  const resolvedCrownStroke = width < 16 ? Math.max(width * 0.18, 0.8) : 3.2

  const resolvedCrownTop = crownTop ?? -Math.max(Math.round(renderedHeight * 0.08), 1)
  const resolvedCrownLeft = crownLeft ?? -Math.max(width * 0.18, 1)

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        width,
        height: renderedHeight,
        lineHeight: 0,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <CardSvg
        width={width}
        height={renderedHeight}
        style={{ display: 'block', overflow: 'visible', color }}
      />
      {/* Sadece taç (created) */}
      {crowned && !purchased && (
        <Crown
          size={resolvedCrownSize}
          strokeWidth={resolvedCrownStroke}
          style={{
            position: 'absolute',
            top: resolvedCrownTop,
            left: resolvedCrownLeft,
            color: 'var(--color-warning)',
            transform: 'rotate(-25deg)',
            filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
      {/* Taç + $ (purchased) — ikisi aynı eğimli container içinde */}
      {crowned && purchased && (
        <span
          style={{
            position: 'absolute',
            top: resolvedCrownTop,
            left: resolvedCrownLeft,
            display: 'inline-flex',
            alignItems: 'center',
            transform: 'rotate(-18deg)',
            transformOrigin: 'left center',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <Crown
            size={resolvedCrownSize}
            strokeWidth={resolvedCrownStroke}
            style={{ color: '#b87333', flexShrink: 0 }}
          />
          <span
            style={{
              marginLeft: `${-resolvedCrownSize * 0.17}px`,
              marginTop: `${resolvedCrownSize * 0.17}px`,
              fontSize: Math.max(resolvedCrownSize * 1.04, 3),
              fontWeight: 900,
              fontFamily: '"Arial Black", Impact, system-ui, sans-serif',
              lineHeight: 1,
              color: '#22c55e',
              textShadow: '0 0 3px rgba(34, 197, 94, 0.35), 0 1px 2px rgba(0,0,0,0.8)',
              WebkitTextStroke: `${(resolvedCrownSize * 0.025).toFixed(2)}px #052e16`,
            }}
          >
            $
          </span>
        </span>
      )}
      {locked && (
        <Lock
          size={resolvedCrownSize}
          strokeWidth={3}
          style={{
            position: 'absolute',
            top: resolvedCrownTop,
            left: resolvedCrownLeft,
            color: '#ffffff',
            transform: 'rotate(-22deg)',
            filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
      {effective && (
        <ClockCheck
          size={resolvedCrownSize}
          strokeWidth={2.8}
          style={{
            position: 'absolute',
            top: resolvedCrownTop,
            left: resolvedCrownLeft,
            color: 'var(--color-warning)',
            transform: 'rotate(-20deg)',
            filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
      {incubating && (
        <ClockAlert
          size={resolvedCrownSize}
          strokeWidth={2.8}
          style={{
            position: 'absolute',
            top: resolvedCrownTop,
            left: resolvedCrownLeft,
            color: '#ffffff',
            transform: 'rotate(-20deg)',
            filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
    </span>
  )
}
