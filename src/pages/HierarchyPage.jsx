import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Maximize2, Network, Plus, Minus, Focus } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { actorApi } from '../api/actorApi'
import BackButton from '../components/common/BackButton'
import HierarchyTree from '../components/hierarchy/HierarchyTree'
import FossilTogglePill from '../components/common/FossilTogglePill'
import HeartSvg from '../assets/FigmaNew/heart.svg?react'
import useDevLog from '../utils/useDevLog'
import useTouchPanZoom from '../hooks/useTouchPanZoom'
import { useTranslation } from 'react-i18next'

export default function HierarchyPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const actorId = searchParams.get('actorId')
  useDevLog('HierarchyPage', arguments[0] || {})
  const navigate = useNavigate()

  const { data: hierarchyData, isLoading } = useQuery({
    queryKey: ['actorHierarchy', actorId],
    queryFn: async () => {
      const res = await actorApi.getChildHierarchy(actorId)
      return res.data?.data || null
    },
    enabled: Boolean(actorId),
  })

  const [treeData, setTreeData] = useState(null)
  const [isExpandingAll, setIsExpandingAll] = useState(false)
  const [isAllExpanded, setIsAllExpanded] = useState(false)
  const [expandCounter, setExpandCounter] = useState(0)
  const [fetchDepth, setFetchDepth] = useState(1)
  const [actorName, setActorName] = useState('')
  const [showFossils, setShowFossils] = useState(false)

  const fossilCount = useMemo(() => {
    const countFossils = (node) => {
      if (!node) return 0
      let count = 0
      for (const tribe of node.tribes || []) {
        if (tribe.isDormant ?? tribe.IsDormant ?? false) count += 1
      }
      for (const bot of node.bots || []) {
        if (bot.isDormant ?? bot.IsDormant ?? false) count += 1
        count += countFossils(bot)
      }
      return count
    }
    return countFossils(treeData)
  }, [treeData])

  const [zoomLevel, setZoomLevel] = useState(0.82)
  const [isViewReady, setIsViewReady] = useState(false)
  // Sınırsız pan: scroll sınırları yerine transform translate ile her yöne serbest kaydırma
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [pulseCount, setPulseCount] = useState(0)
  const handlePulse = useCallback(() => setPulseCount((c) => c + 1), [])

  // Wheel handler effect'i stale closure'a düşmesin diye zoom/pan'in güncel
  // kopyalarını ref'lerde tutuyoruz (imleç-merkezli zoom hesabı için gerekli).
  const zoomLevelRef = useRef(zoomLevel)
  useEffect(() => { zoomLevelRef.current = zoomLevel }, [zoomLevel])
  const panOffsetRef = useRef(panOffset)
  useEffect(() => { panOffsetRef.current = panOffset }, [panOffset])

  const [isFocused, setIsFocused] = useState(false)
  const blockRef = useRef(null)

  // Drag-to-pan (tutup çekerek sürükleme) state & refs
  const containerRef = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const panState = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    hasMoved: false,
  })

  // Mobil: tek parmak pan + iki parmak pinch-zoom
  const { onTouchStart, onTouchMove, onTouchEnd, lastTouchAt } = useTouchPanZoom({
    containerRef,
    zoomRef: zoomLevelRef,
    panRef: panOffsetRef,
    setZoom: setZoomLevel,
    setPan: setPanOffset,
    panState,
  })

  const handleMouseDown = (e) => {
    // Dokunmatikten gelen sentetik fare olaylarını yok say
    if (Date.now() - lastTouchAt.current < 700) return
    // Sol tık (0) veya orta tekerlek tuşu (1) ile sürükleme
    if (e.button !== 0 && e.button !== 1) return
    // Sol tıkta buton veya form elemanına tıklandıysa sürüklemeyi başlatma; orta tıkta ise her yerden sürükleme başlatılabilir
    if (e.button === 0 && e.target.closest('button, input, textarea, a, select')) return

    if (e.button === 1) {
      e.preventDefault() // Tarayıcının orta tık auto-scroll ikonunu ve davranışını engelle
    }

    const container = containerRef.current
    if (!container) return

    panState.current = {
      isDown: true,
      button: e.button,
      startX: e.pageX,
      startY: e.pageY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
      hasMoved: false,
    }
    setIsPanning(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!panState.current.isDown) return

      const deltaX = e.pageX - panState.current.startX
      const deltaY = e.pageY - panState.current.startY

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        panState.current.hasMoved = true
      }

      // Transform bazlı sınırsız pan: scroll alanına takılmaz, istenildiği kadar gidilir
      setPanOffset({
        x: panState.current.startPanX + deltaX,
        y: panState.current.startPanY + deltaY,
      })
    }

    const handleMouseUp = () => {
      if (panState.current.isDown) {
        panState.current.isDown = false
        setIsPanning(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleClickCapture = (e) => {
    // Sürükleme yapıldıysa veya orta tık ise kartların/linklerin kazara tıklanmasını önle
    if (panState.current.hasMoved || e.button === 1) {
      e.stopPropagation()
      e.preventDefault()
      panState.current.hasMoved = false
    }
  }

  // Bloğa tıklandığında focus alması, dışına tıklandığında bırakması
  useEffect(() => {
    const handleDocumentMouseDown = (e) => {
      if (blockRef.current && blockRef.current.contains(e.target)) {
        setIsFocused(true)
      } else {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }
  }, [])

  // Mouse tekerleği: Normal tekerlek ile kamerayı kaydır (pan), Ctrl + tekerlek ile zoom yap
  useEffect(() => {
    const targetEl = blockRef.current || containerRef.current
    if (!targetEl) return

    const handleWheel = (e) => {
      // 1. Ctrl + Tekerlek veya Meta + Tekerlek (Trackpad pinch dahil) -> Kamera Yakınlaştır / Uzaklaştır (Zoom)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const factor = Math.abs(e.deltaY) < 20 ? -e.deltaY * 0.005 : (e.deltaY < 0 ? 0.05 : -0.05)
        const prev = zoomLevelRef.current
        const next = Math.min(2.5, Math.max(0.05, +(prev + factor).toFixed(2)))
        if (next === prev) return

        // İmlecin altındaki dünya noktasını sabit tut: içerik imleç lokasyonuna
        // doğru yakınlaşsın (aksi halde top-left'e göre büyüyüp sola kayıyor).
        const container = containerRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          const cs = window.getComputedStyle(container)
          const padLeft = parseFloat(cs.paddingLeft) || 0
          const padTop = parseFloat(cs.paddingTop) || 0
          const cx = e.clientX - rect.left - padLeft
          const cy = e.clientY - rect.top - padTop
          const ratio = next / prev
          const pan = panOffsetRef.current
          setPanOffset({
            x: cx - (cx - pan.x) * ratio,
            y: cy - (cy - pan.y) * ratio,
          })
        }
        setZoomLevel(next)
        return
      }

      // 2. Normal Tekerlek -> Kamera Kaydırma (Pan)
      e.preventDefault()
      const dx = e.shiftKey ? -e.deltaY : -e.deltaX
      const dy = e.shiftKey ? 0 : -e.deltaY

      setPanOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))
    }

    targetEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      targetEl.removeEventListener('wheel', handleWheel)
    }
  }, [isLoading])

  // İlk giriş (oto-zoom) ile Default butonunun birebir aynı görünümü üretmesi için ortak rutin:
  // doğal boyut ilk seferde ölçülüp önbelleğe alınır; Default'a art arda basınca sapma (drift) olmaz.
  const naturalSizeRef = useRef(null)

  const fitToDefaultView = () => {
    const container = containerRef.current
    if (!container || !treeData) return

    let natW = 0
    let natH = 0
    if (naturalSizeRef.current) {
      natW = naturalSizeRef.current.w
      natH = naturalSizeRef.current.h
    } else {
      const currentZoom = zoomLevel > 0 ? zoomLevel : 0.82
      const wrapEl = container.firstElementChild
      if (wrapEl && wrapEl.offsetWidth > 0) {
        natW = wrapEl.offsetWidth / currentZoom
        natH = wrapEl.offsetHeight / currentZoom
      } else {
        natW = Math.max(1, (container.scrollWidth - 40) / currentZoom)
        natH = Math.max(1, (container.scrollHeight - 100) / currentZoom)
      }
      naturalSizeRef.current = { w: natW, h: natH }
    }

    const availW = Math.max(1, container.clientWidth - 40)
    const availH = Math.max(1, container.clientHeight - 100)
    const fit = Math.min(availW / Math.max(1, natW), availH / Math.max(1, natH))
    // Her şeyi sığdır: zoom en fazla %100; çok büyük içerikte de iyice küçülerek tümünü gösterir.
    const nextZoom = Math.max(0.02, Math.min(1.0, +(fit).toFixed(2)))

    setZoomLevel(nextZoom)

    // Yeni zoom uygulandıktan sonra yatayda ortala; dikeyde başlangıç tepede kalsın
    // ki root node sağ/sol üstteki overlay pill'lerin altına gizlenmesin.
    const predictedContentW = natW * nextZoom
    setTimeout(() => {
      setPanOffset({ x: (availW - predictedContentW) / 2, y: 0 })
    }, 80)
  }

  const handleDefaultView = () => fitToDefaultView()

  // Ağaç ilk yüklendiğinde: gizli render → oto-zoom + ortala → tek karede göster (flicker yok)
  useEffect(() => {
    if (!treeData || !containerRef.current) {
      setIsViewReady(false)
      return
    }
    setIsViewReady(false)
    const container = containerRef.current
    container.scrollLeft = 0
    container.scrollTop = 0
    const timer = setTimeout(() => {
      fitToDefaultView()
      setTimeout(() => setIsViewReady(true), 140)
    }, 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData])


  useEffect(() => {
    if (!hierarchyData) {
      setTreeData(null)
      return
    }

    const rootData = hierarchyData
    setActorName(rootData.profileName || '')

    // Build tree using Map from flat bots
    const map = new Map()
    const rootNode = {
      ...rootData,
      depth: 0,
      bots: [],
      tribes: rootData.tribes || [],
      _checked: true,
    }
    map.set(rootNode.actorId, rootNode)

    const flatBots = rootData.bots || []
    flatBots.forEach((bot) => {
      map.set(bot.actorId, {
        ...bot,
        depth: 0,
        bots: [],
        tribes: bot.tribes || [],
        _checked: true,
      })
    })

    flatBots.forEach((bot) => {
      const node = map.get(bot.actorId)
      const parent = map.get(bot.parentActorId)
      if (parent) {
        node.depth = (parent.depth ?? 0) + 1
        parent.bots.push(node)
      }
    })

    setTreeData(rootNode)
    setIsAllExpanded(false)
  }, [hierarchyData])

  const handleExpandAll = () => {
    setIsExpandingAll(true)
    setIsAllExpanded(true)
    setExpandCounter((c) => c + 1)
    setIsExpandingAll(false)
  }

  return (
    <div
      ref={blockRef}
      className="hierarchy-page-root"
      style={{
        width: '100%',
        height: 'calc(100vh - 135px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: isFocused ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        boxShadow: isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* ── Floating Controls & Header (Sol ve Sağ Üst Bloklar) ──────────────── */}
      <div
        className="hierarchy-header"
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Sol Üst Blok: Geri Dön Butonu & Aktör Kimlik Kartı */}
          <div
            className="hierarchy-header-left"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 44,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '6px 14px',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
              maxWidth: '55%',
            }}
          >
            <BackButton style={{ marginBottom: 0, width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} />
          <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />

          <div className="hierarchy-header-identity" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Network size={16} color="var(--color-primary)" style={{ flexShrink: 0, display: 'block' }} />
            <span
              className="hierarchy-header-label"
              style={{
                fontWeight: 800,
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              {t('hierarchy.profile_hierarchy_title', 'Profile Hierarchy')}
            </span>
            <span className="hierarchy-header-bullet" style={{ color: 'var(--color-primary)', flexShrink: 0, transform: 'translateY(-1px)' }}>•</span>
            <span
              onClick={() => {
                if (actorId) navigate(`/profile?actorId=${actorId}`)
              }}
              style={{
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: actorId ? 'pointer' : 'default',
                transform: 'translateY(1px)',
                minWidth: 0,
              }}
            >
              {actorName || t('hierarchy.no_name', 'isim')}
            </span>
          </div>
        </div>

        {/* Sağ Üst: Derinlik/Zoom Araçları ve Altında Ortalı Heartbeat */}
        <div
          className="hierarchy-header-right"
          style={{
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Sağ Üst Blok: Derinlik, Zoom & Genişletme Araçları */}
          <div
            className="hierarchy-toolbar"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '6px 12px',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
            }}
          >
            <div className="hierarchy-toolbar-secondary">
            {/* Derinlik Kontrolü */}
            <div className="hierarchy-depth" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}
              >
                {t('hierarchy.depth', 'Derinlik:')}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={fetchDepth}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, '')
                  if (!raw) {
                    setFetchDepth('')
                    return
                  }
                  let val = parseInt(raw, 10)
                  if (val > 5) val = 5
                  if (val < 1) val = 1
                  setFetchDepth(val)
                }}
                onBlur={() => {
                  if (!fetchDepth || fetchDepth < 1) setFetchDepth(1)
                }}
                style={{
                  width: 34,
                  padding: '3px 4px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

            {/* Zoom Level Göstergesi */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                minWidth: 38,
                textAlign: 'center',
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </span>

            {/* Zoom Butonları */}
            <button
              type="button"
              className="btn btn-ghost btn-sm hierarchy-zoom-btn"
              onClick={() => setZoomLevel((z) => Math.min(2.0, +(z + 0.05).toFixed(2)))}
              aria-label={t('hierarchy.zoom_in', 'Büyüt (+)')}
              style={{ flexShrink: 0, width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm hierarchy-zoom-btn"
              onClick={() => setZoomLevel((z) => Math.max(0.05, +(z - 0.05).toFixed(2)))}
              aria-label={t('hierarchy.zoom_out', 'Küçült (-)')}
              style={{ flexShrink: 0, width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Minus size={12} />
            </button>
            </div>

            <div className="hierarchy-toolbar-main">
            <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

            {/* Tümünü Genişlet Butonu */}
            <button
              type="button"
              className={`btn btn-sm hierarchy-toggle-btn ${isAllExpanded ? 'hierarchy-toggle-btn--active' : ''}`}
              onClick={handleExpandAll}
              disabled={isExpandingAll || !treeData}
              aria-label={t('hierarchy.expand_all', 'Tümünü Genişlet')}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px', height: 26 }}
            >
              {isExpandingAll ? (
                <div
                  className="spinner spinner-sm"
                  style={{ width: 14, height: 14, borderWidth: 2 }}
                />
              ) : (
                <Maximize2 size={12} />
              )}
              <span>{t('hierarchy.expand_all', 'Tümünü Genişlet')}</span>
            </button>

            {/* Fosil Düğümleri Göster / Gizle Toggle */}
            <FossilTogglePill
              count={fossilCount}
              open={showFossils}
              onToggle={() => setShowFossils((prev) => !prev)}
              style={{ flexShrink: 0 }}
            />

            <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

            {/* Default Görünüm */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDefaultView}
              disabled={!treeData}
              aria-label={t('hierarchy.default_view', 'Varsayılan')}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px', height: 26 }}
            >
              <Focus size={12} />
              <span>{t('hierarchy.default_view', 'Varsayılan')}</span>
            </button>
            </div>
          </div>

          {/* Sağ Üst Bloğun Altında Ortalı Heartbeat (Büyük & Hızlı Nabız) */}
          <div
            className="hierarchy-heartbeat"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('hierarchy_info.section_heartbeat_title', 'Heartbeat')}
          >
            <div
              key={pulseCount}
              style={{
                width: 68,
                height: 68,
                color: 'var(--color-primary)',
                animation: 'heartBeat 0.38s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 4px 14px var(--color-primary-shadow, rgba(0, 180, 216, 0.55)))',
                cursor: 'default',
              }}
            >
              <HeartSvg width={64} height={64} style={{ display: 'block' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Canvas (Drag-to-pan & Zoom) ────────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClickCapture={handleClickCapture}
        onAuxClick={(e) => {
          if (e.button === 1) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className="hierarchy-viewport"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'relative',
          cursor: isPanning ? 'grabbing' : 'grab',
          userSelect: isPanning ? 'none' : 'auto',
          background: 'transparent',
          padding: '76px 20px 24px',
          touchAction: 'none',
        }}
      >
        {isLoading ? null : treeData ? (
          <div
            style={{
              visibility: isViewReady ? 'visible' : 'hidden',
              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
              willChange: 'transform',
              width: 'max-content',
            }}
          >
          <HierarchyTree
            data={treeData}
            setTreeData={setTreeData}
            expandCounter={expandCounter}
            fetchDepth={fetchDepth}
            rootActorId={actorId}
            zoomLevel={zoomLevel}
            onPulse={handlePulse}
            showFossils={showFossils}
          />
          </div>
        ) : (
          <div className="empty-state">
            {t('hierarchy.no_data', 'Hiyerarşi verisi bulunamadı.')}
          </div>
        )}
      </div>

      {/* Auto-zoom hazırlanırken tek karede final görünüm için gizli yükleme spinner'ı */}
      {(isLoading || (treeData && !isViewReady)) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div className="spinner spinner-lg" />
        </div>
      )}
    </div>
  )
}
