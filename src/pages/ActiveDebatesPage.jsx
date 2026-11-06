import { useEffect, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as signalR from '@microsoft/signalr'
import BackButton from '../components/common/BackButton'
import { PageTopDockRow } from '../components/layout/PageTopDock'
import AngryBotWithSwordsIcon from '../components/common/icons/AngryBotWithSwordsIcon'
import DebateCard from '../components/debate/DebateCard'
import { debateApi } from '../api/debateApi'
import { searchApi } from '../api/searchApi'
import useAuthStore from '../store/authStore'
import HowItWorksHelp from '../components/common/HowItWorksHelp'
import SearchFilterBar from '../components/common/SearchFilterBar'
import InfiniteScrollStatus from '../components/common/InfiniteScrollStatus'
import useInfiniteScroll from '../hooks/useInfiniteScroll'

const isLive = (d) => d.status === 1 || d.status === 'InProgress' || d.Status === 1 || d.Status === 'InProgress'
const isCompleted = (d) => d.status === 2 || d.status === 'Completed' || d.Status === 2 || d.Status === 'Completed'

export default function ActiveDebatesPage() {
  const { actorId } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['debates', 'all', actorId],
    queryFn: () =>
      debateApi.loadLobbyDebates().then((r) => {
        const list = r?.data?.data || r?.data
        return Array.isArray(list) ? list : []
      }),
    refetchInterval: 30000,
  })

  const [browseParams, setBrowseParams] = useState({
    query: '',
    orderType: '',
    startDate: null,
    endDate: null,
  })
  const hasActiveBrowseSearch = Boolean(
    browseParams.query ||
    (browseParams.orderType && browseParams.orderType !== 'None') ||
    browseParams.startDate ||
    browseParams.endDate
  )

  const {
    data: browseData,
    isLoading: isBrowseLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['debates', 'browse', browseParams],
    queryFn: ({ pageParam = 1 }) =>
      debateApi
        .loadBrowseDebates(
          pageParam,
          browseParams.query,
          browseParams.orderType,
          browseParams.startDate,
          browseParams.endDate
        )
        .then((r) => {
          const list = r?.data?.data || r?.data
          return Array.isArray(list) ? list : []
        }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (browseParams.query) return undefined
      return lastPage.length === 20 ? allPages.length + 1 : undefined
    },
  })

  const { sentinelRef: loadMoreRef, isWaiting: isWaitingForMore } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
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
            connection.invoke('JoinDebateLobby')
          }
        })

        // Standardized granular signal: DebateCreated
        connection.on('DebateCreated', async (debateId) => {
          try {
            if (!debateId) return
            const res = await debateApi.getDebateById(debateId)
            const debate = res?.data?.data || res?.data
            if (!debate) return

            queryClient.setQueryData(['debates', 'all', actorId], (oldData) => {
              const currentList = Array.isArray(oldData) ? [...oldData] : []
              const targetId = debate.debateId || debate.DebateId
              const idx = currentList.findIndex(
                (d) => (d.debateId || d.DebateId) === targetId
              )
              if (idx >= 0) {
                currentList[idx] = { ...currentList[idx], ...debate }
                return currentList
              }
              return [debate, ...currentList]
            })
          } catch (err) {
            console.error('Error handling DebateCreated signal:', err)
          }
        })

        // Standardized granular signal: DebateEnded
        connection.on('DebateEnded', (debateId) => {
          try {
            if (!debateId) return
            queryClient.setQueryData(['debates', 'all', actorId], (oldData) => {
              const currentList = Array.isArray(oldData) ? [...oldData] : []
              const idx = currentList.findIndex(
                (d) => (d.debateId || d.DebateId) === debateId
              )
              if (idx >= 0) {
                currentList[idx] = { ...currentList[idx], status: 'Completed' }
                return currentList
              }
              return currentList
            })
          } catch (err) {
            console.error('Error handling DebateEnded signal:', err)
          }
        })

        await connection.start()
        if (isMounted) {
          await connection.invoke('JoinDebateLobby')
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
          connection.invoke('LeaveDebateLobby').catch(() => {})
        }
        connection.off('DebateCreated')
        connection.off('DebateEnded')
        connection.stop().catch(() => {})
      }
    }
  }, [actorId, queryClient])

  const debates = data || []
  const activeDebates = debates.filter(isLive)
  const recentDebates = debates.filter(isCompleted)
  const browseDebates = browseData?.pages?.flatMap((p) => p) || []

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

  const renderSection = (title, list, emptyText, isLiveSection = false, toolbar = null) => (
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
                ? t('common.days_remaining_short', { count: seasonStatus.daysRemaining })
                : t('common.hours_remaining_short', { count: seasonStatus.hoursRemaining ?? 0 })}
            </span>
          </div>
        )}
      </div>
      {toolbar}
      {list.length === 0 ? (
        <p className="empty-state" style={{ margin: 0 }}>
          {emptyText}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 350px))',
            justifyContent: 'center',
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
        <PageTopDockRow
          left={<BackButton style={{ marginBottom: 0 }} />}
          style={{ marginBottom: 16 }}
        />

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
            {t('active_debates.title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t(
              'active_debates.subtitle'
            )}
          </p>
        </div>
        <HowItWorksHelp
          title={t('active_debates.how_it_works_title')}
          items={[
            t('active_debates.how_it_works_1'),
            t('active_debates.how_it_works_2'),
            t('active_debates.how_it_works_3'),
          ]}
          closeLabel={t('common.close')}
          triggerStyle={{ marginLeft: 'auto', marginRight: 24, flexShrink: 0 }}
        />
      </div>

      {isLoading || isBrowseLoading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {renderSection(
            t('active_debates.live_title'),
            activeDebates,
            t('common.nothing_here_yet'),
            true
          )}
          {renderSection(
            t('active_debates.recent_title'),
            recentDebates,
            t('common.nothing_here_yet')
          )}
          <section style={{ display: 'flex', flexDirection: 'column' }}>
            {renderSection(
              t('active_debates.browse_title'),
              browseDebates,
              hasActiveBrowseSearch ? t('search.no_results') : t('common.nothing_here_yet'),
              false,
              <SearchFilterBar
                onSearch={setBrowseParams}
                orderOptions={[
                  { value: 'Newest', labelKey: 'sort.newest', labelDefault: 'En Yeni' },
                  { value: 'Oldest', labelKey: 'topbar.oldest', labelDefault: 'En Eski' },
                ]}
                placeholder={t('active_debates.browse_search_placeholder')}
              />
            )}
            <div ref={loadMoreRef} style={{ height: 1 }} />
            <InfiniteScrollStatus
              isFetching={isFetchingNextPage || isWaitingForMore}
              hasNextPage={hasNextPage}
              hasItems={browseDebates.length > 0}
            />
          </section>
        </div>
      )}
    </div>
  </>
  )
}
