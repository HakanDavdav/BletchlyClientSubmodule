import { useContext, useLayoutEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageTopDockContext, PageTopDockSlotContext } from '../layout/PageTopDockContext'

/**
 * BackButton — Standardized back button for pages.
 * PageTopDock mevcutsa buton doğrudan dock DOM'u içine kaydedilir (portal yok).
 */
export default function BackButton({ onClick, style = { marginBottom: 16 } }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const dockContext = useContext(PageTopDockContext)
  const dockSlot = useContext(PageTopDockSlotContext)
  const store = dockContext?.store
  const shouldRegister = Boolean(store) && !dockSlot

  const handleGoBack = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(-1)
    }
  }

  const button = (
    <button
      className="btn-icon page-back-button"
      onClick={handleGoBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        padding: 0,
        ...style,
        ...(shouldRegister ? { marginBottom: 0 } : null),
      }}
      aria-label={t('common.go_back', 'Geri Dön')}
    >
      <ArrowLeft size={18} />
    </button>
  )

  const wrappedButton = <div className="page-top-dock__item">{button}</div>

  useLayoutEffect(() => {
    if (!shouldRegister) return
    store.setSlot('left', wrappedButton)
  })

  useLayoutEffect(() => {
    if (!shouldRegister) return undefined
    return () => store.setSlot('left', null)
  }, [store, shouldRegister])

  if (shouldRegister) return null

  return button
}
