import React, { useEffect, useState, useRef, useCallback } from 'react'
import { getPharmacyDrugs } from '../../api/pharmacy.api'
import type { PharmacyDrug } from '../../types/personnel'

interface DrugSelectProps {
  label?: string
  value: string
  onChange: (drugId: string) => void
  onSelect?: (drug: PharmacyDrug) => void
  /** 숨ج الأصناف اللي خلص مخزونها — صرفاً */
  inStockOnly?: boolean
  error?: string
  required?: boolean
  placeholder?: string
}

/** «بنادول — BND1042» أو «بنادول» لو مفيش كود */
const labelOf = (d: PharmacyDrug): string => (d.code ? `${d.name} — ${d.code}` : d.name)

export const DrugSelect: React.FC<DrugSelectProps> = ({
  label = 'الدواء',
  value,
  onChange,
  onSelect,
  inStockOnly = false,
  error,
  required = false,
  placeholder = 'ابحث بالاسم أو الكود...'
}) => {
  const [options, setOptions] = useState<PharmacyDrug[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const seq = useRef(0)

  // بحث من السيرفر (تطبيع عربي بيتم هناك) — مع debounce بسيط
  const load = useCallback(
    async (term: string): Promise<void> => {
      const id = ++seq.current
      setLoading(true)
      try {
        const res = await getPharmacyDrugs(term || undefined)
        if (id !== seq.current) return
        if (res.success && Array.isArray(res.data)) setOptions(res.data)
      } catch {
        if (id === seq.current) setOptions([])
      } finally {
        if (id === seq.current) setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    load(text.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // مزامنة النص مع الصنف المختار
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!value) {
      setText('')
      return
    }
    const sel = options.find((d) => d.id === value)
    if (sel) setText(labelOf(sel))
  }, [options, value])

  const visible = inStockOnly ? options.filter((d) => d.inStock) : options

  return (
    <div className="flex flex-col gap-1 text-start" ref={boxRef}>
      {label && (
        <label className="text-sm font-semibold text-gray-300">
          {required ? `${label} *` : label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && open && visible.length > 0) {
              e.preventDefault()
              const d = visible[0]
              onChange(d.id)
              onSelect?.(d)
              setText(labelOf(d))
              setOpen(false)
            }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={placeholder}
          className="w-full bg-military-900 border border-white/10 hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none transition-colors"
        />
        {open && !loading && (
          <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-military-800 border border-white/10 rounded-lg shadow-lg">
            {visible.length === 0 ? (
              <div className="p-3 text-sm text-gray-400">
                {inStockOnly ? 'لا توجد أصناف متاحة في المخزون' : 'لا توجد نتائج'}
              </div>
            ) : (
              visible.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(d.id)
                    onSelect?.(d)
                    setText(labelOf(d))
                    setOpen(false)
                  }}
                  className="w-full text-start px-3 py-2 text-sm text-gray-200 hover:bg-military-primary/20 flex items-center justify-between gap-2"
                >
                  <span className="font-semibold">
                    {d.name}
                    {d.code && <span className="text-military-accent ms-1">{d.code}</span>}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {d.outOfStock ? (
                      <span className="text-red-400">خلص</span>
                    ) : (
                      <>متاح {d.stockDisplay?.حبة ?? d.stockPills}</>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
        {open && loading && (
          <div className="absolute z-30 mt-1 w-full bg-military-800 border border-white/10 rounded-lg p-3 text-sm text-gray-400">
            جاري البحث...
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}