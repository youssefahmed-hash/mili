import React from 'react'
import { Users, CalendarClock, HeartPulse, Crosshair, ShieldCheck, UserCog, ClipboardList, CalendarCheck } from 'lucide-react'
import { useAppStore, TabType } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { canAccessTab } from '../../constants/permissions'

export const TopNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore()
  const user = useAuthStore((s) => s.user)

  const allItems = [
    {
      id: 'الأفراد' as TabType,
      label: user?.userType === 'داخلية' ? 'الشئون مجندين' : 'الأفراد',
      icon: Users
    },
    { id: 'طابور الاجازات' as TabType, label: 'طابور الاجازات', icon: CalendarClock },
    { id: 'اعتماد الإجازات' as TabType, label: 'اعتماد الإجازات', icon: CalendarCheck },
    { id: 'طابور الخدمات' as TabType, label: 'طابور الخدمات', icon: ClipboardList },
    { id: 'العيادة' as TabType, label: 'العيادة', icon: HeartPulse },
    { id: 'العمليات' as TabType, label: 'العمليات', icon: Crosshair },
    { id: 'الأمن' as TabType, label: 'الأمن', icon: ShieldCheck }
  ]

  if (user?.role === 'admin') {
    allItems.push({
      id: 'المستخدمين' as TabType,
      label: 'المستخدمين',
      icon: UserCog
    })
  }

  const navigationItems = allItems.filter((item) => canAccessTab(user, item.id))

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
