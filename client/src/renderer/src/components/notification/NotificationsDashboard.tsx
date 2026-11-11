import React, { useState, useEffect } from 'react'
import { Bell, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { NotificationCard } from './NotificationCard'
import { useNotificationStore } from '../../store/notificationStore'
import { useAuthStore } from '../../store/authStore'
import type { NotificationTurn } from '../../types/personnel'
import { isManager } from '../../constants/permissions'

// ==================== Notifications Dashboard (صفحة تفصيلية لتنبيهات الإجازات) ====================
export const NotificationsDashboard: React.FC = () => {
  const {
    current,
    settings,
    loading,
    error,
    fetchCurrent,
    fetchSettings,
    saveSettings,
    clearError
  } = useNotificationStore()
  const { user } = useAuthStore()
  const isAdmin = isManager(user)

  const [rotationStart, setRotationStart] = useState('')
  const [firstTurn, setFirstTurn] = useState<NotificationTurn>('personnel')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    fetchCurrent()
    fetchSettings()
  }, [fetchCurrent, fetchSettings])

  useEffect(() => {
    if (settings?.weeklyRotationStartDate) {
      setRotationStart(settings.weeklyRotationStartDate.slice(0, 10))
    }
    if (settings?.firstTurn) {
      setFirstTurn(settings.firstTurn)
    }
  }, [settings])

  const handleRefresh = () => {
    clearError()
    fetchCurrent()
  }

  const handleSaveSettings = async () => {
    setSaveMessage('')
    if (!rotationStart) {
      setSaveMessage('يجب تحديد تاريخ بداية التناوب')
      return
    }
    setSaving(true)
    const ok = await saveSettings({ weeklyRotationStartDate: rotationStart, firstTurn })
    setSaving(false)
    setSaveMessage(ok ? 'تم حفظ الإعدادات بنجاح' : 'فشل حفظ الإعدادات')
  }

  const isConfigured = current?.configured !== false

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-military-accent" />
            تنبيهات الإجازات
          </h2>
          <p className="text-sm text-gray-400">
            دور الإجازات الأسبوعي: الأفراد ← الخط بالتناوب
          </p>
        </div>
        <Button
          variant="accent"
          startIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={handleRefresh}
          disabled={loading}
        >
          تحديث
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Current Notification */}
      <div className="glassmorphism p-5 rounded-xl">
        {loading && !current && (
          <div className="text-center text-gray-500 text-sm py-6">جاري التحميل...</div>
        )}
        {current && isConfigured && <NotificationCard notification={current} />}
        {current && !isConfigured && (
          <div className="text-center py-6">
            <p className="text-sm font-bold text-yellow-400 mb-2">النظام غير مهيأ</p>
            <p className="text-xs text-gray-400">
              لم يتم إعداد نظام التناوب الأسبوعي بعد. يجب على الأدمن تحديد تاريخ البداية وأول دور أدناه.
            </p>
          </div>
        )}
        {!loading && !current && (
          <div className="text-center text-gray-500 text-sm py-6">
            لا توجد بيانات إشعارات
          </div>
        )}
      </div>

      {/* Admin Settings */}
      {isAdmin && (
        <div className="glassmorphism p-5 rounded-xl flex flex-col gap-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-military-accent" />
            إعدادات التناوب (مدير النظام)
          </h3>
          <p className="text-xs text-gray-400">
            حدد تاريخ بداية أول دور وأول دور (أفراد أو خط). كل 7 أيام متتالية يتبدل الدور.
            تغيير هذا الإعداد لا يغير نظام إجازات الأفراد أو Rotation الخط.
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="w-64">
              <Input
                label="تاريخ بداية التناوب"
                type="date"
                value={rotationStart}
                onChange={(e) => setRotationStart(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Select
                label="أول دور"
                value={firstTurn}
                onChange={(e) => setFirstTurn(e.target.value as NotificationTurn)}
                options={[
                  { value: 'personnel', label: 'الأفراد' },
                  { value: 'line', label: 'الخط' }
                ]}
              />
            </div>
            <Button variant="primary" onClick={handleSaveSettings} loading={saving}>
              حفظ الإعدادات
            </Button>
          </div>
          {saveMessage && (
            <div className="text-xs text-gray-300">{saveMessage}</div>
          )}
        </div>
      )}
    </div>
  )
}
