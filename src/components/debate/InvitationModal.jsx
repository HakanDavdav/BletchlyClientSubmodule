import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Swords, Check, X, User } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import { trackDebate } from '../../utils/analytics'
import ImageWithLoader from '../common/ImageWithLoader'
import ModalPortal from '../common/ModalPortal'

export default function InvitationModal({ invitation, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const totalSeconds = 120

  // 120-second TTL countdown
  const calculateRemaining = () => {
    if (!invitation?.createdAt) return totalSeconds
    const createdMs = new Date(invitation.createdAt).getTime()
    const elapsed = isNaN(createdMs) ? 0 : Math.floor((Date.now() - createdMs) / 1000)
    return Math.max(0, totalSeconds - elapsed)
  }

  const [timeLeft, setTimeLeft] = useState(calculateRemaining)
  const hasExpiredRef = useRef(false)

  useEffect(() => {
    if (!invitation) return

    hasExpiredRef.current = false

    const updateTimer = () => {
      const remaining = calculateRemaining()
      setTimeLeft(remaining)
      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true
        toast.error(t('debate.invitation_expired'))
        onClose()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [invitation, onClose, t])

  if (!invitation) return null

  const handleAccept = async () => {
    try {
      setLoading(true)
      await actorApi.acceptDebate(invitation.debateId)
      trackDebate('accept_challenge', { debate_id: invitation.debateId })
      toast.success(t('debate.invitation_accepted'))
      onClose()
      navigate(`/debate?id=${invitation.debateId}`, {
        state: {
          proposition: invitation.proposition,
          proponent: {
            id: invitation.proponentId,
            name: invitation.proponentName,
            imageUrl: invitation.proponentImageUrl,
            discriminator: 'User',
          },
        },
      })
    } catch (err) {
      toast.error(err.message || err.response?.data?.errors?.[0]?.description || t('debate.accept_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    try {
      setLoading(true)
      await actorApi.declineDebate(invitation.debateId)
      toast(t('debate.invitation_declined'), { icon: '🚫' })
      onClose()
    } catch (err) {
      toast.error(err.message || err.response?.data?.errors?.[0]?.description || t('debate.decline_error'))
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const progressPct = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100))
  const isLowTime = timeLeft <= 20

  return (
    <ModalPortal>
      <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 460, padding: '40px 36px', textAlign: 'center', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--color-primary-lighter)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Swords size={26} color="var(--color-primary)" strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
          {t('debate.incoming_challenge')}
        </h2>

        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
          {t('debate.challenge_subtitle')}
        </p>

        {/* Challenger Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            borderRadius: 12,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          {invitation.proponentImageUrl ? (
            <ImageWithLoader
              src={invitation.proponentImageUrl}
              alt={invitation.proponentName}
              spinnerSize="sm"
              spinnerOpacity={0.4}
              wrapperStyle={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--color-primary-light)',
                flexShrink: 0,
                background: 'var(--color-surface-2)',
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--color-primary-light)',
                flexShrink: 0,
              }}
            >
              <User size={24} color="var(--color-text-faint)" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
              {invitation.proponentName || t('actor.anonymous')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>
              {t('debate.role_proponent')}
            </div>
          </div>
        </div>

        {/* Proposition Box */}
        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 8,
            }}
          >
            {t('debate.proposition')}
          </label>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--color-surface-2)',
              borderLeft: '3px solid var(--color-primary)',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            "{invitation.proposition}"
          </div>
        </div>

        {/* Geri Sayım */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            height: 3, borderRadius: 99,
            background: 'var(--color-border)',
            overflow: 'hidden', marginBottom: 6,
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              borderRadius: 99,
              background: isLowTime ? 'var(--color-error)' : 'var(--color-primary)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
          <p style={{
            fontSize: 12, margin: 0,
            color: isLowTime ? 'var(--color-error)' : 'var(--color-text-muted)',
            fontWeight: isLowTime ? 600 : 400,
            transition: 'color 0.3s',
          }}>
            {t('debate.time_left')}: <strong>{formatTime(timeLeft)}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDecline}
            disabled={loading}
            style={{ flex: 1 }}
          >
            <X size={16} />
            {t('common.decline')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAccept}
            disabled={loading}
            style={{ flex: 1 }}
          >
            <Check size={16} />
            {loading ? t('common.loading') : t('debate.accept_and_fight')}
          </button>
        </div>
      </div>
      </div>
    </ModalPortal>
  )
}
