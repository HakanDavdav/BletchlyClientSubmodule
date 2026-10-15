import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Crown } from 'lucide-react'
import BackButton from '../components/common/BackButton'
import PremiumContent from '../components/common/PremiumContent'

export default function PremiumPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div
      className="premium-page flex-col gap-4"
      style={{ paddingBottom: 60, width: '100%' }}
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
          <Crown size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('premium.title', 'Pro')}
          </h1>
        </div>
      </div>

      <PremiumContent variant="page" onClose={() => navigate(-1)} />
    </div>
  )
}
