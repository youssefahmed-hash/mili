import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  startIcon,
  endIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-military-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2'

  const variants = {
    primary:
      'bg-military-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 focus:ring-blue-500',
    secondary:
      'bg-military-700 hover:bg-military-600 text-gray-200 border border-white/5 focus:ring-military-500',
    success:
      'bg-military-success hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500',
    danger:
      'bg-military-danger hover:bg-red-600 text-white shadow-lg shadow-red-500/20 focus:ring-red-500',
    accent:
      'bg-military-accent hover:bg-amber-600 text-military-900 font-semibold shadow-lg shadow-amber-500/20 focus:ring-amber-500',
    ghost: 'hover:bg-military-800 text-gray-400 hover:text-white focus:ring-military-600'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ms-1 me-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      <span>{children}</span>
      {!loading && endIcon && <span className="flex-shrink-0">{endIcon}</span>}
    </button>
  )
}
