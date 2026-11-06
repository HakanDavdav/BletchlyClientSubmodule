import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import ModalPortal from '../common/ModalPortal'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TopicTypes } from '../../constants/TopicTypes'

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
    <ModalPortal>
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
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.profile_name')}</label>
              <input
                type="text"
                value={formData.profileName}
                onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                placeholder={t('profile_modal.profile_name_placeholder')}
                maxLength={50}
                className={`input ${hasSubmitted && !formData.profileName.trim() ? 'error' : ''}`}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.image_url')}</label>
              <input
                className="input"
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder={t('profile_modal.image_url_placeholder')}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.bio')} <span style={{ color: 'var(--color-primary)' }}>*</span></label>
              <textarea
                className={`input textarea textarea--autogrow ${hasSubmitted && !formData.bio.trim() ? 'error' : ''}`}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('profile_modal.bio_placeholder')}
                rows={4}
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('profile_modal.interests')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {TopicTypes.map(topic => {
                  const translationKey = (topic.key || topic.enumName).toLowerCase();
                  return (
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
                      {t(`topics.${translationKey}`)}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={editUserMutation.isPending}
                style={{ marginTop: 24 }}
              >
                {editUserMutation.isPending ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
    </ModalPortal>
  )
}
