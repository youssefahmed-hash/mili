import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl' | 'full'
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const sizeClasses = {
    md: 'w-[400px]',
    lg: 'w-[600px]',
    xl: 'w-[800px]',
    full: 'w-full'
  }

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute top-0 bottom-0 left-0 bg-military-800 border-r border-white/5 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 max-w-full ${sizeClasses[size]} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-military-900/50">
          <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 rounded-full">
            <X className="h-5 w-5 text-gray-400 hover:text-white" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-gray-300">{children}</div>
      </div>
    </div>
  )
}
