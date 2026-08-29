import React, { useState, useEffect, useCallback } from 'react'
import { Eye, AlertTriangle } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { PersonnelSelect } from '../ui/PersonnelSelect'
import { SecurityProfile } from './SecurityProfile'
import { getAllPersonnel } from '../../api/personnel.api'
import { useAppStore } from '../../store/appStore'
import type { Personnel } from '../../types/personnel'

export const SecurityDashboard: React.FC = () => {
  const { searchQuery } = useAppStore()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerId, setRegisterId] = useState<string | null>(null)

  const fetchPersonnel = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAllPersonnel()
      if (res.success) setPersonnel(res.data)
    } catch {
      setError('فشل تحميل الأفراد')
    } finally {
      setLoading(false)
    }
  }, [])

  const q = (searchQuery || '').trim().toLowerCase()
  const visiblePersonnel = q
    ? personnel.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.militaryId.toLowerCase().includes(q) ||
          (p.rank && p.rank.toLowerCase().includes(q))
      )
    : personnel

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchPersonnel()
  }, [fetchPersonnel])

  const columns: Column<Personnel>[] = [
    {
      key: 'fullName',
      label: 'الاسم',
      render: (row) => <span className="text-gray-100 font-semibold">{row.fullName}</span>
    },
    { key: 'rank', label: 'الرتبة', render: (row) => <span className="text-gray-300">{row.rank}</span> },
    {
      key: 'militaryId',
      label: 'الرقم العسكري',
      render: (row) => <span className="text-gray-300">{row.militaryId}</span>
    },
    { key: 'unit', label: 'القسم', render: (row) => <span className="text-gray-300">{row.unit}</span> },
    {
      key: 'actions',
      label: 'الملف الأمني',
      align: 'center',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setViewId(row.id)} title="عرض الملف الأمني">
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">مركز الأمن العسكري والاستخبارات</h2>
          <p className="text-sm text-gray-400">
            إدارة المواقف الأمنية للأفراد: المحاكمات، الجزئات، تقييم السلوك، والحالة الاجتماعية.
          </p>
        </div>
        <Button
          variant="danger"
          startIcon={<AlertTriangle className="h-4 w-4" />}
          onClick={() => setRegisterOpen(true)}
        >
          تسجيل موقف أمني
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {/* Personnel list */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">قائمة الأفراد — الملف الأمني</h3>
        <Table columns={columns} data={visiblePersonnel} loading={loading} />
      </div>

      {/* Register: pick personnel first */}
      <Modal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="تسجيل موقف أمني — اختيار الفرد"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegisterOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              disabled={!registerId}
              onClick={() => {
                setRegisterOpen(false)
                setViewId(registerId)
              }}
            >
              فتح الملف الأمني
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <PersonnelSelect value={registerId ?? ''} onChange={(v) => setRegisterId(v)} />
          <p className="text-sm text-gray-400">
            اختر الفرد ثم اضغط «فتح الملف الأمني» لتسجيل أو تعديل محاكماته، جزئاته، تقييم سلوكه والحالة
            الاجتماعية.
          </p>
        </div>
      </Modal>

      {viewId && <SecurityProfile personnelId={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}
