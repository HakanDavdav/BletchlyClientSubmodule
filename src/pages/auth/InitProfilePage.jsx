import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../../api/actorApi'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import AvatarUpload from '../../components/common/AvatarUpload'
import SelectionMarker from '../../components/common/SelectionMarker'
import { TopicSelectorPills } from '../../components/topic/TopicTag'
import MentionEditor from '../../components/content/mention/MentionEditor'

export default function InitProfilePage() {
  useDevLog('InitProfilePage', arguments[0] || {})
  const { actorId, setProfileCreated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [profileName, setProfileName] = useState('')
  const [bio, setBio] = useState('')
  const [bioMentions, setBioMentions] = useState([])
  const [imageUrl, setImageUrl] = useState('')
  const [selectedTopics, setSelectedTopics] = useState([])
  const [socialEmailPreference, setSocialEmailPreference] = useState(true)
  const { t } = useTranslation()

  const switchNotificationMutation = useMutation({
    mutationFn: (newVal) => identityApi.switchNotification({ emailPreference: newVal }),
    onError: () => {
      setSocialEmailPreference((prev) => !prev)
    }
  })

  const handleToggleEmailPreference = (newVal) => {
    setSocialEmailPreference(newVal)
    switchNotificationMutation.mutate(newVal)
  }

  const initProfileMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    meta: { showErrorToast: true },
    onSuccess: async () => {
      toast.success(t('common.success'), { duration: 3000 })
      try {
        await identityApi.refreshClaims()
      } catch (err) {
        console.error('Failed to refresh claims:', err)
      }
      setProfileCreated(true)
      queryClient.invalidateQueries()
      navigate('/how-it-works')
    }
  })

  const toggleTopic = (value) => {
    setSelectedTopics(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmit = profileName.trim() !== '' && !initProfileMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }

    const payload = {
      userId: actorId,
      profileName: profileName,
      bio: bio,
      bioMentions: bioMentions,
      imageUrl: imageUrl,
      topicTypes: selectedTopics,

      postPerPage: 20,
      socialNotificationPreference: true,
      socialEmailPreference: socialEmailPreference
    }

    initProfileMutation.mutate(payload)
  }

  return (
    <div className="flex-col gap-4">
      {/* Header */}
      <div className="page-header-row page-header-row--lg">
        <div className="page-header-icon">
          <User size={22} color="#fff" />
        </div>
        <div>
          <h1 className="page-header-title">{t('auth.complete_profile')}</h1>
          <p className="page-header-subtitle">{t('auth.complete_profile_desc')}</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Name */}
        <div>
          <label className="form-section-label">
            {t('auth.display_name')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              placeholder={t('auth.display_name_placeholder')}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={initProfileMutation.isPending || initProfileMutation.isSuccess}
              className={`input ${hasSubmitted && !profileName.trim() ? 'error' : ''}`}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--color-surface)',
              }}
            />
          </div>
        </div>

        {/* Avatar */}
        <div>
          <AvatarUpload
            imageUrl={imageUrl}
            onImageUploaded={setImageUrl}
            size={150}
            disabled={initProfileMutation.isPending || initProfileMutation.isSuccess}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="form-section-label">
            {t('auth.bio')}
          </label>
          <div style={{ position: 'relative' }}>
            <MentionEditor
              className="textarea--surface"
              placeholder={t('profile.bio_placeholder')}
              onChange={({ content, mentions }) => {
                setBio(content)
                setBioMentions(mentions)
              }}
              style={{ minHeight: 120, lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="form-section-label">
            {t('profile.interests')}
          </label>
          <TopicSelectorPills
            selectedTopics={selectedTopics}
            onToggle={toggleTopic}
            gap={10}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Email Notification Preference */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 14,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.2s ease-in-out, background-color 0.2s ease-in-out',
          }}
        >
          <SelectionMarker
            checked={socialEmailPreference}
            disabled={initProfileMutation.isPending || switchNotificationMutation.isPending}
            onChange={(e) => handleToggleEmailPreference(e.target.checked)}
            label={t('auth.email_notifications')}
            style={{ alignItems: 'center', width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {t('auth.email_notifications')}
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {t(
                  'auth.email_notifications_desc'
                )}
              </span>
            </div>
          </SelectionMarker>
        </div>

        <button
          type="submit"
          disabled={initProfileMutation.isPending || initProfileMutation.isSuccess}
          className="btn btn-primary btn-form-submit"
          style={{
            opacity: (initProfileMutation.isPending || initProfileMutation.isSuccess) ? 0.7 : 1,
            cursor: (initProfileMutation.isPending || initProfileMutation.isSuccess) ? 'not-allowed' : 'pointer',
            marginTop: 8,
          }}
        >
          {initProfileMutation.isPending ? t('action.saving') : t('auth.save_and_start')}
        </button>
      </form>
    </div>
  )
}
