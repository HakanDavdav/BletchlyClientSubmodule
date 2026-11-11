import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, PackageOpen, Radio, Plus } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import BackButton from '../../components/common/BackButton'
import HowItWorksHelp from '../../components/common/HowItWorksHelp'
import { useTranslation } from 'react-i18next'

const FEED_SOURCES = [
  {
    name: 'Reddit',
    category: 'Community & Discussions',
    url: 'https://www.reddit.com',
    color: '#FF4500',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.56 12 8 12.56 8 13.25c0 .688.56 1.25 1.25 1.25.688 0 1.25-.562 1.25-1.25 0-.69-.562-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .688.56 1.25 1.25 1.25.688 0 1.25-.562 1.25-1.25 0-.69-.562-1.25-1.25-1.25zm-5.465 3.99a.327.327 0 0 0-.231.096.326.326 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.096z" />
      </svg>
    ),
  },
  {
    name: 'Hacker News',
    category: 'Tech & Startups',
    url: 'https://news.ycombinator.com',
    color: '#FF6600',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#FF6600" />
        <path d="M12 13.5L8 5h2.2l2.3 5 2.3-5H17l-4 8.5V19h-1.8v-5.5z" fill="#FFF" />
      </svg>
    ),
  },
  {
    name: 'BBC World',
    category: 'World & Geopolitics',
    url: 'https://www.bbc.com/news/world',
    color: '#BB1919',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="2" y="7" width="6" height="10" rx="1" fill="#BB1919" />
        <rect x="9" y="7" width="6" height="10" rx="1" fill="#BB1919" />
        <rect x="16" y="7" width="6" height="10" rx="1" fill="#BB1919" />
        <text x="5" y="14.8" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial">B</text>
        <text x="12" y="14.8" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial">B</text>
        <text x="19" y="14.8" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial">C</text>
      </svg>
    ),
  },
  {
    name: 'BBC Sport',
    category: 'Sports & Athletics',
    url: 'https://www.bbc.com/sport',
    color: '#FFD230',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#FFD230" />
        <rect x="3" y="8" width="5.5" height="8" rx="1" fill="#181818" />
        <rect x="9.25" y="8" width="5.5" height="8" rx="1" fill="#181818" />
        <rect x="15.5" y="8" width="5.5" height="8" rx="1" fill="#181818" />
        <text x="5.75" y="14.5" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial">B</text>
        <text x="12" y="14.5" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial">B</text>
        <text x="18.25" y="14.5" fontSize="5.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial">C</text>
      </svg>
    ),
  },
  {
    name: 'The Verge',
    category: 'Technology & Culture',
    url: 'https://www.theverge.com',
    color: '#E0004D',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 2L1 21h4.6l6.4-11.4L18.4 21H23L12 2z" fill="#E0004D" />
      </svg>
    ),
  },
  {
    name: 'PC Gamer',
    category: 'Gaming & Hardware',
    url: 'https://www.pcgamer.com',
    color: '#E51B24',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#E51B24" />
        <text x="12" y="16.5" fontSize="7.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial, sans-serif">PCG</text>
      </svg>
    ),
  },
  {
    name: 'Aeon',
    category: 'Philosophy & Essays',
    url: 'https://aeon.co',
    color: '#181818',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#181818" />
        <text x="12" y="16.5" fontSize="8" fontWeight="800" fontStyle="italic" textAnchor="middle" fill="#FFF" fontFamily="Georgia, serif">aeon</text>
      </svg>
    ),
  },
  {
    name: 'Quanta Magazine',
    category: 'Science & Mathematics',
    url: 'https://www.quantamagazine.org',
    color: '#0B1B3D',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10.5" fill="#0B1B3D" />
        <text x="11.5" y="16.5" fontSize="13" fontWeight="900" textAnchor="middle" fill="#00D2D3" fontFamily="Georgia, serif">Q</text>
      </svg>
    ),
  },
  {
    name: 'Atlas Obscura',
    category: 'Curiosities & Exploration',
    url: 'https://www.atlasobscura.com',
    color: '#0A2540',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#0A2540" />
        <circle cx="12" cy="12" r="8" fill="none" stroke="#E5A823" strokeWidth="1.8" />
        <path d="M12 6l2 6-2 6-2-6z" fill="#E5A823" />
      </svg>
    ),
  },
  {
    name: 'IndieWire',
    category: 'Cinema & Television',
    url: 'https://www.indiewire.com',
    color: '#111111',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#111111" />
        <text x="12" y="16.5" fontSize="8" fontWeight="900" textAnchor="middle" fill="#E50914" fontFamily="Arial, sans-serif">IW</text>
      </svg>
    ),
  },
  {
    name: 'Bored Panda',
    category: 'Viral Stories & Pop Culture',
    url: 'https://www.boredpanda.com',
    color: '#111111',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#111111" />
        <circle cx="8" cy="8" r="3" fill="#FFF" />
        <circle cx="16" cy="8" r="3" fill="#FFF" />
        <circle cx="12" cy="13.5" r="5.5" fill="#FFF" />
        <circle cx="10" cy="13" r="1.5" fill="#111" />
        <circle cx="14" cy="13" r="1.5" fill="#111" />
        <ellipse cx="12" cy="16" rx="1.5" ry="1" fill="#111" />
      </svg>
    ),
  },
]

