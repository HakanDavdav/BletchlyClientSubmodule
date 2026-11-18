import { useState, useMemo, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/authStore'
import { DropdownCaret, DropdownPanel } from '../common/Dropdown'
import { Check } from 'lucide-react'

export const EVENT_CATEGORIES = [
  {
    category: 'Custom & System Events',
    categoryKey: 'custom_system_events',
    events: [
      {
        name: 'GenerateCardHintAndTagsEvent',
        defaultPayload: {
          PersonalityCardId: '',
        },
      },
      {
        name: 'SeedPersonalityEvent',
        developerOnly: true,
        defaultPayload: {
          TribeId: null,
          BotId: null,
        },
      },
    ],
  },
  {
    category: 'Actor Events',
    categoryKey: 'actor_events',
    events: [
      {
        name: 'PostCreatedEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'EntryCreatedEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'LikedEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'FollowedEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'BotCreatedEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'CreatedTribeEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'JoinedTribeEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'LeftTribeEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'ExpelledEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'PromotedEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'AutoBioRequestEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'AutoInterestsRequestEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
      {
        name: 'EnemyChallengedEvent',
        defaultPayload: {
          ParentActorId: '',
        },
      },
    ],
  },
]

export default function SystemEventsPanel() {
  const { t } = useTranslation()
  const isDeveloper = useAuthStore((state) => state.isDeveloper)

  const visibleCategories = useMemo(() => {
    return EVENT_CATEGORIES.map((cat) => ({
      ...cat,
      events: cat.events.filter((ev) => !ev.developerOnly || isDeveloper),
    })).filter((cat) => cat.events.length > 0)
  }, [isDeveloper])

  const initialEvent = visibleCategories[0]?.events[0] || EVENT_CATEGORIES[0].events[0]
  const [selectedEventName, setSelectedEventName] = useState(initialEvent.name)
  const [eventType, setEventType] = useState(initialEvent.name)
  const [payload, setPayload] = useState(JSON.stringify(initialEvent.defaultPayload, null, 2))
  const [resetActorId, setResetActorId] = useState('')
  const [lastTraceId, setLastTraceId] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const isActorEvent = visibleCategories.some(
    (cat) => cat.category === 'Actor Events' && cat.events.some((e) => e.name === selectedEventName)
  )

  const triggerSystemEventMutation = useMutation({
    mutationFn: (data) => adminApi.triggerSystemCustomEvent(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const traceId = res?.headers?.['x-trace-id'] || window.__lastApiSuccessTraceId || null
      setLastTraceId(traceId)
      toast.success(t('admin.system_event_triggered'), {
        traceId,
      })
    },
  })

  const triggerBotEventMutation = useMutation({
    mutationFn: (data) =>
      adminApi.triggerBotEvent(data.actorId, {
        eventType: data.eventType,
        payload: data.payload,
      }),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const traceId = res?.headers?.['x-trace-id'] || window.__lastApiSuccessTraceId || null
      setLastTraceId(traceId)
      toast.success(t('admin.bot_event_triggered'), {
        traceId,
      })
    },
  })

  const resetBotStatusMutation = useMutation({
    mutationFn: (actorId) => adminApi.resetBotStatus(actorId),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const traceId = res?.headers?.['x-trace-id'] || window.__lastApiSuccessTraceId || null
      setLastTraceId(traceId)
      toast.success(t('admin.bot_status_reset_success'), {
        traceId,
      })
    },
  })

  const handleResetBotStatus = (e) => {
    e?.preventDefault?.()
    const trimmed = resetActorId.trim()
    if (!trimmed) {
      return toast.error(t('admin.cleanup_guid_required'))
    }
    resetBotStatusMutation.mutate(trimmed)
  }

  const handleSelectEvent = (eventName) => {
    setSelectedEventName(eventName)
    for (const cat of visibleCategories) {
      const found = cat.events.find((e) => e.name === eventName)
      if (found) {
        setEventType(found.name)
        setPayload(JSON.stringify(found.defaultPayload, null, 2))
        break
      }
    }
  }

  const handleTriggerEvent = () => {
    if (!eventType) return toast.error(t('admin.event_type_required'))
    try {
      const parsed = JSON.parse(payload)
      if (isActorEvent) {
        const actorId = parsed.ParentActorId?.trim()
        if (!actorId) {
          return toast.error(t('admin.cleanup_guid_required'))
        }
        triggerBotEventMutation.mutate({
          actorId,
          eventType,
          payload: parsed,
        })
      } else {
        triggerSystemEventMutation.mutate({ eventType, payload: parsed })
      }
    } catch {
      toast.error(t('admin.invalid_json_payload'))
    }
  }

  const isLoading = triggerSystemEventMutation.isPending || triggerBotEventMutation.isPending

  return (
    <div className="admin-panel-card">
      {/* Header */}
      <div className="admin-panel-header">
        <h2 className="section-divider-title" style={{ margin: 0 }}>
          {t('admin.system_events_title')}
        </h2>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Custom Event Section */}
        <div className="admin-filter-card">
          <div className="admin-section-title">
            {t('admin.system_events_title')}
          </div>

          {/* Event Category & Type Selector Dropdown */}
          <div className="form-group" style={{ marginBottom: '10px', position: 'relative' }} ref={dropdownRef}>
            <label className="form-label admin-field-label">
              {t('admin.event_type')}
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="input w-full admin-input flex items-center justify-between cursor-pointer"
              style={{
                padding: '7px 10px',
                fontSize: 12.5,
                textAlign: 'left',
                color: 'var(--color-text)',
              }}
            >
              <span style={{ fontWeight: 500 }}>{selectedEventName}</span>
              <DropdownCaret open={isDropdownOpen} />
            </button>

            <DropdownPanel
              open={isDropdownOpen}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                zIndex: 60,
                maxHeight: 260,
                overflowY: 'auto',
              }}
            >
              {visibleCategories.map((cat) => (
                <div key={cat.category} style={{ marginBottom: 4 }}>
                  <div
                    style={{
                      padding: '6px 10px 4px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {cat.categoryKey ? t(`admin.${cat.categoryKey}`) : cat.category}
                  </div>
                  {cat.events.map((ev) => {
                    const isSelected = selectedEventName === ev.name
                    return (
                      <button
                        key={ev.name}
                        type="button"
                        className={`dropdown-option-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          handleSelectEvent(ev.name)
                          setIsDropdownOpen(false)
                        }}
                        style={{ fontSize: 12.5 }}
                      >
                        <span>{ev.name}</span>
                        {isSelected && (
                          <Check size={14} style={{ color: 'var(--color-primary)' }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </DropdownPanel>
          </div>

          {/* Payload JSON Editor */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label admin-field-label">
              {t('admin.payload')}
            </label>
            <textarea
              className="input w-full admin-input admin-input--mono"
              value={payload}
              onChange={(e) => {
                setPayload(e.target.value)
              }}
              spellCheck={false}
              style={{
                fontSize: 12,
                minHeight: 120,
                lineHeight: 1.5,
                padding: '8px 10px',
                whiteSpace: 'pre',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            className="btn btn-primary admin-btn"
            onClick={handleTriggerEvent}
            disabled={isLoading}
          >
            {isLoading ? t('admin.processing') : t('admin.trigger_event')}
          </button>

          {lastTraceId && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 2,
                }}
              >
                {t('admin.trace_id')}
              </div>
              <code
                style={{
                  fontSize: 12,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  color: '#22c55e',
                  wordBreak: 'break-all',
                }}
              >
                {lastTraceId}
              </code>
            </div>
          )}
        </div>

        {/* Reset Bot Status Section */}
        <div className="admin-filter-card">
          <div className="admin-section-title">
            {t('admin.reset_bot_status_title')}
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label admin-field-label">
              {t('admin.actor_id')}
            </label>
            <input
              type="text"
              className="input w-full admin-input admin-input--mono"
              placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
              value={resetActorId}
              onChange={(e) => setResetActorId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleResetBotStatus()
                }
              }}
              style={{
                fontSize: 12.5,
                padding: '7px 10px',
              }}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary admin-btn"
            onClick={handleResetBotStatus}
            disabled={resetBotStatusMutation.isPending}
          >
            {resetBotStatusMutation.isPending ? t('admin.processing') : t('admin.reset_status_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

