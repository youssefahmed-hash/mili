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
import { Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import type { Personnel, Vacation } from '../../../types/personnel'

interface VacationsTabProps {
  data: Personnel
}

export const VacationsTab: React.FC<VacationsTabProps> = ({ data }) => {
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [vacationType, setVacationType] = useState('إجازة سنوية')
  const [startDate, setStartDate] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [notes, setNotes] = useState('')
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

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!startDate || !expectedReturnDate) {
      setError('الرجاء تحديد تاريخ بدء وعودة الإجازة')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await createVacation({
        personnelId: data.id,
        vacationType,
        startDate,
        expectedReturnDate,
        notes,
        status: 'معلقة'
      })
      if (res.success) {
        setStartDate('')
        setExpectedReturnDate('')
        setNotes('')
        fetchVacations()
      } else {
        setError(res.message || 'فشل تسجيل الإجازة')
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'حدث خطأ أثناء تسجيل الإجازة')
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
        onSubmit={handleCreate}
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
        <div>
          <Input
            label="تاريخ بدء الإجازة"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="تاريخ العودة المتوقع"
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
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          startIcon={<Plus className="h-4 w-4" />}
        >
          تسجيل إجازة
        </Button>
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
