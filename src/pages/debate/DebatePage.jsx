import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/authStore'
import useIsMobile from '../../hooks/useIsMobile'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { actorApi } from '../../api/actorApi'
import { trackDebate } from '../../utils/analytics'
import './DebatePage.css'
import {
  Swords,
  Send,
  Crown,
  Trophy,
  Bot as BotIcon,
  ArrowLeft,
  Check,
  Timer,
  Eye,
} from 'lucide-react'
import ActorAvatar from '../../components/actor/ActorAvatar'
import ActorMinimalCard from '../../components/actor/ActorMinimalCard'
import PersonalityCard from '../../components/card/PersonalityCard'
import BackButton from '../../components/common/BackButton'
import AngryBotIcon from '../../components/common/icons/AngryBotIcon'
import LazyBotIcon from '../../components/common/icons/LazyBotIcon'
import SwordIcon from '../../components/common/icons/SwordIcon'
import ShieldIcon from '../../components/common/icons/ShieldIcon'
import AngryBotWithSwordsIcon from '../../components/common/icons/AngryBotWithSwordsIcon'

function parseTranscriptMessages(transcript) {
  if (!transcript) return []
  const lines = transcript.split('\n')
  const messages = []
  let current = null
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const match = line.match(
      /^\[Turn\s+(\d+)\]\s+(Proponent|Opponent)\s*\(([^)]+)\):\s*(.*)$/i
    )
    if (match) {
      if (current) messages.push(current)
      current = {
        id: `t-${match[1]}-${match[2].toLowerCase()}-${Date.now()}`,
        speaker: match[2].toLowerCase() === 'proponent' ? 'proponent' : 'opponent',
        text: match[4] || '',
      }
    } else if (current) {
      current.text += '\n' + line
    }
  }
  if (current) messages.push(current)
  return messages
}

