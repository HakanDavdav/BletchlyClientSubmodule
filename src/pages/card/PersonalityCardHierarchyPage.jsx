import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Network,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Crown,
  Focus,
  Bot as BotIconLucide,
  CircleAlert,
  CircleMinus,
  CirclePlus,
  Check,
  Trash2,
  History,
} from 'lucide-react'
import { personalityCardApi } from '../../api/personalityCardApi'
import BackButton from '../../components/common/BackButton'
import FossilTogglePill from '../../components/common/FossilTogglePill'
import ActorMinimalCard from '../../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../../components/tribe/TribeMinimalCard'
import BotIcon from '../../components/common/icons/BotIcon'
import PersonalityCard from '../../components/card/PersonalityCard'
import HierarchyConnectionsOverlay from '../../components/hierarchy/HierarchyConnectionsOverlay'
import useTouchPanZoom from '../../hooks/useTouchPanZoom'
import TRexSkullIcon from '../../assets/t-rex-skull-svgrepo-com.svg?react'

function isNodeFossil(child) {
  if (!child) return false
  // Tombstone (feshedilmiş/silinmiş) düğümler özünde fosilleşmiş düğümlerle
  // aynı anlama gelir; bu yüzden onlar da fosil gibi ele alınır.
  return Boolean(
    child.isDormant ||
    child.IsDormant ||
    child.isDeleted ||
    child.IsDeleted ||
    child.data?.isDormant ||
    child.data?.IsDormant ||
    child.data?.isDeleted ||
    child.bot?.isDormant ||
    child.bot?.IsDormant ||
    child.tribe?.isDormant ||
    child.tribe?.IsDormant ||
    child.actor?.isDormant ||
    child.actor?.IsDormant
  )
}

function hasActiveDescendantsCard(node) {
  if (!node || !node.children || node.children.length === 0) return false
  for (const child of node.children) {
    if (!isNodeFossil(child)) return true
    if (hasActiveDescendantsCard(child)) return true
  }
  return false
}

function collectPromotedActiveCardChildren(fossilNode, ancestorsSoFar = [], expandedAncestorIds = new Set()) {
  const currentAncestors = [...ancestorsSoFar, fossilNode]
  const promoted = []

  if (fossilNode.children && fossilNode.children.length > 0) {
    for (const child of fossilNode.children) {
      if (!isNodeFossil(child)) {
        promoted.push({
          ...child,
          _fossilAncestors: currentAncestors,
        })
      } else if (hasActiveDescendantsCard(child)) {
        if (expandedAncestorIds.has(child.id)) {
          promoted.push({
            ...child,
            _isEnjectedFossil: true,
            _fossilAncestors: currentAncestors,
          })
        } else {
          promoted.push(...collectPromotedActiveCardChildren(child, currentAncestors, expandedAncestorIds))
        }
      }
    }
  }

  return promoted
}

