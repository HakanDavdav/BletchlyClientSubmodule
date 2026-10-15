import React, { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Kırpılmış bölgeyi canvas üzerinde çizip Blob olarak döndürür.
 */
function getCroppedBlob(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.92
      )
    }
    image.onerror = (err) => reject(err)
    image.src = imageSrc
  })
}

/**
 * AvatarCropModal — Resim seçildikten sonra daire kırpma modalı.
 *
 * @param {object} props
 * @param {string} props.imageSrc - Kırpılacak resmin data URL'i
 * @param {boolean} props.open - Modal açık mı
 * @param {'round'|'rect'} [props.cropShape='round'] - Kırpma şekli
 * @param {function} props.onConfirm - (blob: Blob) => void — kırpılmış blob
 * @param {function} props.onCancel - Modal kapatma
 */
export default function AvatarCropModal({
  imageSrc,
  open,
  cropShape = 'round',
  aspectRatio,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Modal her açıldığında / yeni resim geldiğinde state'leri sıfırla
  useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setIsProcessing(false)
    }
  }, [open, imageSrc])

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      onConfirm(blob)
    } catch {
      // hata durumunda modal açık kalır
      setIsProcessing(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onCancel()
    }
  }

  if (!open || !imageSrc) return null

  return (
    <div
      className="avatar-crop-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        animation: 'avatarCropFadeIn 0.2s ease',
      }}
    >
      <div
        className="avatar-crop-modal"
        style={{
          background: 'var(--color-surface)',
          borderRadius: 20,
          width: '90vw',
          maxWidth: 480,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--color-border)',
          animation: 'avatarCropSlideUp 0.25s ease',
        }}
      >

        {/* Crop Area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 340,
            background: '#111',
          }}
        >
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
        </div>

        {/* Zoom Control */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
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
            aria-label={t('upload.zoom', 'Yakınlaştırma')}
          />
          <ZoomIn size={18} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {t('common.cancel', 'İptal')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing
              ? t('upload.processing', 'İşleniyor...')
              : t('upload.crop_confirm', 'Onayla')}
          </button>
        </div>
      </div>
    </div>
  )
}
