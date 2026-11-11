import React, { useState, useEffect, useRef } from 'react'
import { Bell, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { Button } from '../ui/Button'
import { NotificationCard } from './NotificationCard'
import { useNotificationStore } from '../../store/notificationStore'
import { playAlertSound } from '../../utils/notificationSound'

// ==================== Notification Bell (جرس الإشعارات في الـHeader) ====================
export const NotificationBell: React.FC = () => {
  const { current, loading, error, fetchCurrent, soundEnabled, toggleSound } =
    useNotificationStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const playedKeyRef = useRef<string | null>(null)

  // معاينة الصوت عند تشغيله + تبديل الحالة (الضغطة = تفاعل المستخدم فيسمح المتصفح بالصوت)
  const handleToggleSound = () => {
    const wasOff = !soundEnabled
    toggleSound()
    if (wasOff) {
      playAlertSound().catch(() => {})
    }
  }

  useEffect(() => {
    fetchCurrent()
  }, [fetchCurrent])

  // تشغيل صوت التنبيه + إشعار النظام (Toast) مرة واحدة لكل إشعار جديد فيه نازلين إجازة
  useEffect(() => {
    if (!current || current.count === 0) return
    const key = `${current.turn}|${current.weekStart}|${current.weekEnd}|${current.count}`
    if (playedKeyRef.current === key) return
    playedKeyRef.current = key
    if (soundEnabled) {
      playAlertSound().catch(() => {})
    }
    try {
      const names = current.personnel
        .slice(0, 3)
        .map((p) => p.fullName)
        .join('، ')
      const extra =
        current.turn === 'line' && current.lineShiftName
          ? ` (${current.lineShiftName})`
          : ''
      window.api
        ?.notifyVacation?.({
          title: `إعلان إجازات: دور ${current.source}`,
          body: `${current.count} ${
            current.count === 1 ? 'عسكري نازل' : 'عساكر نازلين'
          } إجازة${extra}${names ? ` — ${names}` : ''}`
        })
        ?.catch(() => {})
    } catch {
      // خارج بيئة Electron — تجاهل
    }
  }, [current, soundEnabled])

  // الضغط على تنبيه النظام يفتح قائمة التفاصيل
  useEffect(() => {
    try {
      const off = window.api?.onVacationAlertClicked?.(() => setIsOpen(true))
      return () => {
        if (typeof off === 'function') off()
      }
    } catch {
      return undefined
    }
  }, [])

  // إغلاق الـDropdown عند الضغط خارجه
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const count = current?.count ?? 0
  const isConfigured = current?.configured !== false

  return (
    <div ref={containerRef} className="relative">
      {/* زر الجرس */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title="إشعارات الإجازات"
        className="relative h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-military-primary/20 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {!isConfigured ? (
          <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center border border-military-800">
            !
          </span>
        ) : (
          count > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-military-800">
              {count}
            </span>
          )
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-11 left-0 w-[340px] max-h-[480px] overflow-y-auto glassmorphism rounded-xl border border-white/10 p-4 z-50 flex flex-col gap-3">
          {!isConfigured ? (
            <>
              <h3 className="text-sm font-black text-yellow-400">النظام غير مهيأ</h3>
              <p className="text-xs text-yellow-300">
                لم يتم إعداد نظام التناوب الأسبوعي بعد. يرجى التواصل مع الأدمن لإعداد:
              </p>
              <ul className="text-xs text-yellow-300 space-y-1 list-disc list-inside">
                <li>تاريخ بداية التناوب</li>
                <li>أول دور (الأفراد / الخط)</li>
              </ul>
            </>
          ) : (
          <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">إجازات هذا الأسبوع</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleSound()}
                title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت (اضغط للمعاينة)'}
                startIcon={
                  soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5" />
                  )
                }
              >
                {soundEnabled ? 'الصوت يعمل' : 'الصوت متوقف'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchCurrent()}
                disabled={loading}
                startIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                تحديث
              </Button>
            </div>
          </div>

          {loading && !current && (
            <div className="text-center text-gray-500 text-xs py-4">جاري التحميل...</div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
              {error}
            </div>
          )}

          {current && isConfigured && <NotificationCard notification={current} />}

          {!loading && !error && !current && (
            <div className="text-center text-gray-500 text-xs py-4">
              لا توجد بيانات إشعارات
            </div>
          )}
          </>
          )}
        </div>
      )}
    </div>
  )
}
