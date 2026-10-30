import React from 'react'
import PostCard from './PostCard'
import EntryCard from './EntryCard'
import useAuthStore from '../../store/authStore'
import { useTranslation } from 'react-i18next'

export default function ContextualEntryThread({
  entryDto,
  hideCardStyle = false,
  readMode = 'childToParent',
  depth = 0,
  queryKey,
  hideRootPost = false,
  defaultExpandedEntryIds = null,
}) {
  const { isLoggedIn, actorId } = useAuthStore()
  const { t } = useTranslation()

  if (!entryDto) return null

  const isOwner = (item) => isLoggedIn && item?.actor?.actorId === actorId

  // --- childToParent mod mantığı ---
  const buildParentChain = (entry) => {
    const chain = []
    let current = entry?.parentEntry
    const seen = new Set()
    while (current) {
      if (seen.has(current.contentItemId)) break
      seen.add(current.contentItemId)
      chain.unshift(current) // başa ekle → root'a yakın üstte olur
      current = current.parentEntry
    }
    return chain
  }

  const parentChain = buildParentChain(entryDto)
  const rootPost = parentChain.length > 0 ? parentChain[0].parentPost : entryDto.parentPost

  if (readMode === 'childToParent') {
    return (
      <div
        className={hideCardStyle ? 'flex-col gap-4' : 'flex-col gap-4 card'}
        style={hideCardStyle ? {} : { padding: '16px', background: 'var(--color-bg)' }}
      >
        {/* ── Root Post ──────────────────────────────────────────────────────── */}
        {!hideRootPost && rootPost && (
          <div>
            <SectionLabel color="var(--color-text-faint)">{t('contextual.root_post', 'ANA BAŞLIK')}</SectionLabel>
            <PostCard {...rootPost} isOwner={isOwner(rootPost)} />
          </div>
        )}

        {/* ── Parent Entry Zinciri ───────────────────────────────────────────── */}
        {parentChain.length > 0 && (
          <div>
            <SectionLabel color="var(--color-text-faint)">{t('contextual.context', 'BAĞLAM')}</SectionLabel>
            <div className="flex-col" style={{ gap: 2 }}>
              {parentChain.map((parentEntry, idx) => (
                <div
                  key={parentEntry.contentItemId + '-' + idx}
                  style={{
                    marginLeft: idx * 14,
                    opacity: Math.max(0.45, 1 - idx * 0.15),
                    borderLeft: '2px solid var(--color-border)',
                    paddingLeft: 12,
                    paddingTop: 4,
                    paddingBottom: 4,
                  }}
                >
                  <EntryCard
                    {...parentEntry}
                    depth={idx}
                    entryDepth={parentEntry.depth}
                    isOwner={isOwner(parentEntry)}
                    queryKey={queryKey}
                    defaultExpandedEntryIds={defaultExpandedEntryIds}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Odaklanan Entry (highlight) ────────────────────────────────────── */}
        <div style={{ marginLeft: parentChain.length * 14 }}>
          <SectionLabel color="var(--color-primary)">{t('contextual.focused_reply', 'ODAKLANAN YANIT')}</SectionLabel>
          <div
            style={{
              borderLeft: '3px solid var(--color-primary)',
              borderRadius: '0 8px 8px 0',
              background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
              paddingLeft: 12,
            }}
          >
            <EntryCard
              {...entryDto}
              depth={parentChain.length}
              entryDepth={entryDto.depth}
              isOwner={isOwner(entryDto)}
              queryKey={queryKey}
              defaultExpandedEntryIds={defaultExpandedEntryIds}
            />
          </div>
        </div>
      </div>
    )
  }

  // --- parentToChild mod mantığı ---
  if (readMode === 'parentToChild') {
    return (
      <div
        className={hideCardStyle ? 'flex-col gap-4' : 'flex-col gap-4 card'}
        style={hideCardStyle ? {} : { padding: '16px', background: 'var(--color-bg)' }}
      >
        {!hideRootPost && rootPost && (
          <div>
            <SectionLabel color="var(--color-text-faint)">{t('contextual.root_post', 'ANA BAŞLIK')}</SectionLabel>
            <PostCard {...rootPost} isOwner={isOwner(rootPost)} />
          </div>
        )}

        <div>
          <EntryCard
            {...entryDto}
            depth={0}
            entryDepth={entryDto.depth}
            isOwner={isOwner(entryDto)}
            queryKey={queryKey}
            defaultExpandedEntryIds={defaultExpandedEntryIds}
          />
        </div>
      </div>
    )
  }

  return null
}

// ─── küçük yardımcı ──────────────────────────────────────────────────────────
function SectionLabel({ children, color }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color,
        marginBottom: 6,
        paddingLeft: 4,
      }}
    >
      {children}
    </p>
  )
}
