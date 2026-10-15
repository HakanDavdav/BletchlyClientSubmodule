import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useDrawerSwipe from '../../hooks/useDrawerSwipe'
import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import FooterBar from './FooterBar'
import MobileTabBar from './MobileTabBar'
import MobileDrawerExtras from './MobileDrawerExtras'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../../api/searchApi'

/**
 * MainLayout — 3 kolonlu ana iskelet.
 * Mobil ekranlarda sağ ve sol paneller gizlenir; sol panel drawer olarak açılır,
 * alt kısımda MobileTabBar görünür.
 * Hiyerarşi sayfasında sağ panel gizlenir ve orta panel genişler.
 */
export default function MainLayout({ children, pendingInvitation = null, onOpenInvitation }) {
  useDevLog('MainLayout', arguments[0] || {})
  const { isLeftDrawerOpen, openLeftDrawer, closeDrawers } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isHierarchyPage =
    location.pathname.startsWith('/hierarchy') ||
    location.pathname.startsWith('/card-hierarchy') ||
    location.pathname.startsWith('/tribes')
  const drawerRef = useRef(null)
  const drawerOverlayRef = useRef(null)
  const drawerHandleRef = useRef(null)
  const closeAnimRef = useRef(false)

  const { data: seasonStatus } = useQuery({
    queryKey: ['seasonStatus'],
    queryFn: async () => {
      try {
        const res = await searchApi.getSeasonStatus()
        return res.data?.data || null
      } catch (err) {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  // Drawer'ı elle sürükleyerek kapatırkenki animasyonun aynısıyla kapatır:
  // önce sola kaydırıp söndürür, animasyon bitince store'dan kapatır.
  const animateClose = useCallback(() => {
    const el = drawerRef.current
    if (!el) {
      closeDrawers()
      return
    }
    if (closeAnimRef.current) return
    closeAnimRef.current = true
    const overlay = drawerOverlayRef.current
    el.style.animation = 'none'
    el.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.transform = 'translateX(-100%)'
    if (overlay) {
      overlay.style.animation = 'none'
      overlay.style.transition = 'opacity 0.22s ease'
      overlay.style.opacity = '0'
    }
    window.setTimeout(() => {
      closeAnimRef.current = false
      closeDrawers()
    }, 210)
  }, [closeDrawers])

  // Sol kenardan sağa sürükle → aç; drawer üzerinde sola sürükle → kapat
  useDrawerSwipe({
    drawerRef,
    overlayRef: drawerOverlayRef,
    isOpen: isLeftDrawerOpen,
    onOpen: openLeftDrawer,
    onClose: closeDrawers,
  })

  // Tutamaç, drawer'ın sağ kenarını (dış sınır) ve boyunu gerçek zamanlı takip
  // eder: açılış animasyonu ve kapatma sürüklemesi sırasında her karede
  // konumlanır; boyu drawer soldan dışarı kaydıkça kısalır (progress ile).
  useEffect(() => {
    const handle = drawerHandleRef.current
    if (!isLeftDrawerOpen) {
      if (handle) {
        handle.style.transform = ''
        handle.style.top = ''
        handle.style.bottom = ''
        handle.style.transition = ''
      }
      return undefined
    }
    const closedTop =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--topbar-height')
      ) || 0
    const tabBar = document.querySelector('.mobile-tab-bar')
    const closedBottom = tabBar ? tabBar.getBoundingClientRect().height : 56
    let rafId
    const tick = () => {
      const h = drawerHandleRef.current
      const drawer = drawerRef.current
      if (h && drawer) {
        const rect = drawer.getBoundingClientRect()
        const width = rect.width || 1
        const progress = Math.min(1, Math.max(0, -rect.left / width))
        h.style.transform = `translateX(${Math.round(rect.right)}px)`
        // Tamamen açıkken üst sınır drawer'ın "letchly" satırının altı (44px);
        // kapalıyken topbar'ın altı (closedTop). Aradaki geçiş yumuşak.
        h.style.top = `${Math.round(44 + progress * (closedTop - 44))}px`
        h.style.bottom = `${Math.round(progress * closedBottom)}px`
        // Sürükleme/animasyon sırasında top/bottom'u anlık izle (CSS geçişini
        // devre dışı bırak); duru hâlde CSS geçişi kalsın ki X ile kapanış yumuşak olsun
        const animating = drawer.style.transform !== '' || drawer.getAnimations().length > 0
        h.style.transition = animating
          ? 'opacity var(--transition-fast), color var(--transition-fast)'
          : ''
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
      const h = drawerHandleRef.current
      if (h) {
        h.style.transform = ''
        h.style.top = ''
        h.style.bottom = ''
        h.style.transition = ''
        // Kapanış geçişinde uçlar topbar/tab bar arkasında kaybolmasın diye
        // kısa süre üstte tut (geçiş bitince normal z'ye döner)
        h.style.zIndex = '102'
        window.setTimeout(() => {
          if (drawerHandleRef.current) drawerHandleRef.current.style.zIndex = ''
        }, 320)
      }
    }
  }, [isLeftDrawerOpen])

  // Rota değiştiğinde mobil drawer'ları kapat (aynı pathname'e query-only
  // yönlendirmelerde de kapanması için tam location nesnesi izlenir).
  // Sürükleme kapanışındaki animasyonla kapanır, aniden kaybolmaz.
  useEffect(() => {
    animateClose()
  }, [location, animateClose])

  return (
    <div className="layout-root">
      <TopBar pendingInvitation={pendingInvitation} onOpenInvitation={onOpenInvitation} />

      <div className="layout-body">
        <div
          className={isHierarchyPage ? 'layout-hierarchy' : undefined}
          style={{
            display: 'flex',
            width: isHierarchyPage ? 'calc(100% - max(0px, calc((100% - 1432px) / 2)))' : '100%',
            maxWidth: isHierarchyPage ? 'none' : '1432px',
            marginLeft: isHierarchyPage ? 'max(0px, calc((100% - 1432px) / 2))' : 'auto',
            marginRight: isHierarchyPage ? 0 : 'auto',
            padding: isHierarchyPage ? '0 8px 0 16px' : '0 16px',
          }}
        >
          {/* Sol Panel (Desktop) */}
          <LeftPanel />

          {/* Sol kenar tutamacı: tıklanınca veya sağa sürüklenince mobil drawer
              açılır; drawer açıkken de sol bloğun sağ kenarında kalır */}
          <button
            type="button"
            ref={drawerHandleRef}
            className={`mobile-drawer-handle${isLeftDrawerOpen ? ' is-open' : ''}`}
            onClick={isLeftDrawerOpen ? animateClose : openLeftDrawer}
            aria-label={
              isLeftDrawerOpen ? t('common.close', 'Kapat') : t('common.open_menu', 'Menüyü aç')
            }
            title={isLeftDrawerOpen ? t('common.close', 'Kapat') : t('common.open_menu', 'Menüyü aç')}
          >
            <span className="mobile-drawer-handle__caret" aria-hidden="true">▼</span>
          </button>

          {/* Mobil Sol Drawer */}
          {isLeftDrawerOpen && (
            <>
              <div
                className="modal-overlay mobile-drawer-overlay"
                onClick={animateClose}
                style={{ zIndex: 100 }}
                ref={drawerOverlayRef}
              />
              <div className="layout-left-drawer" role="dialog" aria-modal="true" ref={drawerRef}>
                <div className="layout-left-drawer__bar">
                  <button
                    type="button"
                    className="layout-left-drawer__brand"
                    onClick={() => {
                      animateClose()
                      navigate('/')
                    }}
                  >
                    <span>letchly</span>
                    {seasonStatus && typeof seasonStatus.daysRemaining === 'number' && (
                      <span
                        className="season-remaining-badge season-remaining-badge--drawer"
                        onClick={(e) => {
                          e.stopPropagation()
                          animateClose()
                          navigate('/leaderboard')
                        }}
                      >
                        <span>
                          {seasonStatus.daysRemaining > 0
                            ? `${seasonStatus.daysRemaining}!`
                            : `${seasonStatus.hoursRemaining ?? 0}!`}
                        </span>
                      </span>
                    )}
                  </button>
                </div>
                {/* Bar sabit kalsın diye kaydırılan içerik bar'ın altında ayrı
                    bir kapsayıcıda toplanır */}
                <div className="layout-left-drawer__scroll">
                  <LeftPanel />
                  <MobileDrawerExtras />
                </div>
              </div>
            </>
          )}

          {/* Orta ve Sağ Panel ile Footer'ı Saran Konteyner */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            {/* Sadece Orta ve Sağ Panelin Yanyana Olduğu Kısım */}
            <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
              {/* Merkez İçerik */}
              <main className="layout-center" id="scroll-container" style={{ minWidth: 0, width: '100%' }}>
                <div
                  className="layout-center-inner"
                  style={{
                    maxWidth: isHierarchyPage ? '100%' : 800,
                    width: '100%',
                    margin: isHierarchyPage ? 0 : '0 auto',
                    padding: isHierarchyPage ? '16px 8px 16px 16px' : '16px',
                  }}
                >
                  {children}
                </div>
              </main>

              {/* Sağ Panel (Desktop) — Hiyerarşi sayfasında gizlenir */}
              {!isHierarchyPage && <RightPanel />}
            </div>

            {/* Footer artık SADECE Orta ve Sağ panelin altında! */}
            <FooterBar />
          </div>
        </div>
      </div>

      {/* Mobil alt gezinme çubuğu */}
      <MobileTabBar />
    </div>
  )
}
