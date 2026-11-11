import React from 'react'
import { Users, MapPin } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { displayRank } from '../../utils/rankDisplay'
import type { NotificationData } from '../../types/personnel'

// ==================== Notification Card (تفاصيل الإشعار) ====================
export const NotificationCard: React.FC<{ notification: NotificationData }> = ({
  notification
}) => {
  const isLine = notification.turn === 'line'

  return (
    <div className="flex flex-col gap-3">
      {/* نوع الدور والمصدر */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">
          دور هذا الأسبوع: {notification.source}
        </span>
        <Badge variant={isLine ? 'warning' : 'accent'}>
          {notification.weekStart} ← {notification.weekEnd}
        </Badge>
      </div>

      {/* العمالة في الإجازة (دور الخط فقط) */}
      {isLine && notification.lineShiftName && (
        <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
          العمالة في الإجازة: {notification.lineShiftName}
        </div>
      )}

      {/* العدد */}
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Users className="h-4 w-4 text-military-accent" />
        <span>
          العدد: <strong className="text-white">{notification.count}</strong>
        </span>
      </div>

      {/* قائمة الأسماء */}
      {notification.personnel.length === 0 ? (
        <div className="text-center text-gray-500 text-xs py-3">
          لا يوجد عساكر في هذا الدور
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {notification.personnel.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between bg-military-900/60 border border-white/5 rounded-lg px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-100">
                  {p.fullName}
                  {p.vacationType === 'طارئ' && (
                    <span className="text-[11px] text-red-400 font-bold"> 🚨 طوارئ</span>
                  )}
                </span>
                <span className="text-[11px] text-gray-400">
                  {displayRank(p.rank, p.personnelType)}
                  {p.vacationType ? ` • ${p.vacationType}` : ''}
                  {p.startDate ? ` • نزول: ${p.startDate}` : ''}
                </span>
              </div>
              {p.linePoint && (
                <span className="flex items-center gap-1 text-[11px] text-military-accent">
                  <MapPin className="h-3 w-3" />
                  {p.linePoint}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
