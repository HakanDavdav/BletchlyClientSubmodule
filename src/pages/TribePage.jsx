import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LogOut,
  UserPlus,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Brain,
  CalendarFold,
  Users,
  Crown,
  Sliders,
  ShieldCheck,
} from 'lucide-react'
import BotFlashCardsIcon from '../components/common/icons/BotFlashCardsIcon'
import CardContingencyIcon from '../components/common/icons/CardContingencyIcon'
import CardContingencyModifierIcon from '../components/common/icons/CardContingencyModifierIcon'
import FossilIcon from '../components/common/icons/FossilIcon'
import TRexSkullIcon from '../assets/t-rex-skull-svgrepo-com.svg?react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tribeApi } from '../api/tribeApi'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { TopicTagList } from '../components/topic/TopicTag'
import { TopicTypes } from '../constants/TopicTypes'
import ImageWithLoader from '../components/common/ImageWithLoader'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import FossilTogglePill from '../components/common/FossilTogglePill'
import PostCard from '../components/content/PostCard'
import CardSlots from '../components/card/CardSlots'
import ProfileModifiersModal from '../components/profile/ProfileModifiersModal'
import useAuthStore from '../store/authStore'
import useMyEntitiesStore from '../store/myEntitiesStore'
import useUIStore from '../store/uiStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { buildOwnedCardIdSet, sortCardsOwnedFirst } from '../utils/cardOwnership'

