import React from 'react'
import { Search } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export const GlobalSearch: React.FC = () => {
  const { searchQuery, setSearchQuery } = useAppStore()

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute start-3 pointer-events-none text-gray-400">
        <Search className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="ابحث بالاسم، الرقم العسكري..."
        className="w-full bg-military-900/60 border border-white/10 hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg ps-10 pe-4 py-2 transition-colors duration-200 outline-none text-start font-medium"
      />
    </div>
  )
}
