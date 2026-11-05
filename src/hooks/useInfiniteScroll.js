import { useEffect, useRef, useState } from 'react'

export default function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onIntersect,
  rootRef = null,
  rootMargin = '200px',
  enabled = true,
  depsKey = '',
  delayMs = 1000,
}) {
  const sentinelRef = useRef(null)
  const callbackRef = useRef(onIntersect || fetchNextPage)
  const timerRef = useRef(null)
  const pendingRef = useRef(false)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    callbackRef.current = onIntersect || fetchNextPage
  }, [onIntersect, fetchNextPage])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (hasNextPage) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    pendingRef.current = false
    setIsWaiting(false)
  }, [hasNextPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !enabled || !hasNextPage) return undefined

    const cancelPending = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      pendingRef.current = false
      setIsWaiting(false)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          cancelPending()
          return
        }
        if (!hasNextPage || isFetchingNextPage || pendingRef.current) return
        pendingRef.current = true
        setIsWaiting(true)
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          pendingRef.current = false
          setIsWaiting(false)
          callbackRef.current?.()
        }, delayMs)
      },
      {
        root: rootRef?.current ?? null,
        rootMargin,
      }
    )

    observer.observe(sentinel)
    return () => {
      observer.disconnect()
      cancelPending()
    }
  }, [enabled, hasNextPage, isFetchingNextPage, rootMargin, rootRef, depsKey, delayMs])

  return { sentinelRef, isWaiting }
}
