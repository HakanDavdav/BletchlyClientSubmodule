import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export const EVENT_CATEGORIES = [
  {
    category: 'Custom & System Events',
    events: [
      {
        name: 'GenerateCardHintAndTagsEvent',
        defaultPayload: {
          PersonalityCardId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'DebateStatusEvent',
        defaultPayload: {
          ParentActorId: '',
          DebateId: '',
          Status: 'InProgress',
          CreatedAt: new Date().toISOString(),
        },
      },
    ],
  },
  {
    category: 'Actor Events',
    events: [
      {
        name: 'PostCreatedEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          CreatedPostId: '',
          TribeId: null,
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'EntryCreatedEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          ContentItemId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'LikedEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          ContentItemId: '',
          ReactionType: 'Like',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'FollowedEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          FollowedActorId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'BotCreatedEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          CreatedBotId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'CreatedTribeEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          TribeId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'JoinedTribeEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          TribeId: '',
          JoinedAt: new Date().toISOString(),
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'LeftTribeEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          TribeId: '',
          LeftAt: new Date().toISOString(),
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'ExpelledEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          ExpelledActorId: '',
          TribeId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'PromotedEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          PromotedActorId: '',
          TribeId: '',
          PromotionType: 'Promotion',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'AutoBioRequestEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          RefactoredBotId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'AutoInterestsRequestEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          RefactoredBotId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'EnemyChallengedEvent',
        defaultPayload: {
          ParentActorId: '7abe8920-36be-43f0-95aa-538ee063fe4d',
          CreatedAt: new Date().toISOString(),
        },
      },
    ],
  },
]

export default function SystemEventsPanel() {
  const { t } = useTranslation()
  const initialEvent = EVENT_CATEGORIES[0].events[0]
  const [selectedEventName, setSelectedEventName] = useState(initialEvent.name)
  const [eventType, setEventType] = useState(initialEvent.name)
  const [payload, setPayload] = useState(JSON.stringify(initialEvent.defaultPayload, null, 2))
  const [lastTraceId, setLastTraceId] = useState(null)

  const isActorEvent = EVENT_CATEGORIES.some(
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

  const handleSelectEvent = (eventName) => {
    setSelectedEventName(eventName)
    for (const cat of EVENT_CATEGORIES) {
      const found = cat.events.find((e) => e.name === eventName)
      if (found) {
        setEventType(found.name)
        const newPayload = { ...found.defaultPayload, CreatedAt: new Date().toISOString() }
        setPayload(JSON.stringify(newPayload, null, 2))
        break
      }
    }
  }

  const handleTriggerEvent = () => {
    if (!eventType) return toast.error(t('admin.event_type_required'))
    try {
      const parsed = JSON.parse(payload)
      if (isActorEvent) {
        triggerBotEventMutation.mutate({
          actorId: parsed.ParentActorId,
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
    <div className="card-surface admin-panel-card">
      {/* Header */}
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">
          {t('admin.system_events_title')}
        </h2>
        <p className="admin-panel-subtitle">
          {t('admin.system_events_desc')}
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Custom Event Section */}
        <div className="admin-filter-card">
          <div className="admin-section-title">
            {t('admin.system_events_title')}
          </div>

          {/* Event Category & Type Selector Dropdown */}
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label admin-field-label">
              {t('admin.event_type')}
            </label>
            <select
              className="input w-full admin-input"
              value={selectedEventName}
              onChange={(e) => handleSelectEvent(e.target.value)}
              style={{
                padding: '7px 10px',
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.events.map((ev) => (
                    <option key={ev.name} value={ev.name}>
                      {ev.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
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
      </div>
    </div>
  )
}

