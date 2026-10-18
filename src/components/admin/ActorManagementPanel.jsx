import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import ConfirmModal from '../common/ConfirmModal'

export default function ActorManagementPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Point Management State
  const [pointActorId, setPointActorId] = useState('')
  const [points, setPoints] = useState('')

  // Premium Management State
  const [premiumActorId, setPremiumActorId] = useState('')
  const [isSeasonResetModalOpen, setIsSeasonResetModalOpen] = useState(false)

  // Set Points Mutation
  const setPointsMutation = useMutation({
    mutationFn: ({ actorId, points }) => adminApi.setActorPoint(actorId, points),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.actor_point_updated', 'Kişi puanı güncellendi'))
    },
  })

  // Set Premium Mutation
  const setPremiumMutation = useMutation({
    mutationFn: ({ actorId, isPremium }) => adminApi.setActorPremium(actorId, isPremium),
    meta: { showErrorToast: true },
    onSuccess: (_, { isPremium }) => {
      toast.success(
        isPremium
          ? t('admin.actor_premium_granted', 'Kişi Pro yapıldı')
          : t('admin.actor_premium_revoked', "Kişinin Pro statüsü kaldırıldı")
      )
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
    },
  })

  const handleSetPoints = () => {
    if (!pointActorId.trim() || !points.toString().trim()) {
      return toast.error(t('admin.actor_id_placeholder', 'Kişi ID girin (GUID)'))
    }
    setPointsMutation.mutate({ actorId: pointActorId.trim(), points: parseInt(points, 10) })
  }

  const handleSetPremium = (isPremium) => {
    if (!premiumActorId.trim()) {
      return toast.error(t('admin.actor_id_placeholder', 'Kişi ID girin (GUID)'))
    }
    setPremiumMutation.mutate({ actorId: premiumActorId.trim(), isPremium })
  }

  const isPointsLoading = setPointsMutation.isPending
  const isPremiumLoading = setPremiumMutation.isPending

  // Season Reset Mutation
  const triggerSeasonResetMutation = useMutation({
    mutationFn: () => adminApi.triggerSeasonReset(),
    meta: { showErrorToast: true },
    onSuccess: (response) => {
      const data = response?.data?.data || response?.data
      const message = data?.message || t('admin.season_reset_success', 'Sezon başarıyla sıfırlandı ve arşivlendi!')
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['seasonStatus'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['seasonLeaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['availableSeasons'] })
    },
  })

  const isResetLoading = triggerSeasonResetMutation.isPending

  const handleSeasonReset = () => {
    setIsSeasonResetModalOpen(true)
  }

  return (
    <div
      className="card-surface"
      style={{
        padding: 24,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="border-b"
        style={{ borderColor: 'var(--color-border)', marginBottom: '12px', paddingBottom: '8px' }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
          {t('admin.actor_management_title', 'Kişi Yönetimi')}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
          {t('admin.actor_management_desc', 'Kişi puanlarını ve seviyelerini yönetin')}
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* ─── BLOK 1: KİŞİ PUANI ─── */}
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}
          >
            {t('admin.actor_point_title', 'Kişi Puanı')}
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 3,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('admin.actor_id', 'Kişi ID')}
            </label>
            <input
              className="input w-full"
              placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
              value={pointActorId}
              onChange={(e) => setPointActorId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 3,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('admin.new_point', 'Yeni Puan')}
            </label>
            <input
              type="number"
              className="input w-full"
              placeholder="e.g. 1500"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div className="flex">
            <button
              className="btn btn-primary"
              onClick={handleSetPoints}
              disabled={isPointsLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {isPointsLoading ? t('admin.updating', 'Güncelleniyor...') : t('admin.update_point', 'Puanı Güncelle')}
            </button>
          </div>
        </div>

        {/* ─── BLOK 2: KİŞİ PREMIUM ─── */}
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}
          >
            {t('admin.actor_premium_title', 'Kişi Pro Durumu')}
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 3,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('admin.actor_id', 'Kişi ID')}
            </label>
            <input
              className="input w-full"
              placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
              value={premiumActorId}
              onChange={(e) => setPremiumActorId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => handleSetPremium(true)}
              disabled={isPremiumLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {isPremiumLoading ? t('admin.updating', 'Güncelleniyor...') : t('admin.make_premium', 'Pro Yap')}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => handleSetPremium(false)}
              disabled={isPremiumLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {t('admin.revoke_premium', 'Pro Kaldır')}
            </button>
          </div>
        </div>

        {/* ─── BLOK 3: SEZON SIFIRLAMA ─── */}
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}
          >
            {t('admin.season_reset_title', 'Sezon Sıfırlama')}
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <p
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {t(
                'admin.season_reset_desc',
                'Tüm kişi ve klanların sezonluk puanlarını sıfırlar, liderlik tablosunu yeni sezon numarasıyla arşivler ve inaktif botları fosilleştirir.'
              )}
            </p>
          </div>

          <div className="flex">
            <button
              className="btn btn-primary"
              onClick={handleSeasonReset}
              disabled={isResetLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {isResetLoading
                ? t('admin.season_reset_in_progress', 'Sıfırlanıyor...')
                : t('admin.trigger_season_reset_btn', 'Sezonu Sıfırla')}
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isSeasonResetModalOpen}
        onClose={() => setIsSeasonResetModalOpen(false)}
        onConfirm={() => {
          setIsSeasonResetModalOpen(false)
          triggerSeasonResetMutation.mutate()
        }}
        title={t('admin.trigger_season_reset_btn', 'Sezonu Sıfırla')}
        description={t(
          'admin.season_reset_confirm_desc',
          'Tüm sezonluk puanlar sıfırlanacak ve liderlik tablosu arşivlenecektir. Onaylıyor musunuz?'
        )}
        confirmText={t('common.confirm', 'Onayla')}
        confirmVariant="danger"
        isLoading={isResetLoading}
      />
    </div>
  )
}
