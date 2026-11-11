import { create } from 'zustand'

export type TabType = 'الصفحة الرئيسية' | 'الأفراد' | 'طابور الاجازات' | 'طابور الخدمات' | 'الإعدادات' | 'العيادة' | 'العمليات' | 'الأمن' | 'المستخدمين' | 'تنبيهات الإجازات' | 'سجل التحديثات'

interface AppState {
  activeTab: TabType
  searchQuery: string
  setActiveTab: (tab: TabType) => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'الصفحة الرئيسية',
  searchQuery: '',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query })
}))
