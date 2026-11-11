import React from 'react'
import {
  Users,
  HeartPulse,
  Crosshair,
  ShieldCheck,
  UserCog,
  Bell,
  LayoutDashboard,
  History
} from 'lucide-react'
import { useAppStore, TabType } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useActivityStore } from '../../store/activityStore'
import { canAccessTab, isSuperAdmin } from '../../constants/permissions'

export const TopNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const { newCount, fetchNewCount } = useActivityStore()

  React.useEffect(() => {
    void fetchNewCount()
    const timer = setInterval(() => {
      void fetchNewCount()
    }, 45000)
    return () => clearInterval(timer)
  }, [fetchNewCount])

  const allItems = [
    {
      id: 'الصفحة الرئيسية' as TabType,
      label: 'الصفحة الرئيسية',
      icon: LayoutDashboard
    },
    {
      id: 'الأفراد' as TabType,
      label: user?.userType === 'داخلية' ? 'الشئون مجندين' : 'الأفراد',
      icon: Users
    },
    { id: 'العيادة' as TabType, label: 'العيادة', icon: HeartPulse },
    { id: 'العمليات' as TabType, label: 'العمليات', icon: Crosshair },
    { id: 'الأمن' as TabType, label: 'الأمن', icon: ShieldCheck },
    { id: 'سجل التحديثات' as TabType, label: 'سجل التحديثات', icon: History }
  ]

  // المستخدمون + تنبيهات الإجازات: مدير النظام فقط (canAccessModule يتحقق من الباقي)
if (isSuperAdmin(user)) {
    allItems.push({
      id: 'المستخدمين' as TabType,
      label: 'المستخدمين',
      icon: UserCog
    })
    allItems.push({
      id: 'تنبيهات الإجازات',
      label: 'تنبيهات الإجازات',
      icon: Bell
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
            {item.id === 'سجل التحديثات' && newCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                {newCount > 99 ? '99+' : newCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
