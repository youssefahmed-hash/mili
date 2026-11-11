import React from 'react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { canAccessTab, firstAccessibleTab } from '../../constants/permissions'
import { Header } from './Header'
import { TopNav } from './TopNav'
import { NotificationBanner } from '../notification/NotificationBanner'
import { PersonnelModule } from '../personnel/PersonnelModule'
import { ClinicDashboard } from '../clinic/ClinicDashboard'
import { OperationsDashboard } from '../operations/OperationsDashboard'
import { SecurityDashboard } from '../security/SecurityDashboard'
import { UsersDashboard } from '../users/UsersDashboard'
import { NotificationsDashboard } from '../notification/NotificationsDashboard'
import { ActivityLogDashboard } from '../activity/ActivityLogDashboard'
import { Settings } from '../Settings'
import { HomeDashboard } from '../dashboard/HomeDashboard'

export const AppShell: React.FC = () => {
  const { activeTab } = useAppStore()
  const user = useAuthStore((s) => s.user)

  const currentTab = canAccessTab(user, activeTab) ? activeTab : firstAccessibleTab(user)

  const renderActiveModule = (): React.ReactNode => {
    switch (currentTab) {
      case 'الصفحة الرئيسية':
        return <HomeDashboard />
      case 'الأفراد':
        return <PersonnelModule />
      case 'الإعدادات':
        return <Settings />
      case 'العيادة':
        return <ClinicDashboard />
      case 'العمليات':
        return <OperationsDashboard />
      case 'الأمن':
        return <SecurityDashboard />
      case 'المستخدمين':
        return <UsersDashboard />
      case 'تنبيهات الإجازات':
        return <NotificationsDashboard />
      case 'سجل التحديثات':
        return <ActivityLogDashboard />
      default:
        return <PersonnelModule />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-military-900 text-gray-200">
      {/* Header */}
      <Header />

      {/* Top Navigation */}
      <TopNav />

      {/* شريط إعلان الإجازات الأحمر */}
      <NotificationBanner />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        {renderActiveModule()}
      </main>
    </div>
  )
}
