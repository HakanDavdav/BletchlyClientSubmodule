import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PaginationTotal({ totalPages, onChange, ariaLabel = 'Last page' }) {
  return (
    <button
      type="button"
      className="pagination-total-btn"
      onClick={() => onChange(totalPages)}
      aria-label={ariaLabel}
    >
      {totalPages}
    </button>
  )
}

export default function PaginationSelect({ page, totalPages, onChange, ariaLabel = 'Page' }) {
  const [isOpen, setIsOpen] = useState(false)
  const safePage = Math.min(page, totalPages)

  return (
    <span className={`pagination-select-wrap${isOpen ? ' is-open' : ''}`}>
      <select
        className="input pagination-select"
        value={safePage}
        onMouseDown={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) setIsOpen(true)
          if (event.key === 'Escape') setIsOpen(false)
        }}
        onBlur={() => setIsOpen(false)}
        onChange={(event) => {
          onChange(Number(event.target.value))
          setIsOpen(false)
        }}
        aria-label={ariaLabel}
      >
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <option key={pageNumber} value={pageNumber}>
            {pageNumber}
          </option>
        ))}
      </select>
      <span className="pagination-select-caret" aria-hidden="true">
        ▼
      </span>
    </span>
  )
}

export function PaginationBar({
  page,
  totalPages,
  disabled = false,
  onChange,
  className = 'pagination-controls',
}) {
  const { t } = useTranslation()
  const safeTotal = Math.max(1, totalPages || 1)
  const safePage = Math.min(Math.max(1, page || 1), safeTotal)

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
    >
      <button
        type="button"
        className="btn btn-outline btn-sm pagination-arrow"
        disabled={safePage <= 1 || disabled}
        onClick={() => onChange(Math.max(1, safePage - 1))}
        aria-label={t('common.previous')}
        title={t('common.previous')}
      >
        <ChevronLeft size={14} />
      </button>
      <span
        className="pagination-page-info"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
        }}
      >
        <PaginationSelect
          page={safePage}
          totalPages={safeTotal}
          onChange={onChange}
        />
        / <PaginationTotal totalPages={safeTotal} onChange={onChange} />
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm pagination-arrow"
        disabled={safePage >= safeTotal || disabled}
        onClick={() => onChange(Math.min(safeTotal, safePage + 1))}
        aria-label={t('common.next')}
        title={t('common.next')}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
