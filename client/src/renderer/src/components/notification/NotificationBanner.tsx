import React from 'react'
import { BellRing, RefreshCw, X } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'

// ==================== شريط الإعلان الأحمر (يظهر فوق كل الشاشات عند وجود نازلين إجازة) ====================
export const NotificationBanner: React.FC = () => {
  const { current, loading, bannerDismissed, dismissBanner, fetchCurrent } =
    useNotificationStore()

  if (!current || current.count === 0 || bannerDismissed) return null

  const names = current.personnel.slice(0, 3).map((p) => p.fullName)
  const rest = current.count - names.length

  return (
    <div
      role="alert"
      className="w-full bg-gradient-to-l from-red-700 via-red-600 to-red-700 border-y border-red-400/50 px-4 py-2.5 flex items-center justify-center gap-3 text-white shadow-lg shadow-red-900/40"
    >
      <BellRing className="h-5 w-5 shrink-0 animate-pulse" />
      <p className="text-sm font-black text-center leading-snug">
        إعلان إجازات: دور {current.source} هذا الأسبوع — {current.count}{' '}
        {current.count === 1 ? 'عسكري نازل' : 'عساكر نازلين'} إجازة
        {current.turn === 'line' && current.lineShiftName
          ? ` (${current.lineShiftName})`
          : ''}
        {names.length > 0 ? ` — ${names.join('، ')}` : ''}
        {rest > 0 ? ` و${rest} آخرون` : ''}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => fetchCurrent()}
          disabled={loading}
          title="تحديث"
          className="h-7 w-7 rounded-full flex items-center justify-center text-white/90 hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => dismissBanner()}
          title="إغلاق الإعلان"
          className="h-7 w-7 rounded-full flex items-center justify-center text-white/90 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
