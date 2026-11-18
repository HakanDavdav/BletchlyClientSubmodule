import { Link } from 'react-router-dom'

/**
 * Outer element of the inline (text-flow) card variants: a router link when `to` is set,
 * otherwise a plain span. Clicks never bubble to the surrounding card or editor.
 */
export default function InlineCardShell({ to, target, className, title, style, children }) {
  const stop = (e) => e.stopPropagation()

  if (!to) {
    return (
      <span className={className} title={title} style={{ cursor: 'default', ...style }}>
        {children}
      </span>
    )
  }

  return (
    <Link
      to={to}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className}
      title={title}
      style={{ textDecoration: 'none', cursor: 'pointer', ...style }}
      draggable={false}
      onMouseDown={stop}
      onClick={stop}
    >
      {children}
    </Link>
  )
}
