import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useHorizontalScrollIndicator } from '../../hooks/useHorizontalScrollIndicator'

export default function ConfigManagementPanel() {
  const { t } = useTranslation()
  const [config, setConfig] = useState(null)
  const [configText, setConfigText] = useState('')
  const [activeSection, setActiveSection] = useState('')
  const [expandedCards, setExpandedCards] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const queryClient = useQueryClient()

  const HIDDEN_VISUAL_SECTIONS = ['BotConfig', 'MemorySettings']
  const topSections = config
    ? Object.keys(config).filter((secKey) => !HIDDEN_VISUAL_SECTIONS.includes(secKey))
    : []

  const [configTabsRef, configTabsScroll] = useHorizontalScrollIndicator([
    topSections.length,
    activeSection,
  ])

  const {
    data: configData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['adminAppSettings'],
    queryFn: async () => {
      const res = await adminApi.getAppSettings()
      return res.data?.data ?? res.data
    },
    meta: { showErrorToast: true },
  })

  useEffect(() => {
    if (configData) {
      setConfig(configData)
      setConfigText(JSON.stringify(configData, null, 2))
      const visualKeys = Object.keys(configData).filter(
        (key) => !HIDDEN_VISUAL_SECTIONS.includes(key)
      )
      if (
        visualKeys.length > 0 &&
        (!activeSection || HIDDEN_VISUAL_SECTIONS.includes(activeSection))
      ) {
        setActiveSection(visualKeys[0])
      } else if (visualKeys.length === 0 && !activeSection) {
        setActiveSection('__raw__')
      }
    }
  }, [configData])

  const updateConfigMutation = useMutation({
    mutationFn: (newSettings) => adminApi.updateAppSettings(newSettings),
    meta: { showErrorToast: true },
    onSuccess: (_, newSettings) => {
      toast.success(t('admin.config_saved'))
      setConfig(newSettings)
      setConfigText(JSON.stringify(newSettings, null, 2))
      setIsDirty(false)
      queryClient.setQueryData(['adminAppSettings'], newSettings)
    },
  })

  const handleSave = () => {
    if (activeSection === '__raw__') {
      try {
        const parsed = JSON.parse(configText)
        updateConfigMutation.mutate(parsed)
      } catch {
        toast.error(t('admin.invalid_json'))
      }
    } else {
      if (!config) return
      updateConfigMutation.mutate(config)
    }
  }

  const handleRefresh = async () => {
    try {
      const res = await refetch()
      const freshData = res.data ?? configData
      if (freshData) {
        setConfig(JSON.parse(JSON.stringify(freshData)))
        setConfigText(JSON.stringify(freshData, null, 2))
        setIsDirty(false)
      }
    } catch {
      toast.error(t('admin.config_refresh_error'))
    }
  }

  // --- Dynamic deep state updater ---
  const updateValueByPath = (pathArray, newValue) => {
    setConfig((prev) => {
      const newObj = JSON.parse(JSON.stringify(prev || {}))
      let current = newObj
      for (let i = 0; i < pathArray.length - 1; i++) {
        const k = pathArray[i]
        if (!current[k]) current[k] = {}
        current = current[k]
      }
      current[pathArray[pathArray.length - 1]] = newValue
      setConfigText(JSON.stringify(newObj, null, 2))
      setIsDirty(true)
      return newObj
    })
  }

  const addArrayItem = (pathArray) => {
    setConfig((prev) => {
      const newObj = JSON.parse(JSON.stringify(prev || {}))
      let current = newObj
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]]
      }
      const arrayKey = pathArray[pathArray.length - 1]
      if (Array.isArray(current[arrayKey])) {
        current[arrayKey] = [...current[arrayKey], '']
      } else {
        current[arrayKey] = ['']
      }
      setConfigText(JSON.stringify(newObj, null, 2))
      setIsDirty(true)
      return newObj
    })
  }

  const removeArrayItem = (pathArray, index) => {
    setConfig((prev) => {
      const newObj = JSON.parse(JSON.stringify(prev || {}))
      let current = newObj
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]]
      }
      const arrayKey = pathArray[pathArray.length - 1]
      if (Array.isArray(current[arrayKey])) {
        current[arrayKey] = current[arrayKey].filter((_, i) => i !== index)
      }
      setConfigText(JSON.stringify(newObj, null, 2))
      setIsDirty(true)
      return newObj
    })
  }

  const toggleExpand = (cardKey) => {
    setExpandedCards((prev) => {
      const currentState = prev[cardKey] !== false // matches isExpanded default
      return { ...prev, [cardKey]: !currentState }
    })
  }

  const isDocOrCommentKey = (key) => {
    if (!key) return false
    const lower = key.toLowerCase()
    return (
      lower.startsWith('_doc') ||
      lower.startsWith('_comment') ||
      lower.startsWith('_desc') ||
      lower.startsWith('//')
    )
  }

  // Gather all collapsible card keys in an object
  const getAllCardKeys = (obj, path = []) => {
    let keys = []
    if (!obj || typeof obj !== 'object') return keys
    for (const [k, v] of Object.entries(obj)) {
      if (isDocOrCommentKey(k)) continue
      const currentPath = [...path, k]
      const cardPathKey = currentPath.join('.')
      if (Array.isArray(v)) {
        keys.push(cardPathKey)
      } else if (typeof v === 'object' && v !== null) {
        keys.push(cardPathKey)
        keys = keys.concat(getAllCardKeys(v, currentPath))
      }
    }
    return keys
  }

  const getActiveKeys = () => {
    if (
      !config ||
      activeSection === '__raw__' ||
      !config[activeSection] ||
      HIDDEN_VISUAL_SECTIONS.includes(activeSection)
    )
      return []
    let keys = getAllCardKeys(config[activeSection], [activeSection])
    return Array.from(new Set(keys))
  }

  const activeKeys = getActiveKeys()
  const isAllExpanded = activeKeys.length > 0 && activeKeys.every((k) => expandedCards[k] !== false)

  const toggleExpandAll = () => {
    const keys = getActiveKeys()
    if (keys.length === 0) return
    const nextState = !isAllExpanded
    const newExpanded = { ...expandedCards }
    for (const k of keys) {
      newExpanded[k] = nextState
    }
    setExpandedCards(newExpanded)
  }

  // Humanize camelCase or PascalCase labels
  const formatLabel = (key) => {
    if (!key) return ''
    return key
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .trim()
  }

  // Count total leaf fields in an object recursively
  const countFields = (obj) => {
    if (!obj || typeof obj !== 'object') return 0
    return Object.entries(obj).reduce((sum, [k, v]) => {
      if (isDocOrCommentKey(k)) return sum
      if (v === null) return sum
      if (Array.isArray(v)) return sum + v.length
      if (typeof v === 'object') return sum + countFields(v)
      return sum + 1
    }, 0)
  }

  // Left border accent colors by nesting depth
  const depthColors = ['var(--color-primary)', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']

  const isSaving = updateConfigMutation.isPending
  const isBusy = isLoading || isFetching || isSaving

  // --- Dynamic Renderers ---
  const renderValueField = (path, key, value) => {
    const type = typeof value

    if (type === 'boolean') {
      return (
        <div key={key} className="flex flex-col justify-end" style={{ minWidth: 120 }}>
          <label
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            {formatLabel(key)}
          </label>
          <div>
            <button
              type="button"
              onClick={() => updateValueByPath([...path, key], !value)}
              style={{
                padding: '4px 12px',
                fontSize: 11.5,
                fontWeight: 600,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background: value ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: value ? '#22c55e' : '#ef4444',
                transition: 'all var(--transition-fast)',
              }}
            >
              {value ? t('admin.active') : t('admin.disabled')}
            </button>
          </div>
        </div>
      )
    }

    if (type === 'number') {
      return (
        <div key={key} style={{ minWidth: 140, flex: '1 1 140px' }}>
          <label
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 3,
              display: 'block',
            }}
          >
            {formatLabel(key)}
          </label>
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value)
              updateValueByPath([...path, key], val)
            }}
            style={{
              padding: '6px 10px',
              fontSize: 12.5,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              width: '100%',
            }}
          />
        </div>
      )
    }

    if (type === 'string') {
      const isTime = /^\d{2}:\d{2}:\d{2}$/.test(value)
      return (
        <div key={key} style={{ minWidth: 140, flex: '1 1 140px' }}>
          <label
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 3,
              display: 'block',
            }}
          >
            {formatLabel(key)}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateValueByPath([...path, key], e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: 12.5,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              width: '100%',
              fontFamily: isTime ? 'monospace' : 'inherit',
            }}
          />
        </div>
      )
    }

    return null
  }

  const renderArrayField = (path, key, arr, level = 0) => {
    const cardPathKey = [...path, key].join('.')
    const isExpanded = expandedCards[cardPathKey] !== false // Default open
    const accentColor = depthColors[level % depthColors.length]

    return (
      <div
        key={key}
        style={{
          padding: '14px 14px 14px 18px',
          borderRadius: 'var(--radius-lg)',
          background: level === 0 ? 'var(--color-surface-2)' : 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderLeft: `3px solid ${accentColor}`,
          marginBottom: 2,
        }}
      >
        <div
          className="config-card-header flex items-center gap-2 mb-2"
          onClick={() => toggleExpand(cardPathKey)}
        >
          <span
            className="config-card-title"
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}
          >
            {formatLabel(key)}
          </span>
          {!isExpanded && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: '9999px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              {arr.length} {t('admin.prompts')}
            </span>
          )}
          <span
            className="config-card-arrow"
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              transform: isExpanded ? 'rotate(180deg)' : 'none',
            }}
          >
            ▼
          </span>
        </div>

        {isExpanded && (
          <div className="flex flex-col gap-2.5" style={{ marginTop: 8 }}>
            {arr.map((item, idx) => {
              const text = typeof item === 'string' ? item : ''
              const calculatedRows = Math.max(
                2,
                Math.min(
                  text
                    .split('\n')
                    .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 80)), 0),
                  20
                )
              )

              return (
                <div
                  key={idx}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: level === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-light)',
                  }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface-2)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        #{idx + 1}
                      </span>
                      {text.length > 0 && (
                        <span style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>
                          {text.length} {t('admin.chars')}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeArrayItem([...path, key], idx)}
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        fontWeight: 600,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {t('admin.delete_item')}
                    </button>
                  </div>
                  <textarea
                    className="input w-full"
                    rows={calculatedRows}
                    value={item}
                    onChange={(e) => {
                      const newArr = [...arr]
                      newArr[idx] = e.target.value
                      updateValueByPath([...path, key], newArr)
                    }}
                    style={{
                      padding: '8px 10px',
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      display: 'block',
                      width: '100%',
                    }}
                  />
                </div>
              )
            })}
            <div className="flex justify-start mt-1">
              <button
                type="button"
                onClick={() => addArrayItem([...path, key])}
                style={{
                  padding: '5px 14px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                  cursor: 'pointer',
                  background: 'var(--color-surface)',
                  color: 'var(--color-primary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {t('admin.add_new_prompt')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isPromptString = (key, value) => {
    if (typeof value !== 'string') return false
    const k = key.toLowerCase()
    return k.includes('prompt') || k.includes('description') || value.length > 50
  }

  const renderPromptStringField = (path, key, value, level = 0) => {
    const cardPathKey = [...path, key].join('.')
    const isExpanded = expandedCards[cardPathKey] !== false
    const accentColor = depthColors[level % depthColors.length]
    const text = typeof value === 'string' ? value : ''
    const calculatedRows = Math.max(
      2,
      Math.min(
        text
          .split('\n')
          .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 80)), 0),
        15
      )
    )

    return (
      <div
        key={key}
        style={{
          padding: '14px 14px 14px 18px',
          borderRadius: 'var(--radius-lg)',
          background: level === 0 ? 'var(--color-surface-2)' : 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderLeft: `3px solid ${accentColor}`,
          marginBottom: 2,
        }}
      >
        <div
          className="config-card-header flex items-center gap-2 mb-2"
          onClick={() => toggleExpand(cardPathKey)}
        >
          <span
            className="config-card-title"
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}
          >
            {formatLabel(key)}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: '9999px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            {text.length} {t('admin.chars')}
          </span>
          <span
            className="config-card-arrow"
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              transform: isExpanded ? 'rotate(180deg)' : 'none',
            }}
          >
            ▼
          </span>
        </div>

        {isExpanded && (
          <div className="flex flex-col gap-2.5" style={{ marginTop: 8 }}>
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: level === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <textarea
                className="input w-full"
                rows={calculatedRows}
                value={value || ''}
                onChange={(e) => updateValueByPath([...path, key], e.target.value)}
                style={{
                  padding: '8px 10px',
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  display: 'block',
                  width: '100%',
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderObjectNode = (path, obj, level = 0) => {
    if (!obj || typeof obj !== 'object') return null

    const entries = Object.entries(obj).filter(([k]) => !isDocOrCommentKey(k))
    const promptStrings = entries.filter(([k, v]) => isPromptString(k, v))
    const primitives = entries.filter(
      ([k, v]) => v !== null && typeof v !== 'object' && !isPromptString(k, v)
    )
    const objects = entries.filter(
      ([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v)
    )
    const arrays = entries.filter(([, v]) => Array.isArray(v))

    return (
      <div className="flex flex-col gap-3">
        {/* Render regular primitive fields in a clean flex grid */}
        {primitives.length > 0 && (
          <div
            style={{
              padding: 14,
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {primitives.map(([k, v]) => renderValueField(path, k, v))}
            </div>
          </div>
        )}

        {/* Render nested object cards */}
        {objects.map(([k, v]) => {
          const cardPathKey = [...path, k].join('.')
          const isExpanded = expandedCards[cardPathKey] !== false
          const hasBooleanToggle = v && typeof v.Enabled === 'boolean'
          const fieldCount = countFields(v)

          return (
            <div
              key={k}
              style={{
                padding: '14px 14px 14px 18px',
                borderRadius: 'var(--radius-lg)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                marginBottom: 2,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <div
                  className="config-card-header flex items-center gap-2"
                  onClick={() => toggleExpand(cardPathKey)}
                >
                  {/* Status dot for Enabled */}
                  {hasBooleanToggle && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: v.Enabled ? '#22c55e' : '#ef4444',
                        display: 'inline-block',
                        flexShrink: 0,
                        boxShadow: v.Enabled
                          ? '0 0 6px rgba(34, 197, 94, 0.5)'
                          : '0 0 6px rgba(239, 68, 68, 0.4)',
                        transition: 'all var(--transition-fast)',
                      }}
                    />
                  )}
                  <span
                    className="config-card-title"
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}
                  >
                    {formatLabel(k)}
                  </span>
                  {/* Field count badge when collapsed (mobilde gizlenir) */}
                  {!isExpanded && (
                    <span
                      className="config-field-count"
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {fieldCount} {t('admin.fields')}
                    </span>
                  )}
                  <span
                    className="config-card-arrow"
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}
                  >
                    ▼
                  </span>
                </div>
                {hasBooleanToggle && (
                  <div>
                    <button
                      type="button"
                      onClick={() => updateValueByPath([...path, k, 'Enabled'], !v.Enabled)}
                      style={{
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        background: v.Enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: v.Enabled ? '#22c55e' : '#ef4444',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {v.Enabled ? t('admin.active') : t('admin.disabled')}
                    </button>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div style={{ marginTop: 8 }}>{renderObjectNode([...path, k], v, level + 1)}</div>
              )}
            </div>
          )
        })}

        {/* Render array prompts */}
        {arrays.map(([k, v]) => renderArrayField(path, k, v, level))}

        {/* Render single prompt string fields in the exact same prominent card layout */}
        {promptStrings.map(([k, v]) => renderPromptStringField(path, k, v, level))}
      </div>
    )
  }

  return (
    <div className="admin-panel-card">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 flex-wrap gap-3 admin-panel-header">
        <h2 className="section-divider-title" style={{ margin: 0 }}>
          {t('admin.bg_services_config')}
        </h2>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary admin-btn"
            onClick={handleRefresh}
            disabled={isBusy}
          >
            {isFetching ? t('admin.loading') : t('admin.refresh')}
          </button>
          <button
            className="btn btn-primary admin-btn"
            onClick={handleSave}
            disabled={isBusy}
            style={{
              position: 'relative',
              ...(isDirty && !isSaving
                ? {
                    boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.4)',
                    animation: 'pulse-ring 2s ease-in-out infinite',
                  }
                : {}),
            }}
          >
            {isSaving ? t('admin.saving') : isDirty ? `● ${t('admin.save')}` : t('admin.save')}
          </button>
        </div>
      </div>

      {/* Top Section Tabs & Expand/Collapse All (Mobile Scrollbar Standard) */}
      <div
        className="flex justify-between items-center border-b shrink-0 mb-3 gap-2 flex-wrap"
        style={{ borderColor: 'var(--color-border)', paddingBottom: 8 }}
      >
        <div className="admin-tabs-wrap" style={{ minWidth: 0, flex: '1 1 auto' }}>
          {configTabsScroll.scrollable && (
            <div className="admin-tabs-scrollbar" aria-hidden="true">
              <div
                className="admin-tabs-scrollbar-thumb"
                style={{ width: `${configTabsScroll.width}%`, left: `${configTabsScroll.left}%` }}
              />
            </div>
          )}
          <div
            ref={configTabsRef}
            className="hscroll-strip flex items-center gap-2 overflow-x-auto hide-scrollbar"
            style={{ minWidth: 0, overflowX: 'auto' }}
          >
            {topSections.map((secKey) => {
              const isActive = activeSection === secKey
              return (
                <button
                  key={secKey}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    if (activeSection === '__raw__') {
                      try {
                        const parsed = JSON.parse(configText)
                        setConfig(parsed)
                      } catch {
                        // Ignore parse error
                      }
                    }
                    setActiveSection(secKey)
                  }}
                  style={{
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {secKey === 'BackgroundServiceSettings'
                    ? t('admin.bg_service_settings')
                    : formatLabel(secKey)}
                </button>
              )
            })}

            <button
              className={`btn btn-sm ${activeSection === '__raw__' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                if (config) {
                  setConfigText(JSON.stringify(config, null, 2))
                }
                setActiveSection('__raw__')
              }}
              style={{
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: activeSection === '__raw__' ? 600 : 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {t('admin.raw_json')}
            </button>
          </div>
        </div>

        {activeSection !== '__raw__' && (
          <button
            type="button"
            onClick={toggleExpandAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: 11.5,
              fontWeight: 600,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            aria-label={isAllExpanded ? t('admin.collapse_all') : t('admin.expand_all')}
          >
            <span
              style={{
                fontSize: 11,
                transform: isAllExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
                display: 'inline-block',
              }}
            >
              ▼
            </span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div>
        {activeSection === '__raw__' ? (
          <div
            style={{
              padding: 14,
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}
            >
              {t('admin.raw_json_config')}
            </div>
            <textarea
              className="input w-full"
              value={configText}
              onChange={(e) => {
                setConfigText(e.target.value)
                setIsDirty(true)
              }}
              spellCheck={false}
              disabled={isLoading}
              rows={30}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                lineHeight: 1.5,
                padding: 12,
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ) : config && config[activeSection] && !HIDDEN_VISUAL_SECTIONS.includes(activeSection) ? (
          renderObjectNode([activeSection], config[activeSection], 0)
        ) : isLoading ? (
          <div className="flex justify-center" style={{ padding: 40 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 13,
              padding: 20,
              textAlign: 'center',
            }}
          >
            {t('admin.no_config_found')}
          </div>
        )}
      </div>
    </div>
  )
}
