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
    category: 'Community',
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
    name: 'NewsAPI',
    category: 'Global Headlines',
    url: 'https://newsapi.org',
    color: '#1E88E5',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#1E88E5" />
        <path d="M6 6h3.4c2.3 0 3.8 1.4 3.8 3.5 0 1.4-.6 2.4-1.8 2.9l2.1 4.1h-2.3l-1.8-3.7H8.2V17H6V6zm2.2 2v2.8h1.2c1 0 1.6-.5 1.6-1.4s-.6-1.4-1.6-1.4H8.2z" fill="#FFF" />
        <circle cx="18" cy="15" r="1.6" fill="#FFF" />
      </svg>
    ),
  },
  {
    name: 'The Verge',
    category: 'Technology',
    url: 'https://www.theverge.com',
    color: '#E0004D',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 2L1 21h4.6l6.4-11.4L18.4 21H23L12 2z" fill="#E0004D" />
      </svg>
    ),
  },
  {
    name: 'Ars Technica',
    category: 'Tech & Policy',
    url: 'https://arstechnica.com',
    color: '#FF4E00',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="#FF4E00" />
        <path d="M8 17h2.2l1.1-3h3.4l1.1 3H18L13.2 6h-2.4L8 17zm3.8-5l1.2-3.6 1.2 3.6h-2.4z" fill="#FFF" />
      </svg>
    ),
  },
  {
    name: 'TechCrunch',
    category: 'Startups & VC',
    url: 'https://techcrunch.com',
    color: '#00A562',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#00A562" />
        <path d="M5 8h4v2H7v6H5V8zm6 0h5v2h-3v1h3v2h-3v1h3v2h-5V8z" fill="#FFF" />
      </svg>
    ),
  },
  {
    name: 'ScienceDaily',
    category: 'Research & Science',
    url: 'https://www.sciencedaily.com',
    color: '#007791',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" strokeWidth="1.8">
        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)" stroke="#007791" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)" stroke="#00A896" />
        <circle cx="12" cy="12" r="2.5" fill="#007791" />
      </svg>
    ),
  },
  {
    name: 'NASA',
    category: 'Space & Astronomy',
    url: 'https://www.nasa.gov',
    color: '#0B3D91',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="11" fill="#0B3D91" />
        <path d="M5 14c2.5-5 8-8 14-7-3 5-8 8-14 7z" fill="#FC3D21" opacity="0.85" />
        <text x="12" y="14.5" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial, sans-serif">NASA</text>
      </svg>
    ),
  },
  {
    name: 'phys.org',
    category: 'Science & Space',
    url: 'https://phys.org',
    color: '#2E7D32',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#2E7D32" />
        <text x="12" y="16.5" fontSize="8" fontWeight="800" textAnchor="middle" fill="#FFF" fontFamily="Arial, sans-serif">phys</text>
      </svg>
    ),
  },
  {
    name: 'arXiv',
    category: 'AI Papers & CS',
    url: 'https://arxiv.org',
    color: '#B31B1B',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#B31B1B" />
        <text x="12" y="16.5" fontSize="9" fontWeight="900" fontStyle="italic" textAnchor="middle" fill="#FFF" fontFamily="Georgia, serif">arX</text>
      </svg>
    ),
  },
  {
    name: 'MIT Tech Review',
    category: 'AI & Innovation',
    url: 'https://www.technologyreview.com',
    color: '#E01B22',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect width="24" height="24" rx="4" fill="#E01B22" />
        <text x="12" y="16.5" fontSize="8.5" fontWeight="900" textAnchor="middle" fill="#FFF" fontFamily="Arial, sans-serif">MIT</text>
      </svg>
    ),
  },
  {
    name: 'BBC News',
    category: 'World & Society',
    url: 'https://www.bbc.com/news',
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
    name: 'NY Times',
    category: 'Global Journalism',
    url: 'https://www.nytimes.com',
    color: '#64748B',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
        <text x="12" y="17" fontSize="13" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="Georgia, serif">T</text>
      </svg>
    ),
  },
  {
    name: 'Al Jazeera',
    category: 'World & Society',
    url: 'https://www.aljazeera.com',
    color: '#FA9000',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="11" fill="#FA9000" />
        <path d="M12 4c3.2 3.6 5 6.2 5 9.4a5 5 0 0 1-10 0c0-3.2 1.8-5.8 5-9.4z" fill="#FFF" />
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
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      setContent('')
      setTimeout(() => navigate('/'), 1000)
    },
  })

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (isOverLimit) return 'var(--color-danger, #ef4444)'
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'

    if (isRequired) {
      return !value || !value.trim() ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <PackageOpen size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('news.enrich_news_title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('news.enrich_news_desc')}
          </p>
        </div>
        <HowItWorksHelp
          title={t('news.how_it_works')}
          items={[t('news.how_it_works_1')]}
          closeLabel={t('common.close', 'Kapat')}
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
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
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
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 200,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('content', content, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('content')}
              onBlur={() => setFocused(null)}
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
              {FEED_SOURCES.length} {t('news.sources_count_label', 'Kaynak & API')}
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
              title={t('footer.contact', 'İletişim')}
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
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '13px 24px',
            fontSize: 14,
            fontWeight: 600,
            gap: 8,
            borderRadius: 12,
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
