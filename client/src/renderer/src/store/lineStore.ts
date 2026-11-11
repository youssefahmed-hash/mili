import { create } from 'zustand'
import {
  getShifts,
  getLinePoints,
  createLinePoint,
  updateLinePoint,
  deleteLinePoint,
  getLineAssignments,
  createLineAssignment,
  bulkCreateLineAssignments,
  updateLineAssignment,
  deleteLineAssignment,
  setLineOfficeDuty,
  transferLinePoint,
  transferLineShift,
  transferLineBoth,
  getLeaveCycles,
  getCurrentLeaveCycles,
  initializeLeaveCycle,
  generateNextLeaveCycle,
  getCurrentLeaveShift,
  getDailyReport
} from '../api/line.api'
import type {
  Shift,
  LinePoint,
  LineAssignment,
  LineLeaveCycle,
  LineDailyReport
} from '../types/personnel'

interface LineState {
  // Data
  shifts: Shift[]
  points: LinePoint[]
  assignments: LineAssignment[]
  leaveCycles: LineLeaveCycle[]
  currentReport: LineDailyReport | null
  reportUpdatedAt: string | null
  currentLeaveShift: { shiftId: string; shiftName: string; cycleNumber: number } | null

  // Loading states
  loading: boolean
  error: string | null

  // Shifts actions
  fetchShifts: () => Promise<void>

  // Points actions
  fetchPoints: () => Promise<void>
  addPoint: (data: Partial<LinePoint>) => Promise<boolean>
  editPoint: (id: string, data: Partial<LinePoint>) => Promise<boolean>
  removePoint: (id: string) => Promise<boolean>

  // Assignments actions
  fetchAssignments: (pointId?: string, shiftId?: string) => Promise<void>
  addAssignment: (data: Partial<LineAssignment>) => Promise<boolean>
  bulkAddAssignments: (assignments: Partial<LineAssignment>[]) => Promise<boolean>
  editAssignment: (id: string, data: Partial<LineAssignment>) => Promise<boolean>
  removeAssignment: (id: string) => Promise<boolean>
  setOfficeDuty: (
    items: { id: string; officeDuty: boolean; status?: string }[]
  ) => Promise<boolean>
  transferPoint: (personnelId: string, newPointId: string) => Promise<boolean>
  transferShift: (personnelId: string, newShiftId: string) => Promise<boolean>
  transferBoth: (personnelId: string, newPointId: string, newShiftId: string) => Promise<boolean>

  // Leave cycles actions
  fetchLeaveCycles: () => Promise<void>
  fetchCurrentCycle: () => Promise<void>
  initLeaveCycle: (
    startDate: string,
    shiftId?: string,
    personnelIds?: string[],
    vacationOptions?: {
      vacationType?: string
      cycle?: string
      expectedReturnDate?: string
      notes?: string | null
    }
  ) => Promise<boolean>
  nextLeaveCycle: () => Promise<boolean>
  fetchCurrentLeaveShift: (date: string) => Promise<void>

  // Reports actions
  fetchReport: () => Promise<void>

  // Utils
  clearError: () => void
}

