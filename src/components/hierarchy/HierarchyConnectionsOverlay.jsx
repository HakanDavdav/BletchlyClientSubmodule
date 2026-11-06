import { useEffect, useRef, useState, useCallback } from 'react'
import CardIcon from '../common/icons/CardIcon'

const CARD_ASPECT = 122 / 105
const FADE_DIST = 20

/**
 * Lineer segment enterpolasyonu:
 * Verilen mesafedeki (dist) [x, y] koordinatını hesaplar.
 */
function interpolateRoute(route, dist) {
  let targetSub = route.subSegments[0]
  for (let i = 0; i < route.subSegments.length; i++) {
    const sub = route.subSegments[i]
    if (dist <= sub.accumLen) {
      targetSub = sub
      break
    }
  }
  const localDist = dist - (targetSub.accumLen - targetSub.len)
  const localT = targetSub.len > 0 ? Math.min(1, Math.max(0, localDist / targetSub.len)) : 0
  const x = targetSub.s.x + (targetSub.e.x - targetSub.s.x) * localT
  const y = targetSub.s.y + (targetSub.e.y - targetSub.s.y) * localT
  return { x, y }
}

/**
 * Hiyerarşi Ağacı Global Bağlantı ve Kart Akışı Katmanı (Yaklaşım B)
 * - Ağacın zemininde tek bir SVG overlay barındırır.
 * - Ebeveyn ve çocuk düğümlerin (aktör ve klan) merkezleri arasında kırımlı (dirsekli) SVG path'ler çizer.
 * - Tek bir requestAnimationFrame döngüsüyle tüm hatlar üzerindeki mikro kartların akışını yönetir.
 */
