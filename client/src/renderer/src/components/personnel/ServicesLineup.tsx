import React, { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Clock, MapPin, Building2, Radio } from 'lucide-react'
import { getServicesLineup } from '../../api/services.api'
import type { ServicesLineup as Lineup, ServicesLineupItem } from '../../types/personnel'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Table, Column } from '../ui/Table'

const todayStr = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

const nowHHMM = (): string => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const isOnDutyNow = (item: ServicesLineupItem, isToday: boolean): boolean => {
  if (!isToday) return false
  const now = nowHHMM()
  return now >= item.startTime && now <= item.endTime
}

const RosterTable: React.FC<{ rows: ServicesLineupItem[]; isToday: boolean }> = ({
  rows,
  isToday
}) => {
  const columns: Column<ServicesLineupItem>[] = [
    {
      key: 'fullName',
      label: 'الفرد',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{row.fullName}</span>
          <span className="text-xs text-gray-400">
            {row.rank} / {row.militaryId}
          </span>
        </div>
      )
    },
    { key: 'unit', label: 'الوحدة' },
    {
      key: 'time',
      label: 'من - إلى',
      render: (row) => (
        <span className="flex items-center gap-1 text-gray-300">
          <Clock className="h-3.5 w-3.5 text-gray-500" />
          {row.startTime} — {row.endTime}
        </span>
      )
    },
    {
      key: 'location',
      label: 'المكان',
      render: (row) => (
        <span className="flex items-center gap-1 text-gray-300">
          <MapPin className="h-3.5 w-3.5 text-gray-500" />
          {row.location || '—'}
        </span>
      )
    },
    {
      key: 'department',
      label: 'القسم',
      render: (row) => (
        <span className="flex items-center gap-1 text-gray-300">
          <Building2 className="h-3.5 w-3.5 text-gray-500" />
          {row.department || '—'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (row) =>
        isOnDutyNow(row, isToday) ? (
          <Badge variant="success">
            <Radio className="h-3 w-3 ml-1" /> على الخدمة الآن
          </Badge>
        ) : (
          <Badge variant="secondary">مجدول</Badge>
        )
    },
    { key: 'notes', label: 'ملاحظات' }
  ]

  return <Table columns={columns} data={rows} />
}

export const ServicesLineup: React.FC = () => {
  const [date, setDate] = useState(todayStr())
  const [lineup, setLineup] = useState<Lineup | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const userType = user?.userType
  const isMilitary = userType === 'حربية'
  const isInternal = userType === 'داخلية'
  const showMilitary = isAdmin || isMilitary
  const showInternal = isAdmin || isInternal

  const fetchLineup = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getServicesLineup(date)
      if (res.success) {
        setLineup(res.data)
      } else {
        setError(res.message || 'فشل تحميل طابور الخدمات')
      }
    } catch {
      setError('فشل تحميل طابور الخدمات')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLineup()
  }, [fetchLineup])

  const isToday = date === todayStr()

  const section = (
    title: string,
    rows: ServicesLineupItem[],
    accent: string
  ): React.ReactElement => (
    <section className="flex flex-col gap-3">
      <h3
        className={`flex items-center justify-between text-lg font-bold border-b border-white/5 pb-2 ${accent}`}
      >
        <span>{title}</span>
        <Badge variant="secondary">{rows.length} فرد</Badge>
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">لا يوجد خدمات مسجلة لهذا التاريخ.</p>
      ) : (
        <RosterTable rows={rows} isToday={isToday} />
      )}
    </section>
  )

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-white">
            <ClipboardList className="h-6 w-6" /> طابور الخدمات
          </h2>
          <p className="text-sm text-gray-400">
            قائمة المكلفين بالخدمة في التاريخ المحدد، مقسمة حسب النوع (داخلية / حربية).
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Input
            label={isToday ? 'تاريخ اليوم' : 'تاريخ المشاهدة'}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {!isToday && (
            <Button variant="secondary" onClick={() => setDate(todayStr())}>
              اليوم
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {lineup && (
        <div className="grid grid-cols-1 gap-6 w-full">
          {showMilitary && section('خدمات الحربية', lineup.military, 'text-amber-400')}
          {showInternal && section('خدمات الداخلية', lineup.internal, 'text-sky-400')}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">جاري التحميل...</p>}
    </div>
  )
}
