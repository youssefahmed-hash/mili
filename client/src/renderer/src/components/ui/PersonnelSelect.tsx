import React, { useEffect, useState } from 'react'
import { getAllPersonnel } from '../../api/personnel.api'
import { getRankCategory } from '../../constants/categories'
import type { Personnel } from '../../types/personnel'

interface PersonnelSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onSelect?: (personnel: Personnel) => void
  error?: string
  required?: boolean
  ranks?: string
  categories?: string[]
}

const labelOf = (p: Personnel): string => `${p.fullName} (${p.militaryId}) - ${p.rank}`

export const PersonnelSelect: React.FC<PersonnelSelectProps> = ({
  label = 'الفرد المعني',
  value,
  onChange,
  error,
  required = true,
  ranks,
  categories,
  onSelect
}) => {
  const [options, setOptions] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchPersonnel = async (): Promise<void> => {
      setLoading(true)
      try {
        const res = await getAllPersonnel(ranks)
        if (res.success && Array.isArray(res.data)) setOptions(res.data)
      } catch {
        // ignore - options stay empty
      } finally {
        setLoading(false)
      }
    }
    fetchPersonnel()
  }, [ranks])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const sel = options.find((p) => p.id === value)
    if (sel) setText(labelOf(sel))
  }, [options, value])

  const q = text.trim().toLowerCase()
  const visible = categories
    ? options.filter((p) => categories.includes(getRankCategory(p.rank)))
    : options
  const filtered = q
    ? visible.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.militaryId.toLowerCase().includes(q) ||
          p.rank.toLowerCase().includes(q)
      )
    : visible

  return (
    <div className="flex flex-col gap-1 text-start">
      {label && (
        <label className="text-sm font-semibold text-gray-300">
          {required ? `${label} *` : label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={text}
          disabled={loading}
          placeholder="ابحث بالاسم أو الرقم العسكري..."
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full bg-military-900 border border-white/10 hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none transition-colors"
        />
        {open && !loading && (
          <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-military-800 border border-white/10 rounded-lg shadow-lg">
            {filtered.length === 0 ? (
              <div className="p-2 text-sm text-gray-400">لا توجد نتائج</div>
            ) : (
              filtered.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(p.id)
                    onSelect?.(p)
                    setText(labelOf(p))
                    setOpen(false)
                  }}
                  className="w-full text-start px-3 py-2 text-sm text-gray-200 hover:bg-military-primary/20"
                >
                  {p.fullName} ({p.militaryId}) - {p.rank}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
