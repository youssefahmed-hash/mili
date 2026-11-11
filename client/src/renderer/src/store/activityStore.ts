import { create } from 'zustand'
import { getActivityCount } from '../api/activity.api'

const LAST_SEEN_KEY = 'activity_last_seen'

const loadLastSeen = (): string => {
  const stored = localStorage.getItem(LAST_SEEN_KEY)
  if (stored) return stored
  const now = new Date().toISOString()
  localStorage.setItem(LAST_SEEN_KEY, now)
  return now
}

interface ActivityState {
  /** عدد التحديثات الجديدة بعد آخر زيارة للسجل */
  newCount: number
  lastSeen: string
  fetchNewCount: () => Promise<void>
  markSeen: () => void
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  newCount: 0,
  lastSeen: loadLastSeen(),

  fetchNewCount: async () => {
    try {
      const res = await getActivityCount(get().lastSeen)
      if (res.success) {
        set({ newCount: res.data.count })
      }
    } catch {
      // تجاهل أخطاء الشبكة — الـbadge مش حرج
    }
  },

  markSeen: () => {
    const now = new Date().toISOString()
    localStorage.setItem(LAST_SEEN_KEY, now)
    set({ lastSeen: now, newCount: 0 })
  }
}))
