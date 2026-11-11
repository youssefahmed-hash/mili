import React, { useState, useEffect, useCallback } from 'react'
import {
  getAbsenceByPersonnel,
  createAbsence,
  recordAbsenceReturn,
  deleteAbsence
} from '../../../api/absence.api'
import { usePersonnelStore } from '../../../store/personnelStore'
import { Table, Column } from '../../ui/Table'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Plus, Trash2, UserCheck, CalendarDays } from 'lucide-react'
import type { Personnel, GuardAbsenceRecord } from '../../../types/personnel'

interface AbsenceTabProps {
  data: Personnel
  canManage?: boolean
}

const fmt = (d?: string | null): string => (d ? new Date(d).toLocaleDateString('ar-EG') : '—')

/** يحسب عدد الأيام بين تاريخ البداية والعودة */
const daysBetween = (start: string, end?: string | null): number | null => {
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  if (Number.isNaN(s) || Number.isNaN(e)) return null
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}

export const AbsenceTab: React.FC<AbsenceTabProps> = ({ data, canManage = true }) => {
  const [records, setRecords] = useState<GuardAbsenceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [returningId, setReturningId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const fetchList = usePersonnelStore((s) => s.fetchPersonnelList)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAbsenceByPersonnel(data.id)
      if (res.success) setRecords(res.data)
    } catch {
      setError('فشل تحميل سجل الغياب')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const openAbsence = records.find((r) => !r.returnDate) || null

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!startDate) {
      setError('الرجاء تحديد تاريخ بدء الغياب')
      return
    }
    setSubmitting(true)
    try {
      const res = await createAbsence({ personnelId: data.id, startDate, notes: notes || undefined })
      if (res.success) {
        setStartDate('')
        setNotes('')
        setInfo('تم تسجيل الغياب — تم تحويل التمام إلى «غياب»')
        await load()
        await fetchList()
      } else {
        setError(res.message || 'فشل تسجيل الغياب')
      }
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setError(ex.response?.data?.message || 'حدث خطأ أثناء تسجيل الغياب')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async (id: string): Promise<void> => {
    setError(null)
    setInfo(null)
    setReturningId(id)
    try {
      const res = await recordAbsenceReturn(id, { returnDate: returnDate || undefined })
      if (res.success) {
        setReturnDate('')
        setInfo('تم تسجيل العودة — تم تحويل التمام إلى «داخل القطاع»')
        await load()
        await fetchList()
      } else {
        setError(res.message || 'فشل تسجيل العودة')
      }
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setError(ex.response?.data?.message || 'حدث خطأ أثناء تسجيل العودة')
    } finally {
      setReturningId(null)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف سجل الغياب؟')) return
    try {
      await deleteAbsence(id)
      await load()
      await fetchList()
    } catch {
      setError('فشل حذف سجل الغياب')
    }
  }

  const columns: Column<GuardAbsenceRecord>[] = [
    {
      key: 'startDate',
      label: 'تاريخ الغياب',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          {fmt(row.startDate)}
        </span>
      )
    },
    {
      key: 'returnDate',
      label: 'تاريخ العودة',
      render: (row) =>
        row.returnDate ? (
          <span className="text-emerald-300">{fmt(row.returnDate)}</span>
        ) : (
          <Badge variant="danger">لم يرجع بعد</Badge>
        )
    },
    {
      key: 'duration',
      label: 'المدة',
      render: (row) => {
        const d = daysBetween(row.startDate, row.returnDate)
        return <span className="text-gray-300">{d != null ? `${d} يوم` : '—'}</span>
      }
    },
    { key: 'notes', label: 'ملاحظات', render: (row) => row.notes || '—' },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {canManage && !row.returnDate && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded"
              onClick={() => handleReturn(row.id)}
              loading={returningId === row.id}
              title="تسجيل العودة"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          )}
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
      {/* حالة الغياب الحالية */}
      {openAbsence && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-sm">
              غياب مسجل من {fmt(openAbsence.startDate)} — لم يُسجَّل له عودة بعد
            </span>
            <Badge variant="danger">التمام: {data.status}</Badge>
          </div>
          {canManage && (
            <div className="flex items-end gap-2 flex-wrap">
              <Input
                label="تاريخ العودة (اختياري — افتراضياً اليوم)"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
              <Button
                variant="accent"
                onClick={() => handleReturn(openAbsence.id)}
                loading={returningId === openAbsence.id}
                startIcon={<UserCheck className="h-4 w-4" />}
              >
                سجّل العودة
              </Button>
            </div>
          )}
        </div>
      )}

      {/* تسجيل غياب جديد */}
      {canManage && !openAbsence && (
        <form
          onSubmit={handleCreate}
          className="glassmorphism p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <Input
            label="تاريخ بدء الغياب *"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="ملاحظات"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="سبب الغياب أو تفاصيل..."
          />
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            startIcon={<Plus className="h-4 w-4" />}
          >
            تسجيل غياب
          </Button>
        </form>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}
      {info && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg text-sm font-bold">
          {info}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">سجل الغياب</h4>
        <Table columns={columns} data={records} loading={loading} />
      </div>
    </div>
  )
}