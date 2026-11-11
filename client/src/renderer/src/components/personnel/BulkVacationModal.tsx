import React, { useState, useEffect } from 'react'
import { getAllPersonnel } from '../../api/personnel.api'
import { bulkCreateVacations } from '../../api/vacations.api'
import { useAuthStore } from '../../store/authStore'
import { getUserScope, isManager } from '../../constants/permissions'
import { getRankCategory } from '../../constants/categories'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import type { Personnel } from '../../types/personnel'
import { addDaysYmd } from '../../utils/vacationDates'
import { matchesAnySearch } from '../../utils/arabicSearch'

const typeOptions = [
  { value: 'إجازة سنوية', label: 'إجازة سنوية' },
  { value: 'إجازة ميدانية', label: 'إجازة ميدانية' },
  { value: 'إجازة مرضية', label: 'إجازة مرضية' },
  { value: 'إجازة عارضة', label: 'إجازة عارضة' },
  { value: 'مأمورية خارجية', label: 'مأمورية خارجية' }
]

interface BulkVacationModalProps {
  isOpen: boolean
  onClose: () => void
  categories: string[]
  onCreated: () => void
}

export const BulkVacationModal: React.FC<BulkVacationModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreated
}) => {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [vacationType, setVacationType] = useState('إجازة سنوية')
  const [startDate, setStartDate] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [cycle, setCycle] = useState('28')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalUser = useAuthStore((s) => s.user)
  const scope = getUserScope(modalUser)
  const isModalAdmin = isManager(modalUser)

  useEffect(() => {
    if (!isOpen) return
    const fetchPersonnel = async (): Promise<void> => {
      try {
        const res = await getAllPersonnel()
        if (res.success && Array.isArray(res.data)) {
          // فلتر الرتبة (موجود) + فلتر النطاق (scope): عمليات → الخط فقط، أفراد → غير الخط، أدمن → الكل
          const filtered = res.data.filter(
            (p) =>
              categories.includes(getRankCategory(p.rank)) &&
              (scope === 'admin' ||
                (scope === 'operations' ? p.unit === 'الخط' : p.unit !== 'الخط'))
          )
          setPersonnel(filtered)
        }
      } catch {
        // ignore
      }
    }
    fetchPersonnel()
    setSelectedIds([])
    setSearch('')
    setStartDate('')
    setExpectedReturnDate('')
    setNotes('')
    setError(null)
  }, [isOpen, categories, scope])

  const addDays = (dateStr: string, days: number): string => addDaysYmd(dateStr, days)

  const togglePerson = (id: string): void => {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const visible = personnel.filter((p) =>
    matchesAnySearch([p.fullName, p.militaryId, p.rank], search)
  )

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (selectedIds.length === 0) {
      setError('الرجاء تحديد فرد واحد على الأقل')
      return
    }
    // عساكر الخط لا يمكن تسجيل إجازة لهم من هنا إلا للأدمن (السيرفر يرفض لغيره)
    const hasLine = !isModalAdmin && personnel.some((p) => selectedIds.includes(p.id) && p.unit === 'الخط')
    if (hasLine) {
      setError('عساكر الخط تتم إدارة إجازاتهم من نظام الخط فقط (الدوران + الطوارئ)')
      return
    }
    if (!startDate) {
      setError('الرجاء تحديد تاريخ بدء الإجازة')
      return
    }
    const returnDate = expectedReturnDate || addDays(startDate, 13)
    setSubmitting(true)
    setError(null)
    try {
      const res = await bulkCreateVacations(selectedIds, {
        vacationType,
        cycle,
        startDate,
        expectedReturnDate: returnDate,
        notes
      })
      if (res.success) {
        onCreated()
      } else {
        setError(res.message || 'فشل تسجيل الإجازات')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء تسجيل الإجازات')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل إجازة جماعي" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-start">
        {scope === 'operations' && (
          <div className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 p-2 rounded-lg">
            يظهر هنا عساكر الخط فقط. إجازات عساكر الخط تدار من نظام الخط (الدوران التلقائي كل 14 يوم + الطوارئ من الأدمن) ولا يمكن تسجيلها من هنا.
          </div>
        )}
        <div>
          <label className="text-sm font-semibold text-gray-300">الأفراد ({selectedIds.length} محدد)</label>
          <Input
            placeholder="ابحث بالاسم أو الرقم العسكري..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-military-900 divide-y divide-white/5">
            {visible.length === 0 ? (
              <div className="p-3 text-sm text-gray-400">لا توجد نتائج</div>
            ) : (
              visible.map((p) => {
                const isLine = p.unit === 'الخط'
                const lineBlocked = isLine && !isModalAdmin
                return (
                  <label
                    key={p.id}
                    title={lineBlocked ? 'عساكر الخط تدار إجازاتهم من نظام الخط فقط' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-military-primary/10 ${lineBlocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      className="accent-military-primary"
                      checked={selectedIds.includes(p.id)}
                      disabled={lineBlocked}
                      onChange={() => togglePerson(p.id)}
                    />
                    {p.fullName} ({p.militaryId}) - {p.rank}
                    {isLine && (
                      <span className="text-[11px] text-yellow-400">(نظام الخط)</span>
                    )}
                  </label>
                )
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="نوع الإجازة"
            options={typeOptions}
            value={vacationType}
            onChange={(e) => setVacationType(e.target.value)}
          />
          <Input
            label="مدة التواجد بالقطاع قبل النزول (يوم)"
            type="number"
            min={1}
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            placeholder="28"
          />
          <Input
            label="تاريخ بدء الإجازة"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (!expectedReturnDate) setExpectedReturnDate(addDays(e.target.value, 13))
            }}
          />
          <Input
            label="تاريخ العودة (تلقائي 14 يوم)"
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </div>

        <Input
          label="ملاحظات / عذر الإجازة"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="اكتب تفاصيل إضافية..."
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            تسجيل الإجازات ({selectedIds.length})
          </Button>
        </div>
      </form>
    </Modal>
  )
}
