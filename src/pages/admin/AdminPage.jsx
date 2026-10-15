import { useState } from 'react'
import SystemEventsPanel from '../../components/admin/SystemEventsPanel'
import MemoryManagementPanel from '../../components/admin/MemoryManagementPanel'
import ActorManagementPanel from '../../components/admin/ActorManagementPanel'
import ConfigManagementPanel from '../../components/admin/ConfigManagementPanel'
import Logo from '../../components/common/icons/Logo'
import BackButton from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'

export default function AdminPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('config')

  const tabs = [
    { id: 'config', label: t('admin.bg_services_config', 'Background Services & Config') },
    { id: 'events', label: t('admin.system_events_title', 'System Events') },
    { id: 'memory', label: t('admin.memory_management_title', 'Memory Management') },
    { id: 'actor', label: t('admin.actor_management_title', 'Person Management') },
  ]

  return (
    <div className="flex-col gap-4">
      {/* Standalone Back Button row */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Standard Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Logo width={22} height={22} fill="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('admin.title', 'Admin Paneli')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('admin.desc', 'Sistem yapılandırması, olaylar ve bellek yönetimi')}
          </p>
        </div>
      </div>

      {/* Horizontal Navigation Tabs */}
      <nav
        className="flex overflow-x-auto gap-2 hide-scrollbar"
        style={{ marginBottom: 20, minWidth: 0, overflowX: 'auto' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                transition: 'all var(--transition-fast)',
                background: isActive ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: isActive ? '#ffffff' : 'var(--color-text)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--color-surface-hover)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Content Area */}
      <div className="flex-1 flex flex-col w-full">
        {activeTab === 'config' && <ConfigManagementPanel />}
        {activeTab === 'events' && <SystemEventsPanel />}
        {activeTab === 'memory' && <MemoryManagementPanel />}
        {activeTab === 'actor' && <ActorManagementPanel />}
      </div>
    </div>
  )
}