const RANDOM_PLACEHOLDER_KEYS = [
  'news.content_placeholder_altman',
  'news.content_placeholder_nolan',
  'news.content_placeholder_tarantino',
  'news.content_placeholder_ww2',
]

export default function EnrichNewsPoolPage() {
  const [content, setContent] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [randomPlaceholderKey] = useState(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_PLACEHOLDER_KEYS.length)
    return RANDOM_PLACEHOLDER_KEYS[randomIndex]
  })

  const mutation = useMutation({
    mutationFn: (text) => actorApi.enrichNewsPool(text),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success'), { duration: 3000 })
      setContent('')
      setTimeout(() => navigate('/'), 1000)
    },
  })

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    mutation.mutate(content.trim())
  }

  const charCount = content.length
  const isOverLimit = charCount > 5000
  const canSubmit = content.trim() !== '' && !isOverLimit && !mutation.isPending

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div className="page-header-row page-header-row--lg">
        <div className="page-header-icon">
          <PackageOpen size={22} color="#fff" />
        </div>
        <div>
          <h1 className="page-header-title">{t('news.enrich_news_title')}</h1>
          <p className="page-header-subtitle">{t('news.enrich_news_desc')}</p>
        </div>
        <HowItWorksHelp
          title={t('news.how_it_works')}
          items={[t('news.how_it_works_1')]}
          closeLabel={t('common.close')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {/* Form */}
      <form
        noValidate
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div style={{ marginBottom: 8 }}>
          <label className="form-section-label">
            {t('news.content_label')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="enrich-news-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t(randomPlaceholderKey, t('news.content_placeholder'))}
              disabled={mutation.isPending}
              rows={10}
              className={`input textarea textarea--autogrow ${(hasSubmitted && !content.trim()) || isOverLimit ? 'error' : ''}`}
              style={{
                minHeight: 200,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--color-surface)',
                lineHeight: 1.65,
              }}
            />
          </div>
          {/* Char count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 6,
              fontSize: 12,
              color: isOverLimit
                ? 'var(--color-danger, #ef4444)'
                : 'var(--color-text-muted, var(--color-text-secondary))',
            }}
          >
            {charCount} / 5000
          </div>
        </div>

        {/* Active Sources Badges */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Radio size={14} style={{ color: 'var(--color-primary)' }} />
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted, var(--color-text-secondary))',
              }}
            >
              {FEED_SOURCES.length} {t('news.sources_count_label')}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {FEED_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${source.name} • ${source.category}`}
                className="btn-icon icon-action-button"
                style={{ textDecoration: 'none', boxSizing: 'border-box' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {source.icon}
                </span>
              </a>
            ))}
            <a
              href="https://bletchly.com/contact"
              title={t('footer.contact')}
              className="btn-icon icon-action-button"
              style={{ textDecoration: 'none', boxSizing: 'border-box' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Plus size={24} strokeWidth={2.2} />
              </span>
            </a>
          </div>
        </div>

        {/* Submit button */}
        <button
          id="enrich-news-submit-btn"
          type="submit"
          disabled={mutation.isPending}
          className="btn btn-primary btn-form-submit"
          style={{
            opacity: mutation.isPending ? 0.5 : 1,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              {t('action.adding')}
            </>
          ) : (
            <>{t('action.enrich')}</>
          )}
        </button>
      </form>
    </div>
  )
}
