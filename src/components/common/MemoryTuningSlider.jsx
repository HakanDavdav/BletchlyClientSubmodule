import LockedSlash from './LockedSlash'
import './MemoryTuningSlider.css'

// Genel çarpan biçimi (×0 .. ×2) — mind tuning sliderları için
export function formatMultiplier(value) {
  return `×${Math.round(value * 100) / 100}`
}

export default function MemoryTuningSlider({
  title,
  description,
  leftLabel,
  rightLabel,
  subLeftLabel,
  subRightLabel,
  value = 0.5,
  min = 0,
  max = 1,
  step = 0.05,
  onChange,
  disabled = false,
  locked = false,
  formatValue,
  style = {},
}) {
  const safeValue = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
  const percent = max === min ? 0 : Math.round(((safeValue - min) / (max - min)) * 100)
  const isDisabled = disabled || locked
  const valueLabel = formatValue ? formatValue(safeValue) : `${percent}%`

  return (
    <div
      className={`memory-slider${locked ? ' memory-slider--locked' : ''}`}
      style={{ opacity: isDisabled ? 0.6 : 1, ...style }}
    >
      <div className="memory-slider__header">
        <span className="memory-slider__title">{title}</span>
        <span className="memory-slider__value">{valueLabel}</span>
      </div>
      {description && <p className="memory-slider__desc">{description}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        disabled={isDisabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="memory-slider__input"
        style={{ '--slider-fill': `${percent}%` }}
        aria-label={title}
      />
      <div className="memory-slider__labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      {subLeftLabel && subRightLabel && (
        <div className="memory-slider__sublabels">
          <span>{subLeftLabel}</span>
          <span>{subRightLabel}</span>
        </div>
      )}
      {locked && <LockedSlash stretch />}
    </div>
  )
}
