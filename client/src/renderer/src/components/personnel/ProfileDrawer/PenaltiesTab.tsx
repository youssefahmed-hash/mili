import React, { useState, useEffect, useCallback } from 'react'
import {
  getPenaltiesByPersonnel,
  createPenaltyRecord,
  deletePenaltyRecord
} from '../../../api/penalties.api'
import { Table, Column } from '../../ui/Table'
import { Select } from '../../ui/Select'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Plus, Trash2, ShieldAlert, CalendarDays } from 'lucide-react'
import type { Personnel, PenaltyRecord } from '../../../types/personnel'

interface PenaltiesTabProps {
  data: Personnel
  canManage?: boolean
}

const typeOptions = [
  { value: 'إنذار', label: 'إنذار' },
  { value: 'لفت نظر', label: 'لفت نظر' },
  { value: 'خصم', label: 'خصم' },
  { value: 'عقوبة مالية', label: 'عقوبة مالية' },
  { value: 'حبس', label: 'حبس' },
  { value: 'تأنيب', label: 'تأنيب' }
]

export const PenaltiesTab: React.FC<PenaltiesTabProps> = ({ data, canManage = true }) => {
  const [records, setRecords] = useState<PenaltyRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [penaltyType, setPenaltyType] = useState('إنذار')
  const [penaltyDate, setPenaltyDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchPenalties = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPenaltiesByPersonnel(data.id)
      if (res.success) {
        setRecords(res.data)
      }
    } catch {
      setError('فشل تحميل سجل العقوبات')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPenalties()
  }, [fetchPenalties])

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!penaltyDate) {
      setError('الرجاء تحديد تاريخ العقوبة')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await createPenaltyRecord({
        personnelId: data.id,
        penaltyType,
        penaltyDate,
        notes
      })
      if (res.success) {
        setPenaltyDate('')
        setNotes('')
        fetchPenalties()
      } else {
        setError(res.message || 'فشل تسجيل العقوبة')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء تسجيل العقوبة')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف سجل العقوبة؟')) return
    try {
      await deletePenaltyRecord(id)
      fetchPenalties()
    } catch {
      setError('فشل حذف سجل العقوبة')
    }
  }

  const columns: Column<PenaltyRecord>[] = [
    {
      key: 'penaltyType',
      label: 'نوع العقوبة',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
          {row.penaltyType}
        </span>
      )
    },
    {
      key: 'penaltyDate',
      label: 'تاريخ العقوبة',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          {row.penaltyDate ? new Date(row.penaltyDate).toLocaleDateString('ar-EG') : '—'}
        </span>
      )
    },
    { key: 'notes', label: 'ملاحظات', render: (row) => row.notes || '—' },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
              onClick={() => handleDelete(row.id)}
              title="حذف السجل"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 text-start">
      <form
        onSubmit={handleCreate}
        className="glassmorphism p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <Select
            label="نوع العقوبة"
            options={typeOptions}
            value={penaltyType}
            onChange={(e) => setPenaltyType(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="تاريخ العقوبة"
            type="date"
            value={penaltyDate}
            onChange={(e) => setPenaltyDate(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="ملاحظات"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="تفاصيل إضافية..."
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          startIcon={<Plus className="h-4 w-4" />}
        >
          تسجيل عقوبة
        </Button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">سجل العقوبات</h4>
        <Table columns={columns} data={records} loading={loading} />
      </div>
    </div>
  )
}
