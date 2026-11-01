import { useState, useEffect, useRef } from 'react'

/**
 * Mobilde / dar ekranlarda yatay kaydırılabilir alanlar için
 * üstte gösterilen görsel kaydıraç (scroll indicator) durumunu (left%, width%, scrollable) izleyen hook.
 *
 * @param {Array} deps - Yeniden hesaplamayı tetikleyecek bağımlılıklar
 * @returns {[React.RefObject, { scrollable: boolean, left: number, width: number }]}
 */
export function useHorizontalScrollIndicator(deps = []) {
  const ref = useRef(null)
  const [scrollState, setScrollState] = useState({ scrollable: false, left: 0, width: 100 })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const update = () => {
      const sw = el.scrollWidth
      const cw = el.clientWidth
      const scrollable = sw > cw + 1
      const width = scrollable ? Math.max(14, (cw / sw) * 100 * 0.8) : 100
      const maxScroll = sw - cw
      const left = scrollable && maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - width) : 0
      setScrollState({ scrollable, left, width })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (ro) ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      if (ro) ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, scrollState]
}

export default useHorizontalScrollIndicator

