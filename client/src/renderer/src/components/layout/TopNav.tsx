import React from 'react'
import { Users, HeartPulse, Crosshair, ShieldCheck } from 'lucide-react'
import { useAppStore, TabType } from '../../store/appStore'

export const TopNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore()

  const navigationItems = [
    { id: 'الأفراد' as TabType, label: 'الأفراد', icon: Users },
    { id: 'العيادة' as TabType, label: 'العيادة', icon: HeartPulse },
    { id: 'العمليات' as TabType, label: 'العمليات', icon: Crosshair },
    { id: 'الأمن' as TabType, label: 'الأمن', icon: ShieldCheck }
  ]

  return (
    <div className="flex bg-military-800 border-b border-white/5 px-8 select-none">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-wide transition-all duration-200 border-b-2 cursor-pointer ${
              isActive
                ? 'border-military-primary text-white bg-military-primary/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-military-700/20'
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 ${isActive ? 'text-military-primary' : 'text-gray-400'}`}
            />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
