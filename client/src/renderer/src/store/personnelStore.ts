import { create } from 'zustand'
import {
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel
} from '../api/personnel.api'
import type { Personnel, ApiResponse } from '../types/personnel'

interface Filters {
  ranks?: string
  rank?: string
  unit?: string
  status?: string
  personnelType?: string
}

interface PersonnelState {
  personnelList: Personnel[]
  selectedPersonnel: Personnel | null
  filters: Filters
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  loading: boolean
  error: string | null

  setFilters: (filters: Partial<Filters>) => void
  clearFilters: () => void
  fetchPersonnelList: (search?: string, page?: number) => Promise<void>
  fetchPersonnelDetail: (id: string) => Promise<void>
  addPersonnel: (formData: FormData) => Promise<boolean>
  editPersonnel: (id: string, formData: FormData) => Promise<boolean>
  removePersonnel: (id: string) => Promise<boolean>
  setSelectedPersonnel: (personnel: Personnel | null) => void
}

export const usePersonnelStore = create<PersonnelState>((set, get) => ({
  personnelList: [],
  selectedPersonnel: null,
  filters: {},
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  },
  loading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }))
  },

  clearFilters: () => {
    const { ranks, personnelType } = get().filters
    const next: Filters = {}
    if (ranks) next.ranks = ranks
    if (personnelType) next.personnelType = personnelType
    set({ filters: next })
  },

  setSelectedPersonnel: (personnel) => {
    set({ selectedPersonnel: personnel })
  },

  fetchPersonnelList: async (search = '', page = 1) => {
    set({ loading: true, error: null })
    try {
      const filters = get().filters
      const params = {
        search,
        page,
        limit: get().pagination.limit,
        ...filters
      }
      const response: ApiResponse<Personnel[]> = await getPersonnel(params)
      if (response.success) {
        set({
          personnelList: response.data,
          pagination: response.pagination || get().pagination
        })
      } else {
        set({ error: response.message || 'فشل تحميل قائمة الأفراد' })
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      set({ error: error.response?.data?.message || 'حدث خطأ أثناء تحميل البيانات' })
    } finally {
      set({ loading: false })
    }
  },

  fetchPersonnelDetail: async (id) => {
    set({ loading: true, error: null })
    try {
      const response: ApiResponse<Personnel> = await getPersonnelById(id)
      if (response.success) {
        set({ selectedPersonnel: response.data })
      } else {
        set({ error: response.message || 'فشل تحميل تفاصيل الفرد' })
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      set({ error: error.response?.data?.message || 'حدث خطأ أثناء تحميل التفاصيل' })
    } finally {
      set({ loading: false })
    }
  },

  addPersonnel: async (formData) => {
    set({ loading: true, error: null })
    try {
      const response: ApiResponse<Personnel> = await createPersonnel(formData)
      if (response.success) {
        return true
      } else {
        set({ error: response.message || 'فشل إضافة الفرد' })
        return false
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      set({ error: error.response?.data?.message || 'حدث خطأ أثناء الإضافة' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  editPersonnel: async (id, formData) => {
    set({ loading: true, error: null })
    try {
      const response: ApiResponse<Personnel> = await updatePersonnel(id, formData)
      if (response.success) {
        if (get().selectedPersonnel?.id === id) {
          await get().fetchPersonnelDetail(id)
        }
        return true
      } else {
        set({ error: response.message || 'فشل تعديل البيانات' })
        return false
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      set({ error: error.response?.data?.message || 'حدث خطأ أثناء التعديل' })
      return false
    } finally {
      set({ loading: false })
    }
  },

  removePersonnel: async (id) => {
    set({ loading: true, error: null })
    try {
      const response: ApiResponse<void> = await deletePersonnel(id)
      if (response.success) {
        if (get().selectedPersonnel?.id === id) {
          set({ selectedPersonnel: null })
        }
        return true
      } else {
        set({ error: response.message || 'فشل حذف الفرد' })
        return false
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      set({ error: error.response?.data?.message || 'حدث خطأ أثناء الحذف' })
      return false
    } finally {
      set({ loading: false })
    }
  }
}))
