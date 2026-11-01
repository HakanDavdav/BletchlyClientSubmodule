import { useEffect } from 'react'

const MOBILE_QUERY = '(max-width: 900px)'

const isExcludedFromDrawerSwipe = (target) => {
  const node = target instanceof Element ? target : target?.parentElement
  if (!node || typeof node.closest !== 'function') return false
  return !!node.closest(
    '.left-cache-tabs-row, .left-cache-tabs-wrap, .left-cache-tabs, [data-no-drawer-swipe], .hscroll-strip'
  )
}

/**
 * Mobil sol drawer için jestler:
 * - Ekranın sol kenarından sağa sürükleme drawer'ı açar.
 * - Açıkken drawer üzerinde sola sürükleme parmağı/fareyi takip eder;
 *   yeterince çekince veya hızlı atınca kapatır, aksi halde geri yaylanır.
 * Dikey kaydırma jestleri yok sayılır. Dokunma için touch olayları
 * kullanılır (pointer olayları tarayıcı scroll'una takılıp iptal edilir);
 * fare için pointer olayları dinlenir.
 */
export default function useDrawerSwipe({
  drawerRef,
  overlayRef,
  isOpen,
  onOpen,
  onClose,
  edgeWidth = 28,
  openThreshold = 60,
  closeThreshold = 80,
  flickThreshold = 36,
  flickVelocity = 0.55,
}) {
  // Açma jesti: sol kenardan sağa sürükle
  useEffect(() => {
    if (isOpen) return undefined
    let active = false
    let mode = null
    let startX = 0
    let startY = 0

    const start = (x, y, m) => {
      if (active || !window.matchMedia(MOBILE_QUERY).matches) return
      if (x > edgeWidth) return
      active = true
      mode = m
      startX = x
      startY = y
    }

    const move = (x, y, m) => {
      if (!active || mode !== m) return
      const dx = x - startX
      const dy = y - startY
      if (dx >= openThreshold && Math.abs(dx) > Math.abs(dy)) {
        active = false
        mode = null
        onOpen()
      } else if (Math.abs(dy) > 50) {
        active = false
        mode = null
      }
    }

    const end = (m) => {
      if (mode === m) {
        active = false
        mode = null
      }
    }

    const onTouchStart = (e) => {
      const t = e.touches[0]
      if (t) start(t.clientX, t.clientY, 'touch')
    }
    const onTouchMove = (e) => {
      const t = e.touches[0]
      if (t) move(t.clientX, t.clientY, 'touch')
    }
    const onTouchEnd = () => end('touch')

    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      start(e.clientX, e.clientY, 'mouse')
    }
    const onPointerMove = (e) => {
      if (e.pointerType !== 'mouse') return
      move(e.clientX, e.clientY, 'mouse')
    }
    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse') end('mouse')
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [isOpen, onOpen, edgeWidth, openThreshold])

  // Kapatma jesti: drawer üzerinde sola sürükle (parmağı takip eder)
  useEffect(() => {
    if (!isOpen) return undefined
    const el = drawerRef.current
    if (!el) return undefined
    const overlay = overlayRef ? overlayRef.current : null

    let active = false
    let mode = null
    let dragging = false
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastT = 0
    let vx = 0
    let width = 300

    const resetStyles = () => {
      el.style.transition = ''
      el.style.transform = ''
      el.style.animation = ''
      if (overlay) {
        overlay.style.transition = ''
        overlay.style.opacity = ''
        overlay.style.animation = ''
      }
    }

    const start = (x, y, m) => {
      if (active) return
      active = true
      mode = m
      dragging = false
      startX = x
      startY = y
      lastX = x
      lastT = performance.now()
      vx = 0
      width = el.offsetWidth || 300
    }

    const move = (x, y, m) => {
      if (!active || mode !== m) return
      const dx = x - startX
      const dy = y - startY
      if (!dragging) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          dragging = true
          el.style.animation = 'none'
          if (overlay) overlay.style.animation = 'none'
        } else if (Math.abs(dy) > 12) {
          active = false
          mode = null
          return
        } else {
          return
        }
      }
      const now = performance.now()
      const dt = now - lastT
      if (dt > 0) vx = (x - lastX) / dt
      lastX = x
      lastT = now
      const clamped = Math.min(0, dx)
      el.style.transform = `translateX(${clamped}px)`
      if (overlay) overlay.style.opacity = String(Math.max(0, 1 + clamped / width))
    }

    const finish = (m) => {
      if (!active || mode !== m) return
      active = false
      mode = null
      if (!dragging) return
      dragging = false
      const dx = lastX - startX
      const shouldClose = dx <= -closeThreshold || (dx <= -flickThreshold && vx <= -flickVelocity)
      el.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)'
      if (overlay) overlay.style.transition = 'opacity 0.22s ease'
      if (shouldClose) {
        el.style.transform = 'translateX(-100%)'
        if (overlay) overlay.style.opacity = '0'
        setTimeout(() => {
          resetStyles()
          onClose()
        }, 200)
      } else {
        el.style.transform = ''
        if (overlay) overlay.style.opacity = ''
        setTimeout(() => {
          el.style.transition = ''
          if (overlay) {
            overlay.style.transition = ''
          }
          // Not: animation 'none' olarak bırakılır; '' yapılırsa CSS açılış
          // animasyonu yeniden başlayıp drawer'ı sıfırdan kaydırır (flash).
        }, 240)
      }
    }

    const onTouchStart = (e) => {
      if (isExcludedFromDrawerSwipe(e.target)) return
      const t = e.touches[0]
      if (t) start(t.clientX, t.clientY, 'touch')
    }
    const onTouchMove = (e) => {
      const t = e.touches[0]
      if (t) move(t.clientX, t.clientY, 'touch')
    }
    const onTouchEnd = () => finish('touch')

    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      if (isExcludedFromDrawerSwipe(e.target)) return
      start(e.clientX, e.clientY, 'mouse')
    }
    const onPointerMove = (e) => {
      if (e.pointerType !== 'mouse') return
      move(e.clientX, e.clientY, 'mouse')
    }
    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse') finish('mouse')
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    el.addEventListener('pointerdown', onPointerDown, { passive: true })
    el.addEventListener('pointermove', onPointerMove, { passive: true })
    el.addEventListener('pointerup', onPointerUp, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
    }
  }, [isOpen, drawerRef, overlayRef, onClose, closeThreshold, flickThreshold, flickVelocity])
}
