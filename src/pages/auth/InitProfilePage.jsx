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
import { TopicTypes } from '../../constants/TopicTypes'

export default function InitProfilePage() {
  useDevLog('InitProfilePage', arguments[0] || {})
  const { actorId, setProfileCreated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [profileName, setProfileName] = useState('')
  const [bio, setBio] = useState('')
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
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
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
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'
    
    if (isRequired) {
      return (!value || !value.trim()) ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

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
          <User size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('auth.complete_profile')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('auth.complete_profile_desc')}
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Name */}
        <div>
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
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('profileName', profileName, true)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={() => setFocused('profileName')}
              onBlur={() => setFocused(null)}
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
            {t('auth.bio')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              placeholder={t('profile.bio_placeholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${getBorderColor('bio', bio, false)}`,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                minHeight: 120,
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
              onFocus={() => setFocused('bio')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>

        {/* Topics */}
        <div>
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
            {t('profile.interests')}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {TopicTypes.map(topic => {
              const isSelected = selectedTopics.includes(topic.value);
              const translationKey = (topic.key || topic.enumName).toLowerCase();
              return (
                <label key={topic.value} style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTopic(topic.value)}
                    style={{ display: 'none' }}
                  />
                  {t(`topics.${translationKey}`)}
                </label>
              )
            })}
          </div>
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
          }}
        >
          <SelectionMarker
            checked={socialEmailPreference}
            disabled={initProfileMutation.isPending || switchNotificationMutation.isPending}
            onChange={(e) => handleToggleEmailPreference(e.target.checked)}
            label={t('auth.email_notifications', 'E-posta Bildirimleri')}
            style={{ alignItems: 'center', width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {t('auth.email_notifications', 'E-posta Bildirimleri')}
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {t(
                  'auth.email_notifications_desc',
                  'Sosyal etkileşimler, takipler ve güncellemeler hakkında e-posta bildirimleri alın'
                )}
              </span>
            </div>
          </SelectionMarker>
        </div>

        <button
          type="submit"
          disabled={initProfileMutation.isPending || initProfileMutation.isSuccess}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '13px 24px',
            fontSize: 14,
            fontWeight: 600,
            gap: 8,
            borderRadius: 12,
            opacity: (initProfileMutation.isPending || initProfileMutation.isSuccess) ? 0.7 : 1,
            cursor: (initProfileMutation.isPending || initProfileMutation.isSuccess) ? 'not-allowed' : 'pointer',
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          {initProfileMutation.isPending ? t('action.saving') : t('auth.save_and_start')}
        </button>
      </form>
    </div>
  )
}
