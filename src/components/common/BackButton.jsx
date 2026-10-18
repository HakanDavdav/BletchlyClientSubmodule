import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * BackButton — Standardized back button for pages
 */
export default function BackButton({ onClick, style = { marginBottom: 16 } }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleGoBack = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(-1)
    }
  }

  return (
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
      }}
      aria-label={t('common.go_back', 'Geri Dön')}
    >
      <ArrowLeft size={18} />
    </button>
  )
}
