import { useEffect, useRef, useState } from 'react'
import CardIcon from './icons/CardIcon'
import FossilIcon from './icons/FossilIcon'

const CARD_ASPECT = 112 / 96
const FADE = 0.18
const ROTATE_PER_TICK = 4
const NO_FLOW_MODE_OVERRIDES = {}

function parseArrowEndpoints(d) {
  if (!d) return null

  const points = []
  const re = /[MLHVCSQTAZ]([-\d.\s,]*)/g
  let m
  let cx = 0
  let cy = 0
  while ((m = re.exec(d))) {
    const cmd = m[0][0]
    const nums = (m[1].match(/-?[\d.]+/g) || []).map(Number)
    if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
      if (nums.length >= 2) {
        cx = nums[0]
        cy = nums[1]
        points.push([cx, cy])
      }
    } else if (cmd === 'H') {
      if (nums.length >= 1) {
        cx = nums[0]
        points.push([cx, cy])
      }
    } else if (cmd === 'V') {
      if (nums.length >= 1) {
        cy = nums[0]
        points.push([cx, cy])
      }
    } else if (cmd === 'C' || cmd === 'Q') {
      if (nums.length >= 6) {
        cx = nums[4]
        cy = nums[5]
        points.push([cx, cy])
      }
    } else if (cmd === 'S') {
      if (nums.length >= 4) {
        cx = nums[2]
        cy = nums[3]
        points.push([cx, cy])
      }
    }
  }
  if (points.length < 2) return null
  return points
}

function applyFlow(points, flowMode, force) {
  const start = points[0]
  const end = points[points.length - 1]
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  
  // ~15 degree threshold (tan(15°) ≈ 0.268, multiplier ≈ 3.73)
  if (!force && Math.abs(dy) * 3.73 < Math.abs(dx)) {
    return points
  }
  
  let reverse = false
  if (flowMode === 'BottomToTop') {
    reverse = start[1] < end[1]
  } else if (flowMode === 'LeftToRight') {
    reverse = start[0] > end[0]
  } else if (flowMode === 'RightToLeft') {
    reverse = start[0] < end[0]
  } else {
    reverse = start[1] > end[1]
  }
  return reverse ? [...points].reverse() : points
}

function getCardVariant(crownedChance, purchasedChance) {
  const r = Math.random()
  if (r < purchasedChance) {
    return { crowned: true, purchased: true }
  }
  if (r < purchasedChance + crownedChance) {
    return { crowned: true, purchased: false }
  }
  return { crowned: false, purchased: false }
}

