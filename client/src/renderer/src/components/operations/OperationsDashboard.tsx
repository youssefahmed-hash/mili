import React, { useState, useEffect, useCallback } from 'react'
import { Crosshair, Shield, MapPin, UserCheck, Play, Trash2 } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { PersonnelSelect } from '../ui/PersonnelSelect'
import {
  getOperationsRecords,
  createOperationRecord,
  deleteOperationRecord
} from '../../api/operations.api'
import type { OperationRecord } from '../../types/personnel'

export const OperationsDashboard: React.FC = () => {
  const [records, setRecords] = useState<OperationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    personnelId: '',
    missionName: '',
    location: '',
    status: 'مخططة',
    missionDate: ''
  })

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getOperationsRecords()
      if (res.success) {
        setRecords(res.data)
      }
    } catch {
      setError('فشل تحميل سجلات العمليات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecords()
  }, [fetchRecords])

  const handleSubmit = async (): Promise<void> => {
    if (!formData.personnelId) {
      setError('الرجاء اختيار الفرد المكلف بالمهمة')
      return
    }
    if (!formData.missionName.trim() || !formData.location.trim()) {
      setError('الرجاء إدخال اسم العملية ومكان التحرك')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...formData,
        missionDate: formData.missionDate || null
      }
      const res = await createOperationRecord(payload)
      if (res.success) {
        setFormData({
          personnelId: '',
          missionName: '',
          location: '',
          status: 'مخططة',
          missionDate: ''
        })
        setIsModalOpen(false)
        fetchRecords()
      } else {
        setError(res.message || 'فشل إصدار أمر التحرك')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء إصدار الأمر')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل العملياتي؟')) return
    try {
      await deleteOperationRecord(id)
      fetchRecords()
    } catch {
      setError('فشل حذف السجل')
    }
  }

  const statusOptions = [
    { value: 'مخططة', label: 'مخططة' },
    { value: 'نشطة', label: 'نشطة' },
    { value: 'مكتملة', label: 'مكتملة' }
  ]

  const columns: Column<OperationRecord>[] = [
    {
      key: 'personnel',
      label: 'الفرد المكلف',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{row.personnel?.fullName ?? '—'}</span>
          <span className="text-xs text-gray-400">
            {row.personnel?.rank} / {row.personnel?.militaryId}
          </span>
        </div>
      )
    },
    { key: 'missionName', label: 'اسم العملية / المهمة' },
    { key: 'location', label: 'مكان / جهة التحرك' },
    { key: 'missionDate', label: 'تاريخ البدء' },
    {
      key: 'status',
      label: 'الحالة',
      render: (row) => {
        const isActive = row.status === 'نشطة'
        const isDone = row.status === 'مكتملة'
        return (
          <Badge variant={isActive ? 'danger' : isDone ? 'success' : 'warning'}>{row.status}</Badge>
        )
      }
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          onClick={() => handleDelete(row.id)}
          title="حذف السجل"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ]

  const stats = [
    {
      label: 'إجمالي العمليات',
      value: `${records.length} عملية`,
      icon: UserCheck,
      color: 'text-blue-400'
    },
    {
      label: 'عمليات نشطة',
      value: `${records.filter((r) => r.status === 'نشطة').length} عملية`,
      icon: Shield,
      color: 'text-red-400'
    },
    {
      label: 'مخططة',
      value: `${records.filter((r) => r.status === 'مخططة').length} عملية`,
      icon: MapPin,
      color: 'text-amber-400'
    },
    {
      label: 'مكتملة',
      value: `${records.filter((r) => r.status === 'مكتملة').length} عملية`,
      icon: Crosshair,
      color: 'text-emerald-400'
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">مركز القيادة والعمليات العسكرية</h2>
          <p className="text-sm text-gray-400">
            متابعة الحركات والتحركات العسكرية، وتكليفات المهام الخارجية وتأهب الأفراد.
          </p>
        </div>
        <Button
          variant="accent"
          startIcon={<Play className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          إصدار أمر تحرك عسكري جديد
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="glassmorphism p-5 rounded-xl flex items-center justify-between"
            >
              <div className="flex flex-col gap-1 text-start">
                <span className="text-xs text-gray-400 font-semibold">{stat.label}</span>
                <span className="text-2xl font-black text-white">{stat.value}</span>
              </div>
              <div className={`p-3 bg-military-900/60 rounded-lg ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">
          تحركات القوات والمهام العسكرية الجارية والمخططة
        </h3>
        <Table columns={columns} data={records} loading={loading} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إصدار أمر تحرك عسكري جديد"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button variant="accent" onClick={handleSubmit} loading={submitting}>
              إصدار الأمر
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <PersonnelSelect
            value={formData.personnelId}
            onChange={(v) => setFormData((p) => ({ ...p, personnelId: v }))}
          />
          <Input
            label="اسم العملية / المهمة"
            value={formData.missionName}
            onChange={(e) => setFormData((p) => ({ ...p, missionName: e.target.value }))}
            placeholder="مثال: تأمين قطاع شمالي"
          />
          <Input
            label="مكان / جهة التحرك"
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            placeholder="مثال: المحور الغربي"
          />
          <Input
            label="تاريخ البدء"
            type="date"
            value={formData.missionDate}
            onChange={(e) => setFormData((p) => ({ ...p, missionDate: e.target.value }))}
          />
          <Select
            label="حالة العملية"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
