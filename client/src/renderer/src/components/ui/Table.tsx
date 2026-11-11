import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string
  label: string
  render?: (row: T, index: number) => React.ReactNode
  align?: 'start' | 'center' | 'end'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  /** خلايا أضيق — للجداول جوّه المودالات الصغيرة */
  dense?: boolean
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  loading = false,
  emptyText = 'لا توجد بيانات متاحة حالياً',
  dense = false
}) => {
  const getAlignClass = (align?: 'start' | 'center' | 'end'): string => {
    if (align === 'center') return 'text-center'
    if (align === 'end') return 'text-end'
    return 'text-start'
  }

  const cell = dense ? 'px-2.5 py-2' : 'px-6 py-4'
  const head = dense ? 'px-2.5 py-2.5 text-xs' : 'px-6 py-4'
  const bodyText = dense ? 'text-xs' : 'text-sm'

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-white/5 bg-military-800/40">
      <table className="w-full border-collapse text-start">
        <thead>
          <tr className={`border-b border-white/5 bg-military-800/80 text-gray-400 ${dense ? 'text-xs' : 'text-sm'} font-semibold`}>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                className={`${head} font-bold ${getAlignClass(col.align)}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y divide-white/5 text-gray-300 ${bodyText}`}>
          {loading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className={cell}>
                    <div className="h-4 bg-military-700 rounded w-3/4 mx-auto"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`${cell} py-8 text-center text-gray-500`}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row: Record<string, unknown>, rIdx) => (
              <tr
                key={String(row.id ?? rIdx)}
                className="hover:bg-military-700/30 transition-colors"
              >
                {columns.map((col, cIdx) => (
                  <td key={col.key || cIdx} className={`${cell} ${getAlignClass(col.align)}`}>
                    {col.render ? col.render(row, rIdx) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
