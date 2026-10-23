import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useThemeStore from '../store/themeStore'
import { deriveAccentPalette } from '../utils/themeColor'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import { actorApi } from '../api/actorApi'
import { tribeApi } from '../api/tribeApi'
import { ArrowLeft, ArrowRight, Loader2, Brain, Focus, Search, X, Tag, Lock, Unlock, Filter, Move, Type, Timer, BookOpen, CalendarFold } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

export function getNodeLabelText(label, isRoot = false, isTribeContext = false) {
  if (isRoot) {
    return isTribeContext
      ? i18n.t('mind.labels.tribe_root', 'Tribe (Root)')
      : i18n.t('mind.labels.persona', 'Persona')
  }
  if (label === 'Persona') {
    return i18n.t('mind.labels.persona', 'Persona')
  }
  if (label === 'Core') {
    return i18n.t('mind.labels.core', 'Core')
  }
  if (label === 'Tribe' && isTribeContext) {
    return i18n.t('mind.labels.other_tribes', 'Other Tribes')
  }
  if (label === 'Tribe') {
    return i18n.t('mind.labels.tribe', 'Tribe')
  }
  if (label === 'Actor' || label === 'User' || label === 'Bot') {
    return i18n.t('mind.labels.actor', 'Person')
  }
  if (
    label === 'GeneralThought' ||
    label === 'Topic' ||
    label === 'Concept' ||
    label === 'Thought'
  ) {
    return i18n.t('mind.labels.general_thought', 'GeneralThought')
  }
  return label || ''
}

// Ağ boyutuna (düğüm sayısı ve uzamsal yarıçap) ve ekran genişliğine göre en uygun taban kamera mesafesini hesapla
export function computeOptimalCameraDistance(nodes = [], isMobile = false) {
  const count = nodes?.length || 0
  // Yakın ve etkileyici görsel perspektif: mobilde ~850-980, masaüstünde ~580-720 birim taban
  const base = isMobile ? 820 : 560
  const countDistance = base + Math.sqrt(Math.max(1, count)) * (isMobile ? 50 : 35)

  let maxR = 0
  for (const n of nodes) {
    if (n.x != null && n.y != null && n.z != null) {
      const r = Math.hypot(n.x, n.y, n.z)
      if (r > maxR) maxR = r
    }
  }
  const spatialDistance =
    maxR > 0 ? Math.round(maxR * (isMobile ? 1.7 : 1.3) + (isMobile ? 140 : 100)) : 0

  const dist = Math.max(countDistance, spatialDistance)

  return Math.min(1800, Math.max(isMobile ? 800 : 550, Math.round(dist)))
}

// Nöron renk paleti — Koyu arka planda biyolüminesans tonlar
// (Persona/Merkez düğüm dinamik olarak tema rengine [Yeşil/Mavi] bağlanır)
const NEURON_COLORS = {
  Tribe: { core: '#c084fc', glow: '#a855f7' }, // Asil Mor (Topluluklar)
  Actor: { core: '#f97316', glow: '#ea580c' }, // Canlı Turuncu / Mercan (Diğer Kullanıcı & Botlar)
  GeneralThought: { core: '#facc15', glow: '#eab308' }, // Parlak Altın Sarısı (Düşünceler, Fikirler, Konular)
  Core: { core: '#f472b6', glow: '#db2777' }, // Pembe (Kimlik Çekirdeği / Persona bileşenleri)
  default: { core: '#e879f9', glow: '#d946ef' }, // Fuşya
}

// ─── Kimlik Torbası (Identity Bag) geometrisi ─────────────────────────────────
// Kök (Persona/Tribe) ve Core düğümlerini saran merkez küme.
const BAG_RADIUS = 128 // Torba küresinin taban yarıçapı
const BAG_RADIUS_MAX = 200 // Core sayısı arttıkça torbanın büyüyebileceği üst sınır
const BAG_RADIUS_CORE_STEP = 4 // Taban üstü her core düğümü için ek yarıçap
const BAG_RADIUS_FREE_CORES = 6 // Bu sayıya kadar core, taban yarıçapı kullanır
const CORE_ORBIT_RADIUS = 74 // Core düğümlerinin kök etrafındaki yörünge yarıçapı (taban)
const CORE_ORBIT_RATIO = CORE_ORBIT_RADIUS / BAG_RADIUS
const CORE_NODE_MARGIN = 26 // Core merkezinin torba yüzeyine bırakması gereken pay
const OUTER_ORBIT_MIN = 230 // Dış (kavramsal) düğümlerin küre yarıçapı (min)
const OUTER_ORBIT_STEP = 34 // Dış küre yarıçapı varyasyon adımı

// Node aralığı (Space) modları: her basışta bir sonraki moda geçilir.
// Ölçekler fizik kuvvetlerine (bağ mesafesi + itme) uygulanır.
const SPACING_PRESETS = [
  { key: 'compact', label: 'Dar', linkScale: 0.72, chargeScale: 0.65, coreOrbitScale: 0.85, outerOrbitScale: 0.82 },
  { key: 'normal', label: 'Normal', linkScale: 1, chargeScale: 1, coreOrbitScale: 1, outerOrbitScale: 1 },
  { key: 'wide', label: 'Geniş', linkScale: 1.5, chargeScale: 1.55, coreOrbitScale: 1.25, outerOrbitScale: 1.28 },
  { key: 'xwide', label: 'Ekstra Geniş', linkScale: 2.3, chargeScale: 2.4, coreOrbitScale: 1.6, outerOrbitScale: 1.75 },
]

// Döngü sırası: önce "Otomatik", ardından 4 sabit mod.
const SPACING_OPTIONS = ['auto', ...SPACING_PRESETS.map((p) => p.key)]

// Otomatik aralık: node sayısına göre 4 moddan birini arka planda seç.
function autoSpacingKey(nodeCount) {
  if (nodeCount <= 60) return 'xwide'
  if (nodeCount <= 150) return 'wide'
  if (nodeCount <= 300) return 'normal'
  return 'compact'
}

// Bağlantı etiketleri ilk girişte: düşük düğüm sayısında açık, yüksekte kapalı.
const LINK_LABEL_AUTO_HIDE_NODE_COUNT = 100

// Seçili ayarı (auto veya sabit mod) somut bir ön ayara çöz.
function resolveSpacingPreset(setting, nodeCount) {
  const key = setting === 'auto' ? autoSpacingKey(nodeCount) : setting
  return SPACING_PRESETS.find((p) => p.key === key) || SPACING_PRESETS[1]
}

// Core sayısına göre kimlik torbasının (orb) yarıçapı.
function computeBagRadius(coreCount = 0) {
  const extra = Math.max(0, coreCount - BAG_RADIUS_FREE_CORES)
  return Math.min(BAG_RADIUS_MAX, BAG_RADIUS + extra * BAG_RADIUS_CORE_STEP)
}

// Torbaya oranlı core yörünge yarıçapı.
function computeCoreOrbitRadius(bagRadius) {
  return Math.round(bagRadius * CORE_ORBIT_RATIO)
}

// Dış (kavramsal) düğümlerin torbanın dışında kalması için minimum yarıçap.
function computeOuterOrbitMin(bagRadius) {
  return Math.max(OUTER_ORBIT_MIN, bagRadius + 96)
}

// Fizik kuvvetlerini seçili aralık moduna göre uygula (bağ mesafesi + itme).
function applySpacingForces(fg, preset) {
  if (!fg || typeof fg.d3Force !== 'function') return
  const p = preset || SPACING_PRESETS[1]
  const lf = fg.d3Force('link')
  if (lf) {
    lf.distance((link) => {
      const root = link.source?.isRoot ? link.source : link.target?.isRoot ? link.target : null
      const bagRadius = root?.bagRadius ?? BAG_RADIUS
      const coreOrbit = root?.coreOrbitRadius ?? CORE_ORBIT_RADIUS
      if (link.isCoreLink) {
        // Persona core'ları kendine çeker; mesafe her zaman orbun içinde kalır.
        return Math.min(coreOrbit * p.coreOrbitScale, bagRadius - CORE_NODE_MARGIN)
      }
      if (link.isBagLink) return (root?.outerOrbitMin ?? OUTER_ORBIT_MIN) * p.outerOrbitScale
      return 40 * p.linkScale
    }).strength((link) => (link.isCoreLink ? 0.9 : 0.3))
  }
  const cf = fg.d3Force('charge')
  // Kök düğüm core'ları dışa itmesin; çekim bağ kuvveti ve containment ile sağlanır.
  if (cf) cf.strength((n) => (n.isRoot ? 0 : n.isCore ? -140 : -900) * p.chargeScale)
  installCoreContainmentForce(fg)
}

// Persona ↔ core fiziği: core'ları yörünge çevresinde tutar, orb sınırına
// yaklaştıkça kök merkezine doğru yay kuvveti uygular.
function installCoreContainmentForce(fg) {
  if (!fg || typeof fg.d3Force !== 'function' || typeof fg.graphData !== 'function') return
  fg.d3Force('coreContainment', (alpha) => {
    const nodes = fg.graphData()?.nodes
    if (!nodes || nodes.length === 0) return
    const root = nodes.find((n) => n.isRoot)
    if (!root) return
    const bagRadius = root.bagRadius ?? BAG_RADIUS
    const coreOrbit = root.coreOrbitRadius ?? CORE_ORBIT_RADIUS
    const hardLimit = bagRadius - CORE_NODE_MARGIN
    const softLimit = Math.min(hardLimit, coreOrbit + 12)
    const softPull = 0.12 * alpha
    const hardPull = 0.9 * alpha
    for (const n of nodes) {
      if (!n.isCore || n.isRoot) continue
      const dx = (n.x ?? 0) - (root.x ?? 0)
      const dy = (n.y ?? 0) - (root.y ?? 0)
      const dz = (n.z ?? 0) - (root.z ?? 0)
      const d = Math.hypot(dx, dy, dz)
      if (d < 0.001) continue
      let pull = 0
      if (d > hardLimit) pull = (d - hardLimit) * hardPull
      else if (d > softLimit) pull = (d - softLimit) * softPull
      if (pull === 0) continue
      const f = pull / d
      n.vx = (n.vx ?? 0) - dx * f
      n.vy = (n.vy ?? 0) - dy * f
      n.vz = (n.vz ?? 0) - dz * f
    }
  })
}

// Yatay kaydırılabilir bir ögenin kaydıraç konumunu izle (thumb %konumu + genişliği).
function attachHorizontalScroll(el, setState) {
  if (!el) return undefined
  const update = () => {
    const sw = el.scrollWidth
    const cw = el.clientWidth
    const scrollable = sw > cw + 1
    const width = scrollable ? Math.max(14, (cw / sw) * 100 * 0.8) : 100
    const maxScroll = sw - cw
    const left = scrollable && maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - width) : 0
    setState({ scrollable, left, width })
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
}

// PC görünüm anahtarları: bağlantı/düğüm etiket bloklarını gizle.
// Three.js nesneleri inşa anında bu bayrakları okur; toggle anında mevcut
// nesnelerin .visible değeri güncellenir.
const mindViewFlags = { hideLinkLabels: false, hideNodeLabels: false, lazyRender: false }

function getActiveNeuronColor() {
  const { isGreenMode, customColor } = useThemeStore.getState()
  const accent = deriveAccentPalette({ isGreenMode, customColor })
  return { core: accent.activeCore, glow: accent.activeGlow }
}

function getNeuronColor(label, isRoot = false) {
  const { isGreenMode, customColor } = useThemeStore.getState()
  const accent = deriveAccentPalette({ isGreenMode, customColor })
  if (label === 'Persona' || label === 'Core' || isRoot) {
    return { core: accent.base, glow: accent.rootGlow }
  }
  return NEURON_COLORS[label] || NEURON_COLORS.default
}

// Nöron görsel dokuları ve rozet önbelleği (MindAmbience estetiği)
const nodeTextureCache = new Map()
const nodeBadgeCache = new Map()

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(100, 100, 100, ${alpha})`
  let c = hex.replace('#', '')
  if (c.length === 3)
    c = c
      .split('')
      .map((x) => x + x)
      .join('')
  const num = parseInt(c, 16)
  if (isNaN(num)) return `rgba(100, 100, 100, ${alpha})`
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`
}

function getNodeVisualTextures(coreColor, glowColor) {
  const cacheKey = `${coreColor}_${glowColor}`
  if (nodeTextureCache.has(cacheKey)) {
    return nodeTextureCache.get(cacheKey)
  }

  // 1. Halo Canvas (MindAmbience radyal gradyan halesi - <radialGradient>)
  const haloCanvas = document.createElement('canvas')
  const haloSize = 256
  haloCanvas.width = haloSize
  haloCanvas.height = haloSize
  const hCtx = haloCanvas.getContext('2d')
  const hCenter = haloSize / 2
  const hGrad = hCtx.createRadialGradient(hCenter, hCenter, 0, hCenter, hCenter, hCenter)
  hGrad.addColorStop(0, coreColor)
  hGrad.addColorStop(0.4, glowColor)
  hGrad.addColorStop(0.75, hexToRgba(glowColor, 0.35))
  hGrad.addColorStop(1, hexToRgba(glowColor, 0.0))
  hCtx.fillStyle = hGrad
  hCtx.fillRect(0, 0, haloSize, haloSize)
  const haloTex = new THREE.CanvasTexture(haloCanvas)

  // 2. Pearl Face Canvas (MindAmbience: core circle + sol-üst beyaz parlaklık merkezi)
  const pearlCanvas = document.createElement('canvas')
  const pearlSize = 256
  pearlCanvas.width = pearlSize
  pearlCanvas.height = pearlSize
  const pCtx = pearlCanvas.getContext('2d')
  const pCenter = pearlSize / 2
  const pR = (pearlSize / 2) * 0.76

  // Dış ışıma
  pCtx.save()
  pCtx.shadowColor = glowColor
  pCtx.shadowBlur = 24
  pCtx.fillStyle = coreColor
  pCtx.beginPath()
  pCtx.arc(pCenter, pCenter, pR, 0, Math.PI * 2)
  pCtx.fill()
  pCtx.restore()

  // Biyolüminesans çekirdek gradyanı
  const coreGrad = pCtx.createRadialGradient(
    pCenter - pR * 0.28,
    pCenter - pR * 0.28,
    pR * 0.04,
    pCenter,
    pCenter,
    pR
  )
  coreGrad.addColorStop(0, '#ffffff')
  coreGrad.addColorStop(0.3, coreColor)
  coreGrad.addColorStop(1, glowColor)
  pCtx.fillStyle = coreGrad
  pCtx.beginPath()
  pCtx.arc(pCenter, pCenter, pR, 0, Math.PI * 2)
  pCtx.fill()

  // MindAmbience: Beyaz parlaklık merkezi (Specular Glint)
  // cx={node.x - node.r * 0.28} cy={node.y - node.r * 0.28} r={node.r * 0.32} fill="#ffffff" opacity="0.85"
  pCtx.save()
  pCtx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  pCtx.shadowColor = '#ffffff'
  pCtx.shadowBlur = 12
  pCtx.beginPath()
  pCtx.arc(pCenter - pR * 0.28, pCenter - pR * 0.28, pR * 0.32, 0, Math.PI * 2)
  pCtx.fill()
  pCtx.restore()

  const pearlTex = new THREE.CanvasTexture(pearlCanvas)

  const result = { haloTex, pearlTex }
  nodeTextureCache.set(cacheKey, result)
  return result
}