export const useLineStore = create<LineState>((set, get) => ({
  shifts: [],
  points: [],
  assignments: [],
  leaveCycles: [],
  currentReport: null,
  reportUpdatedAt: null,
  currentLeaveShift: null,
  loading: false,
  error: null,

  // ==================== Shifts ====================
  fetchShifts: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getShifts()
      if (res.success) set({ shifts: res.data })
      else set({ error: res.message || 'فشل تحميل العمالات' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل العمالات' })
    } finally {
      set({ loading: false })
    }
  },

  // ==================== Points ====================
  fetchPoints: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getLinePoints()
      if (res.success) set({ points: res.data })
      else set({ error: res.message || 'فشل تحميل النقاط' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل النقاط' })
    } finally {
      set({ loading: false })
    }
  },

  addPoint: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await createLinePoint(data)
      if (res.success) {
        await get().fetchPoints()
        return true
      }
      set({ error: res.message || 'فشل إنشاء النقطة' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء الإنشاء' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  editPoint: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const res = await updateLinePoint(id, data)
      if (res.success) {
        await get().fetchPoints()
        return true
      }
      set({ error: res.message || 'فشل تعديل النقطة' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء التعديل' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  removePoint: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await deleteLinePoint(id)
      if (res.success) {
        await get().fetchPoints()
        return true
      }
      set({ error: res.message || 'فشل حذف النقطة' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء الحذف' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  // ==================== Assignments ====================
  fetchAssignments: async (pointId, shiftId) => {
    set({ loading: true, error: null })
    try {
      const res = await getLineAssignments({ pointId, shiftId })
      if (res.success) set({ assignments: res.data })
      else set({ error: res.message || 'فشل تحميل التعيينات' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل التعيينات' })
    } finally {
      set({ loading: false })
    }
  },

  addAssignment: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await createLineAssignment(data)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل إنشاء التعيين' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء الإنشاء' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  bulkAddAssignments: async (assignments) => {
    set({ loading: true, error: null })
    try {
      const res = await bulkCreateLineAssignments(assignments)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل إنشاء التعيينات' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء الإنشاء' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  editAssignment: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const res = await updateLineAssignment(id, data)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل تعديل التعيين' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء التعديل' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  removeAssignment: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await deleteLineAssignment(id)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل حذف التعيين' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء الحذف' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  setOfficeDuty: async (items) => {
    set({ loading: true, error: null })
    try {
      const res = await setLineOfficeDuty(items)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل تحديث عساكر المكتب' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحديث عساكر المكتب' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  transferPoint: async (personnelId, newPointId) => {
    set({ loading: true, error: null })
    try {
      const res = await transferLinePoint(personnelId, newPointId)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل نقل النقطة' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء النقل' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  transferShift: async (personnelId, newShiftId) => {
    set({ loading: true, error: null })
    try {
      const res = await transferLineShift(personnelId, newShiftId)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل نقل العمالة' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء النقل' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  transferBoth: async (personnelId, newPointId, newShiftId) => {
    set({ loading: true, error: null })
    try {
      const res = await transferLineBoth(personnelId, newPointId, newShiftId)
      if (res.success) {
        await get().fetchAssignments()
        return true
      }
      set({ error: res.message || 'فشل النقل' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء النقل' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  // ==================== Leave Cycles ====================
  fetchLeaveCycles: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getLeaveCycles()
      if (res.success) set({ leaveCycles: res.data })
      else set({ error: res.message || 'فشل تحميل دورات الإجازات' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل الدورات' })
    } finally {
      set({ loading: false })
    }
  },

  fetchCurrentCycle: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getCurrentLeaveCycles()
      if (res.success) set({ leaveCycles: res.data })
      else set({ error: res.message || 'فشل تحميل الدورة الحالية' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل الدورة' })
    } finally {
      set({ loading: false })
    }
  },

  initLeaveCycle: async (startDate, shiftId, personnelIds, vacationOptions) => {
    set({ loading: true, error: null })
    try {
      const res = await initializeLeaveCycle(startDate, shiftId, personnelIds, vacationOptions)
      if (res.success) {
        await get().fetchLeaveCycles()
        return true
      }
      set({ error: res.message || 'فشل تهيئة الدورة' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء التهيئة' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  nextLeaveCycle: async () => {
    set({ loading: true, error: null })
    try {
      const res = await generateNextLeaveCycle()
      if (res.success) {
        await get().fetchLeaveCycles()
        return true
      }
      set({ error: res.message || 'فشل إنشاء الدورة التالية' })
      return false
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء إنشاء الدورة' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  fetchCurrentLeaveShift: async (date) => {
    set({ loading: true, error: null })
    try {
      const res = await getCurrentLeaveShift(date)
      if (res.success) set({ currentLeaveShift: res.data })
      else set({ error: res.message || 'فشل تحميل العمالة في الإجازة' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل العمالة في الإجازة' })
    } finally {
      set({ loading: false })
    }
  },

  // ==================== Reports ====================
  fetchReport: async () => {
    set({ loading: true, error: null })
    try {
      const res = await getDailyReport()
      if (res.success) {
        set({
          currentReport: res.data,
          reportUpdatedAt: new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        })
      } else set({ error: res.message || 'فشل تحميل التقرير' })
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      set({ error: e.response?.data?.message || 'حدث خطأ أثناء تحميل التقرير' })
    } finally {
      set({ loading: false })
    }
  },

  // ==================== Utils ====================
  clearError: () => set({ error: null })
}))
