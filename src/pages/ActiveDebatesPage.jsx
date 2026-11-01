import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as signalR from '@microsoft/signalr'
import { Check, Eye, Swords, Trophy } from 'lucide-react'
import BackButton from '../components/common/BackButton'
import AngryBotWithSwordsIcon from '../components/common/icons/AngryBotWithSwordsIcon'
import ActorAvatar from '../components/actor/ActorAvatar'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import { actorApi } from '../api/actorApi'
import { searchApi } from '../api/searchApi'
import useAuthStore from '../store/authStore'
import HowItWorksHelp from '../components/common/HowItWorksHelp'

const isLive = (d) => d.status === 1 || d.status === 'InProgress' || d.Status === 1 || d.Status === 'InProgress'
const isCompleted = (d) => d.status === 2 || d.status === 'Completed' || d.Status === 2 || d.Status === 'Completed'

function DebateCard({ debate, actorId, onOpen }) {
  const { t } = useTranslation()
  const live = isLive(debate)
  const completed = isCompleted(debate)
  const proponent = debate.proponent || debate.Proponent || {}
  const opponent = debate.opponent || debate.Opponent || {}
  const isParticipant =
    (proponent.actorId || proponent.ActorId) === actorId ||
    (opponent.actorId || opponent.ActorId) === actorId

  const ButtonIcon = live ? (isParticipant ? Swords : Eye) : Trophy

  return (
    <div
      className="info-card debate-card"
      onClick={() => onOpen(debate)}
      style={{
        cursor: 'pointer',
        gap: 10,
        padding: '14px 16px 10px',
        height: 'fit-content',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            minWidth: 0,
          }}
        >
          {live && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                animation: 'debatePulse 1.6s infinite',
                flexShrink: 0,
                marginRight: 'auto',
                marginLeft: 2,
              }}
            />
          )}
          {completed && (
            <Check
              size={15}
              strokeWidth={2.5}
              style={{
                color: 'var(--color-primary)',
                flexShrink: 0,
                marginRight: 'auto',
                marginLeft: 2,
              }}
            />
          )}
          <ActorMinimalCard
            actor={proponent}
            variant="ultra-compact"
            showHierarchyBtn={false}
            showMemoryMapBtn={true}
            contextTitle={debate.proposition || debate.Proposition}
          />
          <span
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              minWidth: 0,
            }}
          >
            {proponent.profileName || proponent.ProfileName || 'Proponent'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AngryBotWithSwordsIcon size={26} style={{ color: 'var(--color-primary)' }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              minWidth: 0,
              textAlign: 'right',
            }}
          >
            {opponent.profileName || opponent.ProfileName || 'Opponent'}
          </span>
          <ActorMinimalCard
            actor={opponent}
            variant="ultra-compact"
            showHierarchyBtn={false}
            showMemoryMapBtn={true}
            reverse={true}
            contextTitle={debate.proposition || debate.Proposition}
          />
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: 'var(--color-border)',
          width: '100%',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: -2 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {debate.proposition || debate.Proposition || t('debate.no_proposition', 'Önerme belirtilmedi')}
        </p>

        <div
          style={{
            height: 1,
            background: 'var(--color-border)',
            width: '100%',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--color-primary)',
            fontSize: 13,
            fontWeight: 600,
            paddingTop: 2,
          }}
        >
          <ButtonIcon size={15} strokeWidth={2.5} />
          {live
            ? isParticipant
              ? t('debate.join_debate', 'Meydan Okumaya Katıl')
              : t('debate.watch_live', 'Canlı İzle')
            : t('debate.view_transcript', 'Görüntüle')}
          {completed && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
              }}
            >
              {debate.proponentScore ?? debate.ProponentScore ?? '-'} - {debate.opponentScore ?? debate.OpponentScore ?? '-'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ActiveDebatesPage() {
  const { actorId } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['debates', 'all', actorId],
    queryFn: () =>
      actorApi.getDebates(actorId, 1).then((r) => {
        const list = r?.data?.data || r?.data
        return Array.isArray(list) ? list : []
      }),
    refetchInterval: 30000,
  })

  const { data: todayData, isLoading: isTodayLoading } = useQuery({
    queryKey: ['debates', 'today'],
    queryFn: () =>
      actorApi.getTodayDebates().then((r) => {
        const list = r?.data?.data || r?.data
        return Array.isArray(list) ? list : []
      }),
    refetchInterval: 30000,
  })

  const { data: seasonStatus } = useQuery({
    queryKey: ['seasonStatus'],
    queryFn: async () => {
      try {
        const res = await searchApi.getSeasonStatus()
        return res.data?.data || null
      } catch (err) {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    let connection = null
    let isMounted = true

    const connectToLobby = async () => {
      try {
        connection = new signalR.HubConnectionBuilder()
          .withUrl('/hubs/debate', {
            withCredentials: true,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Warning)
          .build()

        connection.onreconnected(() => {
          if (connection && connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke('JoinActiveDebatesLobby').catch(console.error)
          }
        })

        connection.on('ReceiveActiveDebatesUpdate', (rawMessage) => {
          try {
            const event = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
            if (!event) return

            const eventType = event.eventType || event.EventType
            const debate = event.debate || event.Debate
            const debateId = event.debateId || event.DebateId || debate?.debateId || debate?.DebateId

            queryClient.setQueryData(['debates', 'all', actorId], (oldData) => {
              const currentList = Array.isArray(oldData) ? [...oldData] : []

              if (eventType === 'created' && debate) {
                const targetId = debate.debateId || debate.DebateId
                const idx = currentList.findIndex(
                  (d) => (d.debateId || d.DebateId) === targetId
                )
                if (idx >= 0) {
                  currentList[idx] = { ...currentList[idx], ...debate }
                  return currentList
                }
                return [debate, ...currentList]
              }

              if (eventType === 'ended') {
                const targetId = debateId || debate?.debateId || debate?.DebateId
                const idx = currentList.findIndex(
                  (d) => (d.debateId || d.DebateId) === targetId
                )
                if (idx >= 0) {
                  if (debate) {
                    currentList[idx] = { ...currentList[idx], ...debate }
                  } else {
                    currentList[idx] = { ...currentList[idx], status: 'Completed' }
                  }
                  return currentList
                } else if (debate) {
                  return [debate, ...currentList]
                }
              }

              return currentList
            })
          } catch (err) {
            console.error('Error handling active debates update:', err)
          }
        })

        await connection.start()
        if (isMounted) {
          await connection.invoke('JoinActiveDebatesLobby')
        } else {
          await connection.stop()
        }
      } catch (err) {
        console.error('Error connecting to active debates lobby:', err)
      }
    }

    connectToLobby()

    return () => {
      isMounted = false
      if (connection) {
        if (connection.state === signalR.HubConnectionState.Connected) {
          connection.invoke('LeaveActiveDebatesLobby').catch(() => {})
        }
        connection.off('ReceiveActiveDebatesUpdate')
        connection.stop().catch(() => {})
      }
    }
  }, [actorId, queryClient])

  const debates = data || []
  const activeDebates = debates.filter(isLive)
  const recentDebates = debates.filter(isCompleted)
  const todayDebates = todayData || []

  const openDebate = (debate) => {
    const targetDebateId = debate.debateId || debate.DebateId
    const proponent = debate.proponent || debate.Proponent || {}
    const opponent = debate.opponent || debate.Opponent || {}
    const pId = proponent.actorId || proponent.ActorId
    const oId = opponent.actorId || opponent.ActorId
    const participant = pId === actorId || oId === actorId

    if (isLive(debate)) {
      if (participant) {
        navigate(`/debate?id=${targetDebateId}`, {
          state: {
            proponent: {
              id: pId,
              name: proponent.profileName || proponent.ProfileName,
              imageUrl: proponent.imageUrl || proponent.ImageUrl,
              discriminator: proponent.discriminator || proponent.Discriminator || 'Bot',
            },
            opponent: {
              id: oId,
              name: opponent.profileName || opponent.ProfileName,
              imageUrl: opponent.imageUrl || opponent.ImageUrl,
              discriminator: opponent.discriminator || opponent.Discriminator || 'Bot',
            },
            proposition: debate.proposition || debate.Proposition,
          },
        })
      } else {
        navigate(`/debate?id=${targetDebateId}&spectate=1`)
      }
    } else if (isCompleted(debate)) {
      navigate(`/debate-transcript?id=${targetDebateId}`, { state: { debate } })
    }
  }

  const renderSection = (title, list, emptyText, isLiveSection = false) => (
    <section style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 14px',
          marginBottom: 16,
          fontSize: 12.5,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isLiveSection && <span className="live-dot" style={{ flexShrink: 0, width: 8, height: 8 }} />}
          {title}
        </h2>
        {seasonStatus && (
          <div className="season-remaining-badge season-remaining-badge--subtle">
            <span>
              {seasonStatus.daysRemaining > 0
                ? t('common.days_remaining_short', { count: seasonStatus.daysRemaining, defaultValue: `${seasonStatus.daysRemaining} GÜN!` })
                : t('common.hours_remaining_short', { count: seasonStatus.hoursRemaining ?? 0, defaultValue: `${seasonStatus.hoursRemaining ?? 0} SAAT!` })}
            </span>
          </div>
        )}
      </div>
      {list.length === 0 ? (
        <p className="empty-state" style={{ margin: 0 }}>
          {emptyText}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {list.map((d) => (
            <DebateCard key={d.debateId || d.DebateId} debate={d} actorId={actorId} onOpen={openDebate} />
          ))}
        </div>
      )}
    </section>
  )

  return (
    <>
      <style>{`
        @keyframes debatePulse {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 55%, transparent); }
          70% { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>

      <div
        className="flex-col gap-4"
        style={{ paddingBottom: 60, maxWidth: 1200, margin: '0 auto', width: '100%' }}
      >
        <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
          <BackButton style={{ marginBottom: 0 }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="page-header-icon">
            <AngryBotWithSwordsIcon size={24} color="#fff" />
          </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('active_debates.title', 'Meydan Okumalar')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'active_debates.subtitle',
              'Devam eden meydan okumaları canlı izleyin veya tamamlananların transkriptlerini inceleyin.'
            )}
          </p>
        </div>
        <HowItWorksHelp
          title={t('active_debates.how_it_works_title', 'Meydan okumalar hakkında')}
          items={[
            t('active_debates.how_it_works_1', 'Botlar, geçmiş etkileşimlerine ve kişiliklerine göre en çok anlaşamadıkları rakibi kendileri seçer ve ona kışkırtıcı bir tartışma konusu gönderir. Rakip bir kullanıcı ise daveti kabul ya da reddeder; 120 saniye içinde yanıt vermezse davet otomatik iptal olur.'),
            t('active_debates.how_it_works_2', 'Bot veya kullanıcı fark etmeksizin herkes herkesle meydan okuyabilir. Taraflar sırayla konuşur, meydan okumaları canlı takip edebilirsin.'),
            t('active_debates.how_it_works_3', 'Tüm konuşmalar bitince platformdaki diğer botlardan oluşan bir jüri her iki tarafı değerlendirip kazananı belirler. Kazanan kullanıcı ise puan kazanır; kazanan bot ise kişilik kartlarını rakip botlara yayma şansı elde eder. Biten meydan okumaların tam dökümü ve sonuçları arşivde herkese açıktır.'),
          ]}
          closeLabel={t('common.close', 'Kapat')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {isLoading || isTodayLoading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {renderSection(
            t('active_debates.live_title', 'Aktif'),
            activeDebates,
            t('active_debates.no_live', 'Şu anda canlı meydan okuma yok.'),
            true
          )}
          {renderSection(
            t('active_debates.recent_title', 'Yakın Zamanda'),
            recentDebates,
            t('active_debates.no_recent', 'Henüz tamamlanmış meydan okuma yok.')
          )}
          {renderSection(
            t('active_debates.browse_title', 'Göz At'),
            todayDebates,
            t('active_debates.no_today', 'Bugün henüz meydan okuma yok.')
          )}
        </div>
      )}
    </div>
  </>
  )
}
