import { useEffect, useRef, useState } from 'react'
import { Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SearchInput from './SearchInput'

const DEFAULT_ORDER_OPTIONS = [
  { value: 'MostOwned', labelKey: 'card.most_owned', labelDefault: 'En Çok Satın Alınan' },
  { value: 'MostSpread', labelKey: 'card.most_spread', labelDefault: 'En Çok Yayılmış' },
  { value: 'Newest', labelKey: 'sort.newest', labelDefault: 'En Yeni' },
  { value: 'Oldest', labelKey: 'topbar.oldest', labelDefault: 'En Eski' },
]

export default function SearchFilterBar({
  onSearch,
  orderOptions = DEFAULT_ORDER_OPTIONS,
  placeholder,
  initialParams,
}) {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState(initialParams?.query || '')
  const [filterOrderType, setFilterOrderType] = useState(initialParams?.orderType || '')
  const [filterStartDate, setFilterStartDate] = useState(initialParams?.startDate || '')
  const [filterEndDate, setFilterEndDate] = useState(initialParams?.endDate || '')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch?.({
      query: searchInput,
      orderType: filterOrderType || 'None',
      startDate: filterStartDate || null,
      endDate: filterEndDate || null,
    })
    setIsFilterOpen(false)
  }

  const hasFilters = Boolean(filterOrderType || filterStartDate || filterEndDate)

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 6,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <SearchInput
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onClear={() => setSearchInput('')}
        clearLabel={t('common.clear')}
        placeholder={placeholder || t('topbar.search')}
      />

      <div style={{ position: 'relative' }} ref={filterRef}>
        <button
          type="button"
          className="btn btn-outline btn-sm btn-icon"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          aria-label={t('topbar.search_filters')}
          style={{ borderColor: hasFilters ? 'var(--color-primary)' : undefined }}
        >
          <Filter
            size={14}
            color={hasFilters ? 'var(--color-primary)' : 'currentColor'}
            fill={hasFilters ? 'var(--color-primary)' : 'none'}
          />
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setFilterOrderType('')
              setFilterStartDate('')
              setFilterEndDate('')
              setIsFilterOpen(false)
            }}
            aria-label={t('common.clear_all')}
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
          {isFilterOpen && (
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
                width: 'min(220px, calc(100vw - 24px))',
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
                <span>{t('search.filters_title')}</span>
                <X
                  size={14}
                  color="var(--color-text-secondary)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsFilterOpen(false)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {t('search.sort_by')}
                </label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <select
                    className="input"
                    style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1, minWidth: 0 }}
                    value={filterOrderType}
                    onChange={(e) => setFilterOrderType(e.target.value)}
                  >
                    <option value="">{t('search.none')}</option>
                    {orderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.labelKey ? t(option.labelKey, option.labelDefault) : option.label}
                      </option>
                    ))}
                  </select>
                  {filterOrderType && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                      onClick={() => setFilterOrderType('')}
                      aria-label={t('common.clear')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {t('search.start_date')}
                </label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="date"
                    className="input"
                    style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1, minWidth: 0 }}
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                  {filterStartDate && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                      onClick={() => setFilterStartDate('')}
                      aria-label={t('common.clear')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {t('search.end_date')}
                </label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="date"
                    className="input"
                    style={{ padding: '4px 8px', height: 32, fontSize: 13, flex: 1, minWidth: 0 }}
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                  {filterEndDate && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 0, width: 32, height: 32, flexShrink: 0 }}
                      onClick={() => setFilterEndDate('')}
                      aria-label={t('common.clear')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: 4, paddingTop: 7, paddingBottom: 7 }}
              >
                {t('topbar.search_button')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button type="submit" className="btn btn-primary btn-sm">
        {t('topbar.search_button')}
      </button>
    </form>
  )
}
