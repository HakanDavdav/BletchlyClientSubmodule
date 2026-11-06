import { useNavigate } from 'react-router-dom'
import PremiumContent from '../components/common/PremiumContent'
import BackButton from '../components/common/BackButton'

export default function PremiumPage() {
  const navigate = useNavigate()

  return (
    <div
      className="premium-page flex-col gap-4"
      style={{
        paddingBottom: 0,
        width: '100%',
        position: 'relative',
        borderRadius: 16,
      }}
    >
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 4 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <PremiumContent variant="page" onClose={() => navigate(-1)} />
      </div>
    </div>
  )
}

