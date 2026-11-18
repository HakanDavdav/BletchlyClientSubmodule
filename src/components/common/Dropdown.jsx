import { AnimatePresence, motion } from 'framer-motion'

const PANEL_MOTION = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.15 },
}

/**
 * Standard dropdown surface (.dropdown-menu-panel) with the shared open/close animation.
 * Callers only decide placement and size through `style`; colors, border, radius, shadow and
 * padding come from the class. Extra props (ref, role, event handlers) go to the panel element.
 */
export function DropdownPanel({ open = true, className = '', style, children, ...rest }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...PANEL_MOTION}
          className={`dropdown-menu-panel${className ? ` ${className}` : ''}`}
          style={style}
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Standard dropdown row (.dropdown-option-btn); `active` marks the selected/highlighted row. */
export function DropdownOption({ active = false, className = '', type = 'button', children, ...rest }) {
  return (
    <button
      type={type}
      className={`dropdown-option-btn${active ? ' active' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Uppercase group label inside a dropdown panel. */
export function DropdownHeader({ children }) {
  return <div className="dropdown-menu-header">{children}</div>
}

/** The ▼ caret used on dropdown trigger buttons; rotates while open. */
export function DropdownCaret({ open }) {
  return (
    <span aria-hidden="true" className={`dropdown-caret${open ? ' is-open' : ''}`}>
      ▼
    </span>
  )
}