export default function DebatePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const debateId = searchParams.get('id')
  const isSpectator = searchParams.get('spectate') === '1'
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const { actorId } = useAuthStore()

  const initialProponent = location.state?.proponent
    ? { ...location.state.proponent, text: '' }
    : { id: null, name: 'Proponent', imageUrl: null, discriminator: 'Bot', text: '' }
  const initialOpponent = location.state?.opponent
    ? { ...location.state.opponent, text: '' }
    : { id: null, name: 'Opponent', imageUrl: null, discriminator: 'Bot', text: '' }
  const initialProposition = location.state?.proposition || ''

  const [connection, setConnection] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [phase, setPhase] = useState('waiting_ready') // waiting_ready, ready, proponent_speech, opponent_speech, jury_evaluation, verdict
  const [proposition, setProposition] = useState(initialProposition)
  const [turn, setTurn] = useState(0)
  const [totalTurns, setTotalTurns] = useState(0)

  const [proponent, setProponent] = useState(initialProponent)
  const [opponent, setOpponent] = useState(initialOpponent)

  useDocumentTitle(proposition || t('active_debates.title', 'Meydan Okumalar'))

  const [activeSpeaker, setActiveSpeaker] = useState(null)
  const [verdict, setVerdict] = useState(null)
  const [juries, setJuries] = useState([])
  const [showCardAnimation, setShowCardAnimation] = useState(false)
  const [cardsDistributed, setCardsDistributed] = useState(false)
  const [flyingCards, setFlyingCards] = useState([])
  const juryRefs = useRef({})

  const [myInput, setMyInput] = useState('')
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [isTopicExpanded, setIsTopicExpanded] = useState(false)

  const [messages, setMessages] = useState([])
  const chatScrollRef = useRef(null)

  const isValidDebateId = Boolean(
    debateId && debateId !== 'undefined' && debateId !== 'null' && debateId !== '[object Object]'
  )

  const pPoints = proponent.actorPoint || 0
  const oPoints = opponent.actorPoint || 0

  const juriesRef = useRef([])
  juriesRef.current = juries
  const juryFlyerKey = juries.map((j) => j.id || j.profileName || j.name || '').join('|')

  const [debateBots, setDebateBots] = useState([])
  const arenaWrapRef = useRef(null)
  const readyBlockRef = useRef(null)
  const [ellipseStyle, setEllipseStyle] = useState(null)
  const [isCrowdExcited, setIsCrowdExcited] = useState(false)
  const crowdExcitementTimeoutRef = useRef(null)

  const triggerCrowdExcitement = (durationMs = 1200) => {
    setIsCrowdExcited(true)
    if (crowdExcitementTimeoutRef.current) {
      clearTimeout(crowdExcitementTimeoutRef.current)
    }
    crowdExcitementTimeoutRef.current = setTimeout(() => {
      setIsCrowdExcited(false)
    }, durationMs)
  }

  const [timeoutSeconds, setTimeoutSeconds] = useState(120)
  const timerEndRef = useRef(Date.now() + 120 * 1000)
  const initialSignalTimeoutRef = useRef(null)
  const hasReceivedInitialSignalRef = useRef(false)

  const resetTimer = (seconds = 120) => {
    timerEndRef.current = Date.now() + seconds * 1000
    setTimeoutSeconds(seconds)
  }

  useEffect(() => {
    if (phase === 'verdict') return

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((timerEndRef.current - Date.now()) / 1000))
      setTimeoutSeconds(remaining)
    }

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
  }, [phase])

  useEffect(() => {
    return () => {
      if (crowdExcitementTimeoutRef.current) {
        clearTimeout(crowdExcitementTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!verdict || phase !== 'verdict' || !juries.length || !arenaWrapRef.current) return
    if (cardsDistributed) return

    const timer = setTimeout(() => {
      if (!arenaWrapRef.current) return
      const wrapRect = arenaWrapRef.current.getBoundingClientRect()
      const isPropWinner =
        verdict.winnerId === proponent.id || verdict.winnerName === proponent.name
      const winnerActor = isPropWinner ? proponent : opponent

      const originX = wrapRect.width / 2
      const originY = Math.min(220, wrapRect.height * 0.3)

      const cards = juries.map((jury, idx) => {
        const juryEl = juryRefs.current[jury.id || idx]
        let targetX = originX
        let targetY = originY + 280
        if (juryEl) {
          const rect = juryEl.getBoundingClientRect()
          targetX = rect.left - wrapRect.left + rect.width / 2
          targetY = rect.top - wrapRect.top + rect.height / 2
        }

        return {
          id: jury.id || idx,
          startX: originX,
          startY: originY,
          targetX,
          targetY,
          delay: 0.15 + idx * 0.1,
          duration: 0.85,
          winnerActor,
        }
      })

      setFlyingCards(cards)

      const totalTime = (0.15 + juries.length * 0.1 + 0.85 + 0.35) * 1000
      const endTimer = setTimeout(() => {
        setCardsDistributed(true)
        setFlyingCards([])
      }, totalTime)

      return () => clearTimeout(endTimer)
    }, 450)

    return () => clearTimeout(timer)
  }, [verdict, phase, juries, proponent, opponent, cardsDistributed])

  useEffect(() => {
    const el = arenaWrapRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const ellipseW = rect.width * 0.77
      const ellipseH = rect.height * 0.84

      setEllipseStyle({ left: centerX, top: centerY, width: ellipseW, height: ellipseH })

      const Rx = ellipseW / 2
      const Ry = ellipseH / 2
      const offsetX = 0
      const offsetY = 0

      const icons = []
      const totalPoints = pPoints + oPoints
      const baseIcons = Math.min(300, 72 + Math.floor(totalPoints / 20))
      const numIcons = isMobile ? Math.round(baseIcons * 0.4) : baseIcons
      const juryList = juriesRef.current || []
      const juryFlyerCount = Math.min(4, Math.max(2, Math.ceil(juryList.length / 1.5)))
      for (let i = 0; i < numIcons; i++) {
        const rx = Rx * (1.02 + Math.random() * 0.2)
        const ry = Ry * (1.02 + Math.random() * 0.2)
        const theta = Math.random() * 2 * Math.PI
        const x = offsetX + Math.cos(theta) * rx
        const y = offsetY + Math.sin(theta) * ry
        const size = 16 + Math.random() * 12
        const angleRad = Math.atan2(Math.sin(theta) * ry, Math.cos(theta) * rx)
        const jury = i < juryFlyerCount ? juryList[i % juryList.length] : null
        const rotation = jury ? 0 : (angleRad * 180) / Math.PI + 90
        const opacity = jury ? 0.8 + Math.random() * 0.2 : 0.35 + Math.random() * 0.4
        const delay = Math.random() * 4
        const duration = 1.6 + Math.random() * 2.4
        const excitedSpeed = (0.2 + Math.random() * 0.25).toFixed(2)
        const reactionDelay = (Math.random() * 0.22).toFixed(2)
        const excitedGlow = (1.4 + Math.random() * 0.8).toFixed(2)
        const r = Math.random()
        let botType = 'normal'
        if (r < 0.25) botType = 'angry'
        else if (r < 0.5) botType = 'lazy'
        const hasSword = !jury && Math.random() < 0.15
        const hasShield = !jury && Math.random() < 0.15
        icons.push({
          id: i,
          x,
          y,
          size,
          rotation,
          opacity,
          delay,
          duration,
          excitedSpeed,
          reactionDelay,
          excitedGlow,
          botType,
          hasSword,
          hasShield,
          jury,
        })
      }
      setDebateBots(icons)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pPoints, oPoints, isMobile, juryFlyerKey])

  // Auto-enrich profiles for both participants to get actorPoint and missing data
  useEffect(() => {
    const fetchProfile = (participant, setParticipant) => {
      if (participant.id && participant.actorPoint === undefined) {
        actorApi
          .getProfile(participant.id)
          .then((res) => {
            const p = res?.data?.data
            if (p) {
              setParticipant((prev) =>
                prev.id === participant.id
                  ? {
                      ...prev,
                      name: p.profileName || prev.name,
                      imageUrl: p.imageUrl || prev.imageUrl,
                      discriminator: p.discriminator || prev.discriminator,
                      actorPoint: p.actorPoint || 0,
                    }
                  : prev
              )
            }
          })
          .catch(() => {})
      }
    }
    fetchProfile(proponent, setProponent)
    fetchProfile(opponent, setOpponent)
  }, [proponent.id, opponent.id, proponent.actorPoint, opponent.actorPoint])

  // Spectator: load the current debate state (transcript) so mid-debate joiners see prior content
  useEffect(() => {
    if (!isSpectator || !isValidDebateId) return
    let cancelled = false
    actorApi
      .getDebateById(debateId)
      .then((res) => {
        if (cancelled) return
        const d = res?.data?.data || res?.data
        if (!d) return
        if (d.proposition) setProposition(d.proposition)
        if (d.proponent?.profileName)
          setProponent((prev) => ({
            ...prev,
            id: d.proponent.actorId || prev.id,
            name: d.proponent.profileName,
            imageUrl: d.proponent.imageUrl || prev.imageUrl,
            discriminator: d.proponent.discriminator || prev.discriminator,
          }))
        if (d.opponent?.profileName)
          setOpponent((prev) => ({
            ...prev,
            id: d.opponent.actorId || prev.id,
            name: d.opponent.profileName,
            imageUrl: d.opponent.imageUrl || prev.imageUrl,
            discriminator: d.opponent.discriminator || prev.discriminator,
          }))
        if (d.debateTranscript) {
          const parsed = parseTranscriptMessages(d.debateTranscript)
          if (parsed.length > 0) {
            setMessages(parsed)
            setPhase((prev) => (prev === 'waiting_ready' ? 'proponent_speech' : prev))
          }
        }
        // A spectator won't necessarily receive a live signal immediately; suppress the watchdog.
        hasReceivedInitialSignalRef.current = true
        if (initialSignalTimeoutRef.current) {
          clearTimeout(initialSignalTimeoutRef.current)
          initialSignalTimeoutRef.current = null
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isSpectator, isValidDebateId, debateId])

  useEffect(() => {
    if (!isValidDebateId) {
      toast.error(t('common.content_not_found', 'Geçerli bir meydan okuma ID bulunamadı.'))
      return
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/debate', {
        withCredentials: true, // Important for cookie auth
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()

    newConnection.onreconnecting(() => {
      toast.loading(t('common.reconnecting', 'Yeniden bağlanılıyor...'), {
        id: 'signalr-reconnecting',
      })
    })

    newConnection.onreconnected(() => {
      toast.dismiss('signalr-reconnecting')
      toast.success(t('common.reconnected', 'Yeniden bağlandı.'), { duration: 3000 })
      newConnection.invoke('JoinDebate', debateId, isSpectator).catch(console.error)
    })

    newConnection.onclose((error) => {
      toast.dismiss('signalr-reconnecting')
      if (error) {
        toast.error(t('common.session_timeout', 'Oturum zaman aşımına uğradı.'))
      }
    })

    setConnection(newConnection)
  }, [debateId, isValidDebateId])

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log('Connected to Debate Hub')

          connection.on('ReceiveDebateStream', (jsonStr) => {
            try {
              const data = JSON.parse(jsonStr)
              handleSignalRef.current?.(data)
            } catch (e) {
              console.error('Failed to parse debate signal', e)
            }
          })

          // Implicitly join the debate room upon connection
          connection
            .invoke('JoinDebate', debateId, isSpectator)
            .then(() => {
              trackDebate('join', { debate_id: debateId, is_spectator: isSpectator })
            })
            .catch((err) => console.error('JoinDebate error:', err))
        })
        .catch((e) => {
          console.error('Connection failed: ', e)
          toast.error(t('common.session_timeout', 'Oturum zaman aşımına uğradı.'))
        })
    }

    return () => {
      if (connection) {
        connection.invoke('LeaveDebate', debateId).catch(() => {})
        connection.off('ReceiveDebateStream')
        connection.stop()
      }
    }
  }, [connection, debateId])

  // 30-second watchdog: If no debate signal is received after landing on the page, timeout and redirect to default page
  useEffect(() => {
    if (!isValidDebateId) return

    hasReceivedInitialSignalRef.current = false
    initialSignalTimeoutRef.current = setTimeout(() => {
      if (!hasReceivedInitialSignalRef.current) {
        toast.error(t('common.session_timeout', 'Meydan okuma oturumu zaman aşımına uğradı veya başlatılamadı.'))
        if (connection) {
          connection.stop()
        }
        navigate('/')
      }
    }, 30000)

    return () => {
      if (initialSignalTimeoutRef.current) {
        clearTimeout(initialSignalTimeoutRef.current)
      }
    }
  }, [debateId, isValidDebateId])

  const normalizeJury = (j, existing = null) => {
    const id =
      j.actorId || j.ActorId || j.juryId || j.JuryId || j.id || (existing ? existing.id : null)
    const name =
      j.profileName ||
      j.ProfileName ||
      j.name ||
      j.Name ||
      j.juryName ||
      j.JuryName ||
      (existing ? existing.name : 'Jury Member')
    const imageUrl =
      j.imageUrl !== undefined
        ? j.imageUrl
        : j.ImageUrl !== undefined
          ? j.ImageUrl
          : existing
            ? existing.imageUrl
            : null
    const discriminator =
      j.discriminator || j.Discriminator || (existing ? existing.discriminator : 'Bot')
    const proponentScore =
      j.proponentScore ?? j.ProponentScore ?? (existing ? existing.proponentScore : null)
    const opponentScore =
      j.opponentScore ?? j.OpponentScore ?? (existing ? existing.opponentScore : null)

    return {
      id,
      name,
      profileName: name,
      imageUrl,
      discriminator,
      proponentScore,
      opponentScore,
    }
  }

  const handleSignalRef = useRef(null)

  const handleSignal = (data) => {
    if (!data) return

    // Clear initial 10s watchdog as soon as any valid debate signal is received
    hasReceivedInitialSignalRef.current = true
    if (initialSignalTimeoutRef.current) {
      clearTimeout(initialSignalTimeoutRef.current)
      initialSignalTimeoutRef.current = null
    }

    switch (data.type) {
      case 'waiting_ready':
        resetTimer(data.remainingSeconds ?? data.timeLimitSeconds ?? 120)
        setPhase('waiting_ready')
        if (data.proposition) setProposition(data.proposition)
        if (data.proponentName)
          setProponent((prev) => ({
            ...prev,
            id: data.proponentId || prev.id,
            name: data.proponentName,
            imageUrl: data.proponentImageUrl || prev.imageUrl,
            discriminator: data.proponentDiscriminator || prev.discriminator,
          }))
        if (data.opponentName)
          setOpponent((prev) => ({
            ...prev,
            id: data.opponentId || prev.id,
            name: data.opponentName,
            imageUrl: data.opponentImageUrl || prev.imageUrl,
            discriminator: data.opponentDiscriminator || prev.discriminator,
          }))
        if (Array.isArray(data.juries)) {
          setJuries(data.juries.map((j) => normalizeJury(j)))
        }
        break

      case 'turn_switch':
      case 'phase_start': {
        resetTimer(data.remainingSeconds ?? data.timeLimitSeconds ?? 120)
        const currentPhase = data.phase || (data.activeSpeakerRole === 'jury' ? 'jury_evaluation' : (data.activeSpeakerRole ? `${data.activeSpeakerRole}_speech` : 'proponent_speech'))
        setPhase(currentPhase)
        setTurn(data.turn ?? data.round ?? 0)
        setTotalTurns(data.totalTurns ?? data.totalRounds ?? 0)
        if (data.proposition) setProposition(data.proposition)

        if (data.proponentName) {
          setProponent((prev) => ({
            ...prev,
            id: data.proponentId || prev.id,
            name: data.proponentName,
            imageUrl: data.proponentImageUrl !== undefined ? data.proponentImageUrl : prev.imageUrl,
            discriminator: data.proponentDiscriminator || prev.discriminator,
          }))
        }
        if (data.opponentName) {
          setOpponent((prev) => ({
            ...prev,
            id: data.opponentId || prev.id,
            name: data.opponentName,
            imageUrl: data.opponentImageUrl !== undefined ? data.opponentImageUrl : prev.imageUrl,
            discriminator: data.opponentDiscriminator || prev.discriminator,
          }))
        }

        if (Array.isArray(data.juries)) {
          setJuries((prev) =>
            data.juries.map((j) => {
              const jId = j.actorId || j.ActorId || j.juryId || j.JuryId || j.id
              const existing = prev.find((p) => p.id === jId)
              return normalizeJury(j, existing)
            })
          )
        }

        if (currentPhase === 'proponent_speech') {
          setActiveSpeaker('proponent')
          setMessages((prev) => [
            ...prev,
            {
              id: `${data.turn || 0}-prop-${Date.now()}`,
              speaker: 'proponent',
              text: '',
            },
          ])
          setProponent((prev) => ({
            ...prev,
            id: data.speakerId || data.activeSpeakerId || data.proponentId || prev.id,
            name: data.speakerName || data.proponentName || prev.name,
            imageUrl: data.speakerImageUrl || data.proponentImageUrl || prev.imageUrl,
            discriminator:
              data.speakerDiscriminator || data.proponentDiscriminator || prev.discriminator,
            text: '',
          }))
        } else if (currentPhase === 'opponent_speech') {
          setActiveSpeaker('opponent')
          setMessages((prev) => [
            ...prev,
            {
              id: `${data.turn || 0}-opp-${Date.now()}`,
              speaker: 'opponent',
              text: '',
            },
          ])
          setOpponent((prev) => ({
            ...prev,
            id: data.speakerId || data.activeSpeakerId || data.opponentId || prev.id,
            name: data.speakerName || data.opponentName || prev.name,
            imageUrl: data.speakerImageUrl || data.opponentImageUrl || prev.imageUrl,
            discriminator:
              data.speakerDiscriminator || data.opponentDiscriminator || prev.discriminator,
            text: '',
          }))
        } else if (currentPhase === 'jury_evaluation') {
          setActiveSpeaker('jury')
        }

        if (data.activeSpeakerId && actorId) {
          setIsMyTurn(String(data.activeSpeakerId).toLowerCase() === String(actorId).toLowerCase())
        } else {
          setIsMyTurn(false)
        }
        break
      }

      case 'token':
        triggerCrowdExcitement(1000)
        setMessages((prev) => {
          if (prev.length === 0) return prev
          const newMsg = [...prev]
          const lastIdx = newMsg.length - 1
          newMsg[lastIdx] = { ...newMsg[lastIdx], text: newMsg[lastIdx].text + data.chunk }
          return newMsg
        })
        if (data.speaker === 'proponent') {
          setProponent((prev) => ({ ...prev, text: prev.text + data.chunk }))
        } else if (data.speaker === 'opponent') {
          setOpponent((prev) => ({ ...prev, text: prev.text + data.chunk }))
        }
        break

      case 'phase_end':
        resetTimer(120)
        triggerCrowdExcitement(1200)
        setMessages((prev) => {
          if (prev.length === 0) return prev
          const newMsg = [...prev]
          const lastIdx = newMsg.length - 1
          newMsg[lastIdx] = { ...newMsg[lastIdx], text: data.fullContent }
          return newMsg
        })
        if (data.phase === 'proponent_speech') {
          setProponent((prev) => ({ ...prev, text: data.fullContent }))
        } else if (data.phase === 'opponent_speech') {
          setOpponent((prev) => ({ ...prev, text: data.fullContent }))
        }
        break

      case 'verdict': {
        setPhase('verdict')
        setActiveSpeaker(null)
        if (data.proponentName) {
          setProponent((prev) => ({
            ...prev,
            id: data.proponentId || prev.id,
            name: data.proponentName,
            imageUrl: data.proponentImageUrl || prev.imageUrl,
            discriminator: data.proponentDiscriminator || prev.discriminator,
          }))
        }
        if (data.opponentName) {
          setOpponent((prev) => ({
            ...prev,
            id: data.opponentId || prev.id,
            name: data.opponentName,
            imageUrl: data.opponentImageUrl || prev.imageUrl,
            discriminator: data.opponentDiscriminator || prev.discriminator,
          }))
        }
        setVerdict({
          proponentScore: data.proponentScore,
          opponentScore: data.opponentScore,
          winnerName: data.winnerName,
          winnerId: data.winnerId,
        })

        if (Array.isArray(data.juries)) {
          setJuries(data.juries.map((j) => normalizeJury(j)))
        }
        break
      }

      case 'session_timeout': {
        toast.error(t('common.session_timeout', 'Oturum zaman aşımına uğradı.'))
        if (connection) {
          connection.stop()
        }
        setTimeout(() => {
          navigate('/')
        }, 1500)
        break
      }

      case 'user_disconnected':
      case 'user_left': {
        toast.warning(t('common.user_disconnected', 'Katılımcı ayrıldığı veya bağlantı koptuğu için oturum sonlandırıldı.'))
        if (connection) {
          connection.stop()
        }
        setTimeout(() => {
          navigate('/')
        }, 1500)
        break
      }

      case 'session_end': {
        toast.error(t('common.session_ended', 'Oturum sonlandırıldı.'))
        if (connection) {
          connection.stop()
        }
        setTimeout(() => {
          navigate('/')
        }, 1500)
        break
      }

      default:
        break
    }
  }

  handleSignalRef.current = handleSignal

  const handleReady = () => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection
        .invoke('Ready', debateId)
        .then(() => setIsReady(true))
        .catch((err) => toast.error(t('debate.ready_signal_failed', 'Hazır sinyali gönderilemedi: ') + (err?.message || err?.toString() || '')))
    }
  }

  const handleSubmitSpeech = () => {
    if (!myInput.trim()) return

    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection
        .invoke('SubmitSpeech', debateId, myInput)
        .then((res) => {
          if (res && (res.succeeded === false || res.Succeeded === false)) {
            const rawErrors = res.errors || res.Errors || []
            let errMsgs = []
            if (Array.isArray(rawErrors)) {
              errMsgs = rawErrors.map((e) => e.description || e.Description || e.message || e.Message || e)
            } else if (typeof rawErrors === 'object') {
              errMsgs = Object.values(rawErrors).flat()
            }
            if (errMsgs.length === 0) {
              errMsgs = [t('debate.speech_failed', 'Meydan okuma konuşması geçersiz.')]
            }
            errMsgs.forEach((msg) => toast.error(msg))
            return
          }
          triggerCrowdExcitement(1200)
          trackDebate('speech', { debate_id: debateId })
          setMyInput('')
          setIsMyTurn(false)
        })
        .catch((err) => toast.error(err?.message || (t('debate.speech_submit_failed', 'Konuşma gönderilemedi: ') + (err?.toString() || ''))))
    }
  }

  // Auto-scroll logic for chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, phase])

  if (!isValidDebateId) {
    return <div className="p-8 text-center text-red-500">{t('debate.invalid_id', 'Geçerli bir tartışma kimliği belirtilmedi.')}</div>
  }

  const isProponentWinner =
    verdict && (verdict.winnerId === proponent.id || verdict.winnerName === proponent.name)
  const isOpponentWinner =
    verdict && (verdict.winnerId === opponent.id || verdict.winnerName === opponent.name)
  const winningSpeaker = isProponentWinner ? 'proponent' : isOpponentWinner ? 'opponent' : null

  const handleLeaveDebate = () => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('LeaveDebate', debateId).catch(() => {})
      connection.stop()
    }
    if (!isSpectator && phase !== 'verdict') {
      toast.error(t('common.session_terminated', 'Oturum sonlandırıldı.'))
    }
    navigate(-1)
  }

  const isMeOpponent = opponent.id === actorId
  const myParticipant = isMeOpponent ? opponent : proponent
  const otherParticipant = isMeOpponent ? proponent : opponent
  return (
    <div className="debate-page-wrapper">
      <div
        className="px-2"
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <BackButton onClick={handleLeaveDebate} style={{ marginBottom: 0 }} />
      </div>

      <div className="debate-container">
        <div className="debate-header">
          <div className="debate-header__top">
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Debate Topic
            </span>
            {phase !== 'verdict' && (
              <div className={`debate-header__timeout ${timeoutSeconds <= 20 ? 'timeout-warning' : ''}`}>
                <Timer size={13} className="timeout-icon" />
                <span className="timeout-seconds">{timeoutSeconds}s</span>
              </div>
            )}
            <div className="debate-status">
              {totalTurns > 0 && `Turn ${turn}/${totalTurns}`}
            </div>
          </div>
        <div
          className={`debate-proposition-container ${isTopicExpanded ? 'expanded' : ''}`}
          onClick={() => setIsTopicExpanded(!isTopicExpanded)}
        >
          <h2 className="debate-proposition-text">{proposition}</h2>
        </div>
        {isSpectator && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '8px auto 0',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-primary)',
              background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
              border: '1px solid var(--color-border)',
              padding: '4px 10px',
              borderRadius: 9999,
              width: 'fit-content',
            }}
          >
            <Eye size={14} />
          </div>
        )}
      </div>

      <div className="debate-arena-wrap" ref={arenaWrapRef}>
        <div className={`debate-arena-backdrop ${isReady || phase !== 'waiting_ready' ? 'fade-center' : ''}`}>
          <div className="debate-ellipse" aria-hidden="true" style={ellipseStyle}></div>
          {debateBots.map((bot) => {
            const isExcitedMode = isCrowdExcited && (isReady || phase !== 'waiting_ready')
            const activeDuration = isExcitedMode ? `${bot.excitedSpeed}s` : `${bot.duration}s`
            const activeDelay = isExcitedMode ? `${(bot.delay % 0.35).toFixed(2)}s` : `${bot.delay}s`

            return (
              <div
                key={bot.id}
                className={`scattered-bot-positioner ${isExcitedMode ? 'is-excited' : ''}`}
                style={{
                  transform: `translate(calc(-50% + ${bot.x}px), calc(-50% + ${bot.y}px)) rotate(${bot.rotation}deg)`,
                  opacity: isExcitedMode ? Math.min(1, bot.opacity + 0.45) : bot.opacity,
                  filter: isExcitedMode
                    ? `drop-shadow(0 0 10px var(--color-synapse-zap, var(--color-primary))) brightness(${bot.excitedGlow})`
                    : 'none',
                  transition: `opacity 0.22s ease ${bot.reactionDelay}s, filter 0.22s ease ${bot.reactionDelay}s, color 0.22s ease ${bot.reactionDelay}s`,
                  zIndex: 0,
                }}
              >
                <div
                  className="scattered-bot-animator"
                  style={{
                    animationDelay: activeDelay,
                    animationDuration: activeDuration,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {bot.jury ? (
                    <ActorAvatar
                      profileName={bot.jury.profileName || bot.jury.name}
                      imageUrl={bot.jury.imageUrl}
                      actorId={bot.jury.id}
                      discriminator={bot.jury.discriminator || 'Bot'}
                      size="sm"
                      hideBadge
                    />
                  ) : (
                    <>
                      {bot.hasSword && (
                        <div style={{ position: 'absolute', right: '55%', bottom: '-5%', transform: 'rotate(-25deg)', zIndex: 2, opacity: 0.9 }}>
                          <SwordIcon size={bot.size * 0.8} />
                        </div>
                      )}
                      {bot.botType === 'angry' ? (
                        <AngryBotIcon size={bot.size} />
                      ) : bot.botType === 'lazy' ? (
                        <LazyBotIcon size={bot.size} />
                      ) : (
                        <BotIcon size={bot.size} />
                      )}
                      {bot.hasShield && (
                        <div style={{ position: 'absolute', left: '55%', bottom: '-5%', transform: 'rotate(25deg)', zIndex: 2, opacity: 0.9 }}>
                          <ShieldIcon size={bot.size * 0.8} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Flying Winner Cards to Juries */}
        {flyingCards.map((card) => (
          <div
            key={card.id}
            className="flying-winner-card"
            style={{
              '--start-x': `${card.startX}px`,
              '--start-y': `${card.startY}px`,
              '--target-x': `${card.targetX}px`,
              '--target-y': `${card.targetY}px`,
              animationDelay: `${card.delay}s`,
              animationDuration: `${card.duration}s`,
            }}
          >
            <PersonalityCard
              variant="distribute"
              actor={card.winnerActor}
              card={card}
            />
          </div>
        ))}

        {!isReady && phase === 'waiting_ready' ? (
              <div className="debate-ready-content">
                <div className="debate-ready-block">
                  <div className="ready-matchup-preview" ref={readyBlockRef}>
                    <div className="ready-participant">
                      <ActorAvatar
                        profileName={myParticipant.name}
                        imageUrl={myParticipant.imageUrl}
                        actorId={myParticipant.id}
                        discriminator={myParticipant.discriminator || 'Bot'}
                        size="xl"
                      />
                      <span className="ready-participant-name">{myParticipant.name}</span>
                    </div>

                    <div className="ready-vs-divider">
                      <AngryBotWithSwordsIcon size={44} color="var(--color-primary)" />
                    </div>

                    <div className="ready-participant">
                      <ActorAvatar
                        profileName={otherParticipant.name}
                        imageUrl={otherParticipant.imageUrl}
                        actorId={otherParticipant.id}
                        discriminator={otherParticipant.discriminator || 'Bot'}
                        size="xl"
                      />
                      <span className="ready-participant-name">{otherParticipant.name}</span>
                    </div>
                  </div>

                  {!isSpectator ? (
                    <button className="btn btn-primary btn-ready" onClick={handleReady}>
                      Ready
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        padding: '10px 20px',
                      }}
                    >
                      {t('debate.spectating_wait', 'Waiting...')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
            <div className="debate-arena single-chat">
            {/* Unified Chat Timeline */}
            <div className="chat-messages-container" ref={chatScrollRef}>
              {phase === 'waiting_ready' && (
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: '260px',
                  }}
                >
                  <div className="spinner spinner-lg" />
                </div>
              )}
              {messages.map((msg, index) => {
                const isProponent = msg.speaker === 'proponent'
                const p = isProponent ? proponent : opponent
                const isLast = index === messages.length - 1
                const isBlinking =
                  isLast && activeSpeaker === msg.speaker && phase.includes('speech')

                return (
                  <div
                    key={msg.id}
                    className={`chat-message-block ${isProponent ? 'msg-proponent' : 'msg-opponent'}`}
                  >
                    <div className="chat-message-header">
                      <ActorAvatar
                        profileName={p.name}
                        imageUrl={p.imageUrl}
                        actorId={p.id}
                        discriminator={p.discriminator || 'Bot'}
                        size="sm"
                      />
                      <div className="chat-message-info">
                        <span className="chat-message-name">{p.name}</span>
                        <span className="chat-message-role">
                          {isProponent ? 'Proponent' : 'Opponent'}
                        </span>
                      </div>
                    </div>
                    <div className="chat-message-body speech-stream">
                      {!isSpectator && isMyTurn && isLast && activeSpeaker === msg.speaker ? (
                        <div className="inline-debate-input" style={{ position: 'relative' }}>
                          {/* Ghost Div acting as the real visible text with our custom caret */}
                          <div className="inline-speech-ghost">
                            {myInput}
                            <span className="blinking-cursor"></span>
                          </div>
                          {/* Invisible Textarea capturing input */}
                          <textarea
                            className="inline-speech-textarea invisible-caret"
                            value={myInput}
                            onChange={(e) => {
                              setMyInput(e.target.value)
                              triggerCrowdExcitement(800)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmitSpeech()
                              }
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          {msg.text}
                          {isBlinking && <span className="blinking-cursor"></span>}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Waiting/Listening indicator for the inactive speaker */}
              {phase.includes('speech') && activeSpeaker && (
                <div className="chat-waiting-indicator">
                  <ActorAvatar
                    profileName={activeSpeaker === 'proponent' ? opponent.name : proponent.name}
                    imageUrl={
                      activeSpeaker === 'proponent' ? opponent.imageUrl : proponent.imageUrl
                    }
                    actorId={activeSpeaker === 'proponent' ? opponent.id : proponent.id}
                    discriminator={
                      activeSpeaker === 'proponent'
                        ? opponent.discriminator || 'Bot'
                        : proponent.discriminator || 'Bot'
                    }
                    size="sm"
                  />
                  <div className={`waiting-dots ${!isMyTurn ? 'animated' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              {/* Jury deliberation spinner */}
              {phase === 'jury_evaluation' && (
                <div className="chat-waiting-indicator" style={{ opacity: 1 }}>
                  <div className="spinner spinner-sm" />
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {t('debate.jury_deliberating', 'Jüri değerlendiriyor...')}
                  </span>
                </div>
              )}

              {/* Keep Verdict / Jury Evaluation styling slightly below the timeline if needed */}
              {phase === 'verdict' && (
                <div className="verdict-banner" style={{ marginTop: 'var(--space-4)' }}>
                  <div className="verdict-banner__content">
                    <div
                      className="page-header-icon"
                      style={{ width: 42, height: 42, borderRadius: 12 }}
                    >
                      <AngryBotWithSwordsIcon size={22} color="#fff" />
                    </div>
                    <div className="verdict-banner__text">
                      <span className="verdict-banner__title">{t('debate.winner_title', 'Meydan Okuma Kazananı')}</span>
                      <span className="verdict-banner__winner">{verdict?.winnerName}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-back-home"
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={16} /> {t('common.back_to_home', 'Ana Sayfaya Dön')}
                  </button>
                </div>
              )}
            </div>
          </div>
            )}

          </div>

          {/* Jury Panel (Rendered under debate-controls) */}
          {juries.length > 0 && (
            <div className="jury-panel">
              <div className="jury-panel__title">
                <span>{t('debate.juries_title', 'Jüri Heyeti')}</span>
              </div>
              <div className="jury-grid">
                {juries.map((jury, idx) => {
                  const hasScore = jury.proponentScore !== null && jury.opponentScore !== null
                  const actorData = {
                    actorId: jury.id,
                    profileName: jury.profileName || jury.name,
                    imageUrl: jury.imageUrl,
                    discriminator: jury.discriminator || 'Bot',
                  }

                  return (
                    <div
                      key={jury.id || idx}
                      ref={(el) => (juryRefs.current[jury.id || idx] = el)}
                      className={`jury-seat ${cardsDistributed && hasScore ? 'jury-seat--impacted' : ''}`}
                    >
                      <ActorMinimalCard
                        actor={actorData}
                        showHierarchyBtn={false}
                        showMemoryMapBtn={false}
                        showEditBtn={false}
                        showJuryPoints={true}
                        juryProponentScore={jury.proponentScore}
                        juryOpponentScore={jury.opponentScore}
                        clickable={true}
                        chipStyle={{
                          padding: '4px 14px',
                          width: '100%',
                          minWidth: '100%',
                          maxWidth: '100%',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Verdict Banner Overlay */}
          {verdict && (
            <div className="verdict-banner">
              <div className="verdict-banner__content">
                <div
                  className="page-header-icon"
                  style={{ width: 48, height: 48, borderRadius: 14 }}
                >
                  <AngryBotWithSwordsIcon size={26} color="#fff" />
                </div>
                <div className="verdict-banner__text">
                  <span className="verdict-banner__title">{t('debate.concluded_title', 'Meydan Okuma Tamamlandı')}</span>
                  <span className="verdict-banner__winner">
                    {t('debate.winner_label', 'Kazanan')}: <strong>{verdict.winnerName || t('debate.draw', 'Berabere')}</strong> (
                    {verdict.proponentScore} - {verdict.opponentScore})
                  </span>
                </div>
              </div>
              <button
                className="btn btn-primary btn-back-home"
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} /> {t('common.back_to_home', 'Ana Sayfaya Dön')}
              </button>
            </div>
          )}
      </div>
    </div>
  )
}
