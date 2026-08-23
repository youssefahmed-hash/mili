import React, { useState } from 'react'
import { Crosshair, Shield, MapPin, UserCheck, Play } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface Mission {
  id: number
  name: string
  force: string
  location: string
  date: string
  status: string
}

export const OperationsDashboard: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 1,
      name: 'تأمين قطاع ب',
      force: '25 فرد (مجموعة طوارئ)',
      location: 'المحور الغربي',
      date: '2026-08-23',
      status: 'نشطة'
    },
    {
      id: 2,
      name: 'دورية استطلاع حدودية',
      force: '6 أفراد + مدرعة',
      location: 'القطاع الشمالي',
      date: '2026-08-22',
      status: 'مكتملة'
    },
    {
      id: 3,
      name: 'تدريب رماية حيّة',
      force: 'الكتيبة الثالثة',
      location: 'ميدان التدريب الموحد',
      date: '2026-08-24',
      status: 'مخططة'
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    force: '',
    location: '',
    date: '',
    status: 'مخططة'
  })

  const stats = [
    { label: 'القوة الإجمالية بالخدمة', value: '342 فرد', icon: UserCheck, color: 'text-blue-400' },
    { label: 'مكلفون بمهام خارجية', value: '18 فرد', icon: MapPin, color: 'text-amber-400' },
    {
      label: 'حالة الاستعداد القتالي',
      value: 'تأهب كامل (ج)',
      icon: Shield,
      color: 'text-red-400'
    },
    { label: 'النشاط العملياتي اليومي', value: '92%', icon: Crosshair, color: 'text-emerald-400' }
  ]

  const handleSubmit = (): void => {
    if (!formData.name.trim() || !formData.location.trim()) return
    setMissions((prev) => [...prev, { ...formData, id: Date.now() }])
    setFormData({ name: '', force: '', location: '', date: '', status: 'مخططة' })
    setIsModalOpen(false)
  }

  const columns: Column<Mission>[] = [
    { key: 'name', label: 'اسم العملية / المهمة العسكرية' },
    { key: 'force', label: 'القوة المكلفة' },
    { key: 'location', label: 'مكان/جهة التحرك' },
    { key: 'date', label: 'تاريخ البدء/التكليف' },
    {
      key: 'status',
      label: 'حالة العملية',
      render: (row) => {
        const isActive = row.status === 'نشطة'
        const isDone = row.status === 'مكتملة'
        return (
          <Badge variant={isActive ? 'danger' : isDone ? 'success' : 'warning'}>{row.status}</Badge>
        )
      }
    }
  ]

  const statusOptions = [
    { value: 'مخططة', label: 'مخططة' },
    { value: 'نشطة', label: 'نشطة' },
    { value: 'مكتملة', label: 'مكتملة' }
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
        <Table columns={columns} data={missions} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إصدار أمر تحرك عسكري جديد"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="accent" onClick={handleSubmit}>
              إصدار الأمر
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="اسم العملية / المهمة"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="مثال: تأمين قطاع شمالي"
          />
          <Input
            label="القوة المكلفة"
            value={formData.force}
            onChange={(e) => setFormData((p) => ({ ...p, force: e.target.value }))}
            placeholder="مثال: 25 فرد (مجموعة طوارئ)"
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
            value={formData.date}
            onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
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