// ── Tree Builder Algorithm ──────────────────────────────────────────────────
function buildCardHierarchyTree(card, includeHistory = false) {
  if (!card) return null

  const root = {
    id: `card_${card.personalityCardId || 'root'}`,
    nodeType: 'card',
    card: card,
    isRoot: true,
    isDeleted: false,
    children: [],
  }

  const rawOwners = Array.isArray(card.owners) ? card.owners : []
  const rawAssignments = Array.isArray(card.assignments)
    ? (includeHistory ? card.assignments : card.assignments.filter((ass) => !ass.isDeleted && !ass.IsDeleted))
    : []

  const ownerNodesByOwnershipId = new Map()
  const ownerNodesByActorId = new Map()

  const ownerNodes = rawOwners.map((owner, idx) => {
    const actor = owner.actor || {
      actorId: owner.actorId,
      profileName: 'Bilinmeyen Sahip',
    }
    const node = {
      id: `owner_${owner.ownershipId || owner.actorId || idx}`,
      ownershipId: owner.ownershipId ? String(owner.ownershipId).toLowerCase() : null,
      actorId: owner.actorId ? String(owner.actorId).toLowerCase() : null,
      nodeType: 'owner',
      actor: actor,
      ownership: owner,
      card: card,
      isRoot: false,
      isDeleted: false,
      children: [],
    }
    if (node.ownershipId) ownerNodesByOwnershipId.set(node.ownershipId, node)
    if (node.actorId) ownerNodesByActorId.set(node.actorId, node)
    return node
  })

  for (const ownerNode of ownerNodes) {
    root.children.push(ownerNode)
  }

  const assignmentNodes = rawAssignments.map((ass, idx) => {
    const isBot = Boolean(ass.botId || ass.bot)
    const targetId = isBot ? ass.botId : ass.tribeId
    const targetData = isBot ? ass.bot : ass.tribe

    return {
      id: `assignment_${ass.assignmentId || idx}`,
      assignmentId: ass.assignmentId,
      ownershipId: ass.ownershipId ? String(ass.ownershipId).toLowerCase() : null,
      nodeType: isBot ? 'bot' : 'tribe',
      targetId: targetId ? String(targetId).toLowerCase() : null,
      sourceActorId: ass.sourceActorId ? String(ass.sourceActorId).toLowerCase() : null,
      sourceTribeId: ass.sourceTribeId ? String(ass.sourceTribeId).toLowerCase() : null,
      data:
        targetData ||
        (isBot
          ? { actorId: targetId, profileName: 'Bilinmeyen Bot' }
          : { tribeId: targetId, tribeName: 'Bilinmeyen Klan' }),
      bot: ass.bot,
      tribe: ass.tribe,
      isDeleted: Boolean(ass.isDeleted || ass.IsDeleted),
      isLocked: Boolean(ass.isLocked),
      assignedAt: ass.assignedAt,
      children: [],
    }
  })

  // Index assignment nodes by targetId
  const nodesByTargetId = new Map()
  for (const node of assignmentNodes) {
    if (node.targetId) {
      if (!nodesByTargetId.has(node.targetId)) {
        nodesByTargetId.set(node.targetId, [])
      }
      nodesByTargetId.get(node.targetId).push(node)
    }
  }

  // Connect assignments:
  // 1. If sourceTribeId matches another assignment's targetId -> child of that assignment
  // 2. Else if sourceActorId matches another assignment's targetId -> child of that assignment
  // 3. Else if ownershipId matches an owner node -> child of that owner node
  // 4. Else if sourceActorId matches an owner's actorId -> child of that owner node
  // 5. Else child of root (card)
  for (const node of assignmentNodes) {
    let attached = false

    if (node.sourceTribeId) {
      const parentList = nodesByTargetId.get(node.sourceTribeId)
      if (parentList && parentList.length > 0) {
        parentList[0].children.push(node)
        attached = true
      }
    } else if (node.sourceActorId) {
      const parentList = nodesByTargetId.get(node.sourceActorId)
      if (parentList && parentList.length > 0) {
        parentList[0].children.push(node)
        attached = true
      }
    }

    if (!attached && node.ownershipId) {
      const ownerNode = ownerNodesByOwnershipId.get(node.ownershipId)
      if (ownerNode) {
        ownerNode.children.push(node)
        attached = true
      }
    }

    if (!attached && node.sourceActorId) {
      const ownerNode = ownerNodesByActorId.get(node.sourceActorId)
      if (ownerNode) {
        ownerNode.children.push(node)
        attached = true
      }
    }

    if (!attached) {
      root.children.push(node)
    }
  }

  return root
}

