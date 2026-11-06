import React, { useState } from 'react'
import { Bot } from 'lucide-react'

/** Official Mistral AI icon from https://simpleicons.org/?q=mistral */
export function MistralLogo({ size = 30, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: 'block' }}
      {...props}
    >
      <path d="M17.143 3.429v3.428h-3.429v3.429h-3.428V6.857H6.857V3.43H3.43v13.714H0v3.428h10.286v-3.428H6.857v-3.429h3.429v3.429h3.429v-3.429h3.428v3.429h-3.428v3.428H24v-3.428h-3.43V3.429z" />
    </svg>
  )
}

/** Official DeepSeek icon from https://simpleicons.org/?q=deepseek */
export function DeepSeekLogo({ size = 30, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: 'block' }}
      {...props}
    >
      <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45" />
    </svg>
  )
}

export const MODEL_GLASS_ITEMS = [
  { value: 3, key: 'deepseek', title: 'DeepSeek V4 Flash', Icon: DeepSeekLogo },
  { value: 4, key: 'gpt-oss', title: 'GPT-OSS 20B', Icon: Bot },
  { value: 1, key: 'mistral', title: 'Mistral', Icon: MistralLogo },
]

export default function ModelGlassToggle({
  value = 3,
  onChange,
  disabled = false,
  style = {},
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const activeIndex = MODEL_GLASS_ITEMS.findIndex((m) => m.value === value)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0

  const handleSegmentClick = (index) => {
    if (disabled) return
    const targetModel = MODEL_GLASS_ITEMS[index]
    if (index === safeIndex) {
      const nextItem = MODEL_GLASS_ITEMS[(safeIndex + 1) % MODEL_GLASS_ITEMS.length]
      onChange?.(nextItem.value)
    } else {
      onChange?.(targetModel.value)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        height: 60,
        padding: 6,
        borderRadius: 9999,
        background: 'var(--color-surface-raised, rgba(255, 255, 255, 0.04))',
        border: '1.5px solid var(--color-border)',
        boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.12)',
        boxSizing: 'border-box',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {/* ─── Ultra-Clear Sliding Glass Thumb (Glows with Site Theme Color: Blue or Green) ─── */}
      <div
        style={{
          position: 'absolute',
          top: 5,
          bottom: 5,
          left: 5,
          width: `calc((100% - 10px) / ${MODEL_GLASS_ITEMS.length})`,
          borderRadius: 9999,
          transform: `translateX(calc(${safeIndex} * 100%))`,
          transition: 'transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), border-color 0.3s, box-shadow 0.3s',
          // High transparency crystal glass, NO heavy blur so the icon behind is 100% clear
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 60%, rgba(255, 255, 255, 0.1) 100%)',
          border: '1.5px solid color-mix(in srgb, var(--color-primary) 38%, rgba(255, 255, 255, 0.65))',
          boxShadow:
            '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1.5px 2px rgba(255, 255, 255, 0.8), inset 0 -1.5px 2px rgba(0, 0, 0, 0.15), 0 0 16px var(--color-primary-shadow, rgba(59, 130, 246, 0.3))',
          pointerEvents: 'none',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* Subtle curved glass specular reflection */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 6,
            right: 6,
            height: '42%',
            borderRadius: '9999px 9999px 60% 60%',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ─── 3 Model Segments Underneath the Glass ─── */}
      {MODEL_GLASS_ITEMS.map((model, idx) => {
        const { value: modelVal, title, Icon, key: modelKey } = model
        const isSelected = safeIndex === idx
        const isHovered = hoveredIdx === idx

        return (
          <button
            key={modelVal}
            type="button"
            aria-label={title}
            title={title}
            disabled={disabled}
            onClick={() => handleSegmentClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '50%',
                position: 'relative',
                transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'scale(1.15)' : isHovered ? 'scale(1.05)' : 'scale(0.92)',
                opacity: isSelected ? 1 : isHovered ? 0.9 : 0.55,
                // Normal state: monochrome white/gray based on site theme (text-secondary)
                // Active state: turns to theme color (green or blue)
                color: isSelected || isHovered
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
                filter: isSelected
                  ? 'drop-shadow(0 0 10px var(--color-primary-shadow, rgba(59, 130, 246, 0.45)))'
                  : isHovered
                  ? 'drop-shadow(0 0 6px var(--color-primary-shadow, rgba(59, 130, 246, 0.35)))'
                  : 'none',
              }}
            >
              <Icon size={28} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
