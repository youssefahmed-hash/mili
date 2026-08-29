import React, { useState, useEffect, useCallback } from 'react'
import {
  getServicesByPersonnel,
  createServiceRecord,
  deleteServiceRecord
} from '../../../api/services.api'
import { Table, Column } from '../../ui/Table'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Plus, Trash2, Clock, MapPin, Building2 } from 'lucide-react'
import type { Personnel, ServiceRecord } from '../../../types/personnel'

interface ServicesTabProps {
  data: Personnel
  canManage?: boolean
}

export const ServicesTab: React.FC<ServicesTabProps> = ({ data, canManage = true }) => {
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serviceDay, setServiceDay] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getServicesByPersonnel(data.id)
      if (res.success) {
        setRecords(res.data)
      }
    } catch {
      setError('فشل تحميل سجل الخدمات')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchServices()
  }, [fetchServices])

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!serviceDay) {
      setError('الرجاء تحديد يوم الخدمة')
      return
    }
    if (!startTime || !endTime) {
      setError('الرجاء تحديد من ساعة وإلى ساعة الخدمة')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await createServiceRecord({
        personnelId: data.id,
        serviceDay,
        startTime,
        endTime,
        location,
        department,
        notes
      })
      if (res.success) {
        setServiceDay('')
        setStartTime('')
        setEndTime('')
        setLocation('')
        setDepartment('')
        setNotes('')
        fetchServices()
      } else {
        setError(res.message || 'فشل تسجيل الخدمة')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء تسجيل الخدمة')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف سجل الخدمة؟')) return
    try {
      await deleteServiceRecord(id)
      fetchServices()
    } catch {
      setError('فشل حذف سجل الخدمة')
    }
  }

  const columns: Column<ServiceRecord>[] = [
    {
      key: 'serviceDay',
      label: 'يوم الخدمة',
      render: (row) => (
        <span className="text-gray-200">
          {row.serviceDay ? new Date(row.serviceDay).toLocaleDateString('ar-EG') : '—'}
        </span>
      )
    },
    {
      key: 'period',
      label: 'من ساعة ـ إلى ساعة',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {row.startTime} ــ {row.endTime}
        </span>
      )
    },
    {
      key: 'location',
      label: 'مكان الخدمة',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {row.location || '—'}
        </span>
      )
    },
    {
      key: 'department',
      label: 'القسم المحلق به',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <Building2 className="h-3.5 w-3.5 text-gray-400" />
          {row.department || '—'}
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
        className="glassmorphism p-4 rounded-xl grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
      >
        <div>
          <Input
            label="يوم الخدمة"
            type="date"
            value={serviceDay}
            onChange={(e) => setServiceDay(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="من ساعة"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="إلى ساعة"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="مكان الخدمة"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثال: معسكر الزرقاء"
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="القسم المحلق به"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="مثال: إدارة الإمداد"
          />
        </div>
        <div className="md:col-span-1">
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
          تسجيل خدمة
        </Button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">سجل الخدمات المنفذة</h4>
        <Table columns={columns} data={records} loading={loading} />
      </div>
    </div>
  )
}
