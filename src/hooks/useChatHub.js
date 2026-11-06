import { useCallback, useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import useAuthStore from '../store/authStore'

export function useChatHub(onMessage) {
  const { isLoggedIn, actorId } = useAuthStore()
  const connectionRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!isLoggedIn || !actorId) {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
      return undefined
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/chat', { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build()

    connectionRef.current = connection

    connection.on('ReceiveChatMessage', (rawMessage) => {
      try {
        const data = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
        if (data?.type === 'chat_message' || data?.type === 'chat_message_action') {
          onMessageRef.current?.(data)
        }
      } catch (err) {
        console.error('Error handling chat signal:', err)
      }
    })

    connection.start().catch((err) => {
      console.warn('Could not connect to ChatHub:', err.message)
    })

    return () => {
      connection.off('ReceiveChatMessage')
      connection.stop().catch(() => {})
      if (connectionRef.current === connection) connectionRef.current = null
    }
  }, [isLoggedIn, actorId])

  const sendMessage = useCallback(async (targetActorId, content, replyToChatMessageId = null) => {
    const connection = connectionRef.current
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Chat connection is not ready.')
    }
    return connection.invoke('SendChatMessage', targetActorId, content, replyToChatMessageId)
  }, [])

  return { sendMessage }
}