export default function TribePage() {
  const [searchParams] = useSearchParams()
  const tribeId = searchParams.get('tribeId')
  const [postsPage, setPostsPage] = useState(1)
  const inferredPerPage = 5
  useDevLog('TribePage', arguments[0] || {})
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const myCards = useMyEntitiesStore((state) => state.myCards)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [isBouncing, setIsBouncing] = useState(false)
  const [modifiersModalOpen, setModifiersModalOpen] = useState(false)
  const [tribeImgFailed, setTribeImgFailed] = useState(false)
  // Fosil (dormant) üyeler varsayılan olarak gizli.
  const [showFossilMembers, setShowFossilMembers] = useState(false)
  // Limitler & Miras paneli açma/kapama durumu (ProfilePage ile ORTAK global state)
  const { isLimitsExpanded, toggleLimits } = useUIStore()

  const { data: tribe, isLoading } = useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: () => tribeApi.getTribe(tribeId).then((r) => r.data?.data ?? null),
    enabled: !!tribeId,
  })

  const sortedTribeCards = useMemo(
    () => sortCardsOwnedFirst(tribe?.personalityCards || [], buildOwnedCardIdSet(myCards || [])),
    [tribe, myCards]
  )

  const isDormantMember = (member) =>
    Boolean(member?.actor?.isDormant ?? member?.actor?.IsDormant ?? false)

  const visibleMembers = useMemo(
    () =>
      showFossilMembers
        ? tribe?.tribeMemberships || []
        : (tribe?.tribeMemberships || []).filter((m) => !isDormantMember(m)),
    [tribe, showFossilMembers]
  )

  const fossilMemberCount = useMemo(
    () => (tribe?.tribeMemberships || []).filter((m) => isDormantMember(m)).length,
    [tribe]
  )

  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['tribe-posts', tribeId, postsPage],
    queryFn: () => tribeApi.getTribePosts(tribeId, postsPage).then((res) => res.data?.data),
    enabled: !!tribeId,
  })

  const joinMutation = useMutation({
    mutationFn: () => tribeApi.joinTribe(tribeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tribe', tribeId])
      useMyEntitiesStore.getState().fetchMyTribes()
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => tribeApi.leaveTribe(tribeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tribe', tribeId])
      useMyEntitiesStore.getState().fetchMyTribes()
    },
  })

  if (isLoading)
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  if (!tribe) return <div className="empty-state">{t('tribe.not_found')}</div>

  const isDormant = Boolean(tribe.isDormant ?? tribe.IsDormant ?? false)
  const isMember = tribe.tribeMemberships?.some((m) => m.actor?.actorId === currentUserId)
  const isLeader = tribe.tribeMemberships?.some(
    (m) => m.actor?.actorId === currentUserId && m.roleName === 'TribeLeader'
  )
  // Backend TribeService.EditTribe allows TribeAssistantLeader and above; mirror the same
  // hierarchy threshold here so Assistant/Co leaders can manage the tribe from the UI.
  const TRIBE_ROLE_HIERARCHY = {
    TribeMember: 1,
    TribeSenior: 2,
    TribeAssistantLeader: 3,
    TribeCoLeader: 4,
    TribeLeader: 5,
  }
  const myTribeRoleName = tribe.tribeMemberships?.find(
    (m) => m.actor?.actorId === currentUserId
  )?.roleName
  const canManageTribe = (TRIBE_ROLE_HIERARCHY[myTribeRoleName] || 0) >= 3
  const isMyTribe = useMyEntitiesStore.getState().myTribes?.some((t) => t.tribeId === tribeId)

  const rawGrade = tribe.tribeGrade
  const gradeMap = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
    4: 'F',
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    F: 'F',
  }
  const tribeGradeLabel =
    rawGrade !== null && rawGrade !== undefined
      ? gradeMap[rawGrade] || (typeof rawGrade === 'string' ? rawGrade : 'F')
      : 'F'
  const gradeColorMap = {
    A: '#22C55E',
    B: '#84CC16',
    C: '#F59E0B',
    D: '#F97316',
    F: '#EF4444',
  }
  const tribeGradeColor = gradeColorMap[tribeGradeLabel] || '#EF4444'

  const capabilityEmblems = [
    {
      key: 'default',
      label: t('tribe.capability_default', 'Varsayılan'),
      description: `${t('tribe.capability_default', 'Varsayılan')}: ${t('tribe.capability_default_desc', 'Standart klan kapasitesi ve temel özellikler')}`,
      Icon: ShieldCheck,
      tone: 'default',
      size: 25,
    },
    ...(isDormant
      ? [
          {
            key: 'fossil',
            label: t(
              'common.fossil_tribe_desc',
              'Fosil Klan: Aktif döngüden çekilmiş inaktif klan.'
            ),
            description: t(
              'common.fossil_tribe_desc',
              'Fosil Klan: Aktif döngüden çekilmiş inaktif klan.'
            ),
            Icon: FossilIcon,
            tone: 'fossil',
            size: 24,
          },
        ]
      : []),
  ]

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Tribe Header ─── */}
      <div className={`profile-header-card${isDormant ? ' profile-header-card--dormant' : ''}`}>
        <div
          className="flex justify-between profile-header-row"
          style={{ gap: 20, width: '100%', alignItems: 'stretch', marginBottom: -6 }}
        >
          {/* ─── LEFT COLUMN ─── */}
          <div
            className="profile-header-left"
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 4,
            }}
          >
            <div>
              <div className="flex items-center" style={{ gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{tribe.tribeName}</h1>
              </div>

              <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
                {tribe.mission || t('tribe.no_mission')}
              </p>

              {tribe.createdAt && (
                <p
                  className="text-muted tribe-founded"
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CalendarFold size={14} />
                  <span>
                    {t('tribe.founded')}
                    {new Date(tribe.createdAt).toLocaleDateString(
                      i18n.language && i18n.language.startsWith('en') ? 'en-US' : 'tr-TR'
                    )}
                  </span>
                </p>
              )}

              {tribe.topicTypes && tribe.topicTypes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <TopicTagList
                    topicTypes={tribe.topicTypes
                      .map((tt) => {
                        const match = TopicTypes.find(
                          (opt) =>
                            opt.value === tt?.topicTypeName ||
                            opt.enumName === tt?.topicTypeName
                        )
                        return match ? match.value : null
                      })
                      .filter((v) => v != null)}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, marginBottom: 0, maxWidth: 600 }}>
              <div className="bot-capability-emblems" style={{ marginBottom: 0 }}>
                {capabilityEmblems.map(({ key, label, description, Icon, tone, size = 25 }) => (
                  <span
                    key={key}
                    className={`bot-capability-emblem bot-capability-emblem--${tone}`}
                    aria-label={label}
                    title={description || label}
                    role="img"
                  >
                    <Icon size={size} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                ))}
              </div>
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ paddingTop: 16 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() =>
                  navigate('/mind?tribeId=' + tribeId, { state: { profileName: tribe?.tribeName } })
                }
              >
                <Brain size={14} /> {t('tribe.collective_memories', 'Kollektif Anılar')}
              </button>
            </div>
          </div>

          {/* ─── VERTICAL DIVIDER ─── */}
          <div
            className="profile-header-divider"
            style={{
              width: 0,
              borderLeft: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
              marginTop: 0,
              marginBottom: 0,
            }}
          />

          {/* ─── RIGHT COLUMN ─── */}
          <div
            className="profile-header-right"
            style={{
              width: 144,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: 0,
              position: 'relative',
            }}
          >
            <div
              className="actor-avatar-wrap"
              style={{
                position: 'relative',
                width: 144,
                height: 144,
                display: 'inline-flex',
                flexShrink: 0,
              }}
            >
              {tribe.imageUrl && !tribeImgFailed ? (
                <ImageWithLoader
                  src={tribe.imageUrl}
                  alt={tribe.tribeName}
                  onError={() => setTribeImgFailed(true)}
                  spinnerSize="md"
                  spinnerOpacity={0.45}
                  wrapperStyle={{
                    width: 144,
                    height: 144,
                    borderRadius: 24,
                    overflow: 'hidden',
                  }}
                  style={{
                    width: 144,
                    height: 144,
                    objectFit: 'cover',
                    borderRadius: 24,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 144,
                    height: 144,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary-dark)',
                    fontWeight: 800,
                    fontSize: 48,
                    borderRadius: 24,
                  }}
                >
                  {tribe.tribeName?.[0] || 'T'}
                </div>
              )}

              {isDormant && (
                <div
                  className="fossil-stamp"
                  style={{ borderRadius: 24 }}
                >
                  <TRexSkullIcon className="fossil-stamp-icon" />
                </div>
              )}

              {isMyTribe && (
                <span
                  style={{
                    position: 'absolute',
                    top: -11,
                    left: -5,
                    color: 'var(--color-warning)',
                    zIndex: 10,
                    filter: 'drop-shadow(0px 3px 4px rgba(0,0,0,0.5))',
                    transform: 'rotate(-15deg)',
                    display: 'flex',
                    pointerEvents: 'auto',
                  }}
                >
                  <Crown size={40} strokeWidth={2.5} />
                </span>
              )}

              {/* Avatar Sağ Alt: Sadece Klan Grade Rozeti */}
              {tribeGradeLabel && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: tribeGradeColor,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 15,
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid var(--color-surface)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    zIndex: 10,
                    userSelect: 'none',
                  }}
                >
                  {tribeGradeLabel}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2" style={{ width: '100%', marginTop: 12 }}>
              {isLoggedIn && !isMember && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={
                    isDormant
                      ? undefined
                      : () => {
                          setIsBouncing(true)
                          setTimeout(() => setIsBouncing(false), 200)
                          joinMutation.mutate()
                        }
                  }
                  disabled={joinMutation.isPending || isDormant}
                  style={{
                    transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isDormant ? 0.5 : 1,
                    cursor: isDormant ? 'not-allowed' : 'pointer',
                  }}
                  title={isDormant ? t('tribe.dormant_cannot_join', 'Fosil klanlara yeni üye katılamaz.') : undefined}
                >
                  <UserPlus size={14} /> {t('tribe.join')}
                </button>
              )}
              {isLoggedIn && isMember && !isLeader && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setIsBouncing(true)
                    setTimeout(() => setIsBouncing(false), 200)
                    leaveMutation.mutate()
                  }}
                  disabled={leaveMutation.isPending}
                  style={{
                    transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <LogOut size={14} /> {t('tribe.leave')}
                </button>
              )}
              {isLoggedIn && canManageTribe && !isDormant && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/tribe/settings?tribeId=' + tribeId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit2 size={14} /> {t('action.edit', 'Düzenle')}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* ─── HORIZONTAL DIVIDER ─── */}
        <div
          style={{
            width: '100%',
            height: 0,
            borderTop: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
            margin: '2px 0 0px 0',
          }}
        />

        {/* ─── BOTTOM MODULE ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            paddingBottom: 0,
            marginTop: -16,
          }}
        >
          <div className="profile-stats-grid" style={{ width: '100%' }}>
            <div className="profile-stat-box">
              <span className="profile-stat-value">{tribe.tribePoint?.toLocaleString() ?? 0}</span>
              <span className="profile-stat-label">{t('profile.points')}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">{tribe.memberCount ?? 0}</span>
              <span className="profile-stat-label">{t('tribe.member_count_label')}</span>
            </div>
            <div
              className="profile-stat-box"
              onClick={() => setModifiersModalOpen(true)}
            >
              <span
                className="profile-stat-value"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  fontSize: 15,
                }}
              >
                <Sliders size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{t('profile.grade', 'Derece')}</span>
                <span
                  style={{
                    width: 19,
                    height: 19,
                    borderRadius: '50%',
                    background: tribeGradeColor,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 11,
                    lineHeight: 1,
                    border: '1.5px solid var(--color-surface)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {tribeGradeLabel}
                </span>
              </span>
              <span className="profile-stat-label">{t('profile.modifiers', 'Modifikatörler')}</span>
            </div>
          </div>

          {/* ─── LİMİTLER & MİRAS AÇILIR PANELİ (uiStore.isLimitsExpanded — Profil & Tribe ortak) ─── */}
          <button
            type="button"
            className="profile-limits-toggle"
            onClick={toggleLimits}
            aria-expanded={isLimitsExpanded}
            aria-label={isLimitsExpanded ? 'Limitleri Gizle' : 'Limitleri Göster'}
          >
            <span
              aria-hidden="true"
              className={`profile-limits-toggle__chevron ${isLimitsExpanded ? 'expanded' : ''}`}
            >
              ▼
            </span>
          </button>

          {isLimitsExpanded && (
            <>
          {/* Üye Kapasitesi — gri çizginin ÜSTÜNDE (modaldaki gibi) */}
          <div
            className="profile-limits-row"
            style={{ marginTop: 10, marginBottom: 0, paddingLeft: 4, paddingRight: 4 }}
          >
            <div className="profile-limit-chip">
              <Users size={25} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{t('tribe.member_capacity', 'Üye Kapasitesi')}:</span>
              <span className="profile-limit-chip__val">
                {tribe.memberCount ?? 0} / 50
              </span>
            </div>
          </div>

          {/* ─── GRİ AYRAÇ — kart bloğu hep bu çizginin ALTINDA (profil düzeniyle uyumlu) ─── */}
          <div
            style={{
              width: '100%',
              height: 0,
              borderTop: '1px solid var(--color-border)',
              margin: '16px 0 12px 0',
            }}
          />

          <div
            className="profile-limits-row"
            style={{ marginTop: 0, marginBottom: 0, paddingLeft: 4, paddingRight: 4 }}
          >
            <div className="profile-limit-chip">
              <BotFlashCardsIcon
                size={25}
                style={{ color: 'var(--color-primary)', flexShrink: 0 }}
              />
              <span>{t('profile.bot_assignment_limit', 'Kart Atanma Limiti')}:</span>
              <span className="profile-limit-chip__val">
                {tribe.personalityCards?.length || 0} / {tribe.tribeAssignmentLimit || 4}
              </span>
            </div>
            <span className="profile-limit-divider">•</span>
            <div className="profile-limit-chip">
              <CardContingencyIcon
                size={25}
                style={{ color: 'var(--color-primary)', flexShrink: 0 }}
              />
              <span>{t('profile.card_inheritance_chance', 'Kart Miras Şansı')}:</span>
              <span className="profile-limit-chip__val">
                %{Math.round((tribe.cardInheritanceChance || 0.25) * 100)}
              </span>
            </div>
            {tribe.cardInheritanceModifier !== undefined &&
              tribe.cardInheritanceModifier !== null && (
                <>
                  <span className="profile-limit-divider">•</span>
                  <div className="profile-limit-chip">
                    <CardContingencyModifierIcon
                      size={42}
                      style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                    />
                    <span>{t('profile.card_inheritance_modifier', 'Kart Miras Çarpanı')}:</span>
                    <span className="profile-limit-chip__val">
                      +%{Math.round((tribe.cardInheritanceModifier || 0) * 100)}
                    </span>
                  </div>
                </>
              )}
          </div>
            </>
          )}

          {tribe.personalityCards?.length > 0 && (
            <>
              {/* ─── STATS BOTTOM DIVIDER ─── */}
              <div
                style={{
                  width: '100%',
                  height: 0,
                  borderTop: '1px solid var(--color-border)',
                  margin: '16px 0 12px 0',
                }}
              />
              <div style={{ marginBottom: 8, width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                    marginTop: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {t('card.personality_slots', 'Atanmış Kişilik Kartları')} (
                    {tribe.personalityCards?.length || 0} / {tribe.tribeAssignmentLimit || 4}{' '}
                    {t('card.slots_label', 'Slot')})
                  </span>
                </div>
                <CardSlots
                  cards={sortedTribeCards}
                  slotCount={tribe.tribeAssignmentLimit || 4}
                  showMark={false}
                  tribeBadgeLabel={t('tribe.badge_tribe', 'KLAN')}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Members List ─── */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: 'var(--color-text-primary)',
              }}
            >
              {t('tribe.members')} ({visibleMembers.length})
            </h2>
          </div>
          <FossilTogglePill
            count={fossilMemberCount}
            open={showFossilMembers}
            onToggle={() => setShowFossilMembers((v) => !v)}
            style={{ marginLeft: 'auto' }}
          />
        </div>
      </div>

      <div className="flex-col gap-2">
        {visibleMembers.length === 0 && fossilMemberCount === 0 ? (
          <p className="empty-state">{t('tribe.no_members')}</p>
        ) : (
          visibleMembers.map((member) =>
            member.actor ? (
              <div
                key={member.actor.actorId}
                className="lb-card flex items-center justify-between"
                style={{ padding: '8px 16px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActorMinimalCard actor={member.actor} />
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className="badge"
                    style={{ background: 'var(--color-surface-raised)', marginRight: 8 }}
                  >
                    {member.roleName === 'TribeLeader'
                      ? t('tribe.leader')
                      : member.roleName || t('tribe.member')}
                  </span>
                </div>
              </div>
            ) : null
          )
        )}
      </div>

      {/* ─── Posts Section ─── */}
      <div className="profile-tabs-container" style={{ marginTop: 24 }}>
        <div className="profile-tab-group">
          <button className="profile-tab-btn active" style={{ cursor: 'default' }}>
            {t('profile.posts')} ({tribe.postCount ?? 0})
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={postsPage === 1 || isPostsLoading}
            onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
            style={{ padding: '4px 8px' }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            {t('profile.page')} {postsPage} /{' '}
            {Math.max(1, Math.ceil((tribe.postCount || 0) / inferredPerPage))}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={
              postsPage >= Math.ceil((tribe.postCount || 0) / inferredPerPage) || isPostsLoading
            }
            onClick={() => setPostsPage((p) => p + 1)}
            style={{ padding: '4px 8px' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ minHeight: 400, marginTop: 16 }}>
        {isPostsLoading ? (
          <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} />
        ) : !postsData || postsData.length === 0 ? (
          <p className="empty-state">{t('tribe.empty_posts')}</p>
        ) : (
          <div className="flex-col gap-4">
            {postsData.map((p) => (
              <PostCard key={p.contentItemId} {...p} />
            ))}
          </div>
        )}
      </div>

      <ProfileModifiersModal
        profile={{ ...tribe, discriminator: 'Tribe' }}
        isOpen={modifiersModalOpen}
        onClose={() => setModifiersModalOpen(false)}
      />
    </div>
  )
}
