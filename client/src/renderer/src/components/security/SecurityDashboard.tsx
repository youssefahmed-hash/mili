import React, { useState, useEffect, useCallback } from 'react'
import { Lock, AlertTriangle, KeyRound, Radio, Trash2 } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { PersonnelSelect } from '../ui/PersonnelSelect'
import { Tabs } from '../ui/Tabs'
import { RECORD_TABS, TAB_RANK_MAP } from '../../constants/categories'
import { useAppStore } from '../../store/appStore'
import {
  getSecurityRecords,
  createSecurityRecord,
  deleteSecurityRecord
} from '../../api/security.api'
import type { SecurityRecord } from '../../types/personnel'

export const SecurityDashboard: React.FC = () => {
  const [records, setRecords] = useState<SecurityRecord[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const { searchQuery } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    personnelId: '',
    event: '',
    location: '',
    status: 'قيد المراجعة',
    eventTime: ''
  })

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSecurityRecords()
      if (res.success) {
        setRecords(res.data)
      }
    } catch {
      setError('فشل تحميل البلاغات الأمنية')
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
      setError('الرجاء اختيار الفرد المعني بالبلاغ')
      return
    }
    if (!formData.event.trim() || !formData.location.trim()) {
      setError('الرجاء إدخال وصف الحادثة والموقع')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...formData,
        eventTime: formData.eventTime || null
      }
      const res = await createSecurityRecord(payload)
      if (res.success) {
        setFormData({
          personnelId: '',
          event: '',
          location: '',
          status: 'قيد المراجعة',
          eventTime: ''
        })
        setIsModalOpen(false)
        fetchRecords()
      } else {
        setError(res.message || 'فشل تسجيل البلاغ الأمني')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء تسجيل البلاغ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذا البلاغ الأمني؟')) return
    try {
      await deleteSecurityRecord(id)
      fetchRecords()
    } catch {
      setError('فشل حذف البلاغ')
    }
  }

  const columns: Column<SecurityRecord>[] = [
    {
      key: 'personnel',
      label: 'الفرد المعني',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{row.personnel?.fullName ?? '—'}</span>
          <span className="text-xs text-gray-400">
            {row.personnel?.rank} / {row.personnel?.militaryId}
          </span>
        </div>
      )
    },
    { key: 'event', label: 'الحدث الأمني' },
    { key: 'location', label: 'الموقع / النطاق' },
    { key: 'eventTime', label: 'التوقيت' },
    {
      key: 'status',
      label: 'التمام',
      render: (row) => {
        const isAlert = row.status.includes('الاحتجاز')
        const isSafe = row.status.includes('آمن') || row.status.includes('مكتمل')
        return (
          <Badge variant={isAlert ? 'danger' : isSafe ? 'success' : 'warning'}>{row.status}</Badge>
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
          title="حذف البلاغ"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
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

  const stats = [
    {
      label: 'إجمالي البلاغات',
      value: `${visibleRecords.length} بلاغ`,
      icon: KeyRound,
      color: 'text-emerald-400'
    },
    {
      label: 'بلاغات مفتوحة',
      value: `${visibleRecords.filter((r) => r.status.includes('الاحتجاز') || r.status.includes('قيد')).length} بلاغ`,
      icon: AlertTriangle,
      color: 'text-red-400'
    },
    { label: 'حواجز مراقبة', value: '6 نقاط', icon: Radio, color: 'text-blue-400' },
    {
      label: 'مستوى التشفير',
      value: 'درجة أولي (أ)',
      icon: Lock,
      color: 'text-purple-400'
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

      {/* Category Tabs */}
      <Tabs tabs={RECORD_TABS} activeTab={activeTab} onChange={setActiveTab} />

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
        <h3 className="text-lg font-bold text-white">سجل البلاغات والعمليات الأمنية اليومية</h3>
        <Table columns={columns} data={visibleRecords} loading={loading} />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل بلاغ أمني عاجل"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={handleSubmit} loading={submitting}>
              تسجيل البلاغ
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
            label="التوقيت"
            value={formData.eventTime}
            onChange={(e) => setFormData((p) => ({ ...p, eventTime: e.target.value }))}
            placeholder="مثال: 14:22"
          />
          <Input
            label="التمام"
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
            placeholder="مثال: قيد المراجعة"
          />
        </div>
      </Modal>
    </div>
  )
}
