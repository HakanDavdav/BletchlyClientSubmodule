import useDevLog from '../../utils/useDevLog'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
export default function FooterBar() {
  useDevLog('FooterBar', arguments[0] || {})
  const { t } = useTranslation()

  return (
    <footer className="layout-footer">
      <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
        {t('footer.about', 'Hakkımızda')}
      </Link>
      •
      <Link to="/how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>
        {t('footer.how_it_works', 'Nasıl Çalışır?')}
      </Link>
      •
      <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>
        {t('footer.contact', 'İletişim')}
      </Link>
      •
      <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
        Privacy Policy
      </Link>
      •
      <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
        Terms of Service
      </Link>
      •<span>© 2026 Bletchly</span>
    </footer>
  )
}
