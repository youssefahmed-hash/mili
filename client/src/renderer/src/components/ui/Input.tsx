import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  startIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, startIcon, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full text-start">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-gray-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute start-3 pointer-events-none text-gray-400">{startIcon}</div>
          )}
          <input
            id={id}
            ref={ref}
            className={`w-full bg-military-900 border ${
              error ? 'border-red-500' : 'border-white/10'
            } hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg ${
              startIcon ? 'ps-10' : 'ps-3'
            } pe-3 py-2.5 transition-colors duration-200 outline-none ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