export default function ArrowCardTravel({
  Svg,
  widthPct = 100,
  svgStyle,
  cardWidth = 18,
  speed = 24,
  offset = 6,
  spacing = 70,
  cardColor = 'var(--color-primary)',
  flowMode = 'TopToBottom',
  flowModeOverrides = NO_FLOW_MODE_OVERRIDES,
  pulseInterval = 0,
  onPulse,
  maxCards = Infinity,
  rerandomizeInterval = 0,
  crownedChance = 0.3,
  purchasedChance = 0.1,
  dormantArrowIds = [],
  fossilBotIds = [],
  className = '',
  // true ise kartlar SVG içindeki çizili kartlarla (BackCardWrappers) aynı
  // görsel boyuta ölçeklenir (küçük/orta ekranlarda orantı korunur)
  matchDrawnCards = false,
}) {
  const containerRef = useRef(null)
  const cardMapRef = useRef(new Map())
  const segmentsRef = useRef([])
  const cardsRef = useRef([])
  const [cards, setCards] = useState([])
  const [fossils, setFossils] = useState([])
  const [sizeScale, setSizeScale] = useState(1)
  const [drawnCardWidth, setDrawnCardWidth] = useState(null)

  // Mobilde kartlar SVG ölçeğiyle orantılı küçülür; masaüstü boyutları korunur
  useEffect(() => {
    const update = () => {
      const cw = containerRef.current?.getBoundingClientRect().width || 0
      const isMobile = window.matchMedia('(max-width: 640px)').matches
      setSizeScale(isMobile && cw > 0 ? Math.max(0.3, Math.min(1, cw / 810)) : 1)
    }
    update()
    window.addEventListener('resize', update)
    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update)
      if (containerRef.current) ro.observe(containerRef.current)
    }
    return () => {
      window.removeEventListener('resize', update)
      if (ro) ro.disconnect()
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !Svg) return

    const svg = container.querySelector('svg')
    if (!svg) return
    const vb = svg.viewBox.baseVal
    if (!vb || !vb.width || !vb.height) return

    // SVG içinde çizili kartların (BackCardWrappers) CSS ölçeğindeki genişliği
    const measureDrawnCards = () => {
      if (!matchDrawnCards) return
      const wrapper = svg.querySelector('[id^="BackCardWrappers"]')
      if (!wrapper) return
      try {
        const b = wrapper.getBBox()
        if (b.width > 0) {
          const scale = container.getBoundingClientRect().width / vb.width
          setDrawnCardWidth(Math.round(b.width * scale * 0.95 * 10) / 10)
        }
      } catch {
        // getBBox bazı durumlarda hata verebilir; mevcut boyut korunur
      }
    }
    measureDrawnCards()

    const infos = []
    svg.querySelectorAll('g[id^="arrow"], g[id^="Arrow"]').forEach(g => {
      const id = g.getAttribute('id')
      if (dormantArrowIds.includes(id)) return
      const path = g.querySelector('path')
      if (!path) return
      const d = path.getAttribute('d')
      const pts = parseArrowEndpoints(d)
      if (!pts || pts.length < 2) return

      // 1. Global ViewBox boundary check (detects arrows outside canvas, e.g. negative or overflow coordinates)
      const isOutsideVb = pts.some(
        p => p[0] < -2 || p[0] > vb.width + 2 || p[1] < -2 || p[1] > vb.height + 2
      )
      if (isOutsideVb) return

      // 2. Ancestor clip-path check (detects arrows clipped by local clipPath masks)
      const clipParent = g.closest('[clip-path]')
      if (clipParent) {
        const clipAttr = clipParent.getAttribute('clip-path') || ''
        const m = clipAttr.match(/#([a-zA-Z0-9_-]+)/)
        if (m) {
          const clipEl = svg.querySelector(`#${m[1]}`)
          const rectEl = clipEl?.querySelector('rect')
          if (rectEl) {
            let rx = parseFloat(rectEl.getAttribute('x') || '0')
            let ry = parseFloat(rectEl.getAttribute('y') || '0')
            const rw = parseFloat(rectEl.getAttribute('width') || '0')
            const rh = parseFloat(rectEl.getAttribute('height') || '0')
            const transform = rectEl.getAttribute('transform') || ''
            const tm = transform.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/)
            if (tm) {
              rx += parseFloat(tm[1])
              ry += parseFloat(tm[2])
            }
            if (rw > 0 && rh > 0) {
              const isOutsideClip = pts.some(
                p => p[0] < rx - 2 || p[0] > rx + rw + 2 || p[1] < ry - 2 || p[1] > ry + rh + 2
              )
              if (isOutsideClip) return
            }
          }
        }
      }

      const ciEl = g.closest('[id^="CardInterchange"]')
      infos.push({ id, pts, ciKey: ciEl ? ciEl.getAttribute('id') : null })
    })

    const autoOverrides = {}
    const interchangeGroups = new Map()
    infos.forEach(info => {
      if (!info.ciKey) return
      if (!interchangeGroups.has(info.ciKey)) interchangeGroups.set(info.ciKey, [])
      interchangeGroups.get(info.ciKey).push(info)
    })
    interchangeGroups.forEach(arrows => {
      const first = arrows[0]
      const dx = first.pts[first.pts.length - 1][0] - first.pts[0][0]
      const dy = first.pts[first.pts.length - 1][1] - first.pts[0][1]
      const horizontal = Math.abs(dx) > Math.abs(dy)
      arrows.forEach((a, idx) => {
        autoOverrides[a.id] = horizontal
          ? (idx % 2 === 0 ? 'LeftToRight' : 'RightToLeft')
          : (idx % 2 === 0 ? 'TopToBottom' : 'BottomToTop')
      })
    })

    const routesPts = infos.map(({ id, pts }) => {
      const override = autoOverrides[id] || flowModeOverrides[id]
      return applyFlow(pts, override || flowMode, Boolean(override))
    })
    if (routesPts.length === 0) return

    const hiddenFossilEls = []
    const fossilItems = []
    fossilBotIds.forEach((id) => {
      const el = svg.querySelector(`#${id}`)
      if (!el) return
      const b = el.getBBox()
      if (!b || (b.width === 0 && b.height === 0)) return
      el.style.visibility = 'hidden'
      hiddenFossilEls.push(el)
      fossilItems.push({
        id,
        leftPct: ((b.x + b.width / 2) / vb.width) * 100,
        topPct: ((b.y + b.height / 2) / vb.height) * 100,
        sizePct: (Math.max(b.width, b.height) / vb.width) * 100,
      })
    })
    setFossils(fossilItems)

    const computeSegments = () => {
      const rect = container.getBoundingClientRect()
      const scale = rect.width / vb.width
      return routesPts
        .map(pts => {
          if (pts.length < 2) return null
          const scaledPts = pts.map(p => ({ x: p[0] * scale, y: p[1] * scale }))

          const segNormals = []
          for (let i = 0; i < scaledPts.length - 1; i++) {
            const p1 = scaledPts[i]
            const p2 = scaledPts[i + 1]
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const len = Math.hypot(dx, dy)
            if (len === 0) {
              segNormals.push({ px: 0, py: 0, len: 0 })
            } else {
              segNormals.push({ px: -dy / len, py: dx / len, len })
            }
          }

          const offsetVertices = []
          for (let i = 0; i < scaledPts.length; i++) {
            if (i === 0) {
              const n = segNormals[0]
              offsetVertices.push({
                x: scaledPts[0].x + n.px * offset,
                y: scaledPts[0].y + n.py * offset
              })
            } else if (i === scaledPts.length - 1) {
              const n = segNormals[segNormals.length - 1]
              offsetVertices.push({
                x: scaledPts[i].x + n.px * offset,
                y: scaledPts[i].y + n.py * offset
              })
            } else {
              const n1 = segNormals[i - 1]
              const n2 = segNormals[i]
              const nx = n1.px + n2.px
              const ny = n1.py + n2.py
              const nlen = Math.hypot(nx, ny)
              const n = nlen > 0.001 ? { px: nx / nlen, py: ny / nlen } : n1
              offsetVertices.push({
                x: scaledPts[i].x + n.px * offset,
                y: scaledPts[i].y + n.py * offset
              })
            }
          }

          let accumLen = 0
          const subSegments = []
          for (let i = 0; i < offsetVertices.length - 1; i++) {
            const s = offsetVertices[i]
            const e = offsetVertices[i + 1]
            const len = Math.hypot(e.x - s.x, e.y - s.y)
            if (len === 0) continue
            accumLen += len
            subSegments.push({ s, e, len, accumLen })
          }
          return subSegments.length > 0 && accumLen > 15 ? { subSegments, totalLen: accumLen } : null
        })
        .filter(Boolean)
    }

    const buildCards = routes => {
      const nowAbs = performance.now()
      const gap = (spacing / speed) * 1000
      const perRoute = routes.map((route, routeIdx) => {
        const count = Math.max(1, Math.ceil(route.totalLen / spacing))
        route.cycleLen = count * spacing
        return {
          routeIdx,
          len: route.totalLen,
          count,
        }
      })
      let total = perRoute.reduce((sum, p) => sum + p.count, 0)
      if (total > maxCards) {
        const shuffled = [...perRoute].sort(() => Math.random() - 0.5)
        let toDrop = total - maxCards
        for (const p of shuffled) {
          if (toDrop <= 0) break
          const drop = Math.min(p.count, toDrop)
          p.count -= drop
          toDrop -= drop
        }
      }
      const out = []
      perRoute.forEach(p => {
        for (let k = 0; k < p.count; k++) {
          const variant = getCardVariant(crownedChance, purchasedChance)
          out.push({
            id: `${p.routeIdx}-${k}-${cardGen}`,
            routeIdx: p.routeIdx,
            born: nowAbs - k * gap,
            crowned: variant.crowned,
            purchased: variant.purchased,
          })
        }
      })
      cardGen++
      return out
    }

    const commitCards = routes => {
      segmentsRef.current = routes
      if (pulseInterval > 0) return
      const newCards = buildCards(routes)
      cardsRef.current = newCards
      setCards(newCards)
    }

    if (pulseInterval > 0) {
      cardsRef.current = []
      setCards([])
    }

    let cardGen = 0

    commitCards(computeSegments())

    let t0 = performance.now()
    let rafId
    let nextId = 0
    let nextPulse = 0
    let lastRotate = performance.now()

    const interpolateRoute = (route, dist) => {
      let targetSub = route.subSegments[0]
      for (const sub of route.subSegments) {
        if (dist <= sub.accumLen) {
          targetSub = sub
          break
        }
      }
      const localDist = dist - (targetSub.accumLen - targetSub.len)
      const localT = Math.min(1, Math.max(0, localDist / targetSub.len))
      const x = targetSub.s.x + (targetSub.e.x - targetSub.s.x) * localT
      const y = targetSub.s.y + (targetSub.e.y - targetSub.s.y) * localT
      return { x, y }
    }

    const tick = () => {
      let elapsed = performance.now() - t0
      const routes = segmentsRef.current

      if (pulseInterval > 0) {
        let changed = false
        let spawned = false
        while (elapsed >= nextPulse) {
          const wave = routes.map((route, routeIdx) => {
            const variant = getCardVariant(crownedChance, purchasedChance)
            return {
              id: nextId++,
              routeIdx,
              born: nextPulse,
              crowned: variant.crowned,
              purchased: variant.purchased,
            }
          })
          cardsRef.current = [...cardsRef.current, ...wave]
          nextPulse += pulseInterval
          changed = true
          spawned = true
        }
        if (spawned && onPulse) onPulse()
        const filtered = cardsRef.current.filter(c => {
          const route = routes[c.routeIdx]
          if (!route) return false
          return ((elapsed - c.born) / 1000) * speed < route.totalLen
        })
        if (filtered.length !== cardsRef.current.length) {
          cardsRef.current = filtered
          changed = true
        }
        if (changed) setCards(cardsRef.current)
        filtered.forEach(c => {
          const el = cardMapRef.current.get(c.id)
          if (!el) return
          const route = routes[c.routeIdx]
          if (!route) return
          const dist = ((elapsed - c.born) / 1000) * speed
          const FADE_DIST = Math.min(15, route.totalLen * 0.25)
          let opacity = 1
          if (dist < FADE_DIST) {
            opacity = dist / FADE_DIST
          } else if (route.totalLen - dist < FADE_DIST) {
            opacity = (route.totalLen - dist) / FADE_DIST
          }
          const { x, y } = interpolateRoute(route, dist)
          el.style.opacity = String(opacity)
          el.style.transform = `translate(${x}px, ${y}px)`
        })
      } else {
        const nowAbs = performance.now()

        if (rerandomizeInterval > 0 && nowAbs - lastRotate >= rerandomizeInterval) {
          lastRotate = nowAbs
          const active = cardsRef.current.filter(c => !c.retiring)
          const activeRoutes = new Set(active.map(c => c.routeIdx))
          const available = routes.map((_, i) => i).filter(i => !activeRoutes.has(i))
          const rotateCount = Math.min(ROTATE_PER_TICK, active.length, available.length)
          if (rotateCount > 0) {
            const shuffledActive = [...active].sort(() => Math.random() - 0.5)
            const toRetireIds = new Set(shuffledActive.slice(0, rotateCount).map(c => c.id))
            
            // Natural Lifecycle:
            // If a card is already in the gap (dist >= totalLen), drop it silently without visual disruption.
            // If on the arrow, let it continue its natural run until the end of the arrow (retiring: true).
            const kept = []
            cardsRef.current.forEach(c => {
              if (toRetireIds.has(c.id)) {
                const route = routes[c.routeIdx]
                if (route) {
                  const currentDist = (((nowAbs - c.born) / 1000) * speed) % route.cycleLen
                  if (currentDist < route.totalLen) {
                    kept.push({ ...c, retiring: true, retireStartDist: currentDist })
                  }
                }
              } else {
                kept.push(c)
              }
            })

            const newRoutes = [...available].sort(() => Math.random() - 0.5).slice(0, rotateCount)
            const newCards = newRoutes.map(routeIdx => {
              const variant = getCardVariant(crownedChance, purchasedChance)
              return {
                id: `r-${nextId++}`,
                routeIdx,
                born: nowAbs,
                crowned: variant.crowned,
                purchased: variant.purchased,
              }
            })
            cardsRef.current = [...kept, ...newCards]
            setCards(cardsRef.current)
          }
        }

        let hasDone = false
        const metas = cardsRef.current
        for (let i = 0; i < metas.length; i++) {
          const meta = metas[i]
          const el = cardMapRef.current.get(meta.id)
          const route = routes[meta.routeIdx]
          if (!route) {
            meta.done = true
            hasDone = true
            continue
          }

          const dist = (((nowAbs - meta.born) / 1000) * speed) % route.cycleLen

          // If retiring and it has finished its lap, cull it cleanly at the finish line
          if (meta.retiring && (dist >= route.totalLen || dist < meta.retireStartDist)) {
            meta.done = true
            hasDone = true
            if (el) el.style.opacity = '0'
            continue
          }

          // If card is in the invisible gap past the arrow, keep it completely hidden
          if (dist > route.totalLen) {
            if (el) el.style.opacity = '0'
            continue
          }

          if (!el) continue

          const FADE_DIST = Math.min(15, route.totalLen * 0.25)
          let opacity = 1
          if (dist < FADE_DIST) {
            opacity = dist / FADE_DIST
          } else if (route.totalLen - dist < FADE_DIST) {
            opacity = (route.totalLen - dist) / FADE_DIST
          }

          const { x, y } = interpolateRoute(route, dist)
          el.style.opacity = String(opacity)
          el.style.transform = `translate(${x}px, ${y}px)`
        }

        if (hasDone) {
          const remaining = cardsRef.current.filter(c => !c.done)
          cardsRef.current = remaining
          setCards(remaining)
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        measureDrawnCards()
        commitCards(computeSegments())
      })
      ro.observe(container)
    }

    return () => {
      cancelAnimationFrame(rafId)
      if (ro) ro.disconnect()
      hiddenFossilEls.forEach((el) => {
        el.style.visibility = ''
      })
    }
  }, [Svg, cardWidth, speed, offset, spacing, cardColor, flowMode, flowModeOverrides, pulseInterval, onPulse, maxCards, rerandomizeInterval, crownedChance, purchasedChance, dormantArrowIds.join(','), fossilBotIds.join(','), matchDrawnCards])

  const effectiveCardWidth =
    matchDrawnCards && drawnCardWidth
      ? drawnCardWidth
      : Math.round(cardWidth * sizeScale * 10) / 10
  const cardHeight = effectiveCardWidth * CARD_ASPECT

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: `${widthPct}%`, flexShrink: 0 }}>
      {Svg ? (
        <Svg style={{ width: '100%', height: 'auto', display: 'block', ...svgStyle }} />
      ) : null}
      {fossils.map((f) => (
        <div
          key={f.id}
          className="fossil-bot-overlay"
          style={{
            position: 'absolute',
            left: `${f.leftPct}%`,
            top: `${f.topPct}%`,
            width: `${f.sizePct}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 4,
            color: 'var(--color-dormant)',
          }}
        >
          <FossilIcon size="100%" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      ))}
      {cards.map(c => (
        <div
          key={c.id}
          ref={el => {
            if (el) cardMapRef.current.set(c.id, el)
            else cardMapRef.current.delete(c.id)
          }}
          style={{
            position: 'absolute',
            left: -effectiveCardWidth / 2,
            top: -cardHeight / 2,
            width: effectiveCardWidth,
            height: cardHeight,
            color: cardColor,
            pointerEvents: 'none',
            zIndex: 5,
            willChange: 'transform',
            opacity: 0,
          }}
        >
          <CardIcon
            crowned={Boolean(c.crowned)}
            purchased={Boolean(c.purchased)}
            width={effectiveCardWidth}
            height={cardHeight}
            color={cardColor}
            style={{ display: 'block' }}
          />
        </div>
      ))}
    </div>
  )
}
