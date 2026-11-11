import { useState } from 'react'
import SystemEventsPanel from '../../components/admin/SystemEventsPanel'
import MemoryManagementPanel from '../../components/admin/MemoryManagementPanel'
import ActorManagementPanel from '../../components/admin/ActorManagementPanel'
import ConfigManagementPanel from '../../components/admin/ConfigManagementPanel'
import Logo from '../../components/common/icons/Logo'
import BackButton from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/authStore'
import { useHorizontalScrollIndicator } from '../../hooks/useHorizontalScrollIndicator'

export default function AdminPage() {
  const { t } = useTranslation()
  const isDeveloper = useAuthStore((state) => state.isDeveloper)
  const [activeTab, setActiveTab] = useState(isDeveloper ? 'config' : 'events')

  const allTabs = [
    { id: 'config', label: t('admin.bg_services_config'), developerOnly: true },
    { id: 'events', label: t('admin.system_events_title') },
    { id: 'memory', label: t('admin.memory_management_title') },
    { id: 'actor', label: t('admin.actor_management_title') },
  ]

  const tabs = allTabs.filter(tab => !tab.developerOnly || isDeveloper)
  const [adminTabsRef, adminTabsScroll] = useHorizontalScrollIndicator([tabs.length, activeTab])

  return (
    <div className="flex-col gap-4">
      {/* Standalone Back Button row */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Standard Page Header */}
      <div className="page-header-row page-header-row--md" style={{ paddingBottom: 20 }}>
        <div className="page-header-icon">
          <Logo width={22} height={22} fill="#fff" />
        </div>
        <div>
          <h1 className="page-header-title">{t('admin.title')}</h1>
          <p className="page-header-subtitle">{t('admin.desc')}</p>
        </div>
      </div>

      {/* Horizontal Navigation Tabs with Mobile Scroll Indicator */}
      <div className="admin-tabs-wrap" style={{ marginBottom: 28 }}>
        {adminTabsScroll.scrollable && (
          <div className="admin-tabs-scrollbar" aria-hidden="true">
            <div
              className="admin-tabs-scrollbar-thumb"
              style={{ width: `${adminTabsScroll.width}%`, left: `${adminTabsScroll.left}%` }}
            />
          </div>
        )}
        <nav
          ref={adminTabsRef}
          className="hscroll-strip flex overflow-x-auto gap-2 items-center"
          style={{
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col w-full">
        {activeTab === 'config' && isDeveloper && <ConfigManagementPanel />}
        {activeTab === 'events' && <SystemEventsPanel />}
        {activeTab === 'memory' && <MemoryManagementPanel />}
        {activeTab === 'actor' && <ActorManagementPanel />}
      </div>
    </div>
  )
}

