import { Search as SearchIcon, X } from 'lucide-react'
import './SearchInput.css'

export default function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  onClear,
  clearLabel = 'Clear',
  className = '',
  inputProps = {},
}) {
  return (
    <div className={`app-search${className ? ` ${className}` : ''}`}>
      <SearchIcon size={16} className="app-search__icon" aria-hidden="true" />
      <input
        className="input app-search__input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        {...inputProps}
      />
      {value && onClear && (
        <button
          type="button"
          className="app-search__clear"
          onClick={onClear}
          aria-label={clearLabel}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
