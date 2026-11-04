import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { toast } from 'react-hot-toast'
import BackButton from '../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

export default function ContactPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const reportMessage = location.state?.reportMessage || ''
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: reportMessage
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    if (!reportMessage) return
    setFormData((prev) => ({ ...prev, message: reportMessage }))
  }, [reportMessage])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const canSubmit = formData.name.trim() !== '' && formData.email.trim() !== '' && formData.message.trim() !== ''

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }

    setIsSubmitting(true)

    // TODO: Arka plana API isteği atılacak yer (identityApi.sendContactMessage vb.)
    // Şimdilik 1 saniyelik sahte bekleme süresi koyuyoruz:
    setTimeout(() => {
      setIsSubmitting(false)
      setHasSubmitted(false)
      setFormData({ name: '', email: '', message: '' })
      toast.success(t('contact.success_msg', 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.'), { duration: 4000 })
    }, 1000)
  }

  return (
    <div className="flex-col gap-4" style={{ paddingBottom: 60 }}>
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
          <Mail size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('footer.contact', 'İletişim')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('contact.desc', 'Soru, görüş veya destek talepleriniz için bize ulaşın.')}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ marginTop: 24 }}>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
          
          <div className="form-group">
            <label className="form-label">{t('contact.name', 'İsim Soyisim')}</label>
            <input 
              className={`input ${hasSubmitted && !formData.name.trim() ? 'error' : ''}`}
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.email', 'E-posta')}</label>
            <input 
              className={`input ${hasSubmitted && !formData.email.trim() ? 'error' : ''}`}
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('contact.message', 'Mesajınız')}</label>
            <textarea 
              className={`input textarea textarea--autogrow ${hasSubmitted && !formData.message.trim() ? 'error' : ''}`}
              name="message"
              value={formData.message}
              onChange={handleChange}
              style={{ 
                minHeight: 120, 
                paddingTop: 12 
              }}
              placeholder={t('contact.message_placeholder', 'Mesajınızı buraya yazın...')}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isSubmitting}
            style={{ marginTop: 16 }}
          >
            {isSubmitting ? t('common.sending', 'Gönderiliyor...') : t('common.send', 'Gönder')}
          </button>
          
        </form>
      </div>


    </div>
  )
}
