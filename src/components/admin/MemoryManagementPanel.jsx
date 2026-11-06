import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function MemoryManagementPanel() {
  const { t } = useTranslation()
  const [tribeId, setTribeId] = useState('')
  const [actorId, setActorId] = useState('')

  // --- Tribe Memory Mutations ---
  const triggerTribeMemoryMutation = useMutation({
    mutationFn: (id) => adminApi.triggerTribeMemory(id),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.tribe_memory_triggered'))
    },
  })

  const forgetTribeMemoriesMutation = useMutation({
    mutationFn: (id) => adminApi.forgetOldTribeMemories(id),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.tribe_memory_forgotten'))
    },
  })

  // --- Bot Actor Memory Mutations ---
  const triggerActorMemoryMutation = useMutation({
    mutationFn: (id) => adminApi.triggerMemory(id),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.bot_memory_triggered'))
    },
  })

  const forgetActorMemoriesMutation = useMutation({
    mutationFn: (id) => adminApi.forgetOldMemories(id),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.bot_memory_forgotten'))
    },
  })

  const handleTriggerTribeMemory = () => {
    if (!tribeId) return toast.error(t('admin.tribe_id_placeholder'))
    triggerTribeMemoryMutation.mutate(tribeId)
  }

  const handleForgetTribeMemories = () => {
    if (!tribeId) return toast.error(t('admin.tribe_id_placeholder'))
    forgetTribeMemoriesMutation.mutate(tribeId)
  }

  const handleTriggerActorMemory = () => {
    if (!actorId) return toast.error(t('admin.actor_id_placeholder'))
    triggerActorMemoryMutation.mutate(actorId)
  }

  const handleForgetActorMemories = () => {
    if (!actorId) return toast.error(t('admin.actor_id_placeholder'))
    forgetActorMemoriesMutation.mutate(actorId)
  }

  const isTribeBusy = triggerTribeMemoryMutation.isPending || forgetTribeMemoriesMutation.isPending
  const isActorBusy = triggerActorMemoryMutation.isPending || forgetActorMemoriesMutation.isPending
  const isLoading = isTribeBusy || isActorBusy

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
      <div className="border-b" style={{ borderColor: 'var(--color-border)', marginBottom: '12px', paddingBottom: '8px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
          {t('admin.memory_management_title')}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
          {t('admin.memory_management_desc')}
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Tribe Memory Block */}
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
            {t('admin.tribe_memory')}
          </div>
          <div className="form-group">
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('admin.tribe_id')}
            </label>
            <input
              className="input w-full"
              placeholder="e.g. b8026954-6c4c-4734-8778-a261cffd2dba"
              value={tribeId}
              onChange={(e) => setTribeId(e.target.value)}
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

          <div className="flex gap-2.5 mt-4 flex-wrap">
            <button
              className="btn btn-primary"
              onClick={handleTriggerTribeMemory}
              disabled={isLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {t('admin.trigger_memory_extraction')}
            </button>

            <button
              className="btn btn-danger"
              onClick={handleForgetTribeMemories}
              disabled={isLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {t('admin.forget_old_memories')}
            </button>
          </div>
        </div>

        {/* Bot Actor Memory Block */}
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
            {t('admin.bot_actor_memory')}
          </div>
          <div className="form-group">
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('admin.bot_actor_id')}
            </label>
            <input
              className="input w-full"
              placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
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

          <div className="flex gap-2.5 mt-4 flex-wrap">
            <button
              className="btn btn-primary"
              onClick={handleTriggerActorMemory}
              disabled={isLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {t('admin.trigger_memory_extraction')}
            </button>

            <button
              className="btn btn-danger"
              onClick={handleForgetActorMemories}
              disabled={isLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {t('admin.forget_old_memories')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

