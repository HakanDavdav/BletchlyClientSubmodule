import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TOPIC_TYPES = [
  { value: 1, enumName: 'Politics', label: 'Politika' },
  { value: 2, enumName: 'Economy', label: 'Ekonomi' },
  { value: 4, enumName: 'WorldNews', label: 'Dünya Haberleri' },
  { value: 8, enumName: 'LocalNews', label: 'Yerel Haberler' },
  { value: 16, enumName: 'Trending', label: 'Trend Başlıklar' },
  { value: 32, enumName: 'Technology', label: 'Teknoloji' },
  { value: 64, enumName: 'Science', label: 'Bilim' },
  { value: 128, enumName: 'AI', label: 'Yapay Zeka' },
  { value: 256, enumName: 'Space', label: 'Uzay' },
  { value: 512, enumName: 'Health', label: 'Sağlık' },
  { value: 1024, enumName: 'Sports', label: 'Spor' },
  { value: 2048, enumName: 'Entertainment', label: 'Eğlence' },
  { value: 4096, enumName: 'Gaming', label: 'Oyun' },
  { value: 8192, enumName: 'Celebrity', label: 'Ünlüler' },
  { value: 16384, enumName: 'Lifestyle', label: 'Yaşam Tarzı' },
  { value: 32768, enumName: 'Education', label: 'Eğitim' },
  { value: 65536, enumName: 'Relationships', label: 'İlişkiler' },
]

export default function EditProfileModal({ isOpen, onClose }) {
  useDevLog('EditProfileModal', arguments[0] || {})
  const { actorId } = useAuthStore()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    profileName: '',
    imageUrl: '',
    bio: ''
  })
  const [selectedTopics, setSelectedTopics] = useState([])

  const { data: profileResponse, isPending: isLoadingProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId),
    enabled: !!actorId && isOpen,
  })

  useEffect(() => {
    if (profileResponse?.data?.data) {
      const profile = profileResponse.data.data
      setFormData({
        profileName: profile.profileName || '',
        imageUrl: profile.imageUrl || '',
        bio: profile.bio || ''
      })
      if (profile.topicTypes) {
        setSelectedTopics(
          profile.topicTypes
            .map((t) => {
              const match = TOPIC_TYPES.find(
                (opt) => opt.value === t.topicTypeName || opt.enumName === t.topicTypeName || opt.label === t.topicTypeName
              )
              return match ? match.value : null
            })
            .filter((v) => v != null)
        )
      }
    }
  }, [profileResponse])

  const editUserMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
      onClose()
    }
  })

  const toggleTopic = (value) => {
    setSelectedTopics(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'
    
    if (isRequired) {
      return (!value || !value.trim()) ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const canSubmit = formData.profileName.trim() !== '' && formData.bio.trim() !== '' && !editUserMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }

    editUserMutation.mutate({
      userId: actorId,
      ...formData,
      topicTypes: selectedTopics,

      postPerPage: 20,
      socialNotificationPreference: true,
      socialEmailPreference: true
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 460, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('settings.edit_profile')}</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isLoadingProfile ? (
          <div className="flex justify-center" style={{ padding: 40 }}>
            <div className="spinner spinner-md" />
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.profile_name', 'Profil Adı')}</label>
              <input
                className="input"
                type="text"
                value={formData.profileName}
                onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                placeholder={t('profile_modal.profile_name_placeholder', 'Profil Adınız')}
                maxLength={50}
                style={{ borderColor: getBorderColor('profileName', formData.profileName, true), outline: 'none' }}
                onFocus={() => setFocused('profileName')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.image_url', "Profil Resmi URL'si")}</label>
              <input
                className="input"
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder={t('profile_modal.image_url_placeholder', 'https://...')}
                style={{ borderColor: getBorderColor('imageUrl', formData.imageUrl, false), outline: 'none' }}
                onFocus={() => setFocused('imageUrl')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.bio', 'Hakkında')} <span style={{ color: 'var(--color-primary)' }}>*</span></label>
              <textarea
                className="input"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('profile_modal.bio_placeholder', 'Kısa bir biyografi...')}
                rows={4}
                maxLength={300}
                style={{ borderColor: getBorderColor('bio', formData.bio, true), outline: 'none' }}
                onFocus={() => setFocused('bio')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.interests', 'İlgi Alanları')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {TOPIC_TYPES.map(topic => (
                  <label key={topic.value} style={{
                    display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                    padding: '4px 10px', borderRadius: 6, fontSize: 13,
                    background: selectedTopics.includes(topic.value) ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: selectedTopics.includes(topic.value) ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.15s'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.value)}
                      onChange={() => toggleTopic(topic.value)}
                      style={{ display: 'none' }}
                    />
                    {t(`topics.${topic.enumName.toLowerCase()}`)}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={editUserMutation.isPending}
                style={{ marginTop: 24 }}
              >
                {editUserMutation.isPending ? t('common.saving', 'Kaydediliyor...') : t('common.save', 'Kaydet')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
