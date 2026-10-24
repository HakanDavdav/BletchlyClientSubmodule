import { useEffect, useRef, useState } from 'react'
import { ClockAlert, ClockCheck } from 'lucide-react'
import CardSvg from '../../assets/FigmaNew/Card.svg?react'

const DEFAULT_SLOT_XS = [8, 19, 30, 41, 52]

export default function CardConveyor({
  Svg,
  widthPct = 35,
  svgStyle,
  cardColor = 'var(--color-primary)',
  cardWidthPct = 12,
  slotXs = DEFAULT_SLOT_XS,
  rowY = 50,
  entryX = -9,
  exitX = 60,
  stepInterval = 2000,
  moveFraction = 0.28,
  staticCards = [],
  showIncubationBadges = false,
  style = {},
}) {
  const containerRef = useRef(null)
  const cardElsRef = useRef([])
  const cardsRef = useRef([])
  const [cards, setCards] = useState([])

  useEffect(() => {
    if (!containerRef.current || !Svg) return

    const keyX = [entryX, ...slotXs, exitX]
    const maxIdx = slotXs.length
    const step = stepInterval
    const t0 = performance.now()
    let nextId = 0
    let nextBirth = step
    let nextActivation = step * 1.6

    const initial = Array.from({ length: maxIdx + 1 }, (_, i) => i - maxIdx).map((n, idx) => ({
      id: nextId++,
      born: n * step,
      isActive: idx <= 2,
    }))
    cardsRef.current = initial
    setCards(initial)

    const clamp01 = v => Math.min(1, Math.max(0, v))
    const ease = t => t * t * (3 - 2 * t)

    let rafId
    const tick = () => {
      const now = performance.now() - t0

      const newBorns = []
      while (now >= nextBirth) {
        newBorns.push({
          id: nextId++,
          born: nextBirth,
          isActive: false,
        })
        nextBirth += step
      }

      let list = cardsRef.current
      let changed = false
      if (newBorns.length) {
        list = [...list, ...newBorns]
        changed = true
      }

      if (showIncubationBadges && now >= nextActivation) {
        while (now >= nextActivation) {
          nextActivation += step * 3
        }
        list.forEach(c => {
          const phase = (now - c.born) / step
          if (phase >= moveFraction && phase < maxIdx) {
            c.isActive = true
          }
        })
      }
      const filtered = list.filter(c => (now - c.born) / step < maxIdx + 1)
      if (filtered.length !== list.length) changed = true

      if (changed) {
        cardsRef.current = filtered
        setCards(filtered)
      }

      const els = cardElsRef.current
      filtered.forEach((c, i) => {
        const el = els[i]
        if (!el) return
        const phase = (now - c.born) / step
        const stepIdx = Math.max(0, Math.min(maxIdx, Math.floor(phase)))
        const frac = clamp01((phase - stepIdx) / moveFraction)
        const e = ease(frac)
        const x = keyX[stepIdx] + (keyX[stepIdx + 1] - keyX[stepIdx]) * e
        let opacity = 1
        if (stepIdx === 0) opacity = e
        else if (stepIdx === maxIdx) opacity = 1 - e
        el.style.left = `${x}%`
        el.style.opacity = String(opacity)
        if (showIncubationBadges) {
          const isActive = Boolean(c.isActive)
          const nextState = isActive ? '1' : '0'
          if (el.dataset.active !== nextState) {
            el.dataset.active = nextState
            const pendingEl = el.querySelector('[data-badge="pending"]')
            const activeEl = el.querySelector('[data-badge="active"]')
            if (pendingEl) {
              pendingEl.style.opacity = isActive ? '0' : '1'
              pendingEl.style.transform = isActive
                ? 'rotate(-20deg) scale(0.7)'
                : 'rotate(-20deg) scale(1)'
            }
            if (activeEl) {
              activeEl.style.opacity = isActive ? '1' : '0'
              activeEl.style.transform = isActive
                ? 'rotate(-20deg) scale(1)'
                : 'rotate(-20deg) scale(0.7)'
            }
          }
        }
      })

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [Svg, cardWidthPct, slotXs, rowY, entryX, exitX, stepInterval, moveFraction, showIncubationBadges])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: `${widthPct}%`, flexShrink: 0, ...style }}>
      {Svg ? (
        <Svg style={{ width: '100%', height: 'auto', display: 'block', ...svgStyle }} />
      ) : null}
      {staticCards.map(([x, y]) => (
        <div
          key={`s${x}-${y}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: `${cardWidthPct}%`,
            transform: 'translate(-50%, -50%)',
            color: cardColor,
            pointerEvents: 'none',
          }}
        >
          <CardSvg style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      ))}
      {cards.map((c, i) => (
        <div
          key={c.id}
          ref={el => {
            cardElsRef.current[i] = el
          }}
          style={{
            position: 'absolute',
            top: `${rowY}%`,
            width: `${cardWidthPct}%`,
            transform: 'translate(-50%, -50%)',
            color: cardColor,
            pointerEvents: 'none',
            willChange: 'left, opacity',
            opacity: 0,
          }}
        >
          <CardSvg style={{ width: '100%', height: 'auto', display: 'block' }} />
          {showIncubationBadges && (
            <>
              <ClockAlert
                data-badge="pending"
                style={{
                  position: 'absolute',
                  top: '-10%',
                  left: '-12%',
                  width: '38%',
                  height: 'auto',
                  color: '#ffffff',
                  filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
                  transform: 'rotate(-20deg) scale(1)',
                  opacity: 1,
                  transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  strokeWidth: 2.8,
                }}
              />
              <ClockCheck
                data-badge="active"
                style={{
                  position: 'absolute',
                  top: '-10%',
                  left: '-12%',
                  width: '38%',
                  height: 'auto',
                  color: 'var(--color-warning)',
                  filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
                  transform: 'rotate(-20deg) scale(0.7)',
                  opacity: 0,
                  transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  strokeWidth: 2.8,
                }}
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
