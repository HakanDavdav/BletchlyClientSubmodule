import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  Edit3,
  Loader2,
  MessageSquare,
  CheckCircle,
  PenTool,
  PenSquare,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import { contentItemApi } from '../../api/contentItemApi'
import { TopicSelectorPills } from '../../components/topic/TopicTag'
import TribeMinimalCard from '../../components/tribe/TribeMinimalCard'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { trackCreatePost } from '../../utils/analytics'
import MentionEditor from '../../components/content/mention/MentionEditor'
import { mentionDtosToInputs } from '../../components/content/mention/mentionUtils'
import { DropdownCaret, DropdownOption, DropdownPanel } from '../../components/common/Dropdown'

export default function CreateEditPostPage() {
  useDevLog('CreateEditPostPage', arguments[0] || {})
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('postId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // If postId is provided, we are in Edit mode
  const isEditMode = Boolean(postId)

  const myTribes = useMyEntitiesStore(s => s.myTribes)
  const setRightPanelTribeId = useUIStore((s) => s.setRightPanelTribeId)
  const [isTribeDropdownOpen, setIsTribeDropdownOpen] = useState(false)
  const tribeDropdownRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mentions: [],
    topicTypes: [],
    tribeId: '',
  })

  useEffect(() => {
    const handler = (event) => {
      if (tribeDropdownRef.current && !tribeDropdownRef.current.contains(event.target)) {
        setIsTribeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (isEditMode) return
    setRightPanelTribeId(formData.tribeId || null)
    return () => setRightPanelTribeId(null)
  }, [formData.tribeId, isEditMode, setRightPanelTribeId])

  // Fetch existing data if in Edit Mode
  const { data: existingPost, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => contentItemApi.getPost(postId).then((res) => res.data?.data),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (isEditMode && existingPost) {
      setFormData({
        title: existingPost.title || '',
        content: existingPost.content || '',
        mentions: mentionDtosToInputs(existingPost.mentions),
        topicTypes: existingPost.topicTypes || [],
        tribeId: existingPost.tribeId || '',
      })
    }
  }, [isEditMode, existingPost])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditMode ? contentItemApi.editPost(postId, data) : contentItemApi.createPost(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      if (!isEditMode) {
        trackCreatePost({
          title: formData.title,
          tribe_id: formData.tribeId || null,
        })
      }

      toast.success(t('common.success'), { duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['contentitem', postId] })
      if (formData.tribeId) {
        queryClient.invalidateQueries({ queryKey: ['tribe', formData.tribeId] })
        queryClient.invalidateQueries({ queryKey: ['tribe-posts', formData.tribeId] })
      }

      setTimeout(() => {
        const newPostId = isEditMode
          ? postId
          : typeof res.data?.data === 'string'
            ? res.data?.data
            : res.data?.data?.postId || res.data?.data?.contentItemId || res.data?.data?.id
        if (newPostId) {
          navigate('/post?postId=' + newPostId)
        } else {
          navigate('/')
        }
      }, 1000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    const payload = {
      ...formData,
      tribeId: formData.tribeId ? formData.tribeId : null
    }
    mutation.mutate(payload)
  }

  const handleTopicToggle = (value) => {
    setFormData((prev) => {
      const exists = prev.topicTypes.includes(value)
      if (exists) {
        return { ...prev, topicTypes: prev.topicTypes.filter((t) => t !== value) }
      } else {
        return { ...prev, topicTypes: [...prev.topicTypes, value] }
      }
    })
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)

  const canSubmit = formData.title.trim() !== '' && formData.content.trim() !== '' && !mutation.isPending
  const selectedTribe = myTribes?.find((tribe) => tribe.tribeId === formData.tribeId)

  const selectTribe = (tribeId) => {
    setFormData((prev) => ({ ...prev, tribeId }))
    setIsTribeDropdownOpen(false)
  }

  if (isEditMode && isLoadingExisting) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div className="page-header-row page-header-row--lg">
        <div className="page-header-icon">
          {isEditMode ? <Edit3 size={22} color="#fff" /> : <PenSquare size={22} color="#fff" />}
        </div>
        <div>
          <h1 className="page-header-title">
            {isEditMode ? t('post.edit_title') : t('post.start_new_topic')}
          </h1>
          <p className="page-header-subtitle">
            {isEditMode
              ? t('post.edit_topic_desc')
              : t('post.start_new_topic_desc')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Tribe Selection */}
        <div>
          <label className="form-section-label">
            {t('post.tribe_selection')}
          </label>
          <div ref={tribeDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              disabled={mutation.isPending || mutation.isSuccess || isEditMode}
              onClick={() => setIsTribeDropdownOpen((value) => !value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: mutation.isPending || mutation.isSuccess || isEditMode ? 'not-allowed' : 'pointer',
                opacity: mutation.isPending || mutation.isSuccess || isEditMode ? 0.7 : 1,
              }}
            >
              <span>{selectedTribe?.tribeName || t('post.global')}</span>
              <DropdownCaret open={isTribeDropdownOpen} />
            </button>
            <DropdownPanel
              open={isTribeDropdownOpen && !mutation.isPending && !mutation.isSuccess && !isEditMode}
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                zIndex: 60,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              <DropdownOption active={!formData.tribeId} onClick={() => selectTribe('')}>
                <span>{t('post.global')}</span>
              </DropdownOption>
              {myTribes?.map((tribe) => (
                <DropdownOption
                  key={tribe.tribeId}
                  className="dropdown-option-btn--card"
                  active={formData.tribeId === tribe.tribeId}
                  onClick={() => selectTribe(tribe.tribeId)}
                >
                  <TribeMinimalCard
                    tribe={tribe}
                    clickable={false}
                    showEditBtn={false}
                    showMemoryMapBtn={false}
                    showPoint={false}
                  />
                </DropdownOption>
              ))}
            </DropdownPanel>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="form-section-label">
            {t('post.title_label')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              placeholder={t('post.title_placeholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              className={`input ${hasSubmitted && !formData.title.trim() ? 'error' : ''}`}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--color-surface)',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="form-section-label">
            {t('post.content_label')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <MentionEditor
              key={isEditMode ? existingPost?.contentItemId ?? 'edit' : 'new'}
              className="textarea--surface"
              initialContent={isEditMode ? existingPost?.content || '' : ''}
              initialMentions={isEditMode ? existingPost?.mentions : null}
              placeholder={t('post.content_placeholder')}
              onChange={({ content, mentions }) => setFormData((prev) => ({ ...prev, content, mentions }))}
              disabled={mutation.isPending || mutation.isSuccess}
              invalid={hasSubmitted && !formData.content.trim()}
              style={{ minHeight: 150 }}
            />
          </div>
        </div>

        {/* Topic Tags */}
        <div>
          <label className="form-section-label" style={{ marginBottom: 10 }}>
            {t('post.categories_optional')}
          </label>
          <TopicSelectorPills
            selectedTopics={formData.topicTypes}
            onToggle={handleTopicToggle}
            disabled={mutation.isPending || mutation.isSuccess}
          />
        </div>



        {/* Submit button */}
        <div style={{ marginTop: 32 }}>
          <button
            type="submit"
            className="btn btn-primary btn-form-submit"
            disabled={mutation.isPending}
            style={{
              opacity: mutation.isPending ? 0.5 : 1,
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>{isEditMode ? t('action.save') : t('action.share')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
