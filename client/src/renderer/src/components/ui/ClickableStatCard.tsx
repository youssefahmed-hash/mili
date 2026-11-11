import React from 'react'

export interface ClickableStatCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  /** لون الأيقونة / القيمة — أي كلاس تيلوارد */
  tone?: string
  onClick?: () => void
  hint?: string
  className?: string
}

/**
 * كارت إحصائي قابل للدوس.
 * - مع onClick: يتحول لزر، highlight عند المرور، و bearing aria-label.
 * - بدون onClick: div عادي (لما يكون الكارت معلومة بس).
 */
export const ClickableStatCard: React.FC<ClickableStatCardProps> = ({
  label,
  value,
  icon,
  tone = 'text-white',
  onClick,
  hint,
  className = ''
}) => {
  const base =
    'glassmorphism p-5 rounded-xl flex items-center justify-between gap-3 text-start w-full ' +
    className

  const interactive = onClick
    ? `${base} cursor-pointer hover:border-military-accent/50 hover:bg-military-primary/5 ` +
      'transition-all active:scale-[0.99] focus:outline-none focus-visible:ring-2 ' +
      'focus-visible:ring-military-accent/60'
    : base

  const inner = (
    <>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs text-gray-400 font-semibold truncate">{label}</span>
        <span className={`text-2xl font-black ${tone}`}>{value}</span>
        {hint && <span className="text-[10px] text-gray-500">{hint}</span>}
      </div>
      {icon && (
        <div className={`p-3 bg-military-900/60 rounded-lg shrink-0 ${tone}`}>{icon}</div>
      )}
    </>
  )

  if (!onClick) return <div className={interactive}>{inner}</div>

  return (
    <button type="button" onClick={onClick} className={interactive} title={hint || label}>
      {inner}
    </button>
  )
}