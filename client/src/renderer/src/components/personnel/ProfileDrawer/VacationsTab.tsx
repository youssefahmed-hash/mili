import React, { useState, useEffect, useCallback } from 'react'
import {
  getVacationsByPersonnel,
  createVacation,
  updateVacation,
  deleteVacation
} from '../../../api/vacations.api'
import { Table, Column } from '../../ui/Table'
import { Select } from '../../ui/Select'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Plus, CheckCircle, XCircle, Trash2, Pencil } from 'lucide-react'
import type { Personnel, Vacation } from '../../../types/personnel'

interface VacationsTabProps {
  data: Personnel
}

export const VacationsTab: React.FC<VacationsTabProps> = ({ data }) => {
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [vacationType, setVacationType] = useState('إجازة سنوية')
  const [cycle, setCycle] = useState('28')
  const [startDate, setStartDate] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const addDays = (dateStr: string, days: number): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  // Inclusive leave duration (نزول and طلوع days both count as vacation)
  const leaveDurationDays = (startStr: string, retStr: string): number => {
    if (!startStr || !retStr) return 0
    const diff = Math.round(
      (new Date(retStr).getTime() - new Date(startStr).getTime()) / 86400000
    )
    return Math.max(1, diff + 1)
  }
  const [error, setError] = useState<string | null>(null)

  const fetchVacations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getVacationsByPersonnel(data.id)
      if (res.success) {
        setVacations(res.data)
      }
    } catch {
      setError('فشل تحميل سجل الإجازات')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVacations()
  }, [fetchVacations])

  const resetForm = (): void => {
    setEditingId(null)
    setVacationType('إجازة سنوية')
    setCycle('28')
    setStartDate('')
    setExpectedReturnDate('')
    setNotes('')
  }

  const handleEdit = (row: Vacation): void => {
    setEditingId(row.id)
    setVacationType(row.vacationType)
    setCycle(row.cycle || '28')
    setStartDate(row.startDate ? row.startDate.split('T')[0] : '')
    setExpectedReturnDate(row.expectedReturnDate ? row.expectedReturnDate.split('T')[0] : '')
    setNotes(row.notes || '')
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!startDate) {
      setError('الرجاء تحديد تاريخ بدء الإجازة')
      return
    }
    const returnDate = expectedReturnDate || addDays(startDate, 13)

    setSubmitting(true)
    setError(null)

    try {
      const res = editingId
        ? await updateVacation(editingId, {
            vacationType,
            cycle,
            startDate,
            expectedReturnDate: returnDate,
            notes
          })
        : await createVacation({
            personnelId: data.id,
            vacationType,
            cycle,
            startDate,
            expectedReturnDate: returnDate,
            notes,
            status: 'معلقة'
          })
      if (res.success) {
        resetForm()
        fetchVacations()
      } else {
        setError(res.message || (editingId ? 'فشل تحديث الإجازة' : 'فشل تسجيل الإجازة'))
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'حدث خطأ أثناء حفظ الإجازة')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string): Promise<void> => {
    try {
      const res = await updateVacation(id, { status })
      if (res.success) {
        fetchVacations()
      }
    } catch {
      setError('فشل تحديث حالة الإجازة')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذه الإجازة؟')) return
    try {
      const res = await deleteVacation(id)
      if (res.success) {
        fetchVacations()
      }
    } catch {
      setError('فشل حذف الإجازة')
    }
  }

  const typeOptions = [
    { value: 'إجازة سنوية', label: 'إجازة سنوية' },
    { value: 'إجازة ميدانية', label: 'إجازة ميدانية' },
    { value: 'إجازة مرضية', label: 'إجازة مرضية' },
    { value: 'إجازة عارضة', label: 'إجازة عارضة' },
    { value: 'مأمورية خارجية', label: 'مأمورية خارجية' }
  ]

  const statusBadgeVariants: Record<string, 'success' | 'danger' | 'warning' | 'primary'> = {
    معتمدة: 'success',
    مرفوضة: 'danger',
    معلقة: 'warning',
    نشطة: 'primary'
  }

  const columns: Column<Vacation>[] = [
    { key: 'vacationType', label: 'نوع الإجازة' },
    {
      key: 'cycle',
      label: 'الدورة',
      render: (row) => (row.cycle ? `كل ${row.cycle} يوم` : '—')
    },
    {
      key: 'startDate',
      label: 'تاريخ البدء',
      render: (row) => <span>{new Date(row.startDate).toLocaleDateString('ar-EG')}</span>
    },
    {
      key: 'expectedReturnDate',
      label: 'تاريخ العودة المتوقع',
      render: (row) => <span>{new Date(row.expectedReturnDate).toLocaleDateString('ar-EG')}</span>
    },
    {
      key: 'duration',
      label: 'مدة الإجازة (يوم)',
      render: (row) => {
        const d = leaveDurationDays(row.startDate, row.expectedReturnDate)
        return <span>{d} يوم</span>
      }
    },
    {
      key: 'status',
      label: 'التمام',
      render: (row) => (
        <Badge variant={statusBadgeVariants[row.status] || 'warning'}>{row.status}</Badge>
      )
    },
    { key: 'notes', label: 'الملاحظات' },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {row.status === 'معلقة' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                onClick={() => handleUpdateStatus(row.id, 'معتمدة')}
                title="اعتماد الإجازة"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                onClick={() => handleUpdateStatus(row.id, 'مرفوضة')}
                title="رفض الإجازة"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-blue-400 hover:bg-blue-500/10 rounded"
            onClick={() => handleEdit(row)}
            title="تعديل السجل"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
            onClick={() => handleDelete(row.id)}
            title="حذف السجل"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 text-start">
      <form
        onSubmit={handleSubmit}
        className="glassmorphism p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
      >
        <div className="md:col-span-1">
          <Select
            label="نوع الإجازة"
            options={typeOptions}
            value={vacationType}
            onChange={(e) => setVacationType(e.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="مدة التواجد بالقطاع قبل النزول (يوم)"
            type="number"
            min={1}
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            placeholder="28"
          />
        </div>
        <div>
          <Input
            label="تاريخ بدء الإجازة"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (!editingId) setExpectedReturnDate(addDays(e.target.value, 13))
            }}
          />
        </div>
        <div>
          <Input
            label="تاريخ العودة (تلقائي 14 يوم إجازة)"
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="ملاحظات / عذر الإجازة"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب تفاصيل إضافية..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            startIcon={editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {editingId ? 'تحديث الإجازة' : 'تسجيل إجازة'}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              إلغاء
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">سجلات وموافقات الإجازات</h4>
        <Table columns={columns} data={vacations} loading={loading} />
      </div>
    </div>
  )
}
