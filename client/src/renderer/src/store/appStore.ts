import { create } from 'zustand'

export type TabType = 'الأفراد' | 'العيادة' | 'العمليات' | 'الأمن'

interface AppState {
  activeTab: TabType
  searchQuery: string
  setActiveTab: (tab: TabType) => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'الأفراد',
  searchQuery: '',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query })
}))
