import React, { useState, useEffect, useCallback } from 'react'
import { Activity, Stethoscope, Heart, ShieldAlert, CheckCircle } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { PersonnelSelect } from '../ui/PersonnelSelect'
import { Tabs } from '../ui/Tabs'
import { RECORD_TABS, TAB_RANK_MAP } from '../../constants/categories'
import { useAppStore } from '../../store/appStore'
import { getClinicRecords, createClinicRecord, deleteClinicRecord } from '../../api/clinic.api'
import type { ClinicRecord } from '../../types/personnel'

export const ClinicDashboard: React.FC = () => {
  const [records, setRecords] = useState<ClinicRecord[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const { searchQuery } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    personnelId: '',
    examinationType: 'كشف دوري',
    medicalStatus: 'لائق',
    notes: '',
    examinationDate: ''
  })

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getClinicRecords()
      if (res.success) {
        setRecords(res.data)
      }
    } catch {
      setError('فشل تحميل سجلات العيادة')
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
      setError('الرجاء اختيار الفرد المريض')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...formData,
        examinationDate: formData.examinationDate || null
      }
      const res = await createClinicRecord(payload)
      if (res.success) {
        setFormData({
          personnelId: '',
          examinationType: 'كشف دوري',
          medicalStatus: 'لائق',
          notes: '',
          examinationDate: ''
        })
        setIsModalOpen(false)
        fetchRecords()
      } else {
        setError(res.message || 'فشل تسجيل الكشف الطبي')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء تسجيل الكشف')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل الطبي؟')) return
    try {
      await deleteClinicRecord(id)
      fetchRecords()
    } catch {
      setError('فشل حذف السجل الطبي')
    }
  }

  const typeOptions = [
    { value: 'كشف دوري', label: 'كشف دوري' },
    { value: 'كشف رمد', label: 'كشف رمد' },
    { value: 'كشف عظام', label: 'كشف عظام' },
    { value: 'كشف باطنة', label: 'كشف باطنة' },
    { value: 'كشف أسنان', label: 'كشف أسنان' },
    { value: 'استشارة طبية', label: 'استشارة طبية' }
  ]

  const statusOptions = [
    { value: 'لائق', label: 'لائق' },
    { value: 'راحة 24 ساعة', label: 'راحة 24 ساعة' },
    { value: 'راحة 48 ساعة', label: 'راحة 48 ساعة' },
    { value: 'غير لائق مؤقتاً', label: 'غير لائق مؤقتاً' },
    { value: 'غير لائق نهائياً', label: 'غير لائق نهائياً' }
  ]

  const q = (searchQuery || '').trim().toLowerCase()
  const visibleRecords = records.filter(
    (r) =>
      !!r.personnel &&
      TAB_RANK_MAP[activeTab].includes(r.personnel.rank) &&
      (!q ||
        r.personnel.fullName.toLowerCase().includes(q) ||
        r.personnel.militaryId.toLowerCase().includes(q))
  )

  const columns: Column<ClinicRecord>[] = [
    {
      key: 'personnel',
      label: 'الفرد',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{row.personnel?.fullName ?? '—'}</span>
          <span className="text-xs text-gray-400">
            {row.personnel?.rank} / {row.personnel?.militaryId}
          </span>
        </div>
      )
    },
    { key: 'examinationType', label: 'نوع الكشف' },
    {
      key: 'medicalStatus',
      label: 'القرار الطبي',
      render: (row) => {
        const isFit = row.medicalStatus === 'لائق'
        const isRest = row.medicalStatus.includes('راحة')
        return (
          <Badge variant={isFit ? 'success' : isRest ? 'warning' : 'danger'}>
            {row.medicalStatus}
          </Badge>
        )
      }
    },
    { key: 'notes', label: 'الملاحظات الطبية' },
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
          حذف
        </Button>
      )
    }
  ]

  const medicalStats = [
    {
      label: 'كشوفات اليوم',
      value: `${visibleRecords.length} حالة`,
      icon: Stethoscope,
      color: 'text-blue-400'
    },
    {
      label: 'محجوز بالعيادة',
      value: `${visibleRecords.filter((v) => v.medicalStatus.includes('راحة')).length} أفراد`,
      icon: Heart,
      color: 'text-red-400'
    },
    {
      label: 'غير لائق طبيّاً',
      value: `${visibleRecords.filter((v) => v.medicalStatus.includes('غير لائق')).length} فرد`,
      icon: ShieldAlert,
      color: 'text-amber-400'
    },
    {
      label: 'لائق للخدمة',
      value: `${visibleRecords.filter((v) => v.medicalStatus === 'لائق').length} أفراد`,
      icon: CheckCircle,
      color: 'text-emerald-400'
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">العيادة الطبية العسكرية</h2>
          <p className="text-sm text-gray-400">
            متابعة الحالات الطبية، قرارات اللياقة، وسجلات الكشف اليومية للأفراد.
          </p>
        </div>
        <Button
          variant="primary"
          startIcon={<Activity className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          تسجيل كشف طبي جديد
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs tabs={RECORD_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {medicalStats.map((stat, idx) => {
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

      {/* Table Area */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">جدول المراجعات والكشوفات الطبية اليومية</h3>
        <Table columns={columns} data={visibleRecords} loading={loading} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل كشف طبي جديد"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              حفظ الكشف
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <PersonnelSelect
            value={formData.personnelId}
            onChange={(v) => setFormData((p) => ({ ...p, personnelId: v }))}
            ranks={TAB_RANK_MAP[activeTab].join(',')}
          />
          <Select
            label="نوع الكشف الطبي"
            options={typeOptions}
            value={formData.examinationType}
            onChange={(e) => setFormData((p) => ({ ...p, examinationType: e.target.value }))}
          />
          <Select
            label="القرار الطبي"
            options={statusOptions}
            value={formData.medicalStatus}
            onChange={(e) => setFormData((p) => ({ ...p, medicalStatus: e.target.value }))}
          />
          <Input
            label="تاريخ الكشف"
            type="date"
            value={formData.examinationDate}
            onChange={(e) => setFormData((p) => ({ ...p, examinationDate: e.target.value }))}
          />
          <Input
            label="الملاحظات الطبية"
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            placeholder="اكتب الملاحظات..."
          />
        </div>
      </Modal>
    </div>
  )
}
