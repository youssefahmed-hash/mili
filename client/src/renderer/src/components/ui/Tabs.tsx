import React from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'horizontal' | 'vertical'
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'horizontal'
}) => {
  if (variant === 'vertical') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 text-start cursor-pointer w-full ${
                isActive
                  ? 'bg-military-primary text-white shadow-lg shadow-blue-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-military-700/40'
              }`}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex border-b border-white/5 w-full gap-2 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-2 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'border-military-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/10'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
