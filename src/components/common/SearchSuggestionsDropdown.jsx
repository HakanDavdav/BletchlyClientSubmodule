import { Clock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import PostMinimalCard from '../content/PostMinimalCard'

export default function SearchSuggestionsDropdown({
  show,
  query,
  mode = 'general',
  isLoading,
  suggestions,
  recentSearches = [],
  onSelectRecent,
  onRemoveRecent,
  onSelectSuggestion,
  maxHeight = 400,
  marginTop = 4,
}) {
  const { t } = useTranslation()
  const hasContent =
    (query && query.trim().length > 0) || (recentSearches && recentSearches.length > 0)

  return (
    <AnimatePresence>
      {show && hasContent && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 300,
            maxHeight,
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <div className="spinner spinner-sm" />
            </div>
          ) : !query || query.trim().length === 0 ? (
            <div style={{ padding: '6px 8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {t('search.recent')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentSearches.slice(0, 5).map((item) => (
                  <div
                    key={item}
                    onClick={() => onSelectRecent?.(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      fontSize: 13,
                      color: 'var(--color-text)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface-2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Clock
                        size={14}
                        style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
                      />
                      <span className="truncate">{item}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveRecent?.(item)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text-faint)',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: 8,
                        flexShrink: 0,
                        opacity: 0.6,
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.6'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : suggestions ? (
            <div style={{ padding: 8 }}>
              {mode === 'general' ? (
                <>
                  {suggestions.actors?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div className="search-suggestion-header">{t('common.actors')}</div>
                      <div className="minimal-card-list">
                        {suggestions.actors.slice(0, 3).map((actor) => (
                          <div
                            key={actor.actorId}
                            className="lb-card"
                            style={{ padding: '8px 16px', cursor: 'pointer' }}
                            onClick={() => onSelectSuggestion?.()}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <ActorMinimalCard actor={actor} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.tribes?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div className="search-suggestion-header">{t('common.tribes')}</div>
                      <div className="minimal-card-list">
                        {suggestions.tribes.slice(0, 3).map((tribe) => (
                          <div
                            key={tribe.tribeId}
                            onClick={() => onSelectSuggestion?.()}
                          >
                            <TribeMinimalCard {...tribe} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.posts?.length > 0 && (
                    <div>
                      <div className="search-suggestion-header">{t('common.posts')}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {suggestions.posts.slice(0, 4).map((post) => (
                          <div
                            key={post.contentItemId}
                            onClick={() => onSelectSuggestion?.()}
                          >
                            <PostMinimalCard {...post} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!suggestions.posts || suggestions.posts.length === 0) &&
                    (!suggestions.actors || suggestions.actors.length === 0) &&
                    (!suggestions.tribes || suggestions.tribes.length === 0) && (
                      <div className="search-suggestion-empty">{t('search.no_results')}</div>
                    )}
                </>
              ) : (
                <>
                  {mode === 'posts' && suggestions.posts?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {suggestions.posts.map((post) => (
                        <div
                          key={post.contentItemId}
                          onClick={() => onSelectSuggestion?.()}
                        >
                          <PostMinimalCard {...post} />
                        </div>
                      ))}
                    </div>
                  )}

                  {mode === 'actors' && suggestions.actors?.length > 0 && (
                    <div className="minimal-card-list">
                      {suggestions.actors.map((actor) => (
                        <div
                          key={actor.actorId}
                          className="lb-card"
                          style={{ padding: '8px 16px', cursor: 'pointer' }}
                          onClick={() => onSelectSuggestion?.()}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <ActorMinimalCard actor={actor} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mode === 'tribes' && suggestions.tribes?.length > 0 && (
                    <div className="minimal-card-list">
                      {suggestions.tribes.map((tribe) => (
                        <div
                          key={tribe.tribeId}
                          onClick={() => onSelectSuggestion?.()}
                        >
                          <TribeMinimalCard {...tribe} />
                        </div>
                      ))}
                    </div>
                  )}

                  {((mode === 'posts' &&
                    (!suggestions.posts || suggestions.posts.length === 0)) ||
                    (mode === 'actors' &&
                      (!suggestions.actors || suggestions.actors.length === 0)) ||
                    (mode === 'tribes' &&
                      (!suggestions.tribes || suggestions.tribes.length === 0))) && (
                    <div className="search-suggestion-empty">{t('search.no_results')}</div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="search-suggestion-empty">{t('search.no_results')}</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

