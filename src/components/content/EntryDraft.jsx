import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { trackCreateEntry } from '../../utils/analytics'

/**
 * EntryDraft — plan.md Component #22
 * Post veya Entry altında inline yanıt yazma kutusu.
 */
export default function EntryDraft({ parentContentItemId, editContentItemId = null, initialContent = '', onSuccess, onCancel }) {
  useDevLog('EntryDraft', arguments[0] || {})
  const [content, setContent] = useState(initialContent)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { t } = useTranslation()

  const mutation = useMutation({
    mutationFn: () => {
      if (editContentItemId) return contentItemApi.editEntry(editContentItemId, { content })
      return contentItemApi.createEntry(parentContentItemId, { content })
    },
    meta: { showErrorToast: true },
    onSuccess: () => {
      if (!editContentItemId) {
        trackCreateEntry({
          parent_content_id: parentContentItemId,
        })
        setContent('')
      }
      if (onSuccess) onSuccess(content)
    },
  })

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmit = content.trim() !== '' && !mutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }

    mutation.mutate()
  }

  if (!isLoggedIn) return null

  return (
    <div className="entry-draft">
      <form noValidate onSubmit={handleSubmit}>
        <textarea
          className={`input textarea textarea--autogrow ${hasSubmitted && !content.trim() ? 'error' : ''}`}
          placeholder={editContentItemId ? t('action.edit') : t('card.write_reply')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
              {t('action.cancel')}
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={mutation.isPending}
            style={{ marginLeft: 'auto' }}
          >
            {mutation.isPending 
              ? (editContentItemId ? t('action.saving') : t('action.sending')) 
              : (editContentItemId ? t('action.save') : t('action.send'))}
          </button>
        </div>
      </form>
    </div>
  )
}
