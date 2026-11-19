import { useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import ActorMinimalCard from '../../actor/ActorMinimalCard'
import TribeMinimalCard from '../../tribe/TribeMinimalCard'
import useSearchSuggestions from '../../../hooks/useSearchSuggestions'
import { MentionTargetType } from '../../../constants/enums'
import { mentionNodeAttrs } from './mentionUtils'
import { DropdownOption, DropdownPanel } from '../../common/Dropdown'

const PANEL_WIDTH = 300
const VIEWPORT_GUTTER = 16

/**
 * Mini version of the search suggestions dropdown, opened at the caret while typing "@name".
 * Rendered by TipTap's suggestion plugin through a ReactRenderer; keyboard events are forwarded
 * through the imperative `onKeyDown` handle.
 */
export default function MentionSuggestionList({ ref, query, command }) {
  const { t } = useTranslation()
  const { suggestions, isLoading } = useSearchSuggestions(query, {
    mode: 'general',
    delay: 250,
    generalLimit: 4,
  })

  const items = useMemo(() => {
    if (!suggestions) return []
    const actors = (suggestions.actors || [])
      .filter((a) => !a.isDeleted && a.profileName)
      .map((a) => ({ key: `a:${a.actorId}`, attrs: mentionNodeAttrs(MentionTargetType.Actor, a) }))
    const tribes = (suggestions.tribes || [])
      .filter((tr) => !tr.isDeleted && tr.tribeName)
      .map((tr) => ({ key: `t:${tr.tribeId}`, attrs: mentionNodeAttrs(MentionTargetType.Tribe, tr) }))
    return [...actors, ...tribes]
  }, [suggestions])

  const [selectedIndex, setSelectedIndex] = useState(0)
  useEffect(() => setSelectedIndex(0), [items])

  const select = (index) => {
    const item = items[index]
    if (item) command(item.attrs)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) return false
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length)
        return true
      }
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        select(selectedIndex)
        return true
      }
      return false
    },
  }))

  const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2)

  const actorItems = items.filter((i) => i.attrs.targetType === MentionTargetType.Actor)
  const tribeItems = items.filter((i) => i.attrs.targetType === MentionTargetType.Tribe)

  const renderItem = (item) => {
    const index = items.indexOf(item)
    return (
      <DropdownOption
        key={item.key}
        className="dropdown-option-btn--card lb-card"
        active={index === selectedIndex}
        role="option"
        aria-selected={index === selectedIndex}
        onMouseEnter={() => setSelectedIndex(index)}
        onMouseDown={(e) => {
          // keep editor focus/selection so the suggestion range stays valid
          e.preventDefault()
          select(index)
        }}
      >
        {item.attrs.targetType === MentionTargetType.Tribe ? (
          <TribeMinimalCard tribe={item.attrs.entity} variant="inline" clickable={false} />
        ) : (
          <ActorMinimalCard actor={item.attrs.entity} variant="inline" clickable={false} />
        )}
      </DropdownOption>
    )
  }

  return (
    <DropdownPanel className="mention-suggestion-panel" style={{ width }} role="listbox">
      {!query ? (
        <div className="mention-suggestion-idle" aria-hidden="true">
          <Search size={17} />
        </div>
      ) : isLoading && items.length === 0 ? (
        <div style={{ padding: 12, textAlign: 'center' }}>
          <div className="spinner spinner-sm" />
        </div>
      ) : items.length === 0 ? (
        <div className="search-suggestion-empty">{t('mention.no_results')}</div>
      ) : (
        <>
          {actorItems.length > 0 && (
            <div className="mention-suggestion-group">
              <div className="search-suggestion-header">{t('mention.persons')}</div>
              <div className="minimal-card-list">{actorItems.map(renderItem)}</div>
            </div>
          )}
          {tribeItems.length > 0 && (
            <div className="mention-suggestion-group">
              <div className="search-suggestion-header">{t('mention.tribes')}</div>
              <div className="minimal-card-list">{tribeItems.map(renderItem)}</div>
            </div>
          )}
        </>
      )}
    </DropdownPanel>
  )
}
