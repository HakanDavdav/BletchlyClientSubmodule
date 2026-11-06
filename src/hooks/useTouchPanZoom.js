import { useRef } from 'react'

/**
 * Mobil dokunmatik kamera kontrolü: tek parmak ile pan, iki parmak ile
 * pinch-zoom. Zoom, masaüstü fare/tekerlek mantığıyla aynı aralığı
 * (0.05–2.5) kullanır ve pinch sırasında iki parmağın orta noktasını
 * sabit tutar (imleç-merkezli zoom ile aynı mantık).
 *
 * Kullanım: viewport elementine `touchAction: 'none'` verilmeli ve dönen
 * handler'lar onTouchStart/onTouchMove/onTouchEnd olarak bağlanmalı.
 */
export default function useTouchPanZoom({ containerRef, zoomRef, panRef, setZoom, setPan, panState }) {
  const touchState = useRef({ mode: null })
  // Fare uyumluluk olaylarının (tap sonrası sentetik mouse) pan başlatmaması için
  const lastTouchAt = useRef(0)

  const getMidpoint = (touches) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    const cs = window.getComputedStyle(container)
    const padLeft = parseFloat(cs.paddingLeft) || 0
    const padTop = parseFloat(cs.paddingTop) || 0
    const midClientX = (touches[0].clientX + touches[1].clientX) / 2
    const midClientY = (touches[0].clientY + touches[1].clientY) / 2
    return { x: midClientX - rect.left - padLeft, y: midClientY - rect.top - padTop }
  }

  const distance = (touches) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

  const onTouchStart = (e) => {
    lastTouchAt.current = Date.now()
    if (e.touches.length === 1) {
      touchState.current = {
        mode: 'pan',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      }
    } else if (e.touches.length >= 2) {
      const mid = getMidpoint(e.touches)
      touchState.current = {
        mode: 'pinch',
        startDist: Math.max(1, distance(e.touches)),
        startZoom: zoomRef.current,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
        midX: mid.x,
        midY: mid.y,
      }
    }
  }

  const onTouchMove = (e) => {
    lastTouchAt.current = Date.now()
    const st = touchState.current
    if (!st.mode) return

    if (st.mode === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - st.startX
      const dy = e.touches[0].clientY - st.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        panState.current.hasMoved = true
      }
      setPan({ x: st.startPanX + dx, y: st.startPanY + dy })
    } else if (st.mode === 'pinch' && e.touches.length >= 2) {
      const scale = distance(e.touches) / st.startDist
      const next = Math.min(2.5, Math.max(0.05, +(st.startZoom * scale).toFixed(2)))
      panState.current.hasMoved = true
      if (next !== st.startZoom) {
        const ratio = next / st.startZoom
        setPan({
          x: st.midX - (st.midX - st.startPanX) * ratio,
          y: st.midY - (st.midY - st.startPanY) * ratio,
        })
        setZoom(next)
      }
    }
  }

  const onTouchEnd = (e) => {
    lastTouchAt.current = Date.now()
    if (e.touches.length === 0) {
      touchState.current = { mode: null }
      // Dokunmatik sürüklemeden sonra sentetik click gelmez; bir sonraki
      // tap'ın yanlışlıkla baskılanmaması için işareti temizle.
      setTimeout(() => {
        panState.current.hasMoved = false
      }, 0)
    } else if (e.touches.length === 1 && touchState.current.mode === 'pinch') {
      // Pinch bitti, tek parmak kaldı → pan'a devam
      touchState.current = {
        mode: 'pan',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      }
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd, lastTouchAt }
}
