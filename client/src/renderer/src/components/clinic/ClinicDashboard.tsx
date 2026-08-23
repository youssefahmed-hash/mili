import React, { useState } from 'react'
import { Activity, Stethoscope, Heart, ShieldAlert, CheckCircle } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface ClinicVisit {
  id: number
  name: string
  rank: string
  type: string
  status: string
  notes: string
}

export const ClinicDashboard: React.FC = () => {
  const [visits, setVisits] = useState<ClinicVisit[]>([
    {
      id: 1,
      name: 'أحمد محمد علي',
      rank: 'رائد',
      type: 'كشف دوري',
      status: 'لائق',
      notes: 'مستوفى اللياقة'
    },
    {
      id: 2,
      name: 'خالد سعيد عمر',
      rank: 'ملازم أول',
      type: 'كشف رمد',
      status: 'راحة 48 ساعة',
      notes: 'التهاب بالقرنية'
    },
    {
      id: 3,
      name: 'محمود حسن مصطفى',
      rank: 'عريف',
      type: 'كشف عظام',
      status: 'غير لائق مؤقتاً',
      notes: 'كسر بالقدم اليسرى'
    },
    {
      id: 4,
      name: 'ياسر طارق عبد الله',
      rank: 'مساعد أول',
      type: 'كشف باطنة',
      status: 'لائق',
      notes: 'متابعة ضغط الدم'
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    type: 'كشف دوري',
    status: 'لائق',
    notes: ''
  })

  const medicalStats = [
    {
      label: 'كشوفات اليوم',
      value: `${visits.length} حالة`,
      icon: Stethoscope,
      color: 'text-blue-400'
    },
    {
      label: 'محجوز بالعيادة',
      value: `${visits.filter((v) => v.status.includes('راحة')).length} أفراد`,
      icon: Heart,
      color: 'text-red-400'
    },
    {
      label: 'غير لائق طبيّاً',
      value: `${visits.filter((v) => v.status.includes('غير لائق')).length} فرد`,
      icon: ShieldAlert,
      color: 'text-amber-400'
    },
    {
      label: 'لائق للخدمة',
      value: `${visits.filter((v) => v.status === 'لائق').length} أفراد`,
      icon: CheckCircle,
      color: 'text-emerald-400'
    }
  ]

  const handleSubmit = (): void => {
    if (!formData.name.trim()) return
    setVisits((prev) => [...prev, { ...formData, id: Date.now() }])
    setFormData({ name: '', rank: '', type: 'كشف دوري', status: 'لائق', notes: '' })
    setIsModalOpen(false)
  }

  const columns: Column<ClinicVisit>[] = [
    { key: 'name', label: 'الاسم بالكامل' },
    { key: 'rank', label: 'الرتبة' },
    { key: 'type', label: 'نوع الكشف/العيادة' },
    {
      key: 'status',
      label: 'الحالة الطبية والقرار',
      render: (row) => {
        const isFit = row.status === 'لائق'
        const isRest = row.status.includes('راحة')
        return (
          <Badge variant={isFit ? 'success' : isRest ? 'warning' : 'danger'}>{row.status}</Badge>
        )
      }
    },
    { key: 'notes', label: 'الملاحظات الطبية' }
  ]

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

  const rankOptions = [
    { value: 'جندي', label: 'جندي' },
    { value: 'عريف', label: 'عريف' },
    { value: 'رقيب', label: 'رقيب' },
    { value: 'مساعد', label: 'مساعد' },
    { value: 'مساعد أول', label: 'مساعد أول' },
    { value: 'ملازم', label: 'ملازم' },
    { value: 'ملازم أول', label: 'ملازم أول' },
    { value: 'نقيب', label: 'نقيب' },
    { value: 'رائد', label: 'رائد' },
    { value: 'مقدم', label: 'مقدم' }
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">جدول المراجعات والكشوفات الطبية اليومية</h3>
          <span className="text-xs text-gray-400 font-semibold">
            تاريخ اليوم: {new Date().toLocaleDateString('ar-EG')}
          </span>
        </div>
        <Table columns={columns} data={visits} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل كشف طبي جديد"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              حفظ الكشف
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="اسم الفرد بالكامل"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="مثال: أحمد محمد علي"
          />
          <Select
            label="الرتبة"
            options={rankOptions}
            value={formData.rank}
            onChange={(e) => setFormData((p) => ({ ...p, rank: e.target.value }))}
          />
          <Select
            label="نوع الكشف الطبي"
            options={typeOptions}
            value={formData.type}
            onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
          />
          <Select
            label="القرار الطبي"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
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