export default function HierarchyConnectionsOverlay({
  containerRef,
  data,
  rootActorId,
  expandCounter,
  structureVersion = 0,
  cardWidth = 28,
  speed = 54,
  pulseInterval = 2000,
  enableCardTravel = true,
  onPulse,
  cardColor = 'var(--color-primary)',
  strokeColor = 'var(--color-border)',
  strokeWidth = 2,
  crownedChance = 0.2,
}) {
  const cardMapRef = useRef(new Map())
  const routesRef = useRef([])
  const cardsRef = useRef([])
  const prevRouteKeyRef = useRef('')
  const rafMeasureRef = useRef(null)

  const [paths, setPaths] = useState([])
  const [cards, setCards] = useState([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [sizeScale, setSizeScale] = useState(1)

  // Mobilde mikro kartlar alan ölçeğiyle orantılı küçülür; masaüstü korunur
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
  }, [containerRef])

  const effectiveCardWidth = Math.round(cardWidth * sizeScale * 10) / 10
  const cardHeight = Math.round(effectiveCardWidth * CARD_ASPECT)

  const onPulseRef = useRef(onPulse)
  useEffect(() => {
    onPulseRef.current = onPulse
  }, [onPulse])

  const updateConnections = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    // Efektif ölçek: getBoundingClientRect (zoom uygulanmış) / offsetWidth (layout).
    // Hem CSS zoom hem transform fallback'inde doğru çalışır ve zoom değişince
    // ölçümü yeniden tetiklemeye gerek kalmaz (yerel koordinatlar zoom-invariant).
    const zoom = container.offsetWidth > 0
      ? containerRect.width / container.offsetWidth
      : 1
    const width = Math.max(container.scrollWidth, container.offsetWidth, 100)
    const height = Math.max(container.scrollHeight, container.offsetHeight, 100)

    const childEls = container.querySelectorAll('[data-parent-id]')
    const newPaths = []
    const newRoutes = []

    // İlk geçiş: tüm çocukları ölç ve ebeveyn bazında topla.
    // Katmanlı görünüm için aynı ebeveynin çocukları ortak bir yatay kırım
    // (dirsek) Y'si kullanır. Pill'li kartların kart üstü daha aşağıda olduğu
    // için kendi midY'leri ile çizilirse devasa yatay hattan kopuyordu.
    const parentRects = new Map()
    const entries = []
    childEls.forEach((childEl, index) => {
      const parentId = childEl.getAttribute('data-parent-id')
      if (!parentId) return

      let pRect = parentRects.get(parentId)
      if (!pRect) {
        const parentEl = container.querySelector(`[data-node-id="${parentId}"]`)
        if (!parentEl) return
        pRect = parentEl.getBoundingClientRect()
        parentRects.set(parentId, pRect)
      }

      const cRect = childEl.getBoundingClientRect()

      // Zoom etkisini kompanse ederek unzoomed container koordinatlarını bul
      const startX = (pRect.left + pRect.width / 2 - containerRect.left) / zoom
      const startY = (pRect.bottom - containerRect.top) / zoom
      const endX = (cRect.left + cRect.width / 2 - containerRect.left) / zoom
      const endY = (cRect.top - containerRect.top) / zoom

      entries.push({ childEl, index, parentId, startX, startY, endX, endY })
    })

    // Ebeveyn başına ortak dirsek Y'si = çocukların en üstteki midY'si.
    // Böylece her derinlikte yatay hat tek ve aynı hizada kalır; pill'li
    // kartın bağlantısı bu hattan aşağı iner.
    const groupMidY = new Map()
    for (const entry of entries) {
      const m = entry.startY + (entry.endY - entry.startY) / 2
      const current = groupMidY.get(entry.parentId)
      if (current === undefined || m < current) {
        groupMidY.set(entry.parentId, m)
      }
    }

    // İkinci geçiş: ortak dirsek Y'si ile çiz.
    for (const entry of entries) {
      const { childEl, index, parentId, startX, startY, endX, endY } = entry
      const midY = groupMidY.get(parentId) ?? startY + (endY - startY) / 2

      let d
      let pts
      if (Math.abs(startX - endX) < 1.5) {
        // Düz dikey iniş (tek veya tam hizalı çocuk)
        d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} V ${endY.toFixed(1)}`
        pts = [
          [startX, startY],
          [startX, endY],
        ]
      } else {
        // 90 derecelik kırımlı hat: İniş -> Yatay dağıtım -> İniş
        d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} V ${midY.toFixed(1)} H ${endX.toFixed(1)} V ${endY.toFixed(1)}`
        pts = [
          [startX, startY],
          [startX, midY],
          [endX, midY],
          [endX, endY],
        ]
      }

      const childId =
        childEl.getAttribute('data-node-id') ||
        childEl.getAttribute('data-tribe-id') ||
        String(index)
      const id = `arrow_${parentId}_${childId}`
      newPaths.push({ id, d })

      // Yol segmentlerini hesapla
      let accumLen = 0
      const subSegments = []
      for (let i = 0; i < pts.length - 1; i++) {
        const s = { x: pts[i][0], y: pts[i][1] }
        const e = { x: pts[i + 1][0], y: pts[i + 1][1] }
        const len = Math.hypot(e.x - s.x, e.y - s.y)
        if (len === 0) continue
        accumLen += len
        subSegments.push({ s, e, len, accumLen })
      }

      // En tepedeki kök karttan çıkan oklardan kart akışı istenmiyorsa rotaya ekleme
      const topRootId = rootActorId || data?.actorId
      const isFromRoot = topRootId && String(parentId) === String(topRootId)

      if (!isFromRoot && subSegments.length > 0 && accumLen > 10) {
        newRoutes.push({
          id,
          subSegments,
          totalLen: accumLen,
        })
      }
    }

    routesRef.current = newRoutes
    setPaths(newPaths)
    setDimensions({ width, height })
  }, [containerRef, rootActorId, data])

  // Ağaç verisi, genişletme sayacı veya zoom değiştiğinde ölçümü tetikle
  useEffect(() => {
    const triggerUpdate = () => {
      if (rafMeasureRef.current) cancelAnimationFrame(rafMeasureRef.current)
      rafMeasureRef.current = requestAnimationFrame(() => {
        updateConnections()
      })
    }

    triggerUpdate()
    // DOM geçişleri ve font yüklemeleri için hafif gecikmeli ikinci ölçüm
    const timer = setTimeout(triggerUpdate, 60)

    const container = containerRef.current
    if (!container) return () => clearTimeout(timer)

    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => triggerUpdate())
      ro.observe(container)
    }

    let mo
    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => triggerUpdate())
      mo.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    }

    return () => {
      clearTimeout(timer)
      if (rafMeasureRef.current) cancelAnimationFrame(rafMeasureRef.current)
      if (ro) ro.disconnect()
      if (mo) mo.disconnect()
    }
  }, [updateConnections, data, expandCounter, structureVersion])

  // Heartbeat ile senkronize dalga (pulse) animasyon döngüsü
  useEffect(() => {
    if (!enableCardTravel || pulseInterval <= 0) {
      setCards([])
      cardsRef.current = []
      return
    }

    let rafId
    let nextPulse = 0
    let nextId = 0
    const t0 = performance.now()

    const tick = () => {
      const elapsed = performance.now() - t0
      const routes = routesRef.current

      if (pulseInterval > 0) {
        let changed = false
        let spawned = false
        while (elapsed >= nextPulse) {
          if (routes.length > 0) {
            const wave = routes.map((route, routeIdx) => ({
              id: `p_${nextId++}`,
              routeIdx,
              born: nextPulse,
              crowned: Math.random() < crownedChance,
            }))
            cardsRef.current = [...cardsRef.current, ...wave]
            spawned = true
            changed = true
            nextPulse += pulseInterval
          } else {
            nextPulse = elapsed + 50
            break
          }
        }

        // Kalp atışını kart dalgasının doğduğu tam o anda tetikle
        if (spawned && onPulseRef.current) {
          onPulseRef.current()
        }

        // Hedefe varan kartları listeden temizle
        const filtered = cardsRef.current.filter((c) => {
          const route = routes[c.routeIdx]
          if (!route) return false
          return ((elapsed - c.born) / 1000) * speed < route.totalLen
        })

        if (filtered.length !== cardsRef.current.length) {
          cardsRef.current = filtered
          changed = true
        }

        if (changed) {
          setCards([...cardsRef.current])
        }

        // Kartları hat boyunca GPU hızlandırmalı taşı
        const map = cardMapRef.current
        const activeList = cardsRef.current
        for (let i = 0; i < activeList.length; i++) {
          const card = activeList[i]
          const route = routes[card.routeIdx]
          const el = map.get(card.id)
          if (!route || !el) continue

          const dist = ((elapsed - card.born) / 1000) * speed
          let opacity = 1
          if (dist < FADE_DIST) {
            opacity = dist / FADE_DIST
          } else if (route.totalLen - dist < FADE_DIST) {
            opacity = Math.max(0, (route.totalLen - dist) / FADE_DIST)
          }

          const { x, y } = interpolateRoute(route, dist)
          el.style.opacity = String(opacity)
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [enableCardTravel, pulseInterval, speed, crownedChance])

  return (
    <div
      className="hierarchy-connections-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: dimensions.width ? `${dimensions.width}px` : '100%',
        height: dimensions.height ? `${dimensions.height}px` : '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <svg
        className="hierarchy-connections-svg"
        width={dimensions.width || '100%'}
        height={dimensions.height || '100%'}
        viewBox={
          dimensions.width && dimensions.height
            ? `0 0 ${dimensions.width} ${dimensions.height}`
            : undefined
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: dimensions.width ? `${dimensions.width}px` : '100%',
          height: dimensions.height ? `${dimensions.height}px` : '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {paths.map((p) => (
          <g key={p.id} id={p.id}>
            <path
              d={p.d}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          </g>
        ))}
      </svg>

      {/* Hatlar üzerinde akan mikro kartlar */}
      {enableCardTravel && cards.map((c) => (
        <div
          key={c.id}
          ref={(el) => {
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
            zIndex: 1,
            willChange: 'transform, opacity',
            opacity: 0,
          }}
        >
          <CardIcon
            crowned={Boolean(c.crowned)}
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
