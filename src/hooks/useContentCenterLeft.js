import { useEffect, useState } from 'react'

/**
 * Geniş sayfa düzeninde içerik kolonunun (#scroll-container) yatay merkezini
 * viewport koordinatı olarak döndürür. Yüzen butonların sol panele göre değil
 * içerik alanına göre tam ortalanması için kullanılır.
 */
export default function useContentCenterLeft() {
  const [centerLeft, setCenterLeft] = useState(null)

  useEffect(() => {
    const update = () => {
      const el = document.getElementById('scroll-container')
      if (!el) return
      const rect = el.getBoundingClientRect()
      setCenterLeft(rect.left + rect.width / 2)
    }

    update()
    const observer = new ResizeObserver(update)
    const el = document.getElementById('scroll-container')
    if (el) observer.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return centerLeft
}
