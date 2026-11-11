import { create } from 'zustand'
import {
  getCurrentNotification,
  getNotificationSettings,
  updateNotificationSettings
} from '../api/notification.api'
import type {
  NotificationData,
  NotificationSettings
} from '../types/personnel'

interface NotificationState {
  // Data
  current: NotificationData | null
  settings: NotificationSettings | null

  // Loading states
  loading: boolean
  error: string | null

  // Alert preferences
  soundEnabled: boolean
  bannerDismissed: boolean

  // Actions
  fetchCurrent: () => Promise<void>
  fetchSettings: () => Promise<void>
  saveSettings: (data: Partial<NotificationSettings>) => Promise<boolean>
  toggleSound: () => void
  dismissBanner: () => void
  _resetDismissForLogin: () => void

  // Utils
  clearError: () => void
}

const SOUND_KEY = 'notif_sound_enabled'

function notificationKey(n: NotificationData): string {
  return `${n.turn}|${n.weekStart}|${n.weekEnd}|${n.count}`
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  current: null,
  settings: null,
  loading: false,
  error: null,
  soundEnabled:
    typeof localStorage === 'undefined' ||
    localStorage.getItem(SOUND_KEY) !== '0',
  bannerDismissed: false,

  // ==================== Current Notification ====================
  fetchCurrent: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getCurrentNotification()
      if (res.success) {
        const key = notificationKey(res.data)
        // إشعار جديد (أسبوع/دور/عدد مختلف) → أظهر الشريط الأحمر من جديد
        const isNew = get().current
          ? notificationKey(get().current as NotificationData) !== key
          : true
        // قراءة dismiss من localStorage (يُمسح عند كل login جديد)
        const dismissed = isNew
          ? false
          : localStorage.getItem(`notif_dismissed_${key}`) === '1'
        set({
          current: res.data,
          bannerDismissed: dismissed
        })
      } else set({ error: res.message || 'فشل تحميل إشعار الإجازات' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل الإشعار' })
    } finally {
      set({ loading: false })
    }
  },

  // ==================== Settings ====================
  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getNotificationSettings()
      if (res.success) set({ settings: res.data })
      else set({ error: res.message || 'فشل تحميل إعدادات التناوب' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل الإعدادات' })
    } finally {
      set({ loading: false })
    }
  },

  saveSettings: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await updateNotificationSettings(data)
      if (res.success) {
        set({ settings: res.data })
        await get().fetchCurrent()
        return true
      }
      set({ error: res.message || 'فشل تحديث إعدادات التناوب' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحديث الإعدادات' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  // ==================== Utils ====================
  clearError: () => set({ error: null }),

  toggleSound: () => {
    const next = !get().soundEnabled
    try {
      localStorage.setItem(SOUND_KEY, next ? '1' : '0')
    } catch {
      // التخزين المحلي اختياري
    }
    set({ soundEnabled: next })
  },

  dismissBanner: () => {
    const current = get().current
    if (current) {
      try {
        localStorage.setItem(`notif_dismissed_${notificationKey(current)}`, '1')
      } catch {
        // التخزين المحلي اختياري
      }
    }
    set({ bannerDismissed: true })
  },

  // دالة داخلية تُستدعى عند login لمسح جميع dismiss flags
  _resetDismissForLogin: () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('notif_dismissed_')) localStorage.removeItem(key)
      })
    } catch {
      // التخزين المحلي اختياري
    }
    set({ bannerDismissed: false })
  }
}))
