import React from 'react'
import { MaskContext } from './maskContext'

interface Option {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
  warning?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  warning,
  className = '',
  id,
  disabled,
  ...props
}) => {
  const masked = React.useContext(MaskContext)
  if (disabled && masked) {
    return (
      <div className="flex flex-col gap-1 w-full text-start">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-gray-300">
            {label}
          </label>
        )}
        <div className="w-full bg-military-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-500 italic">
          مسجل — ليس لديك صلاحية برؤيته
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1 w-full text-start">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-300">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full bg-military-900 border ${error ? 'border-red-500' : warning ? 'border-amber-500/60' : 'border-white/10'} hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg p-2.5 transition-colors duration-200 outline-none cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-military-800 text-gray-200">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
      {!error && warning && <span className="text-xs text-amber-400">{warning}</span>}
    </div>
  )
}