// 3D Canvas Düğüm Bilgi Bloğu (MindAmbience tarzı sade, zarif, okunaklı cam kart)
function buildNodeBlock(node, core, glow, isPersona, r) {
  let titleText = node.name || node.label
  if (titleText.length > 22) {
    titleText = titleText.substring(0, 22) + '...'
  }
  const subtitleText = getNodeLabelText(node.label, isPersona, Boolean(node.isTribeContext))
  const lang = i18n.language || 'tr'
  const isDark = typeof useThemeStore !== 'undefined' ? useThemeStore.getState().isDarkMode : true
  const cacheKey = `${titleText}_${subtitleText}_${core}_${glow}_${isPersona}_${lang}_${isDark ? 'dark' : 'light'}_v4`

  let tex = nodeBadgeCache.get(cacheKey)
  if (!tex) {
    // 2x Retina ölçeği ile kristal netliğinde çizim
    const scale = 2
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.font = '700 28px Inter, sans-serif'
    const titleWidth = tempCtx.measureText(titleText).width
    tempCtx.font = '600 18px Inter, sans-serif'
    const subtitleWidth = tempCtx.measureText(subtitleText.toUpperCase()).width
    const textWidth = Math.max(titleWidth, subtitleWidth)

    const padX = 36 * scale
    const cardW = Math.max(140 * scale, textWidth + padX)
    const cardH = 58 * scale

    const canvas = document.createElement('canvas')
    canvas.width = cardW + 16
    canvas.height = cardH + 16
    const ctx = canvas.getContext('2d')

    const ox = 8
    const oy = 8

    if (isDark) {
      // MindAmbience koyu cam kart: fill="rgba(10, 5, 20, 0.90)" stroke={core}
      ctx.fillStyle = isPersona ? 'rgba(8, 4, 20, 0.94)' : 'rgba(10, 5, 20, 0.90)'
      ctx.beginPath()
      ctx.roundRect(ox, oy, cardW, cardH, 8 * scale)
      ctx.fill()

      ctx.strokeStyle = core
      ctx.lineWidth = 1.6 * scale
      ctx.stroke()

      // Başlık (Beyaz, net Inter)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const centerX = canvas.width / 2

      ctx.font = '700 28px Inter, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(titleText, centerX, oy + 20 * scale)

      // Alt etiket (Tema rengi, sade, opacity: 0.90)
      ctx.font = '600 18px Inter, sans-serif'
      ctx.fillStyle = glow
      ctx.globalAlpha = 0.9
      ctx.fillText(subtitleText.toUpperCase(), centerX, oy + 42 * scale)
      ctx.globalAlpha = 1.0
    } else {
      // Modern Açık Tema: Kristal beyaz cam kart, soft gölge, net koyu tipografi
      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)'
      ctx.shadowBlur = 10 * scale
      ctx.shadowOffsetY = 3 * scale
      ctx.fillStyle = isPersona ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)'
      ctx.beginPath()
      ctx.roundRect(ox, oy, cardW, cardH, 8 * scale)
      ctx.fill()
      ctx.shadowColor = 'transparent'

      ctx.strokeStyle = core
      ctx.lineWidth = 1.8 * scale
      ctx.stroke()

      // Başlık (Net Koyu Slate)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const centerX = canvas.width / 2

      ctx.font = '700 28px Inter, sans-serif'
      ctx.fillStyle = '#0f172a'
      ctx.fillText(titleText, centerX, oy + 20 * scale)

      // Alt etiket (Canlı vurgulu tema rengi)
      ctx.font = '700 18px Inter, sans-serif'
      ctx.fillStyle = glow
      ctx.fillText(subtitleText.toUpperCase(), centerX, oy + 42 * scale)
    }

    tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.userData = { cardW: cardW / scale, cardH: cardH / scale }
    nodeBadgeCache.set(cacheKey, tex)
  }

  const baseW = tex.userData?.cardW || 140
  const baseH = tex.userData?.cardH || 58

  const badgeMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  // Rahatça okunabilecek belirgin ve dengeli 3D boyutu
  const scaleFactor = isPersona ? 0.72 : 0.56
  const meshW = baseW * scaleFactor
  const meshH = baseH * scaleFactor

  const badgeGeo = new THREE.PlaneGeometry(meshW, meshH)
  const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat)

  // Düğümün hemen üstünde estetik süzülme
  badgeMesh.position.set(0, r + meshH * 0.5 + 6, 0)
  badgeMesh.renderOrder = isPersona ? 100000010 : 9999999
  badgeMesh.userData = { isBadge: true }
  badgeMesh.visible = !mindViewFlags.hideNodeLabels

  badgeMesh.onBeforeRender = function (renderer, scene, camera) {
    this.quaternion.copy(camera.quaternion)
  }

  return badgeMesh
}

