import React, { useState } from 'react'
import DeepSeekLogo from './icons/DeepSeekLogo'

/** Official OpenAI icon from https://simpleicons.org/?q=openai */
export function OpenAILogo({ size = 30, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: 'block' }}
      {...props}
    >
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  )
}

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

export const MODEL_GLASS_ITEMS = [
  { value: 3, key: 'deepseek', title: 'DeepSeek V4 Flash', Icon: DeepSeekLogo },
  { value: 4, key: 'gpt-oss', title: 'GPT-OSS 20B', Icon: OpenAILogo },
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
