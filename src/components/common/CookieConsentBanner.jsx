import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Cookie, X, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useThemeStore from '../../store/themeStore'
import { getCookieConsent, setCookieConsent } from '../../utils/analytics'

export default function CookieConsentBanner() {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show banner only if the user has not made a choice yet
    const consent = getCookieConsent()
    if (!consent) {
      // Slight delay so page renders smoothly before the banner animates in
      const timer = setTimeout(() => setIsVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    setCookieConsent('granted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    setCookieConsent('denied')
    setIsVisible(false)
  }

  const handleDismiss = () => {
    // Dismissing without choosing acts as necessary only for this session
    setCookieConsent('denied')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="cookie-consent-banner"
          style={{
            background: isDarkMode ? 'rgba(18, 18, 22, 0.92)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: isDarkMode
              ? '1px solid rgba(255, 255, 255, 0.12)'
              : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 20,
            boxShadow: isDarkMode
              ? '0 24px 60px -10px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.2)'
              : '0 20px 48px -10px rgba(15, 23, 42, 0.14), 0 0 1px rgba(0, 0, 0, 0.1)',
            padding: '16px 20px',
            fontFamily: 'Inter, sans-serif',
            color: isDarkMode ? '#f8fafc' : '#0f172a',
          }}
        >
          <div className="cookie-consent-inner">
            {/* Left Info: Icon + Title & Description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'transparent',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Cookie size={22} strokeWidth={2} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    margin: '0 0 2px 0',
                    fontSize: 14.5,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: 'var(--color-text)',
                  }}
                >
                  {t('cookie.title', 'Çerez Tercihleri')}
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12.8,
                    lineHeight: 1.48,
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                  }}
                >
                  {t(
                    'cookie.description',
                    'Bletchly deneyiminizi geliştirmek, site trafiğini ve performansını anonim olarak analiz etmek için çerezler kullanıyoruz.'
                  )}{' '}
                  <Link
                    to="/privacy"
                    style={{
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                    }}
                  >
                    {t('cookie.privacy_policy', 'Gizlilik Politikası')}
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Actions: Decline, Accept, Close */}
            <div
              className="cookie-consent-actions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                className="cookie-btn"
                onClick={handleDecline}
                style={{
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(0, 0, 0, 0.14)',
                  background: 'transparent',
                  color: isDarkMode ? '#cbd5e1' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('cookie.decline', 'Reddet')}
              </button>

              <button
                type="button"
                className="cookie-btn"
                onClick={handleAccept}
                style={{
                  padding: '8px 20px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px var(--color-primary-shadow, rgba(59, 130, 246, 0.3))',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('cookie.accept', 'Tümünü Kabul Et')}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label={t('common.close', 'Kapat')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                  marginLeft: 2,
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
