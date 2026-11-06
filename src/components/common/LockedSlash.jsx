export default function LockedSlash({ strokeWidth = 2.2, stretch = false, style = {} }) {
  const isStretch = stretch
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={isStretch ? '0 0 100 100' : '0 0 24 24'}
      preserveAspectRatio={isStretch ? 'none' : 'xMidYMid meet'}
      fill="none"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55))',
        ...style,
      }}
    >
      {isStretch ? (
        // Tam sağ üst köşeden sol alt köşeye (kart en-boy oranından bağımsız)
        <line
          x1="100"
          y1="0"
          x2="0"
          y2="100"
          stroke="var(--color-warning)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <line
          x1="2.5"
          y1="21.5"
          x2="21.5"
          y2="2.5"
          stroke="var(--color-warning)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
