import React, { useState, useEffect, useCallback } from 'react'
import {
  getRewardsByPersonnel,
  createRewardRecord,
  deleteRewardRecord
} from '../../../api/rewards.api'
import { Table, Column } from '../../ui/Table'
import { Select } from '../../ui/Select'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Plus, Trash2, Award, CalendarDays } from 'lucide-react'
import type { Personnel, RewardRecord } from '../../../types/personnel'

interface RewardsTabProps {
  data: Personnel
  canManage?: boolean
}

const typeOptions = [
  { value: 'شكر وتقدير', label: 'شكر وتقدير' },
  { value: 'نوط امتياز', label: 'نوط امتياز' },
  { value: 'ترقية استثنائية', label: 'ترقية استثنائية' },
  { value: 'مكافأة مالية', label: 'مكافأة مالية' },
  { value: 'شهادة تقدير', label: 'شهادة تقدير' }
]

export const RewardsTab: React.FC<RewardsTabProps> = ({ data, canManage = true }) => {
  const [records, setRecords] = useState<RewardRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rewardType, setRewardType] = useState('شكر وتقدير')
  const [rewardDate, setRewardDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchRewards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getRewardsByPersonnel(data.id)
      if (res.success) {
        setRecords(res.data)
      }
    } catch {
      setError('فشل تحميل سجل المكافآت')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRewards()
  }, [fetchRewards])

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!rewardDate) {
      setError('الرجاء تحديد تاريخ المكافأة')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await createRewardRecord({
        personnelId: data.id,
        rewardType,
        rewardDate,
        notes
      })
      if (res.success) {
        setRewardDate('')
        setNotes('')
        fetchRewards()
      } else {
        setError(res.message || 'فشل تسجيل المكافأة')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء تسجيل المكافأة')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف سجل المكافأة؟')) return
    try {
      await deleteRewardRecord(id)
      fetchRewards()
    } catch {
      setError('فشل حذف سجل المكافأة')
    }
  }

  const columns: Column<RewardRecord>[] = [
    {
      key: 'rewardType',
      label: 'نوع المكافأة',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <Award className="h-3.5 w-3.5 text-emerald-400" />
          {row.rewardType}
        </span>
      )
    },
    {
      key: 'rewardDate',
      label: 'تاريخ المكافأة',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-gray-200">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          {row.rewardDate ? new Date(row.rewardDate).toLocaleDateString('ar-EG') : '—'}
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
            label="نوع المكافأة"
            options={typeOptions}
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="تاريخ المكافأة"
            type="date"
            value={rewardDate}
            onChange={(e) => setRewardDate(e.target.value)}
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
          تسجيل مكافأة
        </Button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">سجل المكافآت</h4>
        <Table columns={columns} data={records} loading={loading} />
      </div>
    </div>
  )
}
