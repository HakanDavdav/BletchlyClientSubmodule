import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import ConfirmModal from '../common/ConfirmModal'
import useAuthStore from '../../store/authStore'

function CleanupBlock({ title, description, label, placeholder, value, onChange, onConfirm, loading, buttonLabel, t }) {
  return (
    <div className="admin-filter-card">
      <div className="admin-section-title">
        {title}
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          margin: '0 0 10px',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label className="form-label admin-field-label">
          {label}
        </label>
        <input
          className="input w-full admin-input admin-input--mono"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <button
        className="btn btn-danger admin-btn"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? t('admin.processing') : buttonLabel}
      </button>
    </div>
  )
}

export default function ActorManagementPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isDeveloper = useAuthStore((state) => state.isDeveloper)

  // Point Management State
  const [pointActorId, setPointActorId] = useState('')
  const [points, setPoints] = useState('')

  // Premium Management State
  const [premiumActorId, setPremiumActorId] = useState('')
  const [isSeasonResetModalOpen, setIsSeasonResetModalOpen] = useState(false)

  // Cleanup State
  const [cleanupUserId, setCleanupUserId] = useState('')
  const [cleanupBotId, setCleanupBotId] = useState('')
  const [cleanupTribeId, setCleanupTribeId] = useState('')
  const [cleanupPostId, setCleanupPostId] = useState('')
  const [cleanupEntryId, setCleanupEntryId] = useState('')
  const [cleanupConfirm, setCleanupConfirm] = useState(null)

  // Content Reduction State
  const [reduceKeepRatio, setReduceKeepRatio] = useState('0.2')
  const [reduceTargetPosts, setReduceTargetPosts] = useState('97')
  const [reduceTargetEntries, setReduceTargetEntries] = useState('881')
  const [reduceResult, setReduceResult] = useState(null)
  const [isReduceConfirmOpen, setIsReduceConfirmOpen] = useState(false)

  // Set Points Mutation
  const setPointsMutation = useMutation({
    mutationFn: ({ actorId, points }) => adminApi.setActorPoint(actorId, points),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.actor_point_updated'))
    },
  })

  // Set Premium Mutation
  const setPremiumMutation = useMutation({
    mutationFn: ({ actorId, isPremium }) => adminApi.setActorPremium(actorId, isPremium),
    meta: { showErrorToast: true },
    onSuccess: (_, { isPremium }) => {
      toast.success(
        isPremium
          ? t('admin.actor_premium_granted')
          : t('admin.actor_premium_revoked')
      )
      queryClient.invalidateQueries({ queryKey: ['actorProfile'] })
    },
  })

  const handleSetPoints = () => {
    if (!pointActorId.trim() || !points.toString().trim()) {
      return toast.error(t('admin.actor_id_placeholder'))
    }
    setPointsMutation.mutate({ actorId: pointActorId.trim(), points: parseInt(points, 10) })
  }

  const handleSetPremium = (isPremium) => {
    if (!premiumActorId.trim()) {
      return toast.error(t('admin.actor_id_placeholder'))
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
      const message = data?.message || t('admin.season_reset_success')
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['seasonStatus'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['seasonLeaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['availableSeasons'] })
    },
  })

  const isResetLoading = triggerSeasonResetMutation.isPending

  const invalidateCleanupQueries = () => {
    ;['feed', 'post', 'entry', 'posts', 'entries', 'actorProfile', 'leaderboard', 'search'].forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] })
    })
  }

  const cleanupUserMutation = useMutation({
    mutationFn: (actorId) => adminApi.cleanupUser(actorId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.cleanup_user_deleted'))
      invalidateCleanupQueries()
    },
  })

  const cleanupBotMutation = useMutation({
    mutationFn: (actorId) => adminApi.cleanupBot(actorId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.cleanup_bot_deleted'))
      invalidateCleanupQueries()
    },
  })

  const cleanupTribeMutation = useMutation({
    mutationFn: (tribeId) => adminApi.cleanupTribe(tribeId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.cleanup_tribe_deleted'))
      invalidateCleanupQueries()
      queryClient.invalidateQueries({ queryKey: ['tribes'] })
      queryClient.invalidateQueries({ queryKey: ['tribe'] })
    },
  })

  const cleanupPostMutation = useMutation({
    mutationFn: (postId) => adminApi.cleanupPost(postId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.cleanup_post_deleted'))
      invalidateCleanupQueries()
    },
  })

  const cleanupEntryMutation = useMutation({
    mutationFn: (entryId) => adminApi.cleanupEntry(entryId),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.cleanup_entry_deleted'))
      invalidateCleanupQueries()
    },
  })

  const reduceContentMutation = useMutation({
    mutationFn: (payload) => adminApi.reduceContent(payload),
    meta: { showErrorToast: true },
    onSuccess: (response) => {
      const data = response?.data?.data || response?.data
      setReduceResult(data)
      toast.success(
        data?.dryRun ? t('admin.reduction_preview_success') : t('admin.reduction_success')
      )
      if (!data?.dryRun) invalidateCleanupQueries()
    },
  })

  const handleSeasonReset = () => {
    setIsSeasonResetModalOpen(true)
  }

  const openCleanupConfirm = (type, id) => {
    const value = id.trim()
    if (!value) return toast.error(t('admin.cleanup_guid_required'))
    setCleanupConfirm({ type, id: value })
  }

  const handleCleanupConfirm = () => {
    if (!cleanupConfirm) return
    const { type, id } = cleanupConfirm
    setCleanupConfirm(null)

    if (type === 'user') cleanupUserMutation.mutate(id)
    if (type === 'bot') cleanupBotMutation.mutate(id)
    if (type === 'tribe') cleanupTribeMutation.mutate(id)
    if (type === 'post') cleanupPostMutation.mutate(id)
    if (type === 'entry') cleanupEntryMutation.mutate(id)
  }

  const runReduction = (dryRun) => {
    const ratio = Number.parseFloat(reduceKeepRatio)
    if (Number.isNaN(ratio) || ratio <= 0 || ratio > 1) {
      return toast.error(t('admin.keep_ratio_invalid'))
    }

    reduceContentMutation.mutate({
      keepRatio: ratio,
      targetPosts: reduceTargetPosts.trim() ? Number.parseInt(reduceTargetPosts, 10) : null,
      targetEntries: reduceTargetEntries.trim()
        ? Number.parseInt(reduceTargetEntries, 10)
        : null,
      dryRun,
    })
  }

  const isCleanupLoading =
    cleanupUserMutation.isPending ||
    cleanupBotMutation.isPending ||
    cleanupTribeMutation.isPending ||
    cleanupPostMutation.isPending ||
    cleanupEntryMutation.isPending

  const isReduceLoading = reduceContentMutation.isPending

  return (
    <div className="card-surface admin-panel-card">
      {/* Header */}
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">
          {t('admin.actor_management_title')}
        </h2>
        <p className="admin-panel-subtitle">
          {t('admin.actor_management_desc')}
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* ─── BLOK 1: KİŞİ PUANI ─── */}
        <div className="admin-filter-card">
          <div className="admin-section-title">
            {t('admin.actor_point_title')}
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label admin-field-label">
              {t('admin.actor_id')}
            </label>
            <input
              className="input w-full admin-input admin-input--mono"
              placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
              value={pointActorId}
              onChange={(e) => setPointActorId(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label admin-field-label">
              {t('admin.new_point')}
            </label>
            <input
              type="number"
              className="input w-full admin-input"
              placeholder="e.g. 1500"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>

          <div className="flex">
            <button
              className="btn btn-primary admin-btn"
              onClick={handleSetPoints}
              disabled={isPointsLoading}
            >
              {isPointsLoading ? t('admin.updating') : t('admin.update_point')}
            </button>
          </div>
        </div>

        {/* ─── BLOK 2: KİŞİ PREMIUM ─── */}
        <div className="admin-filter-card">
          <div className="admin-section-title">
            {t('admin.actor_premium_title')}
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label admin-field-label">
              {t('admin.actor_id')}
            </label>
            <input
              className="input w-full admin-input admin-input--mono"
              placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
              value={premiumActorId}
              onChange={(e) => setPremiumActorId(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-primary admin-btn"
              onClick={() => handleSetPremium(true)}
              disabled={isPremiumLoading}
            >
              {isPremiumLoading ? t('admin.updating') : t('admin.make_premium')}
            </button>

            <button
              className="btn btn-secondary admin-btn"
              onClick={() => handleSetPremium(false)}
              disabled={isPremiumLoading}
            >
              {t('admin.revoke_premium')}
            </button>
          </div>
        </div>

        {/* ─── BLOK 3: SEZON SIFIRLAMA (Developer Only) ─── */}
        {isDeveloper && (
          <div className="admin-filter-card">
            <div className="admin-section-title">
              {t('admin.season_reset_title')}
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
                  'admin.season_reset_desc'
                )}
              </p>
            </div>

            <div className="flex">
              <button
                className="btn btn-primary admin-btn"
                onClick={handleSeasonReset}
                disabled={isResetLoading}
              >
                {isResetLoading
                  ? t('admin.season_reset_in_progress')
                  : t('admin.trigger_season_reset_btn')}
              </button>
            </div>
          </div>
        )}

        {/* ─── BLOK 4: USER CLEANUP ─── */}
        <CleanupBlock
          title={t('admin.cleanup_user_title')}
          description={t('admin.cleanup_user_desc')}
          label={t('admin.actor_id')}
          placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
          value={cleanupUserId}
          onChange={setCleanupUserId}
          onConfirm={() => openCleanupConfirm('user', cleanupUserId)}
          loading={cleanupUserMutation.isPending}
          buttonLabel={t('admin.cleanup_soft_delete')}
          t={t}
        />

        {/* ─── BLOK 5: BOT CLEANUP ─── */}
        <CleanupBlock
          title={t('admin.cleanup_bot_title')}
          description={t('admin.cleanup_bot_desc')}
          label={t('admin.bot_actor_id')}
          placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
          value={cleanupBotId}
          onChange={setCleanupBotId}
          onConfirm={() => openCleanupConfirm('bot', cleanupBotId)}
          loading={cleanupBotMutation.isPending}
          buttonLabel={t('admin.cleanup_soft_delete')}
          t={t}
        />

        {/* ─── BLOK 5B: TRIBE CLEANUP ─── */}
        <CleanupBlock
          title={t('admin.cleanup_tribe_title')}
          description={t('admin.cleanup_tribe_desc')}
          label={t('admin.tribe_id')}
          placeholder="e.g. 51dc4f2f-a54e-4dfd-9956-0bfd7284ec69"
          value={cleanupTribeId}
          onChange={setCleanupTribeId}
          onConfirm={() => openCleanupConfirm('tribe', cleanupTribeId)}
          loading={cleanupTribeMutation.isPending}
          buttonLabel={t('admin.cleanup_soft_delete')}
          t={t}
        />

        {/* ─── BLOK 6: POST CLEANUP ─── */}
        <CleanupBlock
          title={t('admin.cleanup_post_title')}
          description={t('admin.cleanup_post_desc')}
          label={t('admin.post_id')}
          placeholder="e.g. 01a0e87b-6b17-7385-a80b-ab24fb5df6fd"
          value={cleanupPostId}
          onChange={setCleanupPostId}
          onConfirm={() => openCleanupConfirm('post', cleanupPostId)}
          loading={cleanupPostMutation.isPending}
          buttonLabel={t('admin.cleanup_soft_delete')}
          t={t}
        />

        {/* ─── BLOK 7: ENTRY CLEANUP ─── */}
        <CleanupBlock
          title={t('admin.cleanup_entry_title')}
          description={t('admin.cleanup_entry_desc')}
          label={t('admin.entry_id')}
          placeholder="e.g. 01a0e87b-6b17-7385-a80b-ab24fb5df6fd"
          value={cleanupEntryId}
          onChange={setCleanupEntryId}
          onConfirm={() => openCleanupConfirm('entry', cleanupEntryId)}
          loading={cleanupEntryMutation.isPending}
          buttonLabel={t('admin.cleanup_soft_delete')}
          t={t}
        />

        {/* ─── BLOK 8: CONTENT REDUCTION (Developer Only) ─── */}
        {isDeveloper && (
          <div className="admin-filter-card">
            <div className="admin-section-title">
              {t('admin.content_reduce_title')}
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                margin: '0 0 10px',
                lineHeight: 1.5,
              }}
            >
              {t('admin.content_reduce_desc')}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label admin-field-label">
                  {t('admin.keep_ratio')}
                </label>
                <input
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  className="input w-full admin-input"
                  value={reduceKeepRatio}
                  onChange={(e) => setReduceKeepRatio(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label admin-field-label">
                  {t('admin.target_posts')}
                </label>
                <input
                  type="number"
                  min="0"
                  className="input w-full admin-input"
                  value={reduceTargetPosts}
                  onChange={(e) => setReduceTargetPosts(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label admin-field-label">
                  {t('admin.target_entries')}
                </label>
                <input
                  type="number"
                  min="0"
                  className="input w-full admin-input"
                  value={reduceTargetEntries}
                  onChange={(e) => setReduceTargetEntries(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              <button
                className="btn btn-secondary admin-btn"
                onClick={() => runReduction(true)}
                disabled={isReduceLoading}
              >
                {isReduceLoading ? t('admin.processing') : t('admin.preview')}
              </button>

              <button
                className="btn btn-danger admin-btn"
                onClick={() => setIsReduceConfirmOpen(true)}
                disabled={isReduceLoading}
              >
                {isReduceLoading ? t('admin.reduction_running') : t('admin.run_reduction')}
              </button>
            </div>

            {reduceResult && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  {t('admin.reduction_result_title')}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 6,
                  }}
                >
                  {[
                    [t('admin.active_posts'), reduceResult.activePosts],
                    [t('admin.active_entries'), reduceResult.activeEntries],
                    [t('admin.keep_posts'), reduceResult.keepPosts],
                    [t('admin.keep_entries'), reduceResult.keepEntries],
                    [
                      t('admin.delete_posts'),
                      reduceResult.deletePosts ?? reduceResult.deletedPosts,
                    ],
                    [
                      t('admin.delete_entries'),
                      reduceResult.deleteEntries ?? reduceResult.deletedEntries,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                      <strong style={{ color: 'var(--color-text)' }}>{value ?? '-'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!cleanupConfirm}
        onClose={() => setCleanupConfirm(null)}
        onConfirm={handleCleanupConfirm}
        title={t('admin.cleanup_confirm_title')}
        description={t('admin.cleanup_confirm_desc')}
        confirmText={t('common.confirm')}
        confirmVariant="danger"
        isLoading={isCleanupLoading}
      />

      <ConfirmModal
        isOpen={isDeveloper && isReduceConfirmOpen}
        onClose={() => setIsReduceConfirmOpen(false)}
        onConfirm={() => {
          setIsReduceConfirmOpen(false)
          runReduction(false)
        }}
        title={t('admin.run_reduction')}
        description={t('admin.reduction_confirm_desc')}
        confirmText={t('common.confirm')}
        confirmVariant="danger"
        isLoading={isReduceLoading}
      />

      <ConfirmModal
        isOpen={isDeveloper && isSeasonResetModalOpen}
        onClose={() => setIsSeasonResetModalOpen(false)}
        onConfirm={() => {
          setIsSeasonResetModalOpen(false)
          triggerSeasonResetMutation.mutate()
        }}
        title={t('admin.trigger_season_reset_btn')}
        description={t(
          'admin.season_reset_confirm_desc'
        )}
        confirmText={t('common.confirm')}
        confirmVariant="danger"
        isLoading={isResetLoading}
      />
    </div>
  )
}
