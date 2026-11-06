import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Mobil sol drawer'ın alt bölümü: footer bağlantıları.
 * Tema (açık/koyu, mavi/yeşil) ve dil seçici üst barda, avatarın solundadır.
 */
export default function MobileDrawerExtras() {
  const { t } = useTranslation()

  return (
    <div className="mobile-drawer-extras">
      {/* Masaüstü üst barındaki "Hakan Davdav" sosyal bloğunun mobil karşılığı */}
      <div className="mobile-drawer-extras__social">
        <span className="mobile-drawer-extras__social-name">Hakan Davdav</span>
        <a
          href="https://www.linkedin.com/in/hakan-davdav-0ba19629a/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        </a>
        <a href="https://github.com/HakanDavdav" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
            <path d="M9 18c-4.5 1.5-5-2.5-7-3" />
          </svg>
        </a>
        <a
          href="https://www.instagram.com/hakandavdav/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </a>
      </div>
      <div className="mobile-drawer-extras__links">
        <Link to="/about">{t('footer.about')}</Link>
        <Link to="/contact">{t('footer.contact')}</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
        <Link to="/cookie-policy">Cookie Policy</Link>
      </div>
      <div className="mobile-drawer-extras__copyright">© 2026 Bletchly</div>
    </div>
  )
}
