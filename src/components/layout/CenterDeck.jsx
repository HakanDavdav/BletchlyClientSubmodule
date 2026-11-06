import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useIsMobile from '../../hooks/useIsMobile'
import useChatDeckStore from '../../store/chatDeckStore'
import useAuthStore from '../../store/authStore'
import ChatPage from '../../pages/chat/ChatPage'
import { PageTopDock, PageTopDockProvider } from './PageTopDock'
import './CenterDeck.css'

export default function CenterDeck({ children, enabled }) {
  const { t } = useTranslation()
  const location = useLocation()
  const isMobile = useIsMobile()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { isOpen, targetActorId, openChatDeck, closeChatDeck } = useChatDeckStore()
  const [chatMounted, setChatMounted] = useState(false)

  const canUseDeck = enabled && !isMobile

  useEffect(() => {
    if (isOpen) setChatMounted(true)
  }, [isOpen])

  useEffect(() => {
    closeChatDeck()
  }, [location.pathname, closeChatDeck])

  useEffect(() => {
    if (!canUseDeck || !isLoggedIn) closeChatDeck()
  }, [canUseDeck, isLoggedIn, closeChatDeck])

  if (!canUseDeck || !isLoggedIn) return children

  return (
    <div className={`center-deck${isOpen ? ' is-chat-open' : ''}`}>
      <div className="center-deck__card center-deck__card--page">
        <PageTopDockProvider>
          <PageTopDock
            onToggle={() => openChatDeck()}
            isOpen={isOpen}
            openLabel={t('chat.open_deck')}
            closeLabel={t('chat.close_deck')}
          />
          <div className="center-deck__content" inert={isOpen ? '' : undefined}>{children}</div>
        </PageTopDockProvider>
      </div>

      <div
        className="center-deck__card center-deck__card--chat"
        aria-hidden={!isOpen}
        inert={!isOpen ? '' : undefined}
      >
        <PageTopDockProvider>
          <PageTopDock
            onToggle={closeChatDeck}
            isOpen={isOpen}
            openLabel={t('chat.open_deck')}
            closeLabel={t('chat.close_deck')}
            handleTabIndex={isOpen ? 0 : -1}
            showHint={false}
            inset
          />
          <div className="center-deck__content" inert={!isOpen ? '' : undefined}>
            {chatMounted && (
              <ChatPage
                embedded
                initialTargetActorId={targetActorId}
                onBack={closeChatDeck}
              />
            )}
          </div>
        </PageTopDockProvider>
      </div>
    </div>
  )
}
