import React, { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
import { ZoomIn, ZoomOut, Image as ImageIcon, ClipboardPaste, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ModalHeader from './ModalHeader'

/**
 * AvatarCropModal — Görsel kaynağı seçimi + kırpma modalı.
 *
 * @param {object} props
 * @param {string|null} props.imageSrc - Kırpılacak resmin data URL'i (yoksa kaynak seçim ekranı)
 * @param {boolean} props.open - Modal açık mı
 * @param {'round'|'rect'} [props.cropShape='round'] - Kırpma şekli
 * @param {function} props.onConfirm - ({ crop, rotation }) => void — normalize crop bilgisi
 * @param {function} props.onCancel - Modal kapatma
 * @param {function} props.onRequestFile - Dosya seçiciyi aç
 * @param {function} props.onPaste - Panodaki görseli al
 */
export default function AvatarCropModal({
  imageSrc,
  open,
  cropShape = 'round',
  aspectRatio,
  onConfirm,
  onCancel,
  onRequestFile,
  onPaste,
  onSelectFile,
}) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPercentages, setCroppedAreaPercentages] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const [clipboardFiles, setClipboardFiles] = useState([])

  // Modal her açıldığında / yeni resim geldiğinde state'leri sıfırla
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPercentages(null)
      setIsProcessing(false)
      setIsPasting(false)
      setClipboardFiles([])
    }
  }, [open, imageSrc])

  useEffect(() => {
    return () => {
      clipboardFiles.forEach((entry) => URL.revokeObjectURL(entry.url))
    }
  }, [clipboardFiles])

  const onCropComplete = useCallback((croppedArea) => {
    setCroppedAreaPercentages(croppedArea)
  }, [])

  const handleConfirm = () => {
    if (!croppedAreaPercentages) return
    setIsProcessing(true)
    onConfirm({ crop: croppedAreaPercentages, rotation: 0 })
    setIsProcessing(false)
  }

  const handlePasteClick = async () => {
    if (!onPaste || isPasting) return
    setIsPasting(true)
    try {
      const files = await onPaste()
      if (!files || files.length === 0) return
      if (files.length === 1) {
        onSelectFile?.(files[0])
        return
      }
      setClipboardFiles(
        files.map((file) => ({ file, url: URL.createObjectURL(file) }))
      )
    } finally {
      setIsPasting(false)
    }
  }

  const handleClipboardSelect = (file) => {
    setClipboardFiles([])
    onSelectFile?.(file)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onCancel()
    }
  }

  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="modal-overlay avatar-crop-backdrop"
      onClick={handleBackdropClick}
      style={{
        zIndex: 10000,
        animation: 'avatarCropFadeIn 0.2s ease',
      }}
    >
      <div
        className="avatar-crop-modal"
        style={{
          background: 'var(--color-bg)',
          borderRadius: 20,
          width: '92vw',
          maxWidth: 760,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          animation: 'avatarCropSlideUp 0.25s ease',
        }}
      >
        <ModalHeader
          icon={<ImageIcon size={18} />}
          title={t('upload.source_title')}
          onClose={onCancel}
        />
        <div className="avatar-crop-body">
          {/* Crop / Empty Stage */}
          <div className="avatar-crop-stage">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio || (cropShape === 'rect' ? 3 / 4 : 1)}
                cropShape={cropShape}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : (
              <button type="button" className="avatar-crop-empty" onClick={onRequestFile}>
                <ImageIcon size={42} />
                <strong>{t('upload.drag_or_click')}</strong>
                <span>{t('upload.limits')}</span>
              </button>
            )}
          </div>

          {/* Source Options */}
          <div className="avatar-crop-side">
            {clipboardFiles.length > 0 && (
              <div className="avatar-crop-clipboard">
                <div className="avatar-crop-clipboard-title">
                  {t('upload.clipboard_choose')}
                </div>
                <div className="avatar-crop-clipboard-grid">
                  {clipboardFiles.map((entry) => (
                    <button
                      key={entry.url}
                      type="button"
                      className="avatar-crop-clipboard-item"
                      onClick={() => handleClipboardSelect(entry.file)}
                    >
                      <img src={entry.url} alt="" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setClipboardFiles([])}
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}

            <button type="button" className="avatar-crop-source-btn" onClick={onRequestFile}>
              <span className="avatar-crop-source-btn__icon">
                <ImageIcon size={20} />
              </span>
              <span className="avatar-crop-source-btn__text">
                <strong>{t('upload.select_image')}</strong>
                <span>{t('upload.from_device')}</span>
              </span>
            </button>

            <button
              type="button"
              className="avatar-crop-source-btn"
              onClick={handlePasteClick}
              disabled={isPasting}
            >
              <span className="avatar-crop-source-btn__icon">
                {isPasting ? (
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ClipboardPaste size={20} />
                )}
              </span>
              <span className="avatar-crop-source-btn__text">
                <strong>{t('upload.from_clipboard')}</strong>
                <span>{isPasting ? t('upload.processing') : t('upload.from_clipboard_desc')}</span>
              </span>
            </button>

            <p className="avatar-crop-side-hint">{t('upload.limits')}</p>
          </div>
        </div>

        {/* Zoom Control */}
        {imageSrc && (
          <div className="avatar-crop-zoom">
            <ZoomOut size={18} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--color-primary)',
                height: 4,
                cursor: 'pointer',
              }}
              aria-label={t('upload.zoom')}
            />
            <ZoomIn size={18} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
          </div>
        )}

        {/* Actions */}
        {imageSrc && (
          <div className="avatar-crop-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPercentages}
            >
              {isProcessing ? t('upload.processing') : t('upload.crop_confirm')}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
