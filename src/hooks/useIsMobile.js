import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 900

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
}

/**
 * Ekran genişliği `MOBILE_BREAKPOINT` (900px) altına indiğinde / üstüne çıktığında
 * reaktif olarak güncellenen mobil durum hook'u.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(isMobileViewport)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const handler = (event) => setIsMobile(event.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}
