import { useState } from 'react'
import { ArrowLeft, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import BackButton from '../components/common/BackButton'
import SelectionMarker from '../components/common/SelectionMarker'
import { identityApi } from '../api/identityApi'
import { actorApi } from '../api/actorApi'

import ChangeUsernameModal from '../components/auth/ChangeUsernameModal'
import ChangePasswordModal from '../components/auth/ChangePasswordModal'
import TwoFactorModal from '../components/auth/TwoFactorModal'
import DeleteAccountModal from '../components/auth/DeleteAccountModal'
import ChangeEmailModal from '../components/auth/ChangeEmailModal'
import ChangePhoneModal from '../components/auth/ChangePhoneModal'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

export default function AccountSettingsPage() {
  useDevLog('AccountSettingsPage', arguments[0] || {})
  const { actorId, isExternalAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeModal, setActiveModal] = useState(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId),
    enabled: !!actorId,
    select: (res) => res.data?.data,
  })

  const currentEmailPref = profile?.userSettings?.socialEmailPreference ?? profile?.socialEmailPreference ?? true
  const [localEmailPref, setLocalEmailPref] = useState(null)
  const isEmailNotificationsEnabled = localEmailPref !== null ? localEmailPref : currentEmailPref

  const switchNotificationMutation = useMutation({
    mutationFn: (newVal) => identityApi.switchNotification({ emailPreference: newVal }),
    onSuccess: (res, newVal) => {
      setLocalEmailPref(newVal)
      toast.success(t('settings.notification_updated', 'Bildirim tercihi güncellendi'))
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
    onError: () => {
      toast.error(t('common.error', 'Bir hata oluştu'))
    }
  })

  const handleToggleNotification = (newVal) => {
    switchNotificationMutation.mutate(newVal)
  }

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
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Settings size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('settings.account_settings')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('settings.account_settings_desc')}
          </p>
        </div>
      </div>

      {/* Hesap & Güvenlik Bölümü */}
      {!isExternalAuth && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <button
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
              onClick={() => setActiveModal('changeEmail')}
            >
              {t('settings.change_email')}
            </button>
            <button
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
              onClick={() => setActiveModal('changeUsername')}
            >
              {t('settings.change_username')}
            </button>
            <button
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
              onClick={() => setActiveModal('changePassword')}
            >
              {t('settings.change_password')}
            </button>
            <button
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
              onClick={() => setActiveModal('twoFactor')}
            >
              {t('settings.two_factor')}
            </button>
          </div>
        </div>
      )}

      {/* E-posta Bildirimleri Bölümü */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 14,
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SelectionMarker
            checked={isEmailNotificationsEnabled}
            disabled={isLoadingProfile || switchNotificationMutation.isPending}
            onChange={(e) => handleToggleNotification(e.target.checked)}
            label={t('settings.email_notifications', 'E-posta Bildirimleri')}
            style={{ alignItems: 'center', width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {t('settings.email_notifications', 'E-posta Bildirimleri')}
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {t(
                  'settings.email_notifications_desc',
                  'Hesabınızdaki sosyal etkileşimler, takipler ve önemli güncellemeler için e-posta bildirimleri alın.'
                )}
              </span>
            </div>
          </SelectionMarker>
        </div>
      </div>

      {/* Tehlikeli Alan Bölümü */}
      <div
        style={{
          padding: 24,
          borderRadius: 12,
          border: '1px solid var(--color-error)',
          marginBottom: 32,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-error)', marginBottom: 4 }}
          >
            {t('settings.danger_zone')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            {t('settings.danger_zone_desc')}
          </p>
        </div>
        <div>
          <button
            className="btn btn-danger"
            onClick={() => setActiveModal('deleteAccount')}
          >
            {t('settings.delete_account')}
          </button>
        </div>
      </div>

      {/* Modals */}

      <ChangeUsernameModal
        isOpen={activeModal === 'changeUsername'}
        onClose={() => setActiveModal(null)}
      />
      <ChangePasswordModal
        isOpen={activeModal === 'changePassword'}
        onClose={() => setActiveModal(null)}
      />
      <TwoFactorModal isOpen={activeModal === 'twoFactor'} onClose={() => setActiveModal(null)} />
      <DeleteAccountModal
        isOpen={activeModal === 'deleteAccount'}
        onClose={() => setActiveModal(null)}
      />
      <ChangeEmailModal
        isOpen={activeModal === 'changeEmail'}
        onClose={() => setActiveModal(null)}
      />
      <ChangePhoneModal
        isOpen={activeModal === 'changePhone'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  )
}
