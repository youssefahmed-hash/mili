import React, { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Clock, MapPin, Building2, Radio } from 'lucide-react'
import { getServicesLineup } from '../../api/services.api'
import { useAppStore } from '../../store/appStore'
import type { ServicesLineup as Lineup, ServicesLineupItem } from '../../types/personnel'
import { useAuthStore } from '../../store/authStore'
import { isSuperAdmin } from '../../constants/permissions'
import { displayRank } from '../../utils/rankDisplay'
import { matchesAnySearch } from '../../utils/arabicSearch'
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
            {displayRank(row.rank, row.personnelType) || row.rank} / {row.militaryId}
          </span>
        </div>
      )
    },
    { key: 'unit', label: 'القسم' },
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
  // null = كل الأقسام | 'military' | 'internal' — بيتشغل من كروت الملخص
  const [sectorView, setSectorView] = useState<'military' | 'internal' | null>(null)
  const user = useAuthStore((s) => s.user)
  const isSuperAdminUser = isSuperAdmin(user)
  const userType = user?.userType
  const isMilitary = userType === 'حربية'
  const isInternal = userType === 'داخلية'
  // مدير النظام يشوف القسمين؛ غيره يرى قسم نوعه فقط (تشغيل يتبع الحربية)
  const showMilitary = isSuperAdminUser || isMilitary
  const showInternal = isSuperAdminUser || isInternal

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

  const { searchQuery } = useAppStore()
  const matchS = (p: ServicesLineupItem): boolean =>
    matchesAnySearch([p.fullName, p.militaryId], searchQuery)
  const militaryRows = lineup ? lineup.military.filter(matchS) : []
  const internalRows = lineup ? lineup.internal.filter(matchS) : []

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
        <div className="flex flex-col gap-4">
          {/* كروت الملخص — كل كارت يعرض قسمه بس */}
          {(showMilitary || showInternal) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showMilitary && (
                <button
                  type="button"
                  onClick={() => setSectorView(sectorView === 'military' ? null : 'military')}
                  title={sectorView === 'military' ? 'عرض كل الأقسام' : 'عرض خدمات الحربية'}
                  className={`glassmorphism p-4 rounded-xl flex items-center justify-between gap-3 w-full text-start transition-all cursor-pointer ${
                    sectorView === 'military'
                      ? 'border-military-accent bg-military-primary/10'
                      : 'hover:border-military-accent/50 hover:bg-military-primary/5'
                  }`}
                >
                  <span className="text-sm font-bold text-amber-400">خدمات الحربية</span>
                  <span className="text-2xl font-black text-amber-400">{militaryRows.length}</span>
                </button>
              )}
              {showInternal && (
                <button
                  type="button"
                  onClick={() => setSectorView(sectorView === 'internal' ? null : 'internal')}
                  title={sectorView === 'internal' ? 'عرض كل الأقسام' : 'عرض خدمات الداخلية'}
                  className={`glassmorphism p-4 rounded-xl flex items-center justify-between gap-3 w-full text-start transition-all cursor-pointer ${
                    sectorView === 'internal'
                      ? 'border-military-accent bg-military-primary/10'
                      : 'hover:border-military-accent/50 hover:bg-military-primary/5'
                  }`}
                >
                  <span className="text-sm font-bold text-sky-400">خدمات الداخلية</span>
                  <span className="text-2xl font-black text-sky-400">{internalRows.length}</span>
                </button>
              )}
            </div>
          )}

          {sectorView && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSectorView(null)}>
                ✕ عرض كل الأقسام
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 w-full">
            {showMilitary && (sectorView === null || sectorView === 'military') &&
              section('خدمات الحربية', militaryRows, 'text-amber-400')}
            {showInternal && (sectorView === null || sectorView === 'internal') &&
              section('خدمات الداخلية', internalRows, 'text-sky-400')}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">جاري التحميل...</p>}
    </div>
  )
}
