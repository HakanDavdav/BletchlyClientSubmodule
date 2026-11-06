import { useContext, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { PageTopDockContext, PageTopDockSlotContext } from './PageTopDockContext'
import ChatBubbleIcon from '../common/icons/ChatBubbleIcon'
import './PageTopDock.css'

export function PageTopDockProvider({ children }) {
  // Slot içerikleri portalla değil, doğrudan PageTopDock içinde render edilir.
  const storeRef = useRef(null)
  if (!storeRef.current) {
    let slots = { left: null, center: null, right: null }
    const listeners = new Set()
    storeRef.current = {
      getSnapshot: () => slots,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      setSlot: (slot, node) => {
        if (slots[slot] === node) return
        slots = { ...slots, [slot]: node }
        listeners.forEach((listener) => listener())
      },
    }
  }

  const value = useMemo(() => ({ store: storeRef.current }), [])

  return (
    <PageTopDockContext.Provider value={value}>{children}</PageTopDockContext.Provider>
  )
}

export function PageTopDock({
  onToggle,
  isOpen = false,
  openLabel = 'Open chat',
  closeLabel = 'Close chat',
  showHint = true,
  handleTabIndex,
  inset = false,
}) {
  const context = useContext(PageTopDockContext)
  const store = context?.store
  const slots = useSyncExternalStore(
    store?.subscribe ?? (() => () => {}),
    store?.getSnapshot ?? (() => ({ left: null, center: null, right: null })),
    store?.getSnapshot ?? (() => ({ left: null, center: null, right: null }))
  )

  if (!context) return null

  return (
    <div className={`page-top-dock${inset ? ' page-top-dock--inset' : ''}`}>
      <button
        type="button"
        className="center-deck__handle"
        onClick={onToggle}
        aria-label={isOpen ? closeLabel : openLabel}
        title={isOpen ? closeLabel : openLabel}
        tabIndex={handleTabIndex ?? (isOpen ? -1 : 0)}
      />
      <div className="page-top-dock__slots">
        <div className="page-top-dock__slot page-top-dock__slot--left">
          {slots.left}
        </div>
        <div className="page-top-dock__slot page-top-dock__slot--center">
          {slots.center ?? (showHint ? (
            <div className="page-top-dock__item page-top-dock__item--hint">
              <span className="page-top-dock__chat-hint" aria-hidden="true">
                <ChatBubbleIcon size={17} />
              </span>
            </div>
          ) : null)}
        </div>
        <div className="page-top-dock__slot page-top-dock__slot--right">
          {slots.right}
        </div>
      </div>
    </div>
  )
}

export function PageTopDockRow({
  left = null,
  center = null,
  right = null,
  style,
  className = '',
}) {
  const context = useContext(PageTopDockContext)
  const store = context?.store
  const hasDock = Boolean(store)

  const wrappedLeft = left ? (
    <PageTopDockSlotContext.Provider value="left">
      <div className="page-top-dock__item">{left}</div>
    </PageTopDockSlotContext.Provider>
  ) : null

  const wrappedCenter = center ? (
    <PageTopDockSlotContext.Provider value="center">
      <div className="page-top-dock__item">{center}</div>
    </PageTopDockSlotContext.Provider>
  ) : null

  const wrappedRight = right ? (
    <PageTopDockSlotContext.Provider value="right">
      <div className="page-top-dock__item">{right}</div>
    </PageTopDockSlotContext.Provider>
  ) : null

  // Her render'da slot içeriğini güncelle; böylece sayfa state'i değişince
  // dock içindeki öğeler de güncel kalır (portal olmadan).
  useLayoutEffect(() => {
    if (!store) return
    store.setSlot('left', wrappedLeft)
    store.setSlot('center', wrappedCenter)
    store.setSlot('right', wrappedRight)
  })

  // Sayfa/row unmount olduğunda slotları temizle.
  useLayoutEffect(() => {
    if (!store) return undefined
    return () => {
      store.setSlot('left', null)
      store.setSlot('center', null)
      store.setSlot('right', null)
    }
  }, [store])

  if (!hasDock) {
    return (
      <div className={`page-top-dock-row-fallback ${className}`.trim()} style={style}>
        <div className="page-top-dock-row-fallback__left">{left}</div>
        <div className="page-top-dock-row-fallback__center">{center}</div>
        <div className="page-top-dock-row-fallback__right">{right}</div>
      </div>
    )
  }

  return (
    <div
      className={`page-top-dock-row-spacer ${className}`.trim()}
      style={{ ...style, height: 0 }}
      aria-hidden="true"
    />
  )
}

export default PageTopDock
