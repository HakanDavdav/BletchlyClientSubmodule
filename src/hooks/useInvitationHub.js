import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

export function useInvitationHub() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tRef = useRef(t)
  tRef.current = t
  const { isLoggedIn, actorId } = useAuthStore()
  const [incomingInvitation, setIncomingInvitation] = useState(null)
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false)
  const connectionRef = useRef(null)
  const invitationTimerRef = useRef(null)

  const clearInvitationTimer = () => {
    if (invitationTimerRef.current) {
      clearTimeout(invitationTimerRef.current)
      invitationTimerRef.current = null
    }
  }

  const scheduleInvitationExpiry = (invitation) => {
    clearInvitationTimer()
    if (!invitation) return
    const createdMs = invitation.createdAt ? new Date(invitation.createdAt).getTime() : Date.now()
    const elapsed = Number.isNaN(createdMs) ? 0 : Date.now() - createdMs
    const remainingMs = Math.max(0, 120000 - elapsed) + 2000
    invitationTimerRef.current = setTimeout(() => {
      setIncomingInvitation(null)
      setIsInvitationModalOpen(false)
      invitationTimerRef.current = null
    }, remainingMs)
  }

  useEffect(() => {
    if (!isLoggedIn || !actorId) {
      clearInvitationTimer()
      setIncomingInvitation(null)
      setIsInvitationModalOpen(false)
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
      return
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/invitation', {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build()

    connectionRef.current = connection

    connection.on('ReceiveInvitation', (rawMessage) => {
      try {
        const data = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
        if (!data) return

        if (data.type === 'debate_invitation') {
          setIncomingInvitation(data)
          setIsInvitationModalOpen(false)
          scheduleInvitationExpiry(data)
        } else if (data.type === 'debate_accepted') {
          const opponent = data.opponentName || (tRef.current ? tRef.current('debate.opponent', 'Rakip') : 'Rakip')
          toast.success(
            tRef.current
              ? tRef.current('debate.opponent_accepted_challenge', `${opponent} meydan okuma davetini kabul etti!`, { name: opponent })
              : `${opponent} meydan okuma davetini kabul etti!`,
            { duration: 5000 }
          )
          if (data.debateId) {
            navigate(`/debate?id=${data.debateId}`)
          }
        } else if (data.type === 'debate_declined') {
          toast.error(
            tRef.current ? tRef.current('debate.invitation_declined', '❌ Rakip meydan okuma davetini reddetti.') : '❌ Rakip meydan okuma davetini reddetti.',
            { duration: 5000 }
          )
        }
      } catch (err) {
        console.error('Error handling invitation signal:', err)
      }
    })

    connection
      .start()
      .then(() => {
        connection.invoke('JoinUserRoom', actorId.toString()).catch(() => {})
      })
      .catch((err) => {
        console.warn('Could not connect to InvitationHub:', err.message)
      })

    return () => {
      clearInvitationTimer()
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [isLoggedIn, actorId, navigate])

  return {
    incomingInvitation,
    isInvitationModalOpen,
    openInvitationModal: () => {
      if (incomingInvitation) setIsInvitationModalOpen(true)
    },
    closeInvitation: () => {
      clearInvitationTimer()
      setIsInvitationModalOpen(false)
      setIncomingInvitation(null)
    },
  }
}
