import { useState } from 'react'

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