// Three.js ile parlayan nöron nesnesi oluştur (MindAmbience estetiğiyle birebir)
function buildNeuronObject(node) {
  const isRoot =
    Boolean(node.isRoot) || node.label === 'Persona' || (node.label === 'Tribe' && node.isRoot)
  const isPersona = isRoot
  const isActive = Boolean(node.isActive) // Active Synapse highlight

  // Active node'lar için tema rengi (Neon Mavi / Neon Yeşil); diğerleri normal renk paleti
  const activeColor = getActiveNeuronColor()
  const { core, glow } = isActive ? activeColor : getNeuronColor(node.label, isRoot)

  const group = new THREE.Group()

  // MindAmbience oranları: Persona hafifçe daha büyük (22 vs 13); Active node'lar %30 daha büyük
  const baseR = isPersona ? 22 : node.label === 'GeneralThought' || node.label === 'Topic' ? 15 : node.label === 'Core' ? 14 : 12
  const r = isActive ? Math.round(baseR * 1.35) : baseR

  // Biyolüminesans süzülme için alt grup (MindAmbience mindFloatCenter)
  const visualGroup = new THREE.Group()
  // Three.js Group.renderOrder -> groupOrder: three-forcegraph bağlantı
  // gruplarını 10 yapar; persona 20 ile her zaman bağlantıların üstünde çizilir.
  if (isPersona) visualGroup.renderOrder = 20
  visualGroup.userData = {
    isVisualGroup: true,
    isPersonaNode: isPersona,
    seed: (strHash(node.id || node.name || 'node') % 1000) / 1000,
  }

  const { haloTex, pearlTex } = getNodeVisualTextures(core, glow)

  const isDark = typeof useThemeStore !== 'undefined' ? useThemeStore.getState().isDarkMode : true

  // 1. Dış en yumuşak ışıma (MindAmbience r * 2.8 radyal gradyan halesi - mindPulseHalo)
  // Active node'larda halo daha geniş ve opaque
  const haloSize = isActive ? r * 7.2 : r * 5.6
  const haloGeo = new THREE.PlaneGeometry(haloSize, haloSize)
  const haloOpacity = isActive
    ? isDark
      ? 0.65
      : 0.45
    : isPersona
      ? isDark
        ? 0.45
        : 0.32
      : isDark
        ? 0.32
        : 0.22
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    opacity: haloOpacity,
    blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  })
  const haloMesh = new THREE.Mesh(haloGeo, haloMat)
  haloMesh.userData = { isHalo: true, isPersona: isPersona, baseOpacity: haloOpacity }
  if (isPersona) {
    // Persona düğümü her zaman en üstte: bağlantıların arkasında kalmasın.
    haloMat.depthTest = false
    haloMesh.renderOrder = 99999900
  }
  haloMesh.onBeforeRender = function (renderer, scene, camera) {
    this.quaternion.copy(camera.quaternion)
  }
  visualGroup.add(haloMesh)

  // 2. Orta hale küresi (MindAmbience r * 1.6 - fill={node.glow} opacity="0.32")
  const midHaloGeo = new THREE.SphereGeometry(r * 1.55, 20, 20)
  const midHaloMat = new THREE.MeshBasicMaterial({
    color: glow,
    transparent: true,
    opacity: isDark
      ? isActive
        ? 0.5
        : isPersona
          ? 0.32
          : 0.22
      : isActive
        ? 0.28
        : isPersona
          ? 0.18
          : 0.12,
    blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  })
  const midHaloMesh = new THREE.Mesh(midHaloGeo, midHaloMat)
  if (isPersona) {
    midHaloMat.depthTest = false
    midHaloMesh.renderOrder = 99999901
  }
  visualGroup.add(midHaloMesh)

  // 3. 3D İç Fiziksel Çekirdek Küresi (Tıklama ve 3D derinlik)
  const coreSphereGeo = new THREE.SphereGeometry(r, 28, 28)
  const coreSphereMat = new THREE.MeshBasicMaterial({ color: core })
  const coreSphereMesh = new THREE.Mesh(coreSphereGeo, coreSphereMat)
  if (isPersona) {
    // Şeffaf listede çizilsin ki üstteki bağlantılar onu örtmesin.
    coreSphereMat.transparent = true
    coreSphereMat.depthTest = false
    coreSphereMat.depthWrite = false
    coreSphereMesh.renderOrder = 99999902
  }
  visualGroup.add(coreSphereMesh)

  // 3b. Persona avatarı — kök düğümün merkezinde bot/tribe görseli
  if (isPersona && node.avatarUrl) {
    const avatarSize = r * 1.02
    const avatarMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
    const avatarMesh = new THREE.Mesh(new THREE.CircleGeometry(avatarSize, 48), avatarMat)
    // Overlay her zaman en önde: bağlantı etiketleri (9999998/9999999) dahil
    // sahnedeki her şeyin üstünde kalsın.
    avatarMesh.renderOrder = 100000000
    avatarMesh.userData = { isAvatar: true }
    avatarMesh.onBeforeRender = function (renderer, scene, camera) {
      this.quaternion.copy(camera.quaternion)
    }
    visualGroup.add(avatarMesh)

    // Site global tema rengi filtresi — görselin üzerine hafif renk katmanı.
    const avatarTintMat = new THREE.MeshBasicMaterial({
      color: core,
      transparent: true,
      opacity: isDark ? 0.18 : 0.12,
      depthWrite: false,
      depthTest: false,
    })
    const avatarTintMesh = new THREE.Mesh(
      new THREE.CircleGeometry(avatarSize, 48),
      avatarTintMat
    )
    avatarTintMesh.renderOrder = 100000001
    avatarTintMesh.onBeforeRender = function (renderer, scene, camera) {
      this.quaternion.copy(camera.quaternion)
    }
    visualGroup.add(avatarTintMesh)

    const avatarRingMat = new THREE.MeshBasicMaterial({
      color: glow,
      transparent: true,
      opacity: isDark ? 0.85 : 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    })
    const avatarRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(avatarSize * 1.03, avatarSize * 1.12, 48),
      avatarRingMat
    )
    avatarRingMesh.renderOrder = 100000002
    avatarRingMesh.onBeforeRender = function (renderer, scene, camera) {
      this.quaternion.copy(camera.quaternion)
    }
    visualGroup.add(avatarRingMesh)

    new THREE.TextureLoader().load(
      node.avatarUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        avatarMat.map = tex
        avatarMat.opacity = 1
        avatarMat.needsUpdate = true
        coreSphereMesh.visible = false
      },
      undefined,
      () => {
        avatarMesh.visible = false
        avatarTintMesh.visible = false
        avatarRingMesh.visible = false
      }
    )
  }

  // 4. Biyolüminesans Pearl Yüzeyi ve Beyaz Parlaklık Merkezi (MindAmbience Glossy Pearl Face)
  // Kameraya dönük parlak pearl diski: Çekirdek rengi + sol üst beyaz parlaklık noktası (Specular Glint)
  const pearlGeo = new THREE.PlaneGeometry(r * 2.15, r * 2.15)
  const pearlMat = new THREE.MeshBasicMaterial({
    map: pearlTex,
    transparent: true,
    depthWrite: false,
  })
  const pearlMesh = new THREE.Mesh(pearlGeo, pearlMat)
  pearlMesh.renderOrder = isPersona ? 99999903 : 999
  if (isPersona) pearlMat.depthTest = false
  pearlMesh.onBeforeRender = function (renderer, scene, camera) {
    this.quaternion.copy(camera.quaternion)
  }
  visualGroup.add(pearlMesh)

  // 5. Düğüm Başlık Bloğu (Orijinal 3D Canvas Kart Yapısı)
  const badgeMesh = buildNodeBlock(node, core, glow, isPersona, r)
  visualGroup.add(badgeMesh)

  // 6. Active Synapse ring — extra dış ışıma halkası aktif node'larda
  if (isActive) {
    const ringGeo = new THREE.RingGeometry(r * 1.7, r * 2.1, 48)
    const ringMat = new THREE.MeshBasicMaterial({
      color: core,
      transparent: true,
      opacity: isDark ? 0.55 : 0.42,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.userData = { isHalo: true, isPersona: false, baseOpacity: isDark ? 0.55 : 0.42 }
    if (isPersona) {
      ringMat.depthTest = false
      ringMesh.renderOrder = 100000005
    }
    ringMesh.onBeforeRender = function (renderer, scene, camera) {
      this.quaternion.copy(camera.quaternion)
    }
    visualGroup.add(ringMesh)
  }

  // ─── Kimlik Torbası (Identity Bag) ─────────────────────────────────────────
  // Kök düğüm (Persona/Tribe) merkezdeyken, Core'ları saran yarı saydam küme küresi.
  if (isRoot) {
    const bagOpacity = isDark ? 0.15 : 0.1
    const bagRadius = node.bagRadius ?? BAG_RADIUS

    // 1. Torba gövdesi — yarı saydam, ışımalı küre (iç yüzey görünür)
    const bagGeo = new THREE.SphereGeometry(bagRadius, 48, 36)
    const bagMat = new THREE.MeshBasicMaterial({
      color: core,
      transparent: true,
      opacity: bagOpacity,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })
    const bagMesh = new THREE.Mesh(bagGeo, bagMat)
    bagMesh.renderOrder = -2000
    bagMesh.userData = { isBag: true, baseOpacity: bagOpacity }
    group.add(bagMesh)

    // 2. Hafif tel kafes kabuk — torbanın sınırını belirginleştirir
    const bagWireOpacity = isDark ? 0.055 : 0.045
    const bagWireGeo = new THREE.SphereGeometry(bagRadius * 1.004, 16, 12)
    const bagWireMat = new THREE.MeshBasicMaterial({
      color: glow,
      wireframe: true,
      transparent: true,
      opacity: bagWireOpacity,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    })
    const bagWireMesh = new THREE.Mesh(bagWireGeo, bagWireMat)
    bagWireMesh.renderOrder = -1999
    bagWireMesh.userData = { isBag: true, baseOpacity: bagWireOpacity }
    group.add(bagWireMesh)
  }

  group.add(visualGroup)
  return group
}

// ─── Kılcal Damar Geometrisi ──────────────────────────────────────────────────

// Basit seeded random — her link için tutarlı ama unique organik şekil
function makeRng(seed) {
  let s = Math.abs(seed) % 233280
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// String'den basit hash
function strHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Global shader uniforms (Biyolüminesans elektrik impulsu)
const initialAccent = deriveAccentPalette({
  isGreenMode: typeof useThemeStore !== 'undefined' ? useThemeStore.getState().isGreenMode : false,
  customColor: typeof useThemeStore !== 'undefined' ? useThemeStore.getState().customColor : null,
})
const globalUniforms = {
  uTime: { value: 0 },
  uPulseColor: {
    value: new THREE.Vector3(...initialAccent.pulseRgb),
  },
}

// ─── MindAmbience Sinaps Bağlantı Materyalleri ────────────────────────────────
// 1. Sinaps ana omurga yolu (MindAmbience stroke="var(--color-border)" strokeWidth="1.6" strokeOpacity="0.5")
const _synapseTrackMat = new THREE.MeshBasicMaterial({
  color: initialAccent.trackDark,
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
})

// 2. Sinaps dış eterik ışıma halesi (MindAmbience filter="url(#synapseGlow)" strokeOpacity="0.15")
const _synapseHaloMat = new THREE.MeshBasicMaterial({
  color: initialAccent.activeGlow,
  transparent: true,
  opacity: 0.16,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

// 3. Akıcı nöral kesikli elektrik sinyali shader'ı (MindAmbience strokeDasharray="6 14" ve @keyframes mindSynapseDash)
const _synapseDashShaderMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: globalUniforms.uTime,
    uColor: {
      value: new THREE.Color(initialAccent.activeCore),
    },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      // vUv.x tüp boyunca (başlangıçtan bitişe) 0..1 arası akar
      // MindAmbience akıcı kesikli sinyal çizgisi ritmi
      float speed = 3.2;
      float segments = 22.0;
      float stream = fract(vUv.x * segments - uTime * speed);

      // MindAmbience "6 14" oranı: ~%30 çizgi, ~%70 boşluk
      float dash = smoothstep(0.0, 0.06, stream) * (1.0 - smoothstep(0.28, 0.35, stream));

      if (dash < 0.02) discard;

      // Beyaz-sıcak elektrik kıvılcım çekirdeği + neon gövde
      vec3 coreWhite = vec3(1.0, 1.0, 1.0);
      vec3 electricColor = mix(uColor, coreWhite, pow(dash, 1.8) * 0.75);

      gl_FragColor = vec4(electricColor, dash * 0.95);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
})

// 4. Seyahat eden darbe küresi (Traveling Pulse Orb) ışıma materyalleri
const _orbGlowMat = new THREE.MeshBasicMaterial({
  color: initialAccent.activeCore,
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const _orbCoronaMat = new THREE.MeshBasicMaterial({
  color: initialAccent.activeGlow,
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

// 5. Aktif / Recalled bağlantılar için güçlü, parıltılı nöral sinaps materyalleri
const _activeSynapseTrackMat = new THREE.MeshBasicMaterial({
  color: initialAccent.deepMid,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
})

const _activeSynapseHaloMat = new THREE.MeshBasicMaterial({
  color: initialAccent.activeCore,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const _activeSynapseDashShaderMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: globalUniforms.uTime,
    uColor: {
      value: new THREE.Color(initialAccent.activeBorder),
    },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      // Hızlı, güçlü ve belirgin nöral elektrik akışı
      float speed = 4.2;
      float segments = 16.0;
      float stream = fract(vUv.x * segments - uTime * speed);

      // Daha dolgun çizgi oranı
      float dash = smoothstep(0.0, 0.05, stream) * (1.0 - smoothstep(0.42, 0.52, stream));

      if (dash < 0.01) discard;

      vec3 coreWhite = vec3(1.0, 1.0, 1.0);
      vec3 electricColor = mix(uColor, coreWhite, pow(dash, 1.4) * 0.9);

      gl_FragColor = vec4(electricColor, dash * 1.0);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
})

const _activeOrbGlowMat = new THREE.MeshBasicMaterial({
  color: initialAccent.activeBorder,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const _activeOrbCoronaMat = new THREE.MeshBasicMaterial({
  color: initialAccent.activeCore,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const _synapseMaterialCache = new Map()

// |affinity| değerleri çoğunlukla 0.5–1 bandında toplandığından, bu banttaki
// görsel farkı belirginleştirmek için kontrast genişletilir (0.5 → 0.2, 1 → 1.0).
function affinityVisualWeight(absAff) {
  if (absAff <= 0.5) return absAff * 0.4
  return 0.2 + (absAff - 0.5) * 1.6
}

// Relationship strength (0..2, başlangıç 1.0) → 0..1 görsel ağırlık
function strengthVisualWeight(strength) {
  const s = typeof strength === 'number' && Number.isFinite(strength) ? strength : 1.0
  return Math.min(1, Math.max(0, s / 2))
}

// Kenar parlaklığı: affinity (A) ve relationship strength (S) birleşimi.
// A görsel olarak baskın, S destekleyici katkı sağlar.
function combinedSynapseWeight(absAff, strength) {
  const affWeight = affinityVisualWeight(absAff)
  const strWeight = strengthVisualWeight(strength)
  return Math.min(1, affWeight * 0.65 + strWeight * 0.35)
}

// İlişki değeri kısa formatı: 0.8, -0.75, 1.25
function formatRelValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return String(Number(value.toFixed(2)))
}

// Kenar etiketi: OPPOSES (A:0.8)(S:1.2) — A: affinity, S: relationship strength
function buildRelationshipLabel(relType, affinity, strength) {
  const parts = []
  const a = formatRelValue(affinity)
  const s = formatRelValue(strength)
  if (a != null) parts.push(`(A:${a})`)
  if (s != null) parts.push(`(S:${s})`)
  return parts.length > 0 ? `${relType} ${parts.join('')}` : relType
}

function getSynapseMaterials(affinity, strength, isRecalled, isDark, accent) {
  const rawAff = typeof affinity === 'number' ? affinity : 0.0
  const absAff = Math.min(1.0, Math.max(0.0, Math.abs(rawAff)))
  const weight = combinedSynapseWeight(absAff, strength)
  const tier = Math.round(weight * 10)
  const key = `${isRecalled ? 'rec_' : ''}t${tier}_${isDark ? 'dark' : 'light'}_${accent.activeCore}`

  if (_synapseMaterialCache.has(key)) {
    return _synapseMaterialCache.get(key)
  }

  // Renk işarete göre değişmez; parlaklık yalnızca |affinity| ile ölçeklenir.
  let coreColorHex, haloColorHex, trackColorHex
  if (absAff > 0.15) {
    coreColorHex = accent.activeCore
    haloColorHex = accent.activeGlow
    trackColorHex = isDark ? accent.deepMid : accent.activeCore
  } else {
    coreColorHex = isDark ? accent.trackDark : accent.trackLight
    haloColorHex = accent.activeGlow
    trackColorHex = isDark ? accent.trackDark : accent.trackLight
  }

  const haloOpacity = isRecalled ? (isDark ? 0.75 : 0.55) : 0.1 + weight * 0.65

  const trackOpacity = isRecalled ? (isDark ? 0.9 : 0.8) : 0.22 + weight * 0.68

  const haloMat = new THREE.MeshBasicMaterial({
    color: haloColorHex,
    transparent: true,
    opacity: haloOpacity,
    blending: isDark || isRecalled ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  })

  const trackMat = new THREE.MeshBasicMaterial({
    color: trackColorHex,
    transparent: true,
    opacity: trackOpacity,
    depthWrite: false,
  })

  const dashMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: globalUniforms.uTime,
      uColor: { value: new THREE.Color(coreColorHex) },
      uSpeedMultiplier: { value: 1.0 + weight * 1.1 },
      uIntensity: { value: 0.35 + weight * 1.05 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uSpeedMultiplier;
      uniform float uIntensity;
      varying vec2 vUv;

      void main() {
        float speed = 3.2 * uSpeedMultiplier;
        float segments = 22.0;
        float stream = fract(vUv.x * segments - uTime * speed);
        float dash = smoothstep(0.0, 0.06, stream) * (1.0 - smoothstep(0.28, 0.35, stream));

        if (dash < 0.02) discard;

        vec3 coreWhite = vec3(1.0, 1.0, 1.0);
        vec3 electricColor = mix(uColor, coreWhite, pow(dash, 1.6) * 0.8);

        gl_FragColor = vec4(electricColor, min(1.0, dash * uIntensity * 1.3));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const mats = {
    haloMat,
    trackMat,
    dashMat,
    orbGlowColor: absAff > 0.15 ? accent.activeCore : trackColorHex,
    orbCoronaColor: absAff > 0.15 ? accent.activeGlow : haloColorHex,
  }

  _synapseMaterialCache.set(key, mats)
  return mats
}

const linkLabelCache = new Map()

function buildCapillaryObject(link) {
  const g = new THREE.Group()
  g.userData._built = false

  if (link && link.name && !link.isCoreLink) {
    // Sadece recalled (anımsanan) nodelar arasındaki bağlantılar ve etiketleri vurgulanır
    // Core bağları (kök ↔ Core) etiketsiz çizilir; küme torba ile temsil edilir.
    const isRecalled = Boolean(
      link?.isRecalled || (link?.source?.isActive && link?.target?.isActive)
    )
    const { isGreenMode, customColor, isDarkMode } = useThemeStore.getState()
    const accent = deriveAccentPalette({ isGreenMode, customColor })
    const isDark = typeof useThemeStore !== 'undefined' ? isDarkMode : true
    const cacheKey = `${link.name}_${accent.base}_${isRecalled}_${isDark ? 'dark' : 'light'}`
    if (!linkLabelCache.has(cacheKey)) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.font = 'bold 44px Inter, sans-serif'
      const textWidth = ctx.measureText(link.name).width

      const rectWidth = Math.max(180, textWidth + 90)
      canvas.width = rectWidth + 24
      canvas.height = 96

      if (isDark) {
        if (isRecalled) {
          // Koyu Tema Recalled: Parlayan neon hap, elektrik gradyan ve beyaz yazı
          ctx.shadowColor = accent.shadowDark
          ctx.shadowBlur = 24
          ctx.shadowOffsetY = 0

          const bgGrad = ctx.createLinearGradient(12, 12, rectWidth + 12, 84)
          bgGrad.addColorStop(0, accent.darkBgStart)
          bgGrad.addColorStop(1, accent.darkBgEnd)
          ctx.fillStyle = bgGrad
        } else {
          ctx.fillStyle = 'rgba(10, 15, 25, 0.9)'
        }
        ctx.beginPath()
        ctx.roundRect(12, 12, rectWidth, 72, 18)
        ctx.fill()
        ctx.shadowColor = 'transparent'

        ctx.strokeStyle = isRecalled ? accent.activeCore : accent.activeGlow
        ctx.lineWidth = isRecalled ? 4.5 : 3
        ctx.stroke()

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = 'bold 44px Inter, sans-serif'
        ctx.fillStyle = isRecalled ? '#ffffff' : accent.light
        ctx.fillText(link.name, canvas.width / 2, 48)
      } else {
        // Modern Açık Tema
        if (isRecalled) {
          // Vurgulu Recalled Anı Bağlantısı: Zengin, canlı elektrik mavi/yeşil gradyan, parlak rim, saf beyaz yazı
          ctx.shadowColor = accent.shadowLight
          ctx.shadowBlur = 22
          ctx.shadowOffsetY = 4

          const bgGrad = ctx.createLinearGradient(12, 12, rectWidth + 12, 84)
          bgGrad.addColorStop(0, accent.lightBgStart)
          bgGrad.addColorStop(1, accent.lightBgEnd)
          ctx.fillStyle = bgGrad
          ctx.beginPath()
          ctx.roundRect(12, 12, rectWidth, 72, 18)
          ctx.fill()
          ctx.shadowColor = 'transparent'

          ctx.strokeStyle = accent.activeBorder
          ctx.lineWidth = 4.5
          ctx.stroke()

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = 'bold 44px Inter, sans-serif'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(link.name, canvas.width / 2, 48)
        } else {
          // Normal bağlantı: Sade, modern nötr beyaz kart, sakin tipografi
          ctx.shadowColor = 'rgba(15, 23, 42, 0.08)'
          ctx.shadowBlur = 10
          ctx.shadowOffsetY = 2
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.beginPath()
          ctx.roundRect(12, 12, rectWidth, 72, 18)
          ctx.fill()
          ctx.shadowColor = 'transparent'

          ctx.strokeStyle = 'rgba(203, 213, 225, 0.95)'
          ctx.lineWidth = 2.2
          ctx.stroke()

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = 'bold 42px Inter, sans-serif'
          ctx.fillStyle = '#475569'
          ctx.fillText(link.name, canvas.width / 2, 48)
        }
      }

      const tex = new THREE.CanvasTexture(canvas)
      tex.minFilter = THREE.LinearFilter

      const labelMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })

      const scaleX = (canvas.width / 400) * 44
      linkLabelCache.set(cacheKey, { mat: labelMat, width: scaleX })
    }

    const { mat, width } = linkLabelCache.get(cacheKey)
    const baseScale = isRecalled ? 2.5 : 2.05 // Recalled bağlantı blokçuğu belirgin şekilde daha büyük ve vurgulu
    const labelGeo = new THREE.PlaneGeometry(width * baseScale, 9.6 * baseScale)
    const labelMesh = new THREE.Mesh(labelGeo, mat)

    labelMesh.renderOrder = isRecalled ? 9999999 : 9999998
    labelMesh.userData = { isLinkLabel: true, link: link }
    labelMesh.visible = !mindViewFlags.hideLinkLabels

    labelMesh.onBeforeRender = function (renderer, scene, camera) {
      this.quaternion.copy(camera.quaternion)
    }

    g.add(labelMesh)
  }

  return g
}

// Kademeli render: simülasyon 100 tick boyunca çalışır, ancak düğüm + tüp
// yalnızca belirlenen checkpoint tick'lerinde ekrana çizilir. Ara tick'lerde
// nodePositionUpdate true döner (pozisyon güncellenmez), linkPositionUpdate
// atlanır. Motor durduğunda her şey son kez tam kalitede çizilir.
let _tickCount = 0
let _engineRunning = true
let _dragging = false
// Lazy mod: yalnızca ilk oluşum simülasyonu bitene kadar nesneler gizlenir.
let _initialSimDone = false
const RENDER_CHECKPOINTS = new Set([
  2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50,
  52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98,
  100,
])

// Temiz, organik kavisli sinaps hattı ve seyahat eden darbe küresi oluşturucu (MindAmbience stili)
function updateCapillaryPosition(obj, { start, end }, link) {
  // Lazy mod: ilk oluşum simülasyonu bitene kadar bağlantıları tamamen gizle.
  if (mindViewFlags.lazyRender && !_initialSimDone && !_dragging) {
    obj.visible = false
    return true
  }
  obj.visible = true
  // Kademeli render: checkpoint değilse ve motor çalışıyorsa tüp geometrisini atla.
  // Drag sırasında her tick güncelle (düğümü takip etsin).
  if (_engineRunning && !_dragging && !RENDER_CHECKPOINTS.has(_tickCount)) {
    return true
  }
  let sv = new THREE.Vector3(start.x, start.y, start.z)
  let ev = new THREE.Vector3(end.x, end.y, end.z)

  // Torba bağları (kök ↔ torba dışı düğüm): hat, torba yüzeyinden başlar/biter
  if (link?.isBagLink) {
    const rootNode = link.source?.isRoot ? link.source : link.target?.isRoot ? link.target : null
    const otherNode = rootNode === link.source ? link.target : link.source
    if (rootNode && otherNode) {
      const rootV = new THREE.Vector3(rootNode.x || 0, rootNode.y || 0, rootNode.z || 0)
      const otherV = new THREE.Vector3(otherNode.x || 0, otherNode.y || 0, otherNode.z || 0)
      const dir = new THREE.Vector3().subVectors(otherV, rootV)
      const bagRadius = rootNode.bagRadius ?? BAG_RADIUS
      if (dir.length() > bagRadius) {
        dir.normalize()
        const surface = rootV.clone().addScaledVector(dir, bagRadius)
        if (link.source?.isRoot) sv = surface
        else ev = surface
      }
    }
  }

  const len = sv.distanceTo(ev)
  if (len < 1) return true

  const isRecalled = Boolean(link?.isRecalled || (link?.source?.isActive && link?.target?.isActive))

  const rawAff = typeof link?.affinity === 'number' ? link.affinity : 0.0
  const absAff = Math.min(1.0, Math.max(0.0, Math.abs(rawAff)))
  const rawStrength = typeof link?.strength === 'number' ? link.strength : 1.0
  const weight = combinedSynapseWeight(absAff, rawStrength)

  // Pozisyon cache — gereksiz yeniden çizimi önle
  const posKey = `${start.x.toFixed(0)},${start.y.toFixed(0)},${start.z?.toFixed(0) || 0},${end.x.toFixed(0)},${end.y.toFixed(0)},${end.z?.toFixed(0) || 0}_${isRecalled}_${rawAff.toFixed(1)}_${rawStrength.toFixed(2)}`
  if (obj.userData._posKey === posKey) return true
  obj.userData._posKey = posKey
  obj.userData.isRecalled = isRecalled
  obj.userData.synapseWeight = weight

  // Organik kavis için yay (MindAmbience beziere eğrisi gibi dışa doğru kavisli kubbe)
  const mid = new THREE.Vector3().addVectors(sv, ev).multiplyScalar(0.5)
  const dir = new THREE.Vector3().subVectors(ev, sv)
  const dirNorm = dir.clone().normalize()

  // Merkezden dışa doğru radyal yayılma vektörü
  const radial = mid.clone().normalize()
  const dot = radial.dot(dirNorm)
  const perp = radial.sub(dirNorm.clone().multiplyScalar(dot)).normalize()

  // Radyal yön hat doğrultusuna paralel kalırsa (ör. kök merkezli bağlar)
  // perp sıfıra yakın çıkıp NaN üretebilir; dirNorm'a dik güvenli bir vektöre düş.
  if (!Number.isFinite(perp.x) || !Number.isFinite(perp.y) || !Number.isFinite(perp.z) || perp.lengthSq() < 1e-6) {
    const ref = Math.abs(dirNorm.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    perp.copy(new THREE.Vector3().crossVectors(dirNorm, ref).normalize())
  }

  // Paralel bağlar (aynı iki düğüm arasında birden fazla ilişki) için yelpaze:
  // her bağ, hat ekseni (dirNorm) etrafında farklı açıyla döndürülerek ayrı yöne kavislenir.
  const parallelCount = Number(link?.parallelCount) || 1
  const parallelIndex = Number(link?.parallelIndex) || 0
  if (parallelCount > 1) {
    const spread = THREE.MathUtils.degToRad(18)
    const fanAngle = (parallelIndex - (parallelCount - 1) / 2) * spread
    perp.applyAxisAngle(dirNorm, fanAngle)
  }

  // Tohum değerine göre kavis yönü ve dış bükey kubbe eğimi
  const seedVal = strHash(link?.id || link?.name || 'seed')
  const bowAmount = Math.min(len * 0.16, 42)
  mid.addScaledVector(perp, bowAmount)

  const curve = new THREE.QuadraticBezierCurve3(sv, mid, ev)
  obj.userData.curve = curve
  obj.userData.seed = (seedVal % 1000) / 1000

  // Önceki geometrileri temizle, ancak etiket ve orb'u koru
  const toRemove = []
  obj.children.forEach((c) => {
    if (c.userData && (c.userData.isLinkLabel || c.userData.isPulseOrb)) {
      if (c.userData.isLinkLabel) {
        c.position.copy(curve.getPoint(0.5))
        c.position.y += 6
      }
    } else {
      c.geometry?.dispose()
      toRemove.push(c)
    }
  })
  toRemove.forEach((c) => obj.remove(c))

  const { isGreenMode, customColor, isDarkMode } = useThemeStore.getState()
  const accent = deriveAccentPalette({ isGreenMode, customColor })
  const mats = getSynapseMaterials(rawAff, rawStrength, isRecalled, isDarkMode, accent)

  const intensity = isRecalled ? Math.max(0.7, weight) : weight

  // 1. Dış yumuşak ışıma kılıfı (Halo - MindAmbience filter="url(#synapseGlow)" stili)
  const haloRadius = isRecalled ? 3.6 : 1.4 + intensity * 2.8
  const haloGeo = new THREE.TubeGeometry(curve, 28, haloRadius, 8, false)
  const haloMesh = new THREE.Mesh(haloGeo, mats.haloMat)
  haloMesh.renderOrder = isRecalled ? -980 : -1000
  obj.add(haloMesh)

  // 2. Akıcı nöral kesikli çizgi tüpü (MindAmbience strokeDasharray="6 14" akışı)
  const dashRadius = isRecalled ? 1.6 : 0.65 + intensity * 1.2
  const dashGeo = new THREE.TubeGeometry(curve, 36, dashRadius, 8, false)
  const dashMesh = new THREE.Mesh(dashGeo, mats.dashMat)
  dashMesh.renderOrder = isRecalled ? -979 : -999
  obj.add(dashMesh)

  // 3. İç ana omurga yolu (Base track - MindAmbience stroke="var(--color-border)")
  const trackRadius = isRecalled ? 0.95 : 0.38 + intensity * 0.75
  const trackGeo = new THREE.TubeGeometry(curve, 28, trackRadius, 8, false)
  const trackMesh = new THREE.Mesh(trackGeo, mats.trackMat)
  trackMesh.renderOrder = isRecalled ? -978 : -998
  obj.add(trackMesh)

  // 4. Hat boyunca seyahat eden parıltılı enerji küresi (Pulse Orb - MindAmbience <circle> darbesi)
  let pulseOrb = obj.children.find((c) => c.userData && c.userData.isPulseOrb)
  if (!pulseOrb) {
    pulseOrb = new THREE.Group()
    pulseOrb.userData = { isPulseOrb: true }
    // Beyaz-sıcak parlak çekirdek
    const innerRadius = isRecalled ? 2.4 : 1.4 + intensity * 1.0
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(innerRadius, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    )
    // Renkli parıldayan yoğun neon iç hale
    const outerRadius = isRecalled ? 6.2 : 3.6 + intensity * 2.6
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(outerRadius, 16, 16),
      new THREE.MeshBasicMaterial({
        color: mats.orbGlowColor,
        transparent: true,
        opacity: isRecalled ? 0.95 : 0.42 + weight * 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    // Geniş eterik dış korona
    const coronaRadius = isRecalled ? 10.5 : 6.0 + intensity * 4.5
    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(coronaRadius, 14, 14),
      new THREE.MeshBasicMaterial({
        color: mats.orbCoronaColor,
        transparent: true,
        opacity: isRecalled ? 0.5 : 0.14 + weight * 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    pulseOrb.add(inner)
    pulseOrb.add(outer)
    pulseOrb.add(corona)
    pulseOrb.renderOrder = isRecalled ? -970 : -990
    obj.add(pulseOrb)
  }
  obj.userData.pulseOrb = pulseOrb
  // Kademeli render (simülasyon) ve drag sırasında ışık hüzmeleri görünmesin
  pulseOrb.visible = !(_engineRunning || _dragging)
  pulseOrb.position.copy(curve.getPoint(0))

  return true
}

// TopBar yüksekliği — CSS değişkeninden okunuyor
const TOPBAR_HEIGHT = 'var(--topbar-height)'

function NodeDetailPanel({ node, onClose, isTribeContext = false, relationships = [], onNavigate }) {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeStore()
  const isRoot = node.label === 'Persona' || (node.label === 'Tribe' && node.isRoot)
  const { core, glow } = getNeuronColor(node.label, isRoot)

  const relChipStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: isDarkMode ? '#cbd5e1' : '#374151',
    background: 'transparent',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(59, 130, 246, 0.25)',
    borderRadius: 999,
    padding: '1px 7px',
    flexShrink: 0,
  }

  const visibleEntries = Object.entries(node).filter(([key, value]) => {
    if (
      [
        'id',
        'x',
        'y',
        'z',
        'vx',
        'vy',
        'vz',
        'fx',
        'fy',
        'fz',
        'index',
        'name',
        'label',
        'val',
        'color',
        'isRoot',
        'isCore',
        'embedding',
        '__indexColor',
        '__threeObj',
        'isActive',
        'isTribeContext',
      ].includes(key) ||
      typeof value === 'object'
    )
      return false
    return true
  })

  return (
    <div
      className="mind-node-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.58)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 'calc(var(--topbar-height, 112px) + 16px)',
        paddingBottom: '16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        className="mind-node-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: isDarkMode ? 'rgba(9, 9, 11, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(36px)',
          WebkitBackdropFilter: 'blur(36px)',
          border: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.12)',
          borderTop: `4px solid ${core}`,
          borderRadius: 20,
          boxShadow: isDarkMode
            ? '0 24px 64px rgba(0, 0, 0, 0.85)'
            : '0 24px 64px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          fontFamily: 'Inter, sans-serif',
          color: isDarkMode ? '#f8fafc' : '#111827',
        }}
      >
        {/* Modal Başlığı */}
        <div
          className="mind-node-panel-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '22px 24px 18px 24px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: core,
                boxShadow: `0 0 16px ${glow}`,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  color: core,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {getNodeLabelText(node.label, isRoot, isTribeContext)}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  marginTop: 2,
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                }}
              >
                {node.name || t('mind.unknown_node', 'Unknown Node')}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Kapat')}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: isDarkMode ? '#fff' : '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: 12,
              transition: 'background 0.15s ease',
            }}
          >
            ✕
          </button>
        </div>

        {/* Kaydırılabilir İçerik */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            margin: '16px 24px 20px',
            padding: '4px 4px 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {visibleEntries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 12px',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)',
                fontSize: 13,
              }}
            >
              {t('mind.no_extra_props', 'Bu düğüm için ek özellik bulunmuyor.')}
            </div>
          ) : (
            <div>
              {visibleEntries.map(([key, value]) => {
                const Icon = key === 'lastUpdated' ? CalendarFold : key === 'description' ? BookOpen : null
                const label =
                  key === 'lastUpdated'
                    ? t('card.updated_at', 'Updated At')
                    : key === 'description'
                      ? t('mind.description', 'Açıklama')
                      : key
                const displayValue =
                  key === 'lastUpdated' && typeof value === 'number'
                    ? new Date(value).toLocaleString()
                    : String(value)
                return (
                  <div key={key} className="card-detail-row">
                    <div className="card-detail-row__label">
                      {Icon && <Icon size={14} className="card-detail-row__icon" style={{ flexShrink: 0 }} />}
                      <span>{label}</span>
                    </div>
                    <div className={`card-detail-row__value${key === 'description' ? ' is-multiline' : ''}`}>
                      {displayValue}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* İlişkiler: bu düğüme bağlı kenarlar + A (affinity) / S (strength) değerleri */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: core,
                marginBottom: 8,
              }}
            >
              {t('mind.relationships', 'Relationships')} · {relationships.length}
            </div>
            {relationships.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)',
                }}
              >
                {t('mind.no_relationships', 'No relationships.')}
              </div>
            ) : (
              relationships.map((rel) => {
                const { core: relDot } = getNeuronColor(rel.otherLabel, rel.otherIsRoot)
                const aff = formatRelValue(rel.affinity)
                const str = formatRelValue(rel.strength)
                return (
                  <div
                    key={rel.key}
                    className="mind-rel-row"
                    style={{
                      background: 'transparent',
                      border: isDarkMode
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: 10,
                      padding: '9px 12px',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="mind-rel-type"
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: core,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {rel.relType}
                    </span>
                    <span style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      {aff != null && <span style={relChipStyle}>Affinity:{aff}</span>}
                      {str != null && <span style={relChipStyle}>Strength:{str}</span>}
                    </span>
                    <span
                      className="mind-rel-target"
                      role={onNavigate ? 'button' : undefined}
                      tabIndex={onNavigate ? 0 : undefined}
                      style={{ cursor: onNavigate ? 'pointer' : undefined }}
                      onClick={
                        onNavigate
                          ? (e) => {
                              e.stopPropagation()
                              onNavigate(rel.otherId)
                            }
                          : undefined
                      }
                      onKeyDown={
                        onNavigate
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                onNavigate(rel.otherId)
                              }
                            }
                          : undefined
                      }
                    >
                      {rel.direction === 'out' ? (
                        <ArrowRight size={13} strokeWidth={2.2} style={{ opacity: 0.65, flexShrink: 0 }} />
                      ) : (
                        <ArrowLeft size={13} strokeWidth={2.2} style={{ opacity: 0.65, flexShrink: 0 }} />
                      )}
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: relDot,
                          boxShadow: `0 0 6px ${relDot}`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rel.otherName}
                      </span>
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// PC görünüm anahtarı: küçük, seçilebilir (checkbox benzeri) toggle butonu
function MindToggle({ active, onClick, label, icon, shortLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        height: 26,
        padding: '0 8px',
        borderRadius: 7,
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#ffffff' : 'var(--color-text-secondary)',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        flexShrink: 0,
      }}
    >
      {icon}
      <span className="mind-toggle-label">{label}</span>
      {shortLabel ? <span className="mind-toggle-label-short">{shortLabel}</span> : null}
    </button>
  )
}

// Legend tıklama filtresi: seçilen düğüm tipi dışındaki her şey görünmez olur
const GRAPH_TYPE_MATCHERS = {
  recalled: (n) => Boolean(n.isActive),
  root: (n) => Boolean(n.isRoot),
  core: (n) => n.label === 'Core',
  tribe: (n) => n.label === 'Tribe' && !n.isRoot,
  person: (n) => n.label === 'Actor' || n.label === 'User' || n.label === 'Bot',
  thought: (n) =>
    n.label === 'GeneralThought' ||
    n.label === 'Topic' ||
    n.label === 'Concept' ||
    n.label === 'Thought',
}

export default function MindPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const actorId = searchParams.get('actorId')
  const tribeId = searchParams.get('tribeId')
  const focusNodeParam = searchParams.get('focusNode')
  const queryName =
    searchParams.get('name') || location.state?.name || location.state?.profileName || null
  const contextTitle =
    searchParams.get('contextTitle') ||
    searchParams.get('title') ||
    location.state?.contextTitle ||
    location.state?.title ||
    location.state?.proposition ||
    null

  // Comma-separated Neo4j node UUIDs to highlight (directly from searchParams)
  const highlightIds = useMemo(() => {
    const raw = searchParams.get('highlightIds') || ''
    return new Set(
      raw
        ? raw
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : []
    )
  }, [searchParams])
  const navigate = useNavigate()

  const { data: profileData } = useQuery({
    queryKey: ['mindProfile', actorId ? 'actor' : 'tribe', actorId || tribeId],
    queryFn: async () => {
      const res = actorId ? await actorApi.getProfile(actorId) : await tribeApi.getTribe(tribeId)
      if (res?.data?.succeeded) {
        return res.data.data
      }
      return null
    },
    enabled: Boolean(actorId || tribeId),
  })

  const rootName =
    profileData?.profileName || profileData?.tribeName || profileData?.name || queryName || ''

  const {
    data: rawData = [],
    isLoading,
    isError,
    error: memoryError,
  } = useQuery({
    queryKey: ['mindMemory', actorId ? 'actor' : 'tribe', actorId || tribeId],
    queryFn: async () => {
      const res = actorId
        ? await actorApi.getFullMemory(actorId)
        : await tribeApi.getFullMemory(tribeId)
      if (res?.data?.succeeded) {
        if (!res.data.data) return []
        try {
          return JSON.parse(res.data.data)
        } catch (e) {
          console.error('Failed to parse neo4j output:', e)
          throw new Error(t('mind.parse_error', 'Failed to parse memory data.'))
        }
      }
      throw new Error(
        res?.data?.errors?.[0]?.description || t('mind.fetch_error', 'Failed to fetch memory.')
      )
    },
    enabled: Boolean(actorId || tribeId),
  })

  const isGreenMode = useThemeStore((s) => s.isGreenMode)
  const isDarkMode = useThemeStore((s) => s.isDarkMode)
  const customColor = useThemeStore((s) => s.customColor)
  const accent = useMemo(
    () => deriveAccentPalette({ isGreenMode, customColor }),
    [isGreenMode, customColor]
  )

  const bgColor = isDarkMode ? '#09090b' : '#f8fafc'
  const headerBg = isDarkMode ? 'rgba(9, 9, 11, 0.85)' : 'rgba(255, 255, 255, 0.88)'
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'

  useEffect(() => {
    linkLabelCache.clear()
    nodeTextureCache.clear()
    nodeBadgeCache.clear()
    _synapseMaterialCache.clear()
    const dark = isDarkMode

    // Omurga yolu: Koyu temada koyu tonlar, Açık temada soft modern gri/zümrüt
    _synapseTrackMat.color.set(dark ? accent.trackDark : accent.trackLight)
    _synapseTrackMat.opacity = dark ? 0.4 : 0.65

    // Dış hale materyali: Koyu temada Additive, Açık temada NormalBlending
    _synapseHaloMat.color.set(accent.activeGlow)
    _synapseHaloMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    _synapseHaloMat.opacity = dark ? (isGreenMode ? 0.18 : 0.15) : 0.24
    _synapseHaloMat.needsUpdate = true

    // Dolaşan orblar
    _orbGlowMat.color.set(dark ? accent.activeCore : accent.deepMid)
    _orbGlowMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    _orbGlowMat.needsUpdate = true

    _orbCoronaMat.color.set(accent.activeGlow)
    _orbCoronaMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    _orbCoronaMat.needsUpdate = true

    // Aktif recalled bağlantı materyalleri
    _activeSynapseTrackMat.color.set(dark ? accent.deepMid : accent.activeCore)
    _activeSynapseTrackMat.opacity = dark ? 0.6 : 0.75

    _activeSynapseHaloMat.color.set(accent.activeCore)
    _activeSynapseHaloMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    _activeSynapseHaloMat.needsUpdate = true

    _activeOrbGlowMat.color.set(dark ? accent.activeBorder : accent.activeGlow)
    _activeOrbGlowMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    _activeOrbGlowMat.needsUpdate = true

    _activeOrbCoronaMat.color.set(accent.activeCore)
    _activeOrbCoronaMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    _activeOrbCoronaMat.needsUpdate = true

    if (_synapseDashShaderMat.uniforms.uColor) {
      _synapseDashShaderMat.uniforms.uColor.value.set(dark ? accent.activeCore : accent.deepMid)
      _synapseDashShaderMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
      _synapseDashShaderMat.needsUpdate = true
    }
    if (_activeSynapseDashShaderMat.uniforms.uColor) {
      _activeSynapseDashShaderMat.uniforms.uColor.value.set(
        dark ? accent.activeBorder : accent.activeDashLight
      )
      _activeSynapseDashShaderMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
      _activeSynapseDashShaderMat.needsUpdate = true
    }

    globalUniforms.uPulseColor.value.set(...accent.pulseRgb)
    if (fgRef.current && typeof fgRef.current.refresh === 'function') {
      fgRef.current.refresh()
    }
  }, [accent, isDarkMode, isGreenMode])

  const [selectedNode, setSelectedNode] = useState(null)
  // Legend tip filtresi: null → tümü görünür; seçili tip dışındakiler gizlenir
  const [graphTypeFilter, setGraphTypeFilter] = useState(null)
  const [nodeSearch, setNodeSearch] = useState('')
  // Anılar paneli filtre durumu: düğüm tipi çipleri + sıralama
  const [memFilterOpen, setMemFilterOpen] = useState(false)
  const [memNodeTypes, setMemNodeTypes] = useState(() => new Set())
  const [memSortBy, setMemSortBy] = useState('')
  const memFilterRef = useRef(null)
  const [isNodeListCollapsed, setIsNodeListCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  )

  // PC/mobil görünüm anahtarları: bağlantı/düğüm etiketlerini gizle, ağı kilitle.
  // Değerler localStorage'da saklanır (mind page için kalıcı). Kayıt yoksa null
  // kalır; geçerli varsayılanlar aşağıdaki "effective" değerlerle belirlenir ve
  // kullanıcı değiştirene kadar tarayıcıya yazılmaz.
  const [hideLinkLabels, setHideLinkLabels] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem('mindView.hideLinkLabels')
    return raw === null ? null : raw === '1'
  })
  const [hideNodeLabels, setHideNodeLabels] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem('mindView.hideNodeLabels')
    return raw === null ? null : raw === '1'
  })
  const [lockGraph, setLockGraph] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem('mindView.lockGraph')
    return raw === null ? null : raw === '1'
  })
  const [lazyRender, setLazyRender] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem('mindView.lazyRender')
    return raw === null ? null : raw === '1'
  })
  // Lazy modda fizik tamamlanana kadar aynı yükleme göstergesi gösterilir.
  const [initialPhysicsDone, setInitialPhysicsDone] = useState(false)
  const [spacingSetting, setSpacingSetting] = useState(() => {
    const raw =
      typeof window !== 'undefined' ? window.localStorage.getItem('mindView.spacingSetting') : null
    return SPACING_OPTIONS.includes(raw) ? raw : null
  })

  // İlk giriş varsayılanları: düğüm yazıları açık, ağ kilitli, aralık otomatik.
  const effectiveHideNodeLabels = hideNodeLabels ?? false
  const effectiveLockGraph = lockGraph ?? true
  const effectiveSpacingSetting = spacingSetting ?? 'auto'
  const effectiveLazyRender = lazyRender ?? true
  // Mobilde yatay kaydırılabilen görünüm anahtarları için kaydıraç durumu
  const viewTogglesRef = useRef(null)
  const [viewScroll, setViewScroll] = useState({ scrollable: false, left: 0, width: 100 })
  // Mobilde yatay kaydırılabilen legend (Recalled/Persona/...) için kaydıraç durumu
  const legendItemsRef = useRef(null)
  const [legendScroll, setLegendScroll] = useState({ scrollable: false, left: 0, width: 100 })

  // Kullanıcı bir anahtarı değiştirdiğinde (null değilken) localStorage'a yaz.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (hideLinkLabels !== null)
      window.localStorage.setItem('mindView.hideLinkLabels', hideLinkLabels ? '1' : '0')
    if (hideNodeLabels !== null)
      window.localStorage.setItem('mindView.hideNodeLabels', hideNodeLabels ? '1' : '0')
    if (lockGraph !== null)
      window.localStorage.setItem('mindView.lockGraph', lockGraph ? '1' : '0')
    if (lazyRender !== null)
      window.localStorage.setItem('mindView.lazyRender', lazyRender ? '1' : '0')
    if (spacingSetting !== null)
      window.localStorage.setItem('mindView.spacingSetting', spacingSetting)
  }, [hideLinkLabels, hideNodeLabels, lockGraph, lazyRender, spacingSetting])

  const fgRef = useRef()
  const containerRef = useRef()
  const memBtnRef = useRef(null)
  const isInitialZoomRef = useRef(true)
  const initialSimDoneRef = useRef(false)
  const hoveredLinkRef = useRef(null)
  const selectedLinkRef = useRef(null)
  const selectedNodeRef = useRef(null)
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? Math.max(400, window.innerHeight - 56) : 800,
  }))
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobileScreen = windowWidth <= 768

  // Ağı kilitle: kütüphanede enableNodeDrag triggerUpdate:false olduğundan prop
  // değişimi drag kontrollerini yeniden kurmaz. lockGraph değişince graphData
  // referansını tazeleriz ki enableNodeDrag yeni değeriyle drag kontrolleri
  // yeniden kurulsun. Re-init sırasında cooldownTicks=0 (cooldownOverride) ile
  // motor anında durur; geçiş görünmez olur, düğümler oynar/sıçramaz.
  // Node nesneleri aynı kaldığından konumlar korunur.
  const [fgRefreshKey, setFgRefreshKey] = useState(0)
  const [cooldownOverride, setCooldownOverride] = useState(null)
  const cooldownOverrideTimerRef = useRef(null)
  const lockInitRef = useRef(true)
  useEffect(() => {
    if (lockInitRef.current) {
      lockInitRef.current = false
      return
    }
    // Düğümleri sabitle / serbest bırak
    const fg = fgRef.current
    if (fg && typeof fg.graphData === 'function') {
      const nodes = fg.graphData()?.nodes
      if (nodes) {
        for (const n of nodes) {
          if (effectiveLockGraph) {
            n.fx = n.x
            n.fy = n.y
            n.fz = n.z
          } else {
            n.fx = undefined
            n.fy = undefined
            n.fz = undefined
          }
        }
      }
    }
    // Re-init motoru yeniden ısıtır; geçiş sırasında motorun koşmasını engelle
    setCooldownOverride(0)
    if (cooldownOverrideTimerRef.current) clearTimeout(cooldownOverrideTimerRef.current)
    cooldownOverrideTimerRef.current = setTimeout(() => setCooldownOverride(null), 150)
    setFgRefreshKey((k) => k + 1)
  }, [effectiveLockGraph])

  useEffect(() => () => clearTimeout(cooldownOverrideTimerRef.current), [])

  // Mobilde yatay kaydırılabilen görünüm anahtarları: kaydıraç konumunu takip et
  useEffect(
    () => attachHorizontalScroll(viewTogglesRef.current, setViewScroll),
    [effectiveSpacingSetting]
  )

  // Mobilde legend (Recalled/Persona/Core/Tribe/Person/Thought) yatay kaydırma göstergesi
  useEffect(() => attachHorizontalScroll(legendItemsRef.current, setLegendScroll), [])

  // Anılar paneli filtre dropdown'ı: dış tıklamada kapat
  useEffect(() => {
    const handler = (e) => {
      if (memFilterRef.current && !memFilterRef.current.contains(e.target)) {
        setMemFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Mobilde "Anılar" paneli butonun hemen altında açılsın (container'a göre üst offset)
  const [memPanelTop, setMemPanelTop] = useState(null)

  useEffect(() => {
    selectedNodeRef.current = selectedNode
  }, [selectedNode])

  useEffect(() => {
    if (isNodeListCollapsed) return undefined
    const compute = () => {
      const btn = memBtnRef.current
      const cont = containerRef.current
      if (!btn || !cont || window.innerWidth > 900) {
        setMemPanelTop(null)
        return
      }
      const btnRect = btn.getBoundingClientRect()
      const contRect = cont.getBoundingClientRect()
      setMemPanelTop(Math.round(btnRect.bottom - contRect.top + 3))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [isNodeListCollapsed])

  // Shader'lar için global zaman sayacı ve animasyonlar
  useEffect(() => {
    let frameId
    const startTime = Date.now()
    const updateTime = () => {
      const nowSec = (Date.now() - startTime) / 1000
      globalUniforms.uTime.value = nowSec

      // Persona süzülme, haleler, seyahat eden sinaps orbları ve etiketler
      if (fgRef.current) {
        const scene = fgRef.current.scene()
        scene.traverse((obj) => {
          if (obj.userData && obj.userData.isVisualGroup) {
            const speed = obj.userData.isPersonaNode ? 1.3 : 1.1
            const seed = obj.userData.seed || 0
            // MindAmbience mindFloatCenter süzülme animasyonu
            obj.position.y =
              Math.sin(nowSec * speed + seed) * (obj.userData.isPersonaNode ? 4.5 : 2.8)
          }
          if (obj.userData && obj.userData.isHalo) {
            // MindAmbience mindPulseHalo 3s nefes alma
            const p = 1.0 + Math.sin(nowSec * 2.1) * 0.08
            obj.scale.set(p, p, 1)
            if (obj.material) {
              obj.material.opacity =
                obj.userData.baseOpacity * (0.85 + Math.sin(nowSec * 2.1) * 0.15)
            }
          }
          if (obj.userData && obj.userData.isBag) {
            // Kimlik torbası: yumuşak nefes alma (ışıma + hafif ölçek)
            const breath = 0.8 + Math.sin(nowSec * 1.5) * 0.2
            if (obj.material) obj.material.opacity = obj.userData.baseOpacity * breath
            const s = 1.0 + Math.sin(nowSec * 1.5) * 0.015
            obj.scale.set(s, s, s)
          }
          if (obj.userData && obj.userData.curve && obj.userData.pulseOrb) {
            const orb = obj.userData.pulseOrb
            // Kademeli render (simülasyon) ve drag sırasında ışık hüzmeleri gizli kalsın,
            // motor durduğunda görünür olsun ve akmaya başlasın
            if (_engineRunning || _dragging) {
              orb.visible = false
            } else {
              orb.visible = true
              const synapseSpeedBoost = obj.userData.synapseWeight
                ? obj.userData.synapseWeight * 0.35
                : 0
              const speed = (obj.userData.isRecalled ? 0.62 : 0.38) + synapseSpeedBoost
              const seed = obj.userData.seed || 0
              const t = (nowSec * speed + seed) % 1
              orb.position.copy(obj.userData.curve.getPoint(t))
              // Uç noktalara yaklaşırken yumuşak nefes alma (fade in/out)
              const fade = Math.sin(t * Math.PI)
              orb.scale.setScalar(Math.max(0.01, fade))
            }
          }
          if (obj.userData && obj.userData.isLinkLabel) {
            const isHovered = obj.userData.link === hoveredLinkRef.current
            const isSelected = obj.userData.link === selectedLinkRef.current
            const targetScale = isHovered || isSelected ? 2.2 : 1.0 // Üzerine gelince 2.2 katına çıkar
            obj.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
          }
        })
      }

      frameId = requestAnimationFrame(updateTime)
    }
    updateTime()
    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!actorId && !tribeId) {
      toast.error(t('mind.id_missing', 'Actor or Tribe ID is missing.'))
      navigate('/')
    }
  }, [actorId, tribeId, navigate, t])

  useEffect(() => {
    if (isError && memoryError) {
      toast.error(
        memoryError.message || t('mind.generic_error', 'An error occurred while fetching memory.')
      )
    }
  }, [isError, memoryError, t])

  const graphData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return { nodes: [], links: [] }

    const nodesMap = new Map()
    const linksSet = new Set()
    const linksArr = []

    // ── 1. Düğümler ──────────────────────────────────────────────────────────
    rawData.forEach((path) => {
      const pathNodes = path.Nodes || []

      pathNodes.forEach((n, idx) => {
        const nodeId = n.id || n.name || JSON.stringify(n)
        if (!nodesMap.has(nodeId)) {
          const isRoot =
            n.label === 'Persona' ||
            Boolean(n.isRoot) ||
            (n.label === 'Actor' &&
              rootName &&
              n.name &&
              n.name.toLowerCase() === rootName.toLowerCase()) ||
            (n.label === 'Tribe' &&
              (n.id === tribeId ||
                idx === 0 ||
                (rootName && n.name && n.name.toLowerCase() === rootName.toLowerCase())))
          const isCore = n.label === 'Core'
          const isFocusMatched =
            focusNodeParam && n.name && n.name.toLowerCase() === focusNodeParam.toLowerCase()
          const isActive =
            (highlightIds.size > 0 && nodeId && highlightIds.has(nodeId)) || Boolean(isFocusMatched)
          const activeColor = getActiveNeuronColor()
          const { core } = isActive ? activeColor : getNeuronColor(n.label, isRoot)

          let displayName = n.name || nodeId
          // Kök düğümde GUID yerine aktörün/grubun gerçek kullanıcı adını ver
          if (isRoot && rootName) {
            displayName = rootName
          }

          nodesMap.set(nodeId, {
            ...n,
            id: nodeId,
            name: displayName,
            label: n.label,
            isRoot,
            isCore,
            isActive,
            isTribeContext: Boolean(tribeId),
            val: isRoot ? 200 : isActive ? 18 : 10,
            color: core,
          })
        }
      })
    })

    // ── 2. Bağlantılar ───────────────────────────────────────────────────────
    rawData.forEach((path) => {
      const pathNodes = path.Nodes || []
      const pathRels = path.Relationships || []

      for (let i = 0; i < pathRels.length; i++) {
        if (i + 1 < pathNodes.length) {
          const sourceId = pathNodes[i].id || pathNodes[i].name || JSON.stringify(pathNodes[i])
          const targetId =
            pathNodes[i + 1].id || pathNodes[i + 1].name || JSON.stringify(pathNodes[i + 1])
          const rawRel = pathRels[i]
          const relType = typeof rawRel === 'object' ? rawRel?.type : rawRel
          const affinity = typeof rawRel === 'object' ? rawRel?.affinity : null
          const strength = typeof rawRel === 'object' ? rawRel?.strength : null

          const linkKey = `${sourceId}-${relType}-${targetId}`
          if (!linksSet.has(linkKey)) {
            linksSet.add(linkKey)

            const sourceNode = nodesMap.get(sourceId)
            const targetNode = nodesMap.get(targetId)

            // Core bağı: kök (Persona/Tribe) ile kimlik çekirdeği arasında
            const isCoreLink =
              relType === 'HAS_CORE' ||
              Boolean(sourceNode?.isRoot && targetNode?.isCore) ||
              Boolean(targetNode?.isRoot && sourceNode?.isCore)

            // Torba bağı: kök ile torba dışındaki bir düğüm arasında
            const isBagLink =
              Boolean(sourceNode?.isRoot && targetNode && !targetNode.isCore) ||
              Boolean(targetNode?.isRoot && sourceNode && !sourceNode.isCore)

            // Etiket formatı: OPPOSES (A:0.8)(S:1.2) — A: affinity, S: relationship strength
            const displayName = buildRelationshipLabel(relType, affinity, strength)

            const isRecalledLink = Boolean(sourceNode?.isActive && targetNode?.isActive)

            linksArr.push({
              source: sourceId,
              target: targetId,
              name: displayName,
              relType,
              affinity,
              strength,
              isRecalled: isRecalledLink,
              isCoreLink,
              isBagLink,
            })
          }
        }
      }
    })

    // ── 3. Paralel bağ yelpazesi (fan-out) ───────────────────────────────────
    // Aynı iki düğüm arasında birden fazla bağ (multi-edge) varsa, her birine
    // yelpazedeki sırasını ve toplam sayısını ata ki 3D sahnede üst üste
    // binmek yerine fan gibi farklı yönlere kavislenip ayrı ayrı okunabilsinler.
    const pairGroups = new Map()
    linksArr.forEach((link) => {
      const a = String(link.source)
      const b = String(link.target)
      const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`
      if (!pairGroups.has(pairKey)) pairGroups.set(pairKey, [])
      pairGroups.get(pairKey).push(link)
    })
    pairGroups.forEach((group) => {
      const count = group.length
      group.forEach((link, idx) => {
        link.parallelIndex = idx
        link.parallelCount = count
      })
    })

    const nodes = Array.from(nodesMap.values())
    const coreNodes = nodes.filter((n) => n.isCore && !n.isRoot)
    const outerNodes = nodes.filter((n) => !n.isRoot && !n.isCore)
    const bagRadius = computeBagRadius(coreNodes.length)
    const coreOrbitRadius = computeCoreOrbitRadius(bagRadius)
    const outerOrbitMin = computeOuterOrbitMin(bagRadius)

    // Kök merkezde sabit; orb geometrisi core sayısına göre ölçeklenir.
    nodes.forEach((node) => {
      if (node.isRoot) {
        node.x = 0
        node.y = 0
        node.z = 0
        node.bagRadius = bagRadius
        node.coreOrbitRadius = coreOrbitRadius
        node.outerOrbitMin = outerOrbitMin
        node.avatarUrl = profileData?.imageUrl || null
      }
    })

    // Core'lar torbanın içinde, kök etrafında küçük bir küre üzerine dağıtılır
    const coreTotal = coreNodes.length || 1
    coreNodes.forEach((node, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / coreTotal)
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5)
      node.x = coreOrbitRadius * Math.sin(phi) * Math.cos(theta)
      node.y = coreOrbitRadius * Math.cos(phi)
      node.z = coreOrbitRadius * Math.sin(phi) * Math.sin(theta)
    })

    // Diğer (kavramsal) düğümler dış küre üzerine dağıtılır
    const outerTotal = outerNodes.length || 1
    outerNodes.forEach((node, i) => {
      const phi = Math.acos(-1 + (2 * i) / outerTotal)
      const theta = Math.sqrt(outerTotal * Math.PI) * phi
      const r = outerOrbitMin + (i % 3) * OUTER_ORBIT_STEP
      node.x = r * Math.sin(phi) * Math.cos(theta)
      node.y = r * Math.sin(phi) * Math.sin(theta)
      node.z = r * Math.cos(phi)
    })

    return {
      nodes,
      links: linksArr,
    }
  }, [rawData, tribeId, actorId, rootName, highlightIds, focusNodeParam, isGreenMode, customColor, profileData?.imageUrl])

  // Bağlantı etiketleri: kullanıcı seçmediyse düğüm sayısına göre açık/kapalı.
  const effectiveHideLinkLabels =
    hideLinkLabels ?? graphData.nodes.length > LINK_LABEL_AUTO_HIDE_NODE_COUNT

  // Three.js inşa fonksiyonları bayrakları render sırasında okur.
  mindViewFlags.hideLinkLabels = effectiveHideLinkLabels
  mindViewFlags.hideNodeLabels = effectiveHideNodeLabels
  mindViewFlags.lazyRender = effectiveLazyRender

  // Görünüm anahtarlarını mevcut Three.js etiket nesnelerine anında uygula
  useEffect(() => {
    const fg = fgRef.current
    if (!fg || typeof fg.scene !== 'function') return
    const scene = fg.scene()
    if (!scene || typeof scene.traverse !== 'function') return
    scene.traverse((obj) => {
      const ud = obj.userData
      if (!ud) return
      if (ud.isBadge) obj.visible = !effectiveHideNodeLabels
      else if (ud.isLinkLabel) obj.visible = !effectiveHideLinkLabels
    })
  }, [effectiveHideLinkLabels, effectiveHideNodeLabels])

  // Node aralığı (Space) modu: seçili ayarı (Otomatik dahil) somut ön ayara çöz,
  // fizik kuvvetlerini uygula ve simülasyonu yeniden ısıt. Kilitliyken düğümler
  // fx/fy/fz ile sabit olduğundan yeni aralık uygulanabilsin diye geçici olarak
  // serbest bırakılır; onEngineStop kilit açıkken düğümleri yeniden sabitler.
  const spacingRef = useRef(SPACING_PRESETS[1])
  useEffect(() => {
    const preset = resolveSpacingPreset(effectiveSpacingSetting, graphData.nodes.length)
    spacingRef.current = preset
    const fg = fgRef.current
    if (!fg) return
    applySpacingForces(fg, preset)
    if (effectiveLockGraph && typeof fg.graphData === 'function') {
      const nodes = fg.graphData()?.nodes
      if (nodes) {
        for (const n of nodes) {
          n.fx = undefined
          n.fy = undefined
          n.fz = undefined
        }
      }
      setCooldownOverride(100)
      if (cooldownOverrideTimerRef.current) clearTimeout(cooldownOverrideTimerRef.current)
      cooldownOverrideTimerRef.current = setTimeout(() => setCooldownOverride(null), 2600)
    }
    requestAnimationFrame(() => {
      const g = fgRef.current
      if (g && typeof g.d3ReheatSimulation === 'function') g.d3ReheatSimulation()
    })
  }, [effectiveSpacingSetting, graphData.nodes.length, effectiveLockGraph])

  // ForceGraph'a verilen referans; fgRefreshKey artınca yeni obje üretilir ki
  // kütüphane update döngüsünü çalıştırıp drag kontrollerini güncel
  // enableNodeDrag değeriyle yeniden kursun. Node nesneleri aynı kalır.
  const graphDataRender = useMemo(
    () => ({ nodes: graphData.nodes, links: graphData.links }),
    [graphData, fgRefreshKey]
  )

  // Seçili düğüme bağlı ilişkiler (modal ilişki listesi için):
  // relType + A (affinity) + S (strength) + karşı düğüm adı ve yönü.
  const nodesById = useMemo(() => {
    const map = new Map()
    graphData.nodes.forEach((n) => map.set(n.id, n))
    return map
  }, [graphData.nodes])

  const selectedNodeRelationships = useMemo(() => {
    if (!selectedNode) return []
    const sid = selectedNode.id
    const list = []
    for (const link of graphData.links) {
      const sId = typeof link.source === 'object' ? link.source?.id : link.source
      const tId = typeof link.target === 'object' ? link.target?.id : link.target
      if (sId !== sid && tId !== sid) continue
      const otherId = sId === sid ? tId : sId
      const other = nodesById.get(otherId)
      list.push({
        key: `${sId}-${link.relType}-${tId}`,
        relType: link.relType,
        affinity: typeof link.affinity === 'number' ? link.affinity : null,
        strength: typeof link.strength === 'number' ? link.strength : null,
        otherId,
        otherName: other?.name || otherId,
        otherLabel: other?.label,
        otherIsRoot: Boolean(other?.isRoot),
        direction: sId === sid ? 'out' : 'in',
      })
    }
    list.sort(
      (a, b) =>
        (a.relType || '').localeCompare(b.relType || '') ||
        (a.otherName || '').localeCompare(b.otherName || '')
    )
    return list
  }, [selectedNode, graphData.links, nodesById])

  // Legend tip filtresi aktifken yalnızca seçilen tipteki düğümler (ve iki ucu da
  // görünür olan bağlantılar) grafiğe verilir; diğerleri görünmez olur.
  const visibleGraphData = useMemo(() => {
    const matcher = graphTypeFilter ? GRAPH_TYPE_MATCHERS[graphTypeFilter] : null
    if (!matcher) return graphDataRender
    const nodes = graphData.nodes.filter((n) => matcher(n) || n.isRoot || n.isCore)
    const keep = new Set(nodes.map((n) => n.id))
    const links = graphData.links.filter((l) => {
      const sId = typeof l.source === 'object' ? l.source?.id : l.source
      const tId = typeof l.target === 'object' ? l.target?.id : l.target
      return keep.has(sId) && keep.has(tId)
    })
    return { nodes, links }
  }, [graphData.nodes, graphData.links, graphDataRender, graphTypeFilter])

  // Yeni grafik verisi geldiğinde kademeli render sayaçlarını sıfırla.
  // (graphDataRender yerine graphData.nodes: lock/unlock re-init'lerinde sıfırlanmasın)
  useEffect(() => {
    _tickCount = 0
    _engineRunning = true
    _initialSimDone = false
    setInitialPhysicsDone(false)
  }, [graphData.nodes])

  const sortedNodes = useMemo(() => {
    return [...graphData.nodes].sort((a, b) => {
      if (a.isRoot && !b.isRoot) return -1
      if (!a.isRoot && b.isRoot) return 1
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [graphData.nodes])

  const baseDistance = useMemo(() => {
    return computeOptimalCameraDistance(graphData.nodes, isMobileScreen)
  }, [graphData.nodes, isMobileScreen])

  const baseDistanceRef = useRef(baseDistance)
  useEffect(() => {
    baseDistanceRef.current = baseDistance
  }, [baseDistance])

  const applyInitialCameraPosition = useCallback(
    (fgInstance) => {
      const fg = fgInstance || fgRef.current
      if (!fg) return
      const targetDist = baseDistanceRef.current || baseDistance
      if (typeof fg.cameraPosition === 'function') {
        fg.cameraPosition({ x: 0, y: 0, z: targetDist }, { x: 0, y: 0, z: 0 }, 0)
      }
    },
    [baseDistance]
  )

  useEffect(() => {
    isInitialZoomRef.current = true
    initialSimDoneRef.current = false
    setGraphTypeFilter(null)
  }, [actorId, tribeId])

  // Active Synapse: highlightIds veya focusNode varsa yükleme sonrası toast + ilk aktif node'a zoom & detay paneli açma
  const highlightedActiveNodes = useMemo(
    () => graphData.nodes.filter((n) => n.isActive),
    [graphData.nodes]
  )
  const hasHandledHighlightRef = useRef(false)

  // Reset highlight handled state if query params change
  const rawHighlightParam = searchParams.get('highlightIds') || ''
  useEffect(() => {
    hasHandledHighlightRef.current = false
  }, [actorId, tribeId, rawHighlightParam, focusNodeParam])

  useEffect(() => {
    if (isLoading || graphData.nodes.length === 0) return

    if (highlightedActiveNodes.length > 0) {
      if (hasHandledHighlightRef.current) return
      hasHandledHighlightRef.current = true

      const first = highlightedActiveNodes[0]

      // Kamera ağ boyutuna göre hesaplanan dengeli taban mesafeden başlar; aktif düğüm parlayarak öne çıkar
      const tid = setTimeout(() => {
        if (!fgRef.current) return
        fgRef.current.cameraPosition({ x: 0, y: 0, z: baseDistance }, { x: 0, y: 0, z: 0 }, 900)
      }, 300)
      return () => clearTimeout(tid)
    } else if ((highlightIds.size > 0 && highlightedActiveNodes.length === 0) || focusNodeParam) {
      if (hasHandledHighlightRef.current) return
      hasHandledHighlightRef.current = true

      // Graceful Nostalgic Fallback: düğüm Neo4j'de zamanla silikleşti / unutuldu
      toast(t('mind.memory_faded', 'Bu anı zamanla silikleşti ve unutuldu.'), {
        icon: '🌫️',
        duration: 5000,
      })
    }
  }, [highlightedActiveNodes, isLoading, highlightIds, focusNodeParam, t])

  // Anılar paneli düğüm tipi eşleştiricileri (legend ile aynı kategoriler)
  const MEM_TYPE_MATCHERS = useMemo(
    () => ({
      recalled: (n) => Boolean(n.isActive),
      Persona: (n) => n.label === 'Persona',
      Core: (n) => n.label === 'Core',
      Tribe: (n) => n.label === 'Tribe',
      Person: (n) => n.label === 'Actor' || n.label === 'User' || n.label === 'Bot',
      Thought: (n) =>
        n.label === 'GeneralThought' ||
        n.label === 'Topic' ||
        n.label === 'Concept' ||
        n.label === 'Thought',
    }),
    []
  )

  const filteredNodes = useMemo(() => {
    let list = sortedNodes
    // Metin araması (harf yazıldığı anda)
    if (nodeSearch.trim()) {
      const q = nodeSearch.toLowerCase()
      list = list.filter(
        (n) =>
          (n.name && n.name.toLowerCase().includes(q)) ||
          (n.label && n.label.toLowerCase().includes(q)) ||
          getNodeLabelText(n.label, n.isRoot, Boolean(tribeId)).toLowerCase().includes(q)
      )
    }
    // Düğüm tipi filtresi (seçim yapıldığı anda; boşsa tümü)
    if (memNodeTypes.size > 0) {
      list = list.filter((n) => {
        for (const key of memNodeTypes) {
          const matcher = MEM_TYPE_MATCHERS[key]
          if (matcher && matcher(n)) return true
        }
        return false
      })
    }
    // Sıralama (node bazlı, lastUpdated alanına göre)
    if (memSortBy) {
      const arr = [...list]
      if (memSortBy === 'oldest') {
        arr.sort((a, b) => (a.lastUpdated || 0) - (b.lastUpdated || 0))
      } else {
        // newest | lastupdated → en son güncellenen önce
        arr.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
      }
      return arr
    }
    return list
  }, [sortedNodes, nodeSearch, memNodeTypes, memSortBy, MEM_TYPE_MATCHERS, tribeId])

  // Drag sınırı — node'lar bu yarıçapı aşamaz
  const MAX_DRAG_DIST = 650
  const handleNodeDrag = useCallback((node) => {
    _dragging = true
    const dist = Math.sqrt((node.x || 0) ** 2 + (node.y || 0) ** 2 + (node.z || 0) ** 2)
    if (dist > MAX_DRAG_DIST) {
      const scale = MAX_DRAG_DIST / dist
      node.x = (node.x || 0) * scale
      node.y = (node.y || 0) * scale
      node.z = (node.z || 0) * scale
    }
  }, [])

  // Drag bırakılınca: yerleşme (settle) için checkpoint takvimini sıfırdan başlat
  const handleNodeDragEnd = useCallback(() => {
    _dragging = false
    _tickCount = 0
  }, [])

  const handleNodeClick = useCallback((node) => {
    if (!node) return
    selectedNodeRef.current = node
    setSelectedNode(node)
    selectedLinkRef.current = null // Node seçildiğinde damar seçimini iptal et
  }, [])

  // Grafik yüklenince iç D3 node'larına Fibonacci küre pozisyonu ata
  useEffect(() => {
    if (graphData.nodes.length === 0) return

    const setupPhysicsAndPositions = () => {
      if (!fgRef.current) return
      const fg = fgRef.current

      // Kuvvetleri seçili aralık moduna göre güvenli şekilde ayarla
      applySpacingForces(fg, spacingRef.current)

      if (typeof fg.graphData !== 'function') return
      const internalNodes = fg.graphData()?.nodes
      if (!internalNodes || internalNodes.length === 0) return

      const coreNodes = internalNodes.filter((n) => n.isCore && !n.isRoot)
      const outerNodes = internalNodes.filter((n) => !n.isRoot && !n.isCore)
      const coreTotal = coreNodes.length || 1
      const outerTotal = outerNodes.length || 1
      const rootNode = internalNodes.find((n) => n.isRoot)
      const coreOrbitRadius = rootNode?.coreOrbitRadius ?? CORE_ORBIT_RADIUS
      const outerOrbitMin = rootNode?.outerOrbitMin ?? OUTER_ORBIT_MIN

      // Root merkez
      internalNodes.forEach((n) => {
        if (n.isRoot) {
          n.x = 0
          n.y = 0
          n.z = 0
          n.vx = 0
          n.vy = 0
          n.vz = 0
        }
      })

      // Core'lar torbanın içinde, kök etrafında küçük bir küre üzerine
      coreNodes.forEach((n, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / coreTotal)
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5)
        n.x = coreOrbitRadius * Math.sin(phi) * Math.cos(theta)
        n.y = coreOrbitRadius * Math.cos(phi)
        n.z = coreOrbitRadius * Math.sin(phi) * Math.sin(theta)
        n.vx = 0
        n.vy = 0
        n.vz = 0
      })

      // Diğer (kavramsal) düğümler dış küre üzerine
      outerNodes.forEach((n, i) => {
        const phi = Math.acos(-1 + (2 * i) / outerTotal)
        const theta = Math.sqrt(outerTotal * Math.PI) * phi
        const r = outerOrbitMin + (i % 3) * OUTER_ORBIT_STEP
        n.x = r * Math.sin(phi) * Math.cos(theta)
        n.y = r * Math.sin(phi) * Math.sin(theta)
        n.z = r * Math.cos(phi)
        n.vx = 0
        n.vy = 0
        n.vz = 0
      })

      // Simülasyonu bu pozisyonlardan başlat
      if (typeof fg.d3ReheatSimulation === 'function') {
        fg.d3ReheatSimulation()
      }

      // Kamerayı hemen ağın boyutuna göre hesaplanan taban mesafeye sabitle (0 gecikme)
      const optimalDist = computeOptimalCameraDistance(internalNodes, window.innerWidth <= 768)
      if (typeof fg.cameraPosition === 'function') {
        fg.cameraPosition({ x: 0, y: 0, z: optimalDist }, { x: 0, y: 0, z: 0 }, 0)
      }
    }

    // İlk mount anında hemen çağır, bileşen henüz bağlanmadıysa 60ms sonra tekrar dene
    setupPhysicsAndPositions()
    const tid = setTimeout(setupPhysicsAndPositions, 60)
    return () => clearTimeout(tid)
  }, [graphData.nodes.length])

  // Otomatik döndürme — mouse ile etkileşimde durur, 4sn sonra devam eder
  const userInteractingRef = useRef(false)
  const interactTimeoutRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const onInteract = () => {
      userInteractingRef.current = true
      clearTimeout(interactTimeoutRef.current)
      // 4 saniye hareketsizlik sonrası rotasyona dön
      interactTimeoutRef.current = setTimeout(() => {
        userInteractingRef.current = false
      }, 4000)
    }

    const el = containerRef.current
    el.addEventListener('mousemove', onInteract)
    el.addEventListener('wheel', onInteract)
    el.addEventListener('mousedown', onInteract)
    el.addEventListener('touchstart', onInteract)

    return () => {
      el.removeEventListener('mousemove', onInteract)
      el.removeEventListener('wheel', onInteract)
      el.removeEventListener('mousedown', onInteract)
      el.removeEventListener('touchstart', onInteract)
      clearTimeout(interactTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (graphData.nodes.length === 0) return
    let angle = 0
    const id = setInterval(() => {
      // Bir düğüm veya bağlantı seçiliyken ya da kullanıcı etkileşim halindeyken rotasyonu durdur
      if (
        !fgRef.current ||
        userInteractingRef.current ||
        selectedNodeRef.current ||
        selectedLinkRef.current
      )
        return

      const cam = fgRef.current.camera?.()
      const curRadius = baseDistanceRef.current || baseDistance
      if (cam) {
        angle = Math.atan2(cam.position.x, cam.position.z) + 0.002
      } else {
        angle += 0.002
      }
      fgRef.current.cameraPosition(
        { x: curRadius * Math.sin(angle), y: 0, z: curRadius * Math.cos(angle) },
        { x: 0, y: 0, z: 0 }
      )
    }, 30)
    return () => clearInterval(id)
  }, [graphData.nodes.length, baseDistance])

  const handleResetView = () => {
    selectedNodeRef.current = null
    setSelectedNode(null)
    setGraphTypeFilter(null)
    selectedLinkRef.current = null
    if (fgRef.current && typeof fgRef.current.cameraPosition === 'function') {
      const internalNodes = fgRef.current.graphData?.()?.nodes || graphData.nodes
      const optimalDist = computeOptimalCameraDistance(internalNodes, window.innerWidth <= 768)
      fgRef.current.cameraPosition({ x: 0, y: 0, z: optimalDist }, { x: 0, y: 0, z: 0 }, 1000)
    }
  }

  const mindLoadingIndicator = (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        zIndex: 5,
      }}
    >
      <Brain size={40} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
      <div className="spinner spinner-lg" />
    </div>
  )

  return (
    <>
      {/* Tam ekranı kaplayan nöron ağı overlay */}
      <div
        className="mind-page-root"
        style={{
          position: 'fixed',
          top: TOPBAR_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: bgColor,
          overflow: 'hidden',
        }}
      >
        {/* Header — PersonalityCardHierarchyPage tarzı yüzen (floating) pill çifti */}
        <div
          className="mind-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px',
            flexShrink: 0,
            minHeight: 56,
          }}
        >
          {/* Sol: Geri + Kimlik bloğu; bağlam başlığı bunun altında bağımsız satır */}
          <div
            className="mind-identity-stack"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              minWidth: 0,
              maxWidth: contextTitle ? '42%' : '55%',
            }}
          >
          <div
            className="mind-identity-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 44,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '6px 14px',
              boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
              maxWidth: '100%',
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => navigate(-1)}
              aria-label={t('common.back', 'Geri')}
              className="page-back-button"
              style={{
                width: 30,
                height: 30,
                padding: 0,
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div
              style={{ width: 1, height: 24, background: 'var(--color-border)', flexShrink: 0 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Brain
                size={18}
                color="var(--color-primary)"
                style={{ flexShrink: 0, display: 'block' }}
              />
              <span
                className="mind-header-label"
                style={{
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('mind.graph_title', 'MIND GRAPH')}
              </span>
              <span
                className="mind-header-bullet"
                style={{
                  color: 'var(--color-primary)',
                  flexShrink: 0,
                  transform: 'translateY(-1px)',
                }}
              >
                •
              </span>
              {rootName && (
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    lineHeight: 1,
                    color: 'var(--color-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transform: 'translateY(1px)',
                    minWidth: 0,
                  }}
                >
                  {rootName}
                </span>
              )}
            </div>
          </div>

          {/* Bağlam başlığı kimlik pilinin altında bağımsız satır */}
          {contextTitle && (
            <div
              className="mind-context-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
              title={contextTitle}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontStyle: 'italic',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '0.01em',
                  textShadow: isDarkMode ? '0 1px 4px rgba(0, 0, 0, 0.4)' : 'none',
                  minWidth: 0,
                }}
              >
                "{contextTitle}"
              </span>
            </div>
          )}
          </div>

          {/* Mobil: Varsayılan görünüm butonu üst satırın sağında durur */}
          <button
            type="button"
            className="btn btn-primary btn-sm mind-default-mobile"
            onClick={handleResetView}
            aria-label={t('hierarchy.default_view', 'Varsayılan')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 12px',
              height: 26,
            }}
          >
            <Focus size={12} />
            <span className="mind-default-label">{t('hierarchy.default_view', 'Varsayılan')}</span>
          </button>

          {/* Sağ: Node tanımları + Varsayılan Görünüm (mobilde legend + Anılar satırı) */}
          <div className="mind-legend-row">
            <div
              className={`mind-controls${contextTitle ? ' is-context' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: '6px 12px',
                boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
                flexShrink: 0,
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              {/* Legend grubu: Recalled + düğüm tipleri (mobilde ayrı satırda kaydırılır) */}
              <div className="mind-legend-items-wrap">
                {legendScroll.scrollable && (
                  <div className="mind-view-scrollbar" aria-hidden="true">
                    <div
                      className="mind-view-scrollbar-thumb"
                      style={{ width: `${legendScroll.width}%`, left: `${legendScroll.left}%` }}
                    />
                  </div>
                )}
                <div
                  className="mind-legend-items"
                  ref={legendItemsRef}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
                >
              {/* 1. Recalled (Tetiklenen Anı) - Dolu parlayan neon küre (8px, yumuşak ışık aurası ile) */}
              <button
                type="button"
                onClick={() => setGraphTypeFilter((f) => (f === 'recalled' ? null : 'recalled'))}
                title={t('mind.filter_by_type', 'Filter by type')}
                aria-pressed={graphTypeFilter === 'recalled'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  opacity: graphTypeFilter && graphTypeFilter !== 'recalled' ? 0.45 : 1,
                  transition: 'all 0.18s ease',
                  font: 'inherit',
                }}
              >
                {/* İç hap: vurgu halkası yalnızca nokta + yazıyı sarar (layout nötr) */}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0 6px',
                    margin: '0 -6px',
                    borderRadius: 999,
                    background:
                      graphTypeFilter === 'recalled'
                        ? hexToRgba(accent.activeCore, isDarkMode ? 0.16 : 0.12)
                        : 'transparent',
                    boxShadow:
                      graphTypeFilter === 'recalled'
                        ? `inset 0 0 0 1px ${accent.activeCore}`
                        : 'none',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: accent.activeCore,
                      boxShadow: `0 0 0 2.5px ${hexToRgba(accent.activeCore, 0.32)}, 0 0 8px ${accent.activeCore}`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('mind.labels.recalled', 'Recalled')}
                  </span>
                </span>
              </button>

              {/* Durum ile Düğüm Tipleri arasındaki ince ayırıcı */}
              <span
                style={{ width: 1, height: 18, background: 'var(--color-border)', margin: '0 2px' }}
              />

              {/* 2. Düğüm Tipleri (Persona, Tribe, Person, Thought) — tıklayınca grafik filtrelenir */}
              {[
                {
                  key: 'root',
                  color: accent.activeGlow,
                  label: tribeId
                    ? t('mind.labels.tribe_root', 'Tribe (Root)')
                    : t('mind.labels.persona', 'Persona'),
                },
                { key: 'core', color: accent.activeGlow, label: t('mind.labels.core', 'Core') },
                {
                  key: 'tribe',
                  color: NEURON_COLORS.Tribe.core,
                  label: tribeId
                    ? t('mind.labels.other_tribes', 'Other Tribes')
                    : t('mind.labels.tribe', 'Tribe'),
                },
                {
                  key: 'person',
                  color: NEURON_COLORS.Actor.core,
                  label: t('mind.labels.actor', 'Person'),
                },
                {
                  key: 'thought',
                  color: NEURON_COLORS.GeneralThought.core,
                  label: t('mind.labels.general_thought', 'Thought'),
                },
              ].map(({ key, color, label }, idx) => {
                const isActive = graphTypeFilter === key
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setGraphTypeFilter((f) => (f === key ? null : key))}
                    title={t('mind.filter_by_type', 'Filter by type')}
                    aria-pressed={isActive}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      opacity: graphTypeFilter && !isActive ? 0.45 : 1,
                      transition: 'all 0.18s ease',
                      font: 'inherit',
                    }}
                  >
                    {idx > 0 && (
                      <span
                        style={{
                          width: 1,
                          height: 18,
                          background: 'var(--color-border)',
                          marginRight: 2,
                        }}
                      />
                    )}
                    {/* İç hap: vurgu halkası yalnızca nokta + yazıyı sarar (layout nötr) */}
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0 6px',
                        margin: '0 -6px',
                        borderRadius: 999,
                        background: isActive
                          ? hexToRgba(color, isDarkMode ? 0.16 : 0.12)
                          : 'transparent',
                        boxShadow: isActive ? `inset 0 0 0 1px ${color}` : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: color,
                          boxShadow: `0 0 8px ${color}`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </span>
                    </span>
                  </button>
                )
              })}
              </div>
              </div>

              <span style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

              {/* Görünüm anahtarları + Varsayılan (mobilde tek satırda, gerekirse yatay kaydırılır) */}
              <div
                className="mind-actions"
                style={{ display: 'flex', gap: 8, flexShrink: 0 }}
              >
              {/* PC: Görünüm anahtarları (bağlantı yazıları / düğüm yazıları / ağı kilitle / aralık) */}
              <div className="mind-view-toggles-wrap">
                {viewScroll.scrollable && (
                  <div className="mind-view-scrollbar" aria-hidden="true">
                    <div
                      className="mind-view-scrollbar-thumb"
                      style={{ width: `${viewScroll.width}%`, left: `${viewScroll.left}%` }}
                    />
                  </div>
                )}
                <div
                  className="mind-view-toggles"
                  ref={viewTogglesRef}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                <MindToggle
                  active={effectiveHideLinkLabels}
                  onClick={() => setHideLinkLabels(!effectiveHideLinkLabels)}
                  label={t('mind.view.hide_link_labels', 'Bağlantı yazıları')}
                  icon={<Tag size={12} />}
                />
                <MindToggle
                  active={effectiveHideNodeLabels}
                  onClick={() => setHideNodeLabels(!effectiveHideNodeLabels)}
                  label={t('mind.view.hide_node_labels', 'Düğüm yazıları')}
                  icon={<Type size={12} />}
                />
                <MindToggle
                  active={effectiveLockGraph}
                  onClick={() => setLockGraph(!effectiveLockGraph)}
                  label={t('mind.view.lock_graph', 'Kilit')}
                  icon={effectiveLockGraph ? <Lock size={12} /> : <Unlock size={12} />}
                />
                <MindToggle
                  active={effectiveSpacingSetting !== 'auto'}
                  onClick={() => {
                    const i = SPACING_OPTIONS.indexOf(effectiveSpacingSetting)
                    setSpacingSetting(SPACING_OPTIONS[(i + 1) % SPACING_OPTIONS.length])
                  }}
                  label={`${t('mind.view.spacing', 'Aralık')}: ${
                    effectiveSpacingSetting === 'auto'
                      ? t('mind.view.spacing_auto', 'Otomatik')
                      : t(
                          `mind.view.spacing_${effectiveSpacingSetting}`,
                          resolveSpacingPreset(effectiveSpacingSetting, graphData.nodes.length)
                            .label
                        )
                  }`}
                  shortLabel={
                    effectiveSpacingSetting === 'auto'
                      ? t('mind.view.spacing_auto', 'Otomatik')
                      : t(
                          `mind.view.spacing_${effectiveSpacingSetting}`,
                          resolveSpacingPreset(effectiveSpacingSetting, graphData.nodes.length)
                            .label
                        )
                  }
                  icon={<Move size={12} />}
                />
                <MindToggle
                  active={effectiveLazyRender}
                  onClick={() => setLazyRender(!effectiveLazyRender)}
                  label={t('mind.view.lazy', 'Lazy')}
                  icon={<Timer size={12} />}
                />
                </div>
              </div>

              <span style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

              <button
                type="button"
                className="btn btn-primary btn-sm mind-default-desktop"
                onClick={handleResetView}
                aria-label={t('hierarchy.default_view', 'Varsayılan')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '0 12px',
                  height: 26,
                }}
              >
                <Focus size={12} />
                <span className="mind-default-label">{t('hierarchy.default_view', 'Varsayılan')}</span>
              </button>
              </div>
            </div>

            {/* Mobil: Anılar paneli tetikleyicisi (legend satırının sağında) */}
            <button
              type="button"
              ref={memBtnRef}
              className="mind-memories-btn"
              onClick={() => setIsNodeListCollapsed((prev) => !prev)}
              aria-label={t('mind.memories_title', 'Anılar')}
              aria-expanded={!isNodeListCollapsed}
            >
              <Brain size={15} />
              <span>{t('mind.memories_title', 'Anılar')}</span>
              <span
                className="mind-memories-caret"
                aria-hidden="true"
                style={{
                  transform: !isNodeListCollapsed ? 'rotate(180deg)' : 'none',
                }}
              >
                ▼
              </span>
            </button>
          </div>
        </div>

        {/* Graph Alanı */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            width: '100%',
            position: 'relative',
            background: bgColor,
            backgroundImage: isDarkMode
              ? 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 80%)'
              : 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 80%), radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
            backgroundSize: isDarkMode ? 'auto' : 'auto, 28px 28px',
          }}
        >
          {isLoading ? (
            mindLoadingIndicator
          ) : graphData.nodes.length === 0 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <Brain size={40} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
              <p style={{ color: 'var(--color-primary)', opacity: 0.6, fontSize: 14 }}>
                {t('mind.no_memories', 'No memories found.')}
              </p>
            </div>
          ) : (
            <>
            {dimensions.width > 0 &&
            dimensions.height > 0 && (
              <ForceGraph3D
                ref={(el) => {
                  fgRef.current = el
                  if (el && isInitialZoomRef.current) {
                    applyInitialCameraPosition(el)
                  }
                }}
                width={dimensions.width}
                height={dimensions.height}
                graphData={visibleGraphData}
                backgroundColor={bgColor}
                // Custom Three.js parlayan nöron objeleri
                nodeThreeObject={buildNeuronObject}
                nodeThreeObjectExtend={false}
                nodePositionUpdate={(obj, pos, node) => {
                  // Lazy mod: ilk oluşum simülasyonu bitene kadar düğümleri
                  // tamamen gizle; motor durunca son pozisyonlarla göster.
                  if (mindViewFlags.lazyRender && !_initialSimDone && !_dragging) {
                    obj.visible = false
                    return true
                  }
                  obj.visible = true
                  // Kademeli render: checkpoint değilse ve motor çalışıyorsa
                  // pozisyon güncellemesini bastır (düğüm yerinde kalsın).
                  // Drag sırasında ve motor durduğunda her zaman güncelle.
                  if (_dragging || RENDER_CHECKPOINTS.has(_tickCount) || !_engineRunning) {
                    return undefined
                  }
                  return true
                }}
                nodeLabel={() => ''}
                // 3D silindirik kılcal damar tüpleri
                linkThreeObject={buildCapillaryObject}
                linkPositionUpdate={updateCapillaryPosition}
                // Organik fizik + node arası mesafe
                d3VelocityDecay={0.3}
                d3AlphaDecay={0.02}
                warmupTicks={0}
                cooldownTicks={
                  cooldownOverride !== null
                    ? cooldownOverride
                    : effectiveLockGraph && initialSimDoneRef.current
                      ? 0
                      : 100
                }
                onEngineTick={() => {
                  // Motor durmuşken tick geliyorsa yeniden ısıtılmıştır (drag vb.):
                  // kademeli render döngüsünü sıfırdan başlat
                  if (!_engineRunning) {
                    _engineRunning = true
                    _tickCount = 0
                  }
                  _tickCount++
                  const fg = fgRef.current
                  // Core düğümlerini torbanın içinde tut (kök merkezli yarıçap sınırı)
                  if (fg && typeof fg.graphData === 'function') {
                    const nodes = fg.graphData()?.nodes
                    if (nodes) {
                      // Core düğümlerini kök merkezli torbanın içinde tut.
                      const rootNode = nodes.find((n) => n.isRoot)
                      const maxD = (rootNode?.bagRadius ?? BAG_RADIUS) - CORE_NODE_MARGIN
                      for (const n of nodes) {
                        if (n.isCore && !n.isRoot) {
                          const dx = (n.x || 0) - (rootNode?.x || 0)
                          const dy = (n.y || 0) - (rootNode?.y || 0)
                          const dz = (n.z || 0) - (rootNode?.z || 0)
                          const d = Math.hypot(dx, dy, dz)
                          if (d > maxD) {
                            const s = maxD / d
                            n.x = (rootNode?.x || 0) + dx * s
                            n.y = (rootNode?.y || 0) + dy * s
                            n.z = (rootNode?.z || 0) + dz * s
                            // Sınıra yapışıp dışa doğru itilmeyi engelle.
                            n.vx = (n.vx || 0) * 0.2
                            n.vy = (n.vy || 0) * 0.2
                            n.vz = (n.vz || 0) * 0.2
                          }
                        }
                      }
                    }
                  }
                  if (isInitialZoomRef.current && fgRef.current) {
                    const cam = fgRef.current.camera?.()
                    const targetDist = baseDistanceRef.current || baseDistance
                    // Eğer kamera henüz taban mesafede değilse (örn. kütüphanenin varsayılan yakın konumu) anında taban mesafeye sabitle
                    if (cam && Math.abs(cam.position.z - targetDist) > 30) {
                      applyInitialCameraPosition(fgRef.current)
                    }
                    isInitialZoomRef.current = false
                  }
                }}
                onEngineStop={() => {
                  _engineRunning = false
                  _dragging = false
                  _initialSimDone = true
                  setInitialPhysicsDone(true)
                  isInitialZoomRef.current = false
                  initialSimDoneRef.current = true
                  // Sayfa kilitli yüklendiyse, ilk simülasyon tamamlanınca düğümleri sabitle
          if (effectiveLockGraph) {
                    const fg = fgRef.current
                    if (fg && typeof fg.graphData === 'function') {
                      const nodes = fg.graphData()?.nodes
                      if (nodes) {
                        for (const n of nodes) {
                          n.fx = n.x
                          n.fy = n.y
                          n.fz = n.z
                        }
                      }
                    }
                  }
                }}
                enableNodeDrag={!effectiveLockGraph}
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
                onNodeClick={handleNodeClick}
                onLinkHover={(link) => {
                  hoveredLinkRef.current = link
                }}
                onLinkClick={(link) => {
                  // Seçili olanı kaldır ya da yenisini seç
                  selectedLinkRef.current = selectedLinkRef.current === link ? null : link
                }}
              />
            )}
            {effectiveLazyRender &&
              !initialPhysicsDone &&
              dimensions.width > 0 &&
              dimensions.height > 0 &&
              mindLoadingIndicator}
            </>
          )}

          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              isTribeContext={Boolean(tribeId)}
              relationships={selectedNodeRelationships}
              onNavigate={(nodeId) => {
                const target = nodesById.get(nodeId)
                if (target) handleNodeClick(target)
              }}
              onClose={() => {
                selectedNodeRef.current = null
                setSelectedNode(null)
              }}
            />
          )}

          {/* Sağ Üst Kontrol & Düğüm Listesi */}
          <div
            className={`mind-memories-wrap${isNodeListCollapsed ? ' is-collapsed' : ''}`}
            style={{
              position: 'absolute',
              top: memPanelTop ?? 24,
              right: 24,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 12,
              maxHeight: 'calc(100vh - 120px)',
              pointerEvents: 'none',
            }}
          >
            {/* Anılar Listesi Paneli (Sağ Üstte) */}
            {graphData.nodes.length > 0 && (
              <div
                style={{
                  pointerEvents: 'auto',
                  width: isMobileScreen ? 264 : 324,
                  maxHeight: 'calc(100vh - 200px)',
                  display: 'flex',
                  flexDirection: 'column',
                  background: headerBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 16,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: isDarkMode
                    ? '0 12px 36px rgba(0,0,0,0.5)'
                    : '0 12px 32px -4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  // Filtre dropdown'ı panel sınırlarını aşabilsin diye açıkken kırpma kapatılır
                  overflow: memFilterOpen ? 'visible' : 'hidden',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {/* Panel Başlığı (mobilde gizlenir; panel arama kutusundan başlar) */}
                <div
                  className="mind-memories-panel-header"
                  onClick={() => setIsNodeListCollapsed((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!isNodeListCollapsed}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setIsNodeListCollapsed((prev) => !prev)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isNodeListCollapsed
                      ? 'none'
                      : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Brain size={16} style={{ color: accent.activeGlow }} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isDarkMode ? '#f0e6ff' : '#111827',
                      }}
                    >
                      {t('mind.memories_title', 'Anılar')}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {graphData.nodes.length}
                    </span>
                  </div>

                  <span
                    aria-hidden="true"
                    style={{
                      padding: '4px 6px',
                      borderRadius: 6,
                      color: isDarkMode ? 'rgba(240,230,255,0.7)' : 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        display: 'inline-block',
                        transform: isNodeListCollapsed ? 'none' : 'rotate(180deg)',
                        transition: 'transform var(--transition-fast, 0.2s ease)',
                      }}
                    >
                      ▼
                    </span>
                  </span>
                </div>

                {/* Genişletilmiş Liste İçeriği */}
                {!isNodeListCollapsed && (
                  <>
                    {/* Arama + Filtre (site geneli search bar stili) */}
                    {graphData.nodes.length > 5 && (
                      <div
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        }}
                      >
                        {/* Arama girdisi */}
                        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                          <Search
                            size={14}
                            style={{
                              position: 'absolute',
                              left: 10,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--color-text-faint)',
                              zIndex: 1,
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            type="text"
                            className="input"
                            style={{ paddingLeft: 30, height: 32, fontSize: 12, width: '100%' }}
                            placeholder={t('topbar.search', 'Ara')}
                            value={nodeSearch}
                            onChange={(e) => setNodeSearch(e.target.value)}
                          />
                        </div>

                        {/* Filtre butonu + dropdown (site geneli stil) */}
                        <div style={{ position: 'relative', flexShrink: 0 }} ref={memFilterRef}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm btn-icon"
                            onClick={() => setMemFilterOpen((v) => !v)}
                            style={{
                              height: 32,
                              width: 32,
                              borderColor:
                                memNodeTypes.size > 0 || memSortBy ? 'var(--color-primary)' : undefined,
                            }}
                            aria-label={t('topbar.search_filters', 'Arama Filtreleri')}
                          >
                            <Filter
                              size={14}
                              color={
                                memNodeTypes.size > 0 || memSortBy
                                  ? 'var(--color-primary)'
                                  : 'currentColor'
                              }
                              fill={
                                memNodeTypes.size > 0 || memSortBy ? 'var(--color-primary)' : 'none'
                              }
                            />
                          </button>
                          {(memNodeTypes.size > 0 || memSortBy) && (
                            <button
                              type="button"
                              onClick={() => {
                                setMemNodeTypes(new Set())
                                setMemSortBy('')
                              }}
                              aria-label={t('common.clear_all', 'Tümünü Temizle')}
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 14,
                                height: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                zIndex: 10,
                              }}
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          )}
                          <AnimatePresence>
                            {memFilterOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  marginTop: 4,
                                  background: 'var(--color-bg)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 8,
                                  boxShadow: 'var(--shadow-md)',
                                  zIndex: 200,
                                  minWidth: 220,
                                  padding: 12,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 12,
                                  textAlign: 'left',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--color-text)',
                                    borderBottom: '1px solid var(--color-border-light)',
                                    paddingBottom: 6,
                                  }}
                                >
                                  <span>{t('search.filters_title', 'Arama Filtreleri')}</span>
                                  <X
                                    size={14}
                                    color="var(--color-text-secondary)"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setMemFilterOpen(false)}
                                  />
                                </div>

                                {/* Düğüm Tipleri */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <label
                                    style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
                                  >
                                    {t('mind.filters.node_types', 'Düğüm Tipleri')}
                                  </label>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {[
                                      {
                                        key: 'recalled',
                                        label: t('mind.labels.recalled', 'Recalled'),
                                      },
                                      { key: 'Persona', label: t('mind.labels.persona', 'Persona') },
                                      { key: 'Core', label: t('mind.labels.core', 'Core') },
                                      { key: 'Tribe', label: t('mind.labels.tribe', 'Tribe') },
                                      { key: 'Person', label: t('mind.labels.actor', 'Person') },
                                      {
                                        key: 'Thought',
                                        label: t('mind.labels.general_thought', 'Thought'),
                                      },
                                    ].map(({ key, label }) => {
                                      const active = memNodeTypes.has(key)
                                      return (
                                        <button
                                          key={key}
                                          type="button"
                                          className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline'}`}
                                          style={{ padding: '2px 10px', height: 26, fontSize: 12 }}
                                          onClick={() =>
                                            setMemNodeTypes((prev) => {
                                              const next = new Set(prev)
                                              if (next.has(key)) next.delete(key)
                                              else next.add(key)
                                              return next
                                            })
                                          }
                                        >
                                          {label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* SortBy */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <label
                                    style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
                                  >
                                    {t('search.sort_by', 'Sıralama')}
                                  </label>
                                  <select
                                    className="input"
                                    style={{ padding: '4px 8px', height: 32, fontSize: 13 }}
                                    value={memSortBy}
                                    onChange={(e) => setMemSortBy(e.target.value)}
                                  >
                                    <option value="">{t('search.none', 'Yok')}</option>
                                    <option value="newest">{t('search.newest', 'Newest')}</option>
                                    <option value="oldest">{t('search.oldest', 'Oldest')}</option>
                                    <option value="lastupdated">
                                      {t('mind.last_updated', 'Last Updated')}
                                    </option>
                                  </select>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* Anılar Listesi */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        maxHeight: isMobileScreen ? 340 : 420,
                      }}
                    >
                      {filteredNodes.length === 0 ? (
                        <div
                          style={{
                            padding: '16px 8px',
                            textAlign: 'center',
                            fontSize: 12,
                            color: isDarkMode ? 'rgba(240,230,255,0.4)' : 'rgba(0,0,0,0.4)',
                          }}
                        >
                          {t('mind.no_memories_found', 'Eşleşen anı bulunamadı')}
                        </div>
                      ) : (
                        filteredNodes.map((node) => {
                          const isSelected = selectedNode?.id === node.id
                          const { core, glow } = getNeuronColor(node.label, node.isRoot)

                          return (
                            <div
                              key={node.id}
                              onClick={() => {
                                let targetNode = node
                                if (fgRef.current) {
                                  const scene = fgRef.current.scene()
                                  scene?.traverse((obj) => {
                                    if (obj.__data && obj.__data.id === node.id) {
                                      targetNode = obj.__data
                                    }
                                  })
                                }
                                handleNodeClick(targetNode)
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: isMobileScreen ? '8px 10px' : '10px 12px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                background: isSelected
                                  ? isDarkMode
                                    ? 'rgba(255,255,255,0.12)'
                                    : 'rgba(0,0,0,0.08)'
                                  : 'transparent',
                                border: isSelected ? `1px solid ${core}` : '1px solid transparent',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = isDarkMode
                                    ? 'rgba(255,255,255,0.06)'
                                    : 'rgba(0,0,0,0.04)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'transparent'
                                }
                              }}
                            >
                              {/* Nokta göstergesi */}
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: core,
                                  boxShadow: `0 0 6px ${glow}`,
                                  flexShrink: 0,
                                }}
                              />

                              {/* İsim ve Etiket */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: isDarkMode ? '#f0e6ff' : '#111827',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={node.name}
                                >
                                  {node.name || t('mind.unknown_memory', 'Anı')}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 500,
                                    color: core,
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase',
                                    marginTop: 1,
                                  }}
                                >
                                  {getNodeLabelText(node.label, node.isRoot, Boolean(tribeId))}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: '60vh' }} />
    </>
  )
}
