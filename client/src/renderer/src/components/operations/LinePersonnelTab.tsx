import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, FileText, RefreshCw, Search, UserX, Users } from 'lucide-react'
import { getPersonnel } from '../../api/personnel.api'
import { getOpenAbsences } from '../../api/absence.api'
import { useLineStore } from '../../store/lineStore'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Table, Column } from '../ui/Table'
import { ProfileDrawer } from '../personnel/ProfileDrawer/ProfileDrawer'
import { displayRank } from '../../utils/rankDisplay'
import { matchesAnySearch } from '../../utils/arabicSearch'
import { LINE_STATUSES } from '../../types/personnel'
import type { GuardAbsenceRecord, LineAssignment, Personnel } from '../../types/personnel'

// ==================== Status Helpers ====================
const STATUS_COLORS: Record<string, string> = {
  'حاضر': '#22c55e',
  'إجازة': '#3b82f6',
  'مرضي': '#ef4444',
  'سجن': '#78716c',
  'مهمة': '#f59e0b',
  'غياب': '#dc2626',
  'منقول': '#6b7280'
}

/** تمام سجل الفرد → حالة الخط المعروضة (نفس منطق السيرفر) */
const RECORD_STATUS_TO_LINE: Record<string, string> = {
  'غياب': 'غياب',
  'محكمه': 'سجن',
  'مستشفى خارجي': 'مرضي',
  'عرض مستشفى': 'مرضي',
  'اجازه': 'إجازة',
  'ماموريه': 'مهمة',
  'منقول': 'منقول'
}

const lineStatusOf = (person: Personnel, assignment?: LineAssignment): string => {
  if (assignment?.status) return assignment.status
  const record = (person.status || '').trim()
  if (!record || record === 'داخل القطاع') return 'حاضر'
  return RECORD_STATUS_TO_LINE[record] || 'منقول'
}

const fmtDate = (value?: string | Date | null): string =>
  value ? new Date(value).toLocaleDateString('ar-EG') : '—'

/** عدد أيام الغياب حتى اليوم */
const absenceDays = (start?: string | Date | null): number | null => {
  if (!start) return null
  const s = new Date(start).getTime()
  if (Number.isNaN(s)) return null
  return Math.max(1, Math.round((Date.now() - s) / 86400000) + 1)
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = STATUS_COLORS[status] || '#6b7280'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {status}
    </span>
  )
}

type LineSoldierRow = Personnel & {
  lineStatus: string
  assignment?: LineAssignment
  openAbsence?: GuardAbsenceRecord
}

// ==================== Line Personnel Tab ====================
/**
 * تبويب «أفراد الخط» — عساكر قسم الخط فقط (unit = الخط)، مع فتح ملف الفرد
 * بنفس تفاصيل تاب الأفراد (وسجل الغياب لمعرفة غائب من امتى).
 */
