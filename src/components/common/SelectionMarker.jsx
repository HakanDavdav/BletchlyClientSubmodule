import { Check } from 'lucide-react'

export default function SelectionMarker({
  checked = false,
  onChange,
  disabled = false,
  label,
  children,
  size = 'md',
  locked = false,
  className = '',
  style,
  markerStyle,
}) {
  const isBox = size === 'box' || size === '44'

  const marker = (
    <span
      className={`selection-marker selection-marker--${size}${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}${locked ? ' is-locked' : ''}`}
      aria-hidden="true"
      style={markerStyle}
    >
      {checked && (
        <Check size={isBox ? 20 : size === 'sm' ? 12 : 13} strokeWidth={isBox ? 2.6 : 3} />
      )}
      {locked && <span className="selection-marker__slash" aria-hidden="true" />}
    </span>
  )

  if (typeof onChange !== 'function') {
    return (
      <span
        className={`selection-marker-display${className ? ` ${className}` : ''}`}
        role={label ? 'img' : undefined}
        aria-label={label}
        style={style}
      >
        {marker}
      </span>
    )
  }

  return (
    <label
      className={`selection-control${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
      {marker}
      {children && <span className="selection-control__label">{children}</span>}
    </label>
  )
}
