import React from 'react'
import { Brain, Zap } from 'lucide-react'

/**
 * SynapseBrainIcon — Düğüm aktivasyonlu Memory Map butonları için ikili ikon (Brain + Zap).
 * Beynin önünde parlayan şimşek svg'si ile hafıza/sinaps çağrışımını temsil eder.
 */
export default function SynapseBrainIcon({
  brainSize = 14,
  zapSize = 10,
  brainColor = 'currentColor',
  zapColor = 'var(--color-synapse-zap, var(--color-primary))',
  style = {},
  className = '',
}) {
  const isGlowing = zapColor && zapColor !== 'currentColor' && zapColor !== 'inherit'

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        width: brainSize + 2,
        height: brainSize + 2,
        ...style,
      }}
    >
      <Brain size={brainSize} style={{ color: brainColor }} />
      <Zap
        size={zapSize}
        style={{
          position: 'absolute',
          top: -3,
          right: -4,
          color: zapColor,
          fill: zapColor,
          filter: isGlowing ? 'drop-shadow(0 0 3px var(--color-synapse-zap, var(--color-primary)))' : 'none',
          pointerEvents: 'none',
        }}
      />
    </span>
  )
}
