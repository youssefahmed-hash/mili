import React, { useState, useEffect, useCallback } from 'react'
import { getAllPersonnel } from '../../api/personnel.api'
import {
  getVacations,
  updateVacation,
  bulkCreateVacations
} from '../../api/vacations.api'
import { useAuthStore } from '../../store/authStore'
import { visibleCategories, canManage } from '../../constants/permissions'
import { getRankCategory } from '../../constants/categories'
import { Table, Column } from '../ui/Table'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { CheckCircle, XCircle, Plus, CheckCheck } from 'lucide-react'
import type { Personnel, Vacation } from '../../types/personnel'

const typeOptions = [
  { value: 'إجازة سنوية', label: 'إجازة سنوية' },
  { value: 'إجازة ميدانية', label: 'إجازة ميدانية' },
  { value: 'إجازة مرضية', label: 'إجازة مرضية' },
  { value: 'إجازة عارضة', label: 'إجازة عارضة' },
  { value: 'مأمورية خارجية', label: 'مأمورية خارجية' }
]

const VacationApproval: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const manage = canManage(user)
  const cats = visibleCategories(user)

  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)

  const fetchPending = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await getVacations('معلقة')
      if (res.success) setVacations(res.data)
    } catch {
      setError('فشل تحميل الإجازات المعلقة')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPending()
  }, [fetchPending])

  const toggle = (id: string): void => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const handleApprove = async (id: string): Promise<void> => {
    await updateVacation(id, { status: 'معتمدة' })
    setSelected((s) => s.filter((x) => x !== id))
    fetchPending()
  }

  const handleReject = async (id: string): Promise<void> => {
    await updateVacation(id, { status: 'مرفوضة' })
    setSelected((s) => s.filter((x) => x !== id))
    fetchPending()
  }

  const handleBulkApprove = async (): Promise<void> => {
    for (const id of selected) {
      await updateVacation(id, { status: 'معتمدة' })
    }
    setSelected([])
    fetchPending()
  }

  const columns: Column<Vacation>[] = [
    {
      key: 'select',
      label: '',
      align: 'center',
      render: (row) => (
        <input
          type="checkbox"
          className="accent-military-primary"
          checked={selected.includes(row.id)}
          disabled={!manage}
          onChange={() => toggle(row.id)}
        />
      )
    },
    {
      key: 'name',
      label: 'الاسم',
      render: (row) => <span className="font-bold text-white">{row.personnel?.fullName || '—'}</span>
    },
    { key: 'rank', label: 'الرتبة', render: (row) => row.personnel?.rank || '—' },
    { key: 'type', label: 'نوع الإجازة', render: (row) => row.vacationType },
    {
      key: 'start',
      label: 'تاريخ البدء',
      render: (row) => <span>{row.startDate ? new Date(row.startDate).toLocaleDateString('ar-EG') : '—'}</span>
    },
    {
      key: 'ret',
      label: 'تاريخ العودة',
      render: (row) => (
        <span>{row.expectedReturnDate ? new Date(row.expectedReturnDate).toLocaleDateString('ar-EG') : '—'}</span>
      )
    },
    {
      key: 'actions',
      label: 'التمام',
      align: 'center',
      render: (row) =>
        manage ? (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
              onClick={() => handleApprove(row.id)}
              title="اعتماد الإجازة"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-red-400 hover:bg-red-500/10 rounded"
              onClick={() => handleReject(row.id)}
              title="رفض الإجازة"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-gray-500">بانتظار الاعتماد</span>
        )
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full text-start">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-white">اعتماد الإجازات</h2>
        <p className="text-sm text-gray-400">
          تسجيل الإجازات بشكل جماعي، واعتماد/رفض الإجازات المعلقة. الاعتماد متاح لصف الضباط والضباط والأدمن فقط.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="primary"
          onClick={() => setBulkOpen(true)}
          startIcon={<Plus className="h-4 w-4" />}
        >
          تسجيل إجازة جماعي
        </Button>
        {manage && selected.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleBulkApprove}
            startIcon={<CheckCheck className="h-4 w-4" />}
          >
            اعتماد المحدد ({selected.length})
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <Table columns={columns} data={vacations} loading={loading} />

      {!loading && vacations.length === 0 && !error && (
        <div className="text-center text-gray-500 py-12">لا توجد إجازات معلقة حالياً.</div>
      )}

      {bulkOpen && (
        <BulkVacationModal
          isOpen={bulkOpen}
          onClose={() => setBulkOpen(false)}
          categories={cats}
          onCreated={() => {
            setBulkOpen(false)
            fetchPending()
          }}
        />
      )}
    </div>
  )
}

interface BulkVacationModalProps {
  isOpen: boolean
  onClose: () => void
  categories: string[]
  onCreated: () => void
}

const BulkVacationModal: React.FC<BulkVacationModalProps> = ({
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

  useEffect(() => {
    if (!isOpen) return
    const fetchPersonnel = async (): Promise<void> => {
      try {
        const res = await getAllPersonnel()
        if (res.success && Array.isArray(res.data)) {
          const filtered = res.data.filter((p) => categories.includes(getRankCategory(p.rank)))
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
  }, [isOpen, categories])

  const addDays = (dateStr: string, days: number): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const togglePerson = (id: string): void => {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const q = search.trim().toLowerCase()
  const visible = q
    ? personnel.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.militaryId.toLowerCase().includes(q) ||
          p.rank.toLowerCase().includes(q)
      )
    : personnel

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (selectedIds.length === 0) {
      setError('الرجاء تحديد فرد واحد على الأقل')
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
        notes,
        status: 'معلقة'
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
              visible.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-military-primary/10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="accent-military-primary"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => togglePerson(p.id)}
                  />
                  {p.fullName} ({p.militaryId}) - {p.rank}
                </label>
              ))
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

export default VacationApproval
