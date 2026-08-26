import React from 'react'
import { useAppStore } from '../../store/appStore'
import { Header } from './Header'
import { TopNav } from './TopNav'
import { PersonnelModule } from '../personnel/PersonnelModule'
import { ClinicDashboard } from '../clinic/ClinicDashboard'
import { OperationsDashboard } from '../operations/OperationsDashboard'
import { SecurityDashboard } from '../security/SecurityDashboard'
import { UsersDashboard } from '../users/UsersDashboard'
import { VacationLineup } from '../personnel/VacationLineup'
import { ServicesLineup } from '../personnel/ServicesLineup'
import { Settings } from '../Settings'

export const AppShell: React.FC = () => {
  const { activeTab } = useAppStore()

  const renderActiveModule = (): React.ReactNode => {
    switch (activeTab) {
      case 'الأفراد':
        return <PersonnelModule />
      case 'طابور الاجازات':
        return <VacationLineup />
      case 'طابور الخدمات':
        return <ServicesLineup />
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

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        {renderActiveModule()}
      </main>
    </div>
  )
}
