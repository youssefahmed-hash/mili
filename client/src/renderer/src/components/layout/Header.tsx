import React from 'react'
import { Shield, User, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from '../notification/NotificationBell'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { ROLE_LABELS } from '../../types/user'

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  return (
    <header className="h-16 border-b border-white/5 bg-military-800/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Right side: System Brand */}
      <div className="flex items-center gap-3">
        <div className="bg-military-primary/10 p-2 rounded-lg border border-military-primary/30">
          <Shield className="h-6 w-6 text-military-primary" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-wider text-white">
            منظومة إدارة شؤون الأفراد
          </h1>
          <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
            القوات المسلحة
          </p>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="w-[380px]">
        <GlobalSearch />
      </div>

      {/* Left side: Notifications + Profile Badge + Logout */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex items-center gap-3 bg-military-900/60 border border-white/5 rounded-full py-1.5 ps-4 pe-2">
        <div className="flex flex-col text-end">
          <span className="text-sm font-bold text-white leading-tight">
            {user?.fullName || user?.username || 'مستخدم'}
          </span>
          <span className="text-[10px] text-military-accent font-semibold leading-tight">
            {ROLE_LABELS[user?.role || 'user']} • {user?.department || '—'}
          </span>
        </div>
        <div className="h-8 w-8 rounded-full bg-military-primary flex items-center justify-center border border-white/10 shadow-lg">
          <User className="h-4 w-4 text-white" />
        </div>
        <button
          onClick={() => setActiveTab('الإعدادات')}
          title="الإعدادات"
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-military-primary/20 transition-colors"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
        <button
          onClick={logout}
          title="تسجيل الخروج"
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
        </div>
      </div>
    </header>
  )
}