// ── Recursive TreeNode Component ─────────────────────────────────────────────
function CardTreeNode({
  node,
  isAllCollapsed,
  expandTrigger,
  parentId = null,
  showFossils = false,
  expandedAncestorIds,
  onToggleAncestor,
  fossilAncestors = null,
  isEnjectedFossil = false,
}) {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [localFossilExpanded, setLocalFossilExpanded] = useState(null)

  useEffect(() => {
    if (expandTrigger > 0) {
      setIsCollapsed(isAllCollapsed)
      if (showFossils) {
        setLocalFossilExpanded(!isAllCollapsed)
      } else {
        setLocalFossilExpanded(false)
      }
    }
  }, [expandTrigger, isAllCollapsed, showFossils])

  const allChildren = node.children || []
  const directActiveChildren = allChildren.filter((c) => !isNodeFossil(c))
  const allFossilChildren = allChildren.filter((c) => isNodeFossil(c))

  const pureFossilChildren = []
  const fossilAncestorsWithActiveDescendants = []

  for (const fChild of allFossilChildren) {
    if (hasActiveDescendantsCard(fChild)) {
      fossilAncestorsWithActiveDescendants.push(fChild)
    } else {
      pureFossilChildren.push(fChild)
    }
  }

  let displayActiveChildren = [...directActiveChildren]
  let enjectedFossilChildren = []

  if (showFossils) {
    pureFossilChildren.push(...fossilAncestorsWithActiveDescendants)
  } else {
    for (const fChild of fossilAncestorsWithActiveDescendants) {
      if (expandedAncestorIds?.has(fChild.id)) {
        enjectedFossilChildren.push(fChild)
      } else {
        const promoted = collectPromotedActiveCardChildren(fChild, [], expandedAncestorIds)
        displayActiveChildren.push(...promoted)
      }
    }
  }

  const totalActive = displayActiveChildren.length + enjectedFossilChildren.length
  const totalPureFossils = pureFossilChildren.length
  const hasChildren = totalActive > 0 || totalPureFossils > 0

  const effectiveFossilExpanded = localFossilExpanded !== null ? localFossilExpanded : showFossils
  // Fosil (dormant) ve tombstone (feshedilmiş) düğümler aynı şekilde ele alınır
  const isFossilLike = isNodeFossil(node)

  return (
    <div className={`vtree-node${node.nodeType === 'tribe' ? ' vtree-node--tribe' : ''}`}>
      {/* ── Sanal Atlama Köprü Rozeti (Bypass Bridge Badge) ────────────────── */}
      {fossilAncestors && fossilAncestors.length > 0 && (
        <div className="vtree-ancestor-bridge-pill-wrapper">
          <button
            type="button"
            className="vtree-ancestor-bridge-pill"
            onClick={(e) => {
              e.stopPropagation()
              if (onToggleAncestor) {
                onToggleAncestor(fossilAncestors[fossilAncestors.length - 1].id)
              }
            }}
          >
            <TRexSkullIcon className="badge-fossil-icon" />
            {fossilAncestors.length > 1 && (
              <span style={{ fontSize: 10, fontWeight: 800, paddingRight: 1 }}>{fossilAncestors.length}</span>
            )}
            <CirclePlus size={12} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* ── Araya Enjekte Edilmiş Fosil Ata Rozeti (Kapatma Butonu) ─────────── */}
      {isEnjectedFossil && (
        <div className="vtree-ancestor-bridge-pill-wrapper">
          <button
            type="button"
            className="vtree-ancestor-bridge-pill vtree-ancestor-bridge-pill--expanded"
            onClick={(e) => {
              e.stopPropagation()
              if (onToggleAncestor) {
                onToggleAncestor(node.id)
              }
            }}
            aria-label={t('hierarchy.collapse_fossil_ancestor_tooltip', 'Fosil atayı daralt ve alt birimleri doğrudan üste bağla')}
          >
            <TRexSkullIcon className="badge-fossil-icon" />
            <CircleMinus size={12} strokeWidth={2.4} />
          </button>
        </div>
      )}

      <div
        className="vtree-card-wrapper"
        data-node-id={node.id}
        data-parent-id={parentId || undefined}
        style={{ position: 'relative' }}
      >
        {/* Node Badge: Card Owner Crown */}
        {node.nodeType === 'owner' ? (
          <div
            style={{
              position: 'absolute',
              top: -9,
              left: 14,
              padding: '3px 6px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, var(--color-warning), #d97706)',
              color: '#fff',
              zIndex: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Crown size={12} strokeWidth={2.5} />
          </div>
        ) : null}

        {/* Assignment Durum Rozeti (Bitişik kısa tire ve solunda Tik / Çöp İkonu) */}
        {(node.nodeType === 'bot' || node.nodeType === 'tribe') && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translate(-100%, -50%)',
              display: 'inline-flex',
              alignItems: 'center',
              zIndex: 4,
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
          >
            {/* İkon */}
            <div
              title={
                node.isDeleted
                  ? t('hierarchy.carrier_deleted', 'Silinmiş Atama (Eski Taşıyıcı)')
                  : t('hierarchy.carrier_active', 'Aktif Taşıyıcı')
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--color-bg)',
                border: `1.5px solid ${node.isDeleted ? 'var(--color-error)' : 'var(--color-primary)'}`,
                color: node.isDeleted ? 'var(--color-error)' : 'var(--color-primary)',
                boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.12))',
                cursor: 'help',
                flexShrink: 0,
              }}
            >
              {node.isDeleted ? (
                <Trash2 size={12} strokeWidth={2.4} />
              ) : (
                <Check size={12} strokeWidth={2.8} />
              )}
            </div>

            {/* Bitişik kısacık yatay çizgi (--) */}
            <div
              style={{
                width: 10,
                height: 2,
                background: node.isDeleted ? 'var(--color-error)' : 'var(--color-primary)',
                flexShrink: 0,
              }}
            />
          </div>
        )}

        {/* Render Node Content */}
        {node.nodeType === 'card' ? (
          <div style={{ width: 350, maxWidth: 380, textAlign: 'left' }}>
            <PersonalityCard card={node.card} showMark={false} />
          </div>
        ) : node.nodeType === 'tribe' ? (
          <div style={{ position: 'relative', width: '100%', minWidth: 180 }}>
            <TribeMinimalCard
              tribe={node.tribe || node.data}
              tribeId={node.tribe?.tribeId || node.data?.tribeId}
              tribeName={node.tribe?.tribeName || node.data?.tribeName}
              tribePoint={node.tribe?.tribePoint ?? node.data?.tribePoint}
              imageUrl={node.tribe?.imageUrl || node.data?.imageUrl}
              isDormant={isNodeFossil(node)}
              assignedCardIds={node.tribe?.assignedCardIds || node.tribe?.AssignedCardIds || node.data?.assignedCardIds || node.data?.AssignedCardIds}
              variant="expanded"
              clickable={true}
              style={{
                margin: 0,
                minWidth: 180,
                width: '100%',
                background: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                transform: 'none',
              }}
            />

            {/* Tribe alt alanı: Üst karttan ince line ile ayrılan, siyah/arka plan ile bütünleşik bot listesi */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                marginTop: -1,
                background: 'var(--color-bg)',
                borderLeft: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                borderTop: '1px solid var(--color-border)',
                borderBottomLeftRadius: 'var(--radius-md, 8px)',
                borderBottomRightRadius: 'var(--radius-md, 8px)',
                boxSizing: 'border-box',
              }}
            >
              {/* 3 Bot İkonu ve Dikey ... */}
              <div
                className="vtree-tribe-bots"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  paddingLeft: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  gap: 8,
                }}
              >
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="vtree-tribe-bot-icon"
                  >
                    <BotIcon size={26} />
                  </div>
                ))}

                {/* Dikey üç nokta (...) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    gap: 4,
                    padding: '2px 0 4px',
                  }}
                >
                  {[0, 1, 2].map((dotIdx) => (
                    <span
                      key={dotIdx}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        boxShadow: '0 0 4px var(--color-primary-shadow)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ActorMinimalCard
            actor={
              isFossilLike
                ? { ...(node.actor || node.bot || node.data), isDormant: true }
                : node.actor || node.bot || node.data
            }
            showHierarchyBtn={true}
            clickable={true}
            variant="expanded"
            chipStyle={
              node.nodeType === 'owner'
                ? {
                    background: 'color-mix(in srgb, var(--color-warning) 8%, var(--color-surface))',
                    borderColor: 'var(--color-warning)',
                    boxShadow: '0 3px 10px rgba(217, 119, 6, 0.18)',
                    minWidth: 195,
                  }
                : isEnjectedFossil
                  ? {
                      background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
                      borderColor: 'var(--color-primary)',
                      boxShadow: '0 3px 10px var(--color-primary-shadow)',
                      minWidth: 190,
                    }
                  : {
                      background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                      minWidth: 190,
                    }
            }
          />
        )}

        {/* Toggle Expand/Collapse Button */}
        {hasChildren && (
          <button
            type="button"
            className="vtree-toggle-btn"
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed((c) => !c)
            }}
            aria-label={
              isCollapsed
                ? t('hierarchy.expand', 'Genişlet')
                : t('hierarchy.collapse', 'Daralt')
            }
          >
            {isCollapsed ? <CirclePlus size={28} strokeWidth={2.2} /> : <CircleMinus size={28} strokeWidth={2.2} />}
          </button>
        )}
      </div>

      {/* Children Branches */}
      {hasChildren && !isCollapsed && (
        <div className="vtree-children-container">
          <div className="vtree-stem-down" />
          <div className="vtree-children-row">
            {/* 1. Araya Enjekte Edilmiş Fosil Atalar */}
            {enjectedFossilChildren.map((child) => (
              <div key={`enjected-${child.id}`} className="vtree-child-branch vtree-child-branch--enjected-fossil">
                <div className="vtree-branch-line" />
                <CardTreeNode
                  node={child}
                  parentId={node.id}
                  isAllCollapsed={isAllCollapsed}
                  expandTrigger={expandTrigger}
                  showFossils={showFossils}
                  expandedAncestorIds={expandedAncestorIds}
                  onToggleAncestor={onToggleAncestor}
                  isEnjectedFossil={true}
                />
              </div>
            ))}

            {/* 2. Aktif & Terfi Etmiş Birimler */}
            {displayActiveChildren.map((child) => (
              <div key={child.id} className="vtree-child-branch">
                <div className="vtree-branch-line" />
                <CardTreeNode
                  node={child}
                  parentId={node.id}
                  isAllCollapsed={isAllCollapsed}
                  expandTrigger={expandTrigger}
                  showFossils={showFossils}
                  expandedAncestorIds={expandedAncestorIds}
                  onToggleAncestor={onToggleAncestor}
                  fossilAncestors={child._fossilAncestors}
                  isEnjectedFossil={Boolean(child._isEnjectedFossil)}
                />
              </div>
            ))}

            {/* 3. Saf Fosil Birimleri Grubu (Açılım Noktasında Sabit Hap + Alt Dallar) */}
            {totalPureFossils > 0 && (
              <div className="vtree-child-branch vtree-child-branch--fossil-group">
                <div className="vtree-branch-line" />
                <div
                  className="vtree-card-wrapper"
                  data-node-id={`fossil-pill-${node.id}`}
                  data-parent-id={node.id}
                >
                  <button
                    type="button"
                    className={`vtree-fossil-pill ${effectiveFossilExpanded ? 'vtree-fossil-pill--expanded' : ''}`}
                    onClick={() => setLocalFossilExpanded(!effectiveFossilExpanded)}
                    aria-label={
                      effectiveFossilExpanded
                        ? t('hierarchy.hide_fossils', 'Fosilleşmiş alt birimleri daralt')
                        : t('hierarchy.show_fossils', 'Fosilleşmiş alt birimleri göster')
                    }
                  >
                    <TRexSkullIcon className="badge-fossil-icon" />
                    <span>{totalPureFossils}</span>
                    {effectiveFossilExpanded ? (
                      <CircleMinus size={15} strokeWidth={2.2} />
                    ) : (
                      <CirclePlus size={15} strokeWidth={2.2} />
                    )}
                  </button>
                </div>

                {effectiveFossilExpanded && (
                  <div className="vtree-children-container">
                    <div className="vtree-stem-down" />
                    <div className="vtree-children-row">
                      {pureFossilChildren.map((child) => (
                        <div key={child.id} className="vtree-child-branch vtree-child-branch--fossil">
                          <div className="vtree-branch-line" />
                          <CardTreeNode
                            node={child}
                            parentId={`fossil-pill-${node.id}`}
                            isAllCollapsed={isAllCollapsed}
                            expandTrigger={expandTrigger}
                            showFossils={showFossils}
                            expandedAncestorIds={expandedAncestorIds}
                            onToggleAncestor={onToggleAncestor}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────────
export default function PersonalityCardHierarchyPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const cardId = searchParams.get('cardId') || searchParams.get('ownershipId')
  const navigate = useNavigate()
  const [includeHistory, setIncludeHistory] = useState(false)

  const {
    data: cardData = null,
    isLoading,
    error: queryError,
    refetch: loadHierarchy,
  } = useQuery({
    queryKey: ['cardHierarchy', cardId, includeHistory],
    queryFn: async () => {
      const res = await personalityCardApi.getCardHierarchy(cardId, includeHistory)
      const payload = res.data?.data !== undefined ? res.data.data : res.data
      if (payload && (payload.personalityCardId || payload.cardId || res.data?.success)) {
        return payload
      }
      throw new Error(res.data?.message || t('card.load_failed', 'Hiyerarşi verisi yüklenemedi.'))
    },
    enabled: Boolean(cardId),
  })

  const error = !cardId
    ? t('card.no_card_id', 'Kart ID bilgisi bulunamadı.')
    : queryError
    ? queryError.response?.data?.message || queryError.message || t('card.load_error', 'Bağlantı hatası oluştu.')
    : null

  const [showFossils, setShowFossils] = useState(false)
  const [expandedAncestorIds, setExpandedAncestorIds] = useState(() => new Set())

  const handleToggleAncestor = useCallback((ancestorId) => {
    setExpandedAncestorIds((prev) => {
      const next = new Set(prev)
      if (next.has(ancestorId)) {
        next.delete(ancestorId)
      } else {
        next.add(ancestorId)
      }
      return next
    })
  }, [])
  const [zoomLevel, setZoomLevel] = useState(0.85)
  const [isViewReady, setIsViewReady] = useState(false)
  // Sınırsız pan: scroll sınırları yerine transform translate ile her yöne serbest kaydırma
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isAllCollapsed, setIsAllCollapsed] = useState(false)
  const [expandTrigger, setExpandTrigger] = useState(0)

  // Dokunmatik pan/zoom handler'ları stale closure'a düşmesin diye güncel değer ref'leri
  const zoomLevelRef = useRef(zoomLevel)
  useEffect(() => { zoomLevelRef.current = zoomLevel }, [zoomLevel])
  const panOffsetRef = useRef(panOffset)
  useEffect(() => { panOffsetRef.current = panOffset }, [panOffset])

  const blockRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  // Drag-to-pan state & refs
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

  const treeContainerRef = useRef(null)

  const treeRoot = useMemo(() => {
    return buildCardHierarchyTree(cardData, includeHistory)
  }, [cardData, includeHistory])

  const fossilCount = useMemo(() => {
    const countFossils = (node) => {
      if (!node || !node.children) return 0
      return node.children.reduce(
        (sum, child) => sum + (isNodeFossil(child) ? 1 : 0) + countFossils(child),
        0
      )
    }
    return countFossils(treeRoot)
  }, [treeRoot])

  const deletedAssignmentCount = useMemo(() => {
    if (!cardData || !Array.isArray(cardData.assignments)) return 0
    return cardData.assignments.filter((ass) => ass.isDeleted || ass.IsDeleted).length
  }, [cardData])

  const [lastKnownDeletedCount, setLastKnownDeletedCount] = useState(0)

  useEffect(() => {
    if (includeHistory && cardData && Array.isArray(cardData.assignments)) {
      const count = cardData.assignments.filter((ass) => ass.isDeleted || ass.IsDeleted).length
      if (count > 0) {
        setLastKnownDeletedCount(count)
      }
    }
  }, [includeHistory, cardData])

  const displayDeletedCount = includeHistory ? deletedAssignmentCount : lastKnownDeletedCount

  // İlk giriş (oto-zoom) ile Default butonunun birebir aynı görünümü üretmesi için ortak rutin:
  // içeriğe sığacak zoom hesapla → yatayda ortala (pan) → dikeyde başlangıcı en üstte tut.
  // Kök node'u ekranın yatay merkezine oturtur.
  // Ölçüm transform'u (mevcut pan'ı) da içerdiği için DELTA olarak uygulanır ve
  // mevcut pan'a eklenir; böylece Default art arda basılsa da sola/ortaya zıplamaz.
  const centerRootOnView = () => {
    const container = containerRef.current
    if (!container) return
    const rootEl = container.querySelector('.vtree-node')
    if (!rootEl) return
    const c = container.getBoundingClientRect()
    const r = rootEl.getBoundingClientRect()
    const deltaX = c.left + c.width / 2 - (r.left + r.width / 2)

    // İçerik görünüm alanından kısaysa dikeyde ortala (tek owner'lı gibi kısa ağaçlarda
    // owner altta tek başına kalmasın); uzunsa üstten başlasın.
    let targetY = 0
    const zoomEl = treeContainerRef.current
    if (zoomEl) {
      const contentH = zoomEl.offsetHeight
      if (contentH < container.clientHeight) {
        targetY = (container.clientHeight - contentH) / 2
      }
    }

    setPanOffset((prev) => ({ x: prev.x + deltaX, y: targetY }))
  }

  // Doğal boyut ilk seferde ölçülüp önbelleğe alınır; Default'a art arda basınca sapma (drift) olmaz.
  const naturalSizeRef = useRef(null)

  const fitToDefaultView = () => {
    const container = containerRef.current
    const zoomEl = treeContainerRef.current
    if (!container || !zoomEl || !treeRoot) return

    let natW = 0
    let natH = 0
    if (naturalSizeRef.current) {
      natW = naturalSizeRef.current.w
      natH = naturalSizeRef.current.h
    } else {
      if (zoomEl.offsetWidth === 0) return
      const currentZoom = zoomLevel > 0 ? zoomLevel : 0.85
      // Dekoratif padding'leri (üst 130 + alt 48, sağ/sol 40'ar) doğal boyuttan düş;
      // böylece gerçek node alanına göre fit yapılır ve Default hem yakın hem tam sığar.
      natW = Math.max(1, (zoomEl.offsetWidth - 80) / currentZoom)
      natH = Math.max(1, (zoomEl.offsetHeight - 178) / currentZoom)
      naturalSizeRef.current = { w: natW, h: natH }
    }

    const availW = Math.max(1, container.clientWidth - 8)
    const availH = Math.max(1, container.clientHeight - 8)
    const fit = Math.min(availW / Math.max(1, natW), availH / Math.max(1, natH))
    // Her şeyi sığdır: bonus yok, zoom en fazla %100; çok büyük içerikte de iyice küçülerek tümünü gösterir.
    const nextZoom = Math.max(0.02, Math.min(1.0, +(fit).toFixed(2)))

    setZoomLevel(nextZoom)

    // Yeni zoom'un render commit'ini garanti altına almak için çift rAF ile merkezle.
    // Aksi halde 80ms'lik sabit timeout, yeni zoom'dan ÖNCE ölçüm yapıp pan'ı kaydırır
    // (Default'a art arda basınca görünümün sürekli değişmesine yol açar).
    requestAnimationFrame(() => requestAnimationFrame(() => centerRootOnView()))
  }

  const handleDefaultView = () => fitToDefaultView()

  // Ağaç ilk yüklendiğinde: gizli render → oto-zoom + ortala → tek karede göster (flicker yok)
  useEffect(() => {
    if (!treeRoot || !containerRef.current) {
      setIsViewReady(false)
      return
    }
    setIsViewReady(false)
    const container = containerRef.current
    container.scrollLeft = 0
    container.scrollTop = 0
    const timer = setTimeout(() => {
      const zoomEl = treeContainerRef.current
      if (!zoomEl || zoomEl.offsetWidth === 0) {
        setIsViewReady(true)
        return
      }
      fitToDefaultView()
      setTimeout(() => setIsViewReady(true), 140)
    }, 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeRoot])

  // Mobil: tek parmak pan + iki parmak pinch-zoom
  const { onTouchStart, onTouchMove, onTouchEnd, lastTouchAt } = useTouchPanZoom({
    containerRef,
    zoomRef: zoomLevelRef,
    panRef: panOffsetRef,
    setZoom: setZoomLevel,
    setPan: setPanOffset,
    panState,
  })

  // Mouse pan event handlers (transform tabanlı sınırsız kaydırma)
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
      startPanX: panOffsetRef.current.x,
      startPanY: panOffsetRef.current.y,
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
      const newPan = {
        x: panState.current.startPanX + deltaX,
        y: panState.current.startPanY + deltaY,
      }
      panOffsetRef.current = newPan
      setPanOffset(newPan)
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

  // Kamera orta noktasını (viewport center) referans alarak yakınlaştır/uzaklaştır
  const handleZoom = useCallback((targetZoomOrFn) => {
    const container = containerRef.current
    if (!container) return

    const prevZoom = zoomLevelRef.current
    const nextZoom = typeof targetZoomOrFn === 'function'
      ? targetZoomOrFn(prevZoom)
      : targetZoomOrFn

    const clampedZoom = Math.min(2.5, Math.max(0.05, +nextZoom.toFixed(2)))
    if (clampedZoom === prevZoom) return

    const rect = container.getBoundingClientRect()
    const cs = window.getComputedStyle(container)
    const padLeft = parseFloat(cs.paddingLeft) || 0
    const padTop = parseFloat(cs.paddingTop) || 0

    // Kameranın tam orta noktası (viewport center)
    const cx = (rect.width / 2) - padLeft
    const cy = (rect.height / 2) - padTop

    const ratio = clampedZoom / prevZoom
    const pan = panOffsetRef.current

    const newPan = {
      x: cx - (cx - pan.x) * ratio,
      y: cy - (cy - pan.y) * ratio,
    }

    panOffsetRef.current = newPan
    zoomLevelRef.current = clampedZoom

    setPanOffset(newPan)
    setZoomLevel(clampedZoom)
  }, [])

  // Mouse tekerleği: Normal tekerlek ile kamerayı kaydır (pan), Ctrl + tekerlek ile zoom yap
  useEffect(() => {
    const targetEl = blockRef.current || containerRef.current
    if (!targetEl) return

    const handleWheel = (e) => {
      // 1. Ctrl + Tekerlek veya Meta + Tekerlek (Trackpad pinch dahil) -> Kamera Yakınlaştır / Uzaklaştır (Kamera merkezli)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const factor = Math.abs(e.deltaY) < 20 ? -e.deltaY * 0.005 : (e.deltaY < 0 ? 0.05 : -0.05)
        handleZoom((prev) => prev + factor)
        return
      }

      // 2. Normal Tekerlek -> Kamera Kaydırma (Pan)
      e.preventDefault()
      const dx = e.shiftKey ? -e.deltaY : -e.deltaX
      const dy = e.shiftKey ? 0 : -e.deltaY

      const newPan = {
        x: panOffsetRef.current.x + dx,
        y: panOffsetRef.current.y + dy,
      }
      panOffsetRef.current = newPan
      setPanOffset(newPan)
    }

    targetEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      targetEl.removeEventListener('wheel', handleWheel)
    }
  }, [handleZoom, isLoading])

  const handleToggleAll = () => {
    setIsAllCollapsed((prev) => !prev)
    setExpandTrigger((c) => c + 1)
  }

  const card = cardData
  const ownersCount = cardData?.owners?.length ?? cardData?.ownershipCount ?? 0
  const assignmentsCount = cardData?.assignments?.length ?? cardData?.assignmentCount ?? 0

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
      {/* ── Floating Controls & Header ──────────────────────────────────────── */}
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
        {/* Left: Back button & Card Identity Badge */}
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
            maxWidth: '100%',
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <BackButton style={{ marginBottom: 0, width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ width: 1, height: 24, background: 'var(--color-border)', flexShrink: 0 }} />

          <div
            className="hierarchy-header-identity"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
              flex: '1 1 auto',
              overflow: 'hidden',
            }}
          >
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
                flexShrink: 0,
              }}
            >
              <span className="hierarchy-header-label-full">
                {t('hierarchy.card_hierarchy_title', 'Card Hierarchy')}
              </span>
              <span className="hierarchy-header-label-short">
                {t('hierarchy.card_hierarchy_title_short', 'Kart')}
              </span>
            </span>
            <span className="hierarchy-header-bullet" style={{ color: 'var(--color-primary)', flexShrink: 0, transform: 'translateY(-1px)' }}>•</span>
            <span
              onClick={() => {
                navigate('/cards')
              }}
              style={{
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                transform: 'translateY(1px)',
                minWidth: 0,
                flex: '0 1 auto',
              }}
            >
              {card?.cardName ? `${card.cardName}` : t('hierarchy.no_name', 'isim')}
            </span>
          </div>
        </div>

        {/* Right: Controls Toolbar */}
        <div className="hierarchy-header-right" style={{ flexShrink: 0 }}>
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
            {/* Owners Count Badge */}
            <div
              className="hierarchy-count-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                padding: '0 4px',
              }}
            >
              <Crown size={14} color="var(--color-warning)" />
              <span>{ownersCount}</span>
              <span className="hierarchy-count-badge__text" style={{ fontSize: 11, opacity: 0.7 }}>{t('card.owners', 'Sahip')}</span>
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

            {/* Node Count Badge */}
            <div
              className="hierarchy-count-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                padding: '0 4px',
              }}
            >
              <BotIconLucide size={14} color="var(--color-primary)" />
              <span>{assignmentsCount}</span>
              <span className="hierarchy-count-badge__text" style={{ fontSize: 11, opacity: 0.7 }}>{t('card.assignees', 'Atama')}</span>
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

            {/* Zoom Level Indicator */}
            <span
              className="hierarchy-zoom-pct"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                minWidth: 42,
                textAlign: 'center',
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </span>

            {/* Zoom Controls */}
            <button
              type="button"
              className="btn btn-ghost btn-sm hierarchy-zoom-btn"
              onClick={() => handleZoom((z) => z + 0.1)}
              aria-label={t('hierarchy.zoom_in', 'Büyüt (+)')}
              style={{ flexShrink: 0, width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm hierarchy-zoom-btn"
              onClick={() => handleZoom((z) => z - 0.1)}
              aria-label={t('hierarchy.zoom_out', 'Küçült (-)')}
              style={{ flexShrink: 0, width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Minus size={12} />
            </button>
          </div>

          <div className="hierarchy-toolbar-main">
            {/* Expand / Collapse All */}
          <button
            type="button"
            className={`btn btn-sm hierarchy-toggle-btn ${!isAllCollapsed ? 'hierarchy-toggle-btn--active' : ''}`}
            onClick={handleToggleAll}
            disabled={!treeRoot}
            aria-label={isAllCollapsed ? t('hierarchy.expand_all', 'Tümünü Genişlet') : t('hierarchy.collapse_all', 'Tümünü Daralt')}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px', height: 26 }}
          >
            {isAllCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            <span>{isAllCollapsed ? t('hierarchy.expand_all', 'Tümünü Genişlet') : t('hierarchy.collapse_all', 'Tümünü Daralt')}</span>
          </button>

          {/* Fosil Düğümleri Göster / Gizle Toggle */}
          <FossilTogglePill
            count={fossilCount}
            open={showFossils}
            onToggle={() => setShowFossils((prev) => !prev)}
            style={{ flexShrink: 0 }}
          />

          {/* Tarihsel Sirkülasyon / Çöp Kutusu Hap Butoncuğu (FossilTogglePill Tasarımı) */}
          <button
            type="button"
            className={`vtree-fossil-pill ${includeHistory ? 'vtree-fossil-pill--expanded' : ''}`}
            onClick={() => {
              setIncludeHistory((prev) => {
                const next = !prev
                if (next) {
                  setIsAllCollapsed(true)
                  setExpandTrigger((c) => c + 1)
                }
                return next
              })
            }}
            aria-label={includeHistory ? t('hierarchy.history_mode_on', 'Tarihsel Sirkülasyon') : t('hierarchy.history_mode_off', 'Aktif Sirkülasyon')}
            title={t('hierarchy.history_mode_tooltip', 'Tüm geçmiş aktarım sirkülasyonunu göster')}
            style={{ flexShrink: 0 }}
          >
            <Trash2
              size={14}
              style={{
                flexShrink: 0,
              }}
            />
            <span>{displayDeletedCount}</span>
            {includeHistory ? (
              <CircleMinus size={15} strokeWidth={2.2} />
            ) : (
              <CirclePlus size={15} strokeWidth={2.2} />
            )}
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

          {/* Default Görünüm */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDefaultView}
            disabled={!treeRoot}
            aria-label={t('hierarchy.default_view', 'Varsayılan')}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px', height: 26 }}
          >
            <Focus size={12} />
            <span>{t('hierarchy.default_view', 'Varsayılan')}</span>
          </button>
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
          cursor: isPanning ? 'grabbing' : 'grab',
          position: 'relative',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <div className="spinner spinner-lg" />
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <CircleAlert size={36} color="var(--color-danger, #ef4444)" />
            <span style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: 16 }}>
              {error}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={loadHierarchy}
            >
              {t('action.retry', 'Tekrar Dene')}
            </button>
          </div>
        ) : treeRoot ? (
          <div
            style={{
              visibility: isViewReady ? 'visible' : 'hidden',
              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
              willChange: 'transform',
              width: 'max-content',
            }}
          >
          <div
            ref={treeContainerRef}
            className="hierarchy-tree-container personality-card-tree-container"
            style={{
              zoom: zoomLevel,
              '--tree-zoom': zoomLevel,
              minWidth: 'max-content',
              minHeight: 'max-content',
              padding: '130px 40px 48px 40px',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <HierarchyConnectionsOverlay
              containerRef={treeContainerRef}
              data={treeRoot}
              rootActorId={null}
              expandCounter={expandTrigger}
              zoomLevel={zoomLevel}
              enableCardTravel={false}
              pulseInterval={0}
            />
            <CardTreeNode
              node={treeRoot}
              parentId={null}
              isAllCollapsed={isAllCollapsed}
              expandTrigger={expandTrigger}
              showFossils={showFossils}
              expandedAncestorIds={expandedAncestorIds}
              onToggleAncestor={handleToggleAncestor}
            />
          </div>
          </div>
        ) : null}
      </div>

      {/* Auto-zoom hazırlanırken tek karede final görünüm için gizli yükleme spinner'ı */}
      {treeRoot && !isViewReady && (
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
