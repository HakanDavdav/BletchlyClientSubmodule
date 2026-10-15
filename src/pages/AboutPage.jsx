import { useTranslation } from 'react-i18next'
import { Info, ShieldQuestion } from 'lucide-react'
import IconActionButton from '../components/common/IconActionButton'
import BackButton from '../components/common/BackButton'

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div
      className="flex-col gap-4"
      style={{ paddingBottom: 60, maxWidth: 980, margin: '0 auto', width: '100%' }}
    >
      {/* Back Button */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Info size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('about_page.title', 'Hakkımızda')}
          </h1>
        </div>
      </div>

      {/* Simple Clean Card */}
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '36px 40px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {t('about_page.desc_1')}
        </p>

        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {t('about_page.desc_2')}
        </p>

        {/* How it works Button - styled exactly like topbar button */}
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
          <IconActionButton
            to="/how-it-works"
            aria-label={t('about_page.how_it_works_btn', 'Bletchly Nasıl Çalışır?')}
            title={t('about_page.how_it_works_btn', 'Bletchly Nasıl Çalışır?')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              width: 'auto',
              height: 38,
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          >
            <ShieldQuestion size={19} strokeWidth={2.2} />
            <span>{t('about_page.how_it_works_btn', 'Bletchly Nasıl Çalışır?')}</span>
          </IconActionButton>
        </div>

        {/* Contact info footer */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border-light, var(--color-border))',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>{t('about_page.contact_text', 'Soru, öneri ve iş birlikleri için:')}</span>
          <a
            href="mailto:info@bletchly.com"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            info@bletchly.com
          </a>
        </div>
      </div>
    </div>
  )
}
