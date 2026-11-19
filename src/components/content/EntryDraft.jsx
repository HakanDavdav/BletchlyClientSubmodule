import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { trackCreateEntry } from '../../utils/analytics'
import MentionEditor from './mention/MentionEditor'
import { mentionDtosToInputs } from './mention/mentionUtils'

/**
 * EntryDraft — plan.md Component #22
 * Post veya Entry altında inline yanıt yazma kutusu.
 */
export default function EntryDraft({ parentContentItemId, editContentItemId = null, initialContent = '', initialMentions = null, onSuccess, onCancel }) {
  useDevLog('EntryDraft', arguments[0] || {})
  const [draft, setDraft] = useState(() => ({
    content: initialContent,
    mentions: mentionDtosToInputs(initialMentions),
    mentionDtos: initialMentions || [],
  }))
  const content = draft.content
  const editorRef = useRef(null)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { t } = useTranslation()

  const mutation = useMutation({
    mutationFn: () => {
      const dto = { content, mentions: draft.mentions }
      if (editContentItemId) return contentItemApi.editEntry(editContentItemId, dto)
      return contentItemApi.createEntry(parentContentItemId, dto)
    },
    meta: { showErrorToast: true },
    onSuccess: () => {
      if (!editContentItemId) {
        trackCreateEntry({
          parent_content_id: parentContentItemId,
        })
        editorRef.current?.clear()
      }
      if (onSuccess) onSuccess(content, draft.mentionDtos)
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
        <MentionEditor
          ref={editorRef}
          initialContent={initialContent}
          initialMentions={initialMentions}
          invalid={hasSubmitted && !content.trim()}
          placeholder={editContentItemId ? t('action.edit') : t('card.write_reply')}
          onChange={setDraft}
          disabled={mutation.isPending}
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
