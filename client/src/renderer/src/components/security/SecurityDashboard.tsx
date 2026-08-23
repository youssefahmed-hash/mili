import React, { useState } from 'react'
import { Lock, AlertTriangle, KeyRound, Radio } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'

interface SecurityLog {
  id: number
  event: string
  location: string
  person: string
  time: string
  status: string
}

export const SecurityDashboard: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([
    {
      id: 1,
      event: 'تسجيل دخول غير مصرح به للبوابة 3',
      location: 'البوابة الرئيسية الشرقية',
      person: 'شخص مدني بمرافقة فرد',
      time: '14:22',
      status: 'تم الاحتجاز والتحقيق'
    },
    {
      id: 2,
      event: 'تغيير كلمة مرور نظام تشفير المراسلات',
      location: 'غرفة الحاسب الآلي الرئيسي',
      person: 'نقيب / محمد سالم',
      time: '11:05',
      status: 'مكتمل بنجاح'
    },
    {
      id: 3,
      event: 'تسيير دورية تمشيط أمن حدودي داخلية',
      location: 'المنطقة المحيطة بالمخازن',
      person: 'ملازم أول / أحمد فرج',
      time: '09:45',
      status: 'آمن بالكامل'
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    event: '',
    location: '',
    person: '',
    time: '',
    status: 'قيد المراجعة'
  })

  const stats = [
    {
      label: 'تصاريح الدخول النشطة اليوم',
      value: '48 تصريح',
      icon: KeyRound,
      color: 'text-emerald-400'
    },
    {
      label: 'البلاغات الأمنية المفتوحة',
      value: `${logs.filter((l) => l.status.includes('الاحتجاز') || l.status.includes('قيد')).length} بلاغ`,
      icon: AlertTriangle,
      color: 'text-red-400'
    },
    { label: 'حواجز المراقبة الفعّالة', value: '6 نقاط', icon: Radio, color: 'text-blue-400' },
    { label: 'مستوى التشفير والأمان', value: 'درجة أولي (أ)', icon: Lock, color: 'text-purple-400' }
  ]

  const handleSubmit = (): void => {
    if (!formData.event.trim() || !formData.location.trim()) return
    const now = new Date()
    setLogs((prev) => [
      {
        ...formData,
        id: Date.now(),
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
      },
      ...prev
    ])
    setFormData({ event: '', location: '', person: '', time: '', status: 'قيد المراجعة' })
    setIsModalOpen(false)
  }

  const columns: Column<SecurityLog>[] = [
    { key: 'event', label: 'الحدث الأمني' },
    { key: 'location', label: 'الموقع/النطاق' },
    { key: 'person', label: 'الفرد المسؤول / المنفذ' },
    { key: 'time', label: 'التوقيت' },
    {
      key: 'status',
      label: 'الإجراء المتخذ والحالة',
      render: (row) => {
        const isAlert = row.status.includes('الاحتجاز')
        const isSafe = row.status.includes('آمن') || row.status.includes('مكتمل')
        return (
          <Badge variant={isAlert ? 'danger' : isSafe ? 'success' : 'warning'}>{row.status}</Badge>
        )
      }
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">مركز الأمن العسكري والاستخبارات</h2>
          <p className="text-sm text-gray-400">
            رصد الحوادث الأمنية، إدارة تصاريح الدخول، ومراقبة البوابات والحرم العسكري.
          </p>
        </div>
        <Button
          variant="danger"
          startIcon={<AlertTriangle className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          تسجيل بلاغ أمني عاجل
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
        <h3 className="text-lg font-bold text-white">سجل البلاغات والعمليات الأمنية اليومية</h3>
        <Table columns={columns} data={logs} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل بلاغ أمني عاجل"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={handleSubmit}>
              تسجيل البلاغ
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="وصف الحادثة / الحدث الأمني *"
            value={formData.event}
            onChange={(e) => setFormData((p) => ({ ...p, event: e.target.value }))}
            placeholder="مثال: محاولة دخول غير مصرح بها"
          />
          <Input
            label="الموقع / النطاق *"
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            placeholder="مثال: البوابة الرئيسية الشرقية"
          />
          <Input
            label="الفرد المسؤول / المتورط"
            value={formData.person}
            onChange={(e) => setFormData((p) => ({ ...p, person: e.target.value }))}
            placeholder="مثال: نقيب / أحمد سعيد"
          />
          <Input
            label="الحالة"
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
            placeholder="مثال: قيد المراجعة"
          />
        </div>
      </Modal>
    </div>
  )
}