export const LinePersonnelTab: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const { assignments, fetchAssignments } = useLineStore()
  const [soldiers, setSoldiers] = useState<Personnel[]>([])
  const [openAbsences, setOpenAbsences] = useState<GuardAbsenceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [drawer, setDrawer] = useState<{ id: string; tab: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // unit = الخط ⇒ عساكر الخط فقط (نفس نطاق تاب العمليات)
      const [personnelRes, absencesRes] = await Promise.all([
        getPersonnel({ unit: 'الخط', page: 1, limit: 1000 }),
        getOpenAbsences().catch(() => null)
      ])
      if (personnelRes.success && Array.isArray(personnelRes.data)) {
        setSoldiers(personnelRes.data)
      } else {
        setError(personnelRes.message || 'فشل تحميل أفراد الخط')
      }
      if (absencesRes?.success && Array.isArray(absencesRes.data)) {
        setOpenAbsences(absencesRes.data)
      }
      await fetchAssignments()
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'حدث خطأ أثناء تحميل أفراد الخط')
    } finally {
      setLoading(false)
    }
  }, [fetchAssignments])

  useEffect(() => {
    load()
  }, [load])

  const assignmentByPersonnel = useMemo(() => {
    const map: Record<string, LineAssignment> = {}
    for (const a of assignments) map[a.personnelId] = a
    return map
  }, [assignments])

  const openAbsenceByPersonnel = useMemo(() => {
    const map: Record<string, GuardAbsenceRecord> = {}
    for (const r of openAbsences) map[r.personnelId] = r
    return map
  }, [openAbsences])

  const decorated: LineSoldierRow[] = useMemo(
    () =>
      soldiers.map((p) => {
        const assignment = assignmentByPersonnel[p.id]
        return {
          ...p,
          lineStatus: lineStatusOf(p, assignment),
          assignment,
          openAbsence: openAbsenceByPersonnel[p.id]
        }
      }),
    [soldiers, assignmentByPersonnel, openAbsenceByPersonnel]
  )

  const searched = useMemo(() => {
    return decorated.filter((p) => matchesAnySearch([p.fullName, p.militaryId, p.rank], search))
  }, [decorated, search])

  const rows = statusFilter ? searched.filter((p) => p.lineStatus === statusFilter) : searched

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of decorated) counts[p.lineStatus] = (counts[p.lineStatus] || 0) + 1
    return counts
  }, [decorated])

  const present = statusCounts['حاضر'] || 0
  const out = decorated.length - present

  const columns: Column<LineSoldierRow>[] = [
    {
      key: 'fullName',
      label: 'الفرد',
      render: (row) => {
        const content = (
          <>
            <div className="h-9 w-9 rounded-full bg-military-900 border border-white/10 flex items-center justify-center text-gray-400 text-sm font-bold flex-shrink-0">
              {row.fullName?.charAt(0) || '?'}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={`text-sm font-bold text-white truncate ${
                  readOnly ? '' : 'group-hover:text-military-accent transition-colors'
                }`}
              >
                {row.fullName || '—'}
              </span>
              <span className="text-[11px] text-gray-400 truncate">
                {displayRank(row.rank, row.personnelType) || ''}
                {row.militaryId ? ` • ${row.militaryId}` : ''}
              </span>
            </div>
          </>
        )
        if (readOnly) {
          return <div className="flex items-center gap-3 text-start">{content}</div>
        }
        return (
          <button
            type="button"
            onClick={() => setDrawer({ id: row.id, tab: 'basic' })}
            className="flex items-center gap-3 text-start group"
            title="فتح ملف الفرد"
          >
            {content}
          </button>
        )
      }
    },
    {
      key: 'assignment',
      label: 'النقطة / العمالة',
      render: (row) =>
        row.assignment ? (
          <div className="flex flex-col">
            <span className="text-xs text-gray-200">{row.assignment.linePoint?.name || '—'}</span>
            <span className="text-[11px] text-gray-500">
              {row.assignment.officeDuty ? 'مكتب' : row.assignment.shift?.name || '—'}
            </span>
          </div>
        ) : (
          <Badge variant="secondary">غير معيّن</Badge>
        )
    },
    {
      key: 'lineStatus',
      label: 'الحالة',
      render: (row) => <StatusBadge status={row.lineStatus} />
    },
    {
      key: 'absence',
      label: 'غائب من',
      render: (row) => {
        if (!row.openAbsence) return <span className="text-xs text-gray-500">—</span>
        const content = (
          <>
            <span className="inline-flex items-center gap-1 text-xs text-red-300">
              <CalendarDays className="h-3.5 w-3.5" />
              {fmtDate(row.openAbsence.startDate)}
            </span>
            <span className="text-[11px] text-gray-500">
              {absenceDays(row.openAbsence.startDate)} يوم
            </span>
          </>
        )
        if (readOnly) {
          return <div className="flex flex-col text-start">{content}</div>
        }
        return (
          <button
            type="button"
            onClick={() => setDrawer({ id: row.id, tab: 'absences' })}
            className="flex flex-col text-start hover:opacity-80"
            title="فتح سجل الغياب"
          >
            {content}
          </button>
        )
      }
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-400 hover:text-military-accent hover:bg-military-primary/10 rounded"
            onClick={() => setDrawer({ id: row.id, tab: 'basic' })}
            title="فتح ملف الفرد"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-400 hover:text-red-300 hover:bg-red-500/10 rounded"
            onClick={() => setDrawer({ id: row.id, tab: 'absences' })}
            title="سجل الغياب"
          >
            <UserX className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // وضع القراءة فقط (شئون مجندين): بدون عمود إجراءات وبدون فتح ملف الفرد
  const visibleColumns = readOnly ? columns.filter((c) => c.key !== 'actions') : columns

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-military-accent" />
            أفراد الخط
          </h2>
          <p className="text-sm text-gray-400">
            {readOnly
              ? 'مكان كل عسكري على الخط (النقطة/العمالة) وتمامه الحالي — عرض للقراءة فقط'
              : 'كل عساكر قسم الخط — افتح ملف أي فرد لمراجعة بياناته وسجل غيابه'}
          </p>
        </div>
        <Button variant="secondary" startIcon={<RefreshCw className="h-4 w-4" />} onClick={load}>
          تحديث
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          title="عرض كل أفراد الخط"
          className={`glassmorphism p-4 rounded-xl text-center transition-all cursor-pointer ${
            statusFilter === null
              ? 'border-military-accent bg-military-primary/10'
              : 'hover:border-military-accent/50 hover:bg-military-primary/5'
          }`}
        >
          <div className="text-2xl font-black text-white">{decorated.length}</div>
          <div className="text-xs text-gray-400 mt-1">إجمالي</div>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'حاضر' ? null : 'حاضر')}
          title="عرض الحاضرين فقط"
          className={`glassmorphism p-4 rounded-xl text-center transition-all cursor-pointer ${
            statusFilter === 'حاضر'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'hover:border-emerald-500/50 hover:bg-emerald-500/5'
          }`}
        >
          <div className="text-2xl font-black text-emerald-400">{present}</div>
          <div className="text-xs text-gray-400 mt-1">حاضر</div>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          title="عرض الكل"
          className="glassmorphism p-4 rounded-xl text-center transition-all cursor-pointer hover:border-red-500/50 hover:bg-red-500/5"
        >
          <div className="text-2xl font-black text-red-400">{out}</div>
          <div className="text-xs text-gray-400 mt-1">خارج</div>
        </button>
        {LINE_STATUSES.filter((s) => s !== 'حاضر').map((status) => {
          const color = STATUS_COLORS[status] || '#6b7280'
          const active = statusFilter === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(active ? null : status)}
              title={`عرض ${status} فقط`}
              className={`glassmorphism p-4 rounded-xl text-center transition-all cursor-pointer ${
                active ? 'bg-military-primary/10' : 'hover:bg-military-primary/5'
              }`}
              style={active ? { borderColor: color } : undefined}
            >
              <div className="text-2xl font-black" style={{ color }}>
                {statusCounts[status] || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">{status}</div>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-gray-500 -mt-3">
        {readOnly
          ? '🔒 عرض للقراءة فقط: مكان كل عسكري على الخط (النقطة/العمالة) وتمامه الحالي.'
          : '🔒 التبويب ده بيعرض عساكر قسم «الخط» فقط. اضغط على اسم الفرد أو أيقونة الملف لفتح ملفه الكامل، وأيقونة الغياب لمراجعة/تسجيل غيابه من تاريخ محدد.'}
      </p>

      {/* Search + filter state */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم العسكري..."
            className="w-full bg-military-900/60 border border-white/10 rounded-lg py-2 pr-9 pl-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-military-accent/50"
          />
        </div>
        {statusFilter && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              عرض {statusFilter} فقط ({rows.length} من {decorated.length})
            </span>
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)}>
              ✕ إلغاء الفلتر
            </Button>
          </div>
        )}
      </div>

      <Table
        columns={visibleColumns}
        data={rows}
        loading={loading}
        emptyText={
          soldiers.length === 0
            ? 'مفيش عساكر مسجلين في قسم الخط'
            : 'لا توجد نتائج مطابقة للبحث أو الفلتر'
        }
      />

      {!readOnly && drawer && (
        <ProfileDrawer
          isOpen
          onClose={() => setDrawer(null)}
          personnelId={drawer.id}
          initialTab={drawer.tab}
        />
      )}
    </div>
  )
}
