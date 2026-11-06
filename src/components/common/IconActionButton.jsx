import { Link } from 'react-router-dom'

export default function IconActionButton({ children, className = '', style, to, ...props }) {
  const combinedClassName = `btn-icon icon-action-button${className ? ` ${className}` : ''}`

  if (to) {
    return (
      <Link
        to={to}
        className={combinedClassName}
        style={{ textDecoration: 'none', ...style }}
        {...props}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={combinedClassName}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}
