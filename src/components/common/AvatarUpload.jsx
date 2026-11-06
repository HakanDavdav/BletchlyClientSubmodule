import React, { useRef, useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { mediaApi } from '../../api/mediaApi'
import { Loader2, UploadCloud, Camera, Trash2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import AvatarCropModal from './AvatarCropModal'
import ImageWithLoader from './ImageWithLoader'
import LockedSlash from './LockedSlash'

export default function AvatarUpload({
  imageUrl,
  onImageUploaded,
  disabled,
  size = 144,
  shape = 'circle',
  compact = false,
  aspectRatio,
  imageKind = 'avatar',
  isLocked = false,
  onLockedClick,
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Crop modal state
  const [cropSrc, setCropSrc] = useState(null)
  const [showCrop, setShowCrop] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)

  const uploadMutation = useMutation({
    mutationFn: (payload) => mediaApi.uploadImage(payload),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const url = res.data?.data || res.data?.Data || (typeof res.data === 'string' ? res.data : null)
      if (res.data?.succeeded !== false && url) {
        onImageUploaded(url)
        toast.success(t('upload.success'))
      }
    },
    onSettled: () => {
      setPendingFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
  })

  const isUploading = uploadMutation.isPending

  const processFile = (file) => {
    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/pjpeg',
      'image/jfif',
    ]
    const extension = file.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : ''
    const isAllowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'].includes(extension)

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      toast.error(
        t('upload.invalid_type')
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('upload.size_error'))
      return
    }

    setPendingFile(file)

    // Dosyayı data URL'e çevirip crop modal'ı aç
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result)
      setShowCrop(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = useCallback(
    ({ crop, rotation }) => {
      if (!pendingFile) return
      setShowCrop(false)
      setCropSrc(null)
      uploadMutation.mutate({
        file: pendingFile,
        kind: imageKind,
        crop,
        rotation,
      })
    },
    [imageKind, pendingFile, uploadMutation]
  )

  const handleCropCancel = useCallback(() => {
    setShowCrop(false)
    setCropSrc(null)
    setPendingFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading && !isLocked) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled || isUploading || isLocked) {
      if (isLocked) onLockedClick?.()
      return
    }
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    if (onImageUploaded) {
      onImageUploaded('')
    }
  }

  const borderRadius = shape === 'circle' ? '50%' : '14px'
  const borderWidth = shape === 'circle' ? 2.5 : 2
  const cropShape = shape === 'circle' ? 'round' : 'rect'

  const previewBox = (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: borderRadius,
        background: isDragging
          ? 'var(--color-primary-light, rgba(99, 102, 241, 0.1))'
          : 'var(--color-surface-raised)',
        border: isDragging
          ? '2px dashed var(--color-primary)'
          : `${borderWidth}px solid ${isHovered && !disabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        transform: isHovered && !disabled ? 'translateY(-1px)' : 'none',
        boxShadow:
          isHovered && !disabled
            ? '0 6px 20px rgba(0, 0, 0, 0.18)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      title={isLocked ? t('premium.required') : undefined}
      onClick={() => {
        if (disabled || isUploading) return
        if (isLocked) {
          onLockedClick?.()
          return
        }
        fileInputRef.current?.click()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Loader2
            size={Math.max(24, Math.round(size * 0.25))}
            style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }}
          />
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {t('upload.uploading')}
          </span>
        </div>
      ) : imageUrl ? (
        <>
          <ImageWithLoader
            src={imageUrl}
            alt="Avatar"
            spinnerSize="sm"
            spinnerOpacity={0.4}
            wrapperStyle={{ width: '100%', height: '100%' }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.3s ease, opacity 0.28s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          {/* Hover overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isHovered
                ? 'rgba(0, 0, 0, 0.65)'
                : compact
                ? 'rgba(0, 0, 0, 0.35)'
                : 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 0 : 4,
              opacity: isHovered ? 1 : compact ? 0.65 : 0,
              transition: 'all 0.25s ease',
              color: '#fff',
              borderRadius: borderRadius,
              backdropFilter: compact && !isHovered ? 'blur(0.5px)' : 'none',
            }}
          >
            <Camera size={Math.max(20, Math.round(size * 0.2))} />
            {!compact && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                {t('upload.change')}
              </span>
            )}
          </div>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: size < 60 ? 2 : 6,
            color: isHovered ? 'var(--color-primary)' : 'var(--color-text-faint)',
            transition: 'color 0.2s ease',
            padding: size < 60 ? 2 : undefined,
          }}
        >
          {compact ? (
            <Camera size={Math.max(20, Math.round(size * 0.2))} />
          ) : (
            <UploadCloud size={Math.max(18, Math.round(size * (size < 60 ? 0.42 : 0.28)))} />
          )}
          {size >= 60 && !compact && (
            <span style={{ fontSize: 11, fontWeight: 500 }}>
              {t('upload.drag_or_click')}
            </span>
          )}
        </div>
      )}
      {isLocked && <LockedSlash stretch strokeWidth={2.4} style={{ zIndex: 10 }} />}
    </div>
  )

  const hiddenFileInput = (
    <input
      type="file"
      accept="image/jpeg, image/png, image/gif, image/webp, image/pjpeg, .jfif, .jpg, .jpeg, .png, .gif, .webp"
      ref={fileInputRef}
      style={{ display: 'none' }}
      onChange={handleFileChange}
      disabled={disabled || isUploading}
    />
  )

  const cropModal = (
    <AvatarCropModal
      imageSrc={cropSrc}
      open={showCrop}
      cropShape={cropShape}
      aspectRatio={aspectRatio}
      onConfirm={handleCropConfirm}
      onCancel={handleCropCancel}
    />
  )

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: size < 60 ? 4 : 8,
          width: size,
          maxWidth: '100%',
        }}
      >
        {hiddenFileInput}
        {previewBox}

        {imageUrl && (
          <div style={{ width: '100%' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              title={t('upload.remove')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: size < 60 ? 0 : 6,
                width: '100%',
                padding: size < 60 ? '2px 0' : '4px 8px',
                height: size < 60 ? 22 : undefined,
                minHeight: 'unset',
              }}
            >
              <Trash2 size={size < 60 ? 12 : 13} />
              {size >= 60 && <span>{t('upload.remove')}</span>}
            </button>
          </div>
        )}

        {cropModal}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      {hiddenFileInput}
      {previewBox}

      {/* Control Actions & Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            disabled={disabled || isUploading}
            onClick={() => {
              if (isLocked) {
                onLockedClick?.()
                return
              }
              fileInputRef.current?.click()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {imageUrl ? <Camera size={16} /> : <ImagePlus size={16} />}
            {imageUrl
              ? t('upload.change_image')
              : t('upload.select_image')}
          </button>

          {imageUrl && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
              }}
            >
              <Trash2 size={15} />
              <span>{t('upload.remove')}</span>
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {t(
            'upload.drag_hint'
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 2 }}>
            {t('upload.limits')}
          </div>
        </div>
      </div>

      {cropModal}
    </div>
  )
}
