import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw,
  Printer,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Move,
  Briefcase,
  Search
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { PersonnelSelect } from '../ui/PersonnelSelect'
import { useLineStore } from '../../store/lineStore'
import { displayRank } from '../../utils/rankDisplay'
import { matchesAnySearch } from '../../utils/arabicSearch'
import { useAuthStore } from '../../store/authStore'
import { canManageLineAssignments } from '../../constants/permissions'
import { getDailyReportPDFUrl } from '../../api/line.api'
import { getPersonnel } from '../../api/personnel.api'
import { LINE_STATUSES } from '../../types/personnel'
import type { Shift, LinePoint, LineAssignment, Personnel } from '../../types/personnel'

// ==================== Status Colors ====================
const STATUS_COLORS: Record<string, string> = {
  'حاضر': '#22c55e',
  'إجازة': '#3b82f6',
  'مرضي': '#ef4444',
  'سجن': '#78716c',
  'مهمة': '#f59e0b',
  'غياب': '#dc2626',
  'منقول': '#6b7280'
}

// ==================== Shift Badge Component ====================
const ShiftBadge: React.FC<{ shift: Shift }> = ({ shift }) => {
  const colorClass =
    shift.order === 1
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : shift.order === 2
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        : 'bg-red-500/20 text-red-400 border border-red-500/30'

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
      {shift.name}
    </span>
  )
}

// ==================== Status Badge Component ====================
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

// ==================== Personnel Card Component ====================
const PersonnelCard: React.FC<{
  assignment: LineAssignment
  canManage: boolean
  onDelete: (id: string) => void
  onTransfer: (assignment: LineAssignment) => void
  /** تغيير حالة العسكري مباشرة من العمليات (بيتزامن مع سجل الفرد) */
  onStatusChange?: (id: string, status: string) => void
  /** للتحديد الجماعي (إجازة / حاضر) */
  selected?: boolean
  onToggleSelect?: (id: string) => void
}> = ({ assignment, canManage, onDelete, onTransfer, onStatusChange, selected, onToggleSelect }) => (
  <div
    className={`glassmorphism p-3 rounded-xl flex items-center justify-between gap-2 transition-all ${
      selected ? 'ring-1 ring-military-accent bg-military-primary/10' : 'hover:border-white/20'
    }`}
  >
    <div className="flex items-center gap-3 min-w-0">
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={!!selected}
          disabled={!canManage}
          onChange={() => onToggleSelect(assignment.id)}
          title="تحديد — بعده تحط المحدد كلهم إجازة أو حاضر"
          className="accent-military-primary h-4 w-4 rounded flex-shrink-0 cursor-pointer"
        />
      )}
      <div className="h-10 w-10 rounded-full bg-military-900 border border-white/10 flex items-center justify-center text-gray-400 text-sm font-bold flex-shrink-0">
        {assignment.personnel?.fullName?.charAt(0) || '?'}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-white truncate">
          {assignment.personnel?.fullName || '—'}
        </span>
        <span className="text-xs text-gray-400">
          {displayRank(assignment.personnel?.rank, assignment.personnel?.personnelType) || ''} • {assignment.personnel?.militaryId || ''}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {canManage && onStatusChange ? (
        <select
          value={assignment.status || 'حاضر'}
          onChange={(e) => onStatusChange(assignment.id, e.target.value)}
          title="تغيير حالة العسكري — بيتزامن مع تمام سجل الفرد"
          className="text-xs font-bold rounded-lg px-2 py-1 bg-military-900 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-military-accent/50"
          style={{
            color: STATUS_COLORS[assignment.status] || '#d1d5db',
            borderColor: `${STATUS_COLORS[assignment.status] || '#6b7280'}66`
          }}
        >
          {!LINE_STATUSES.includes(assignment.status as (typeof LINE_STATUSES)[number]) &&
            assignment.status && (
              <option value={assignment.status} className="bg-military-900 text-white">
                {assignment.status}
              </option>
            )}
          {LINE_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-military-900 text-white">
              {s}
            </option>
          ))}
        </select>
      ) : (
        assignment.status && <StatusBadge status={assignment.status} />
      )}
      {canManage && (
        <Button
          variant="ghost"
          size="sm"
          className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
          onClick={() => onTransfer(assignment)}
          title="نقل العسكري"
        >
          <Move className="h-3.5 w-3.5" />
        </Button>
      )}
      {canManage && (
        <Button
          variant="ghost"
          size="sm"
          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
          onClick={() => onDelete(assignment.id)}
          title="حذف التعيين"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  </div>
)

// ==================== Office Column Component (قسم المكتب) ====================
const OfficeColumn: React.FC<{
  assignments: LineAssignment[]
  canManage: boolean
  onToggle: (items: { id: string; officeDuty: boolean; status?: string }[]) => void
}> = ({ assignments, canManage, onToggle }) => {
  const [search, setSearch] = useState('')
  //emornerôids المحددين — علشان نطبّق حالة على أكتر من واحد مرة واحدة
  const [selected, setSelected] = useState<string[]>([])

  const filtered = assignments.filter((a) => {
    const p = a.personnel
    return matchesAnySearch([p?.fullName, p?.militaryId, p?.rank], search)
  })

  const toggleSelect = (id: string): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((a) => selected.includes(a.id))

  const toggleSelectAll = (): void => {
    setSelected(allVisibleSelected ? [] : filtered.map((a) => a.id))
  }

  /** يطبّق حالة على المحدد — officeDuty بيتحسب من كل شخص على حدة (مش بيتغيّر) */
  const applyStatus = (status: string): void => {
    const ids = new Set(selected)
    const items = filtered
      .filter((a) => ids.has(a.id))
      .map((a) => ({ id: a.id, officeDuty: !!a.officeDuty, status }))
    if (items.length) {
      onToggle(items)
      setSelected([])
    }
  }

  const row = (a: LineAssignment) => (
    <div
      key={a.id}
      className={`rounded-lg p-2 flex items-center justify-between gap-2 border transition-all ${
        selected.includes(a.id)
          ? 'bg-military-primary/20 border-military-accent/50'
          : a.officeDuty
            ? 'bg-sky-500/10 border-sky-500/30'
            : 'bg-military-900/50 border-white/5'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <input
          type="checkbox"
          checked={selected.includes(a.id)}
          disabled={!canManage}
          onChange={() => toggleSelect(a.id)}
          title="تحديد — بعده تحطه إجازة أو حاضر"
          className="accent-military-primary h-4 w-4 rounded flex-shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white truncate">
            {a.personnel?.fullName || '—'}
          </span>
          <span className="text-[10px] text-gray-400 truncate">
            {displayRank(a.personnel?.rank, a.personnel?.personnelType) || ''}
            {a.personnel?.militaryId ? ` • ${a.personnel.militaryId}` : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {canManage && (
          <>
            <button
              type="button"
              onClick={() => onToggle([{ id: a.id, officeDuty: !!a.officeDuty, status: 'إجازة' }])}
              title="اجعله في إجازة"
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                a.status === 'إجازة'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'text-gray-500 hover:text-blue-300 hover:bg-blue-500/10 border-white/10'
              }`}
            >
              إجازة
            </button>
            <button
              type="button"
              onClick={() => onToggle([{ id: a.id, officeDuty: !!a.officeDuty, status: 'حاضر' }])}
              title="رجّعه حاضر"
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                a.status === 'حاضر'
                  ? 'bg-green-500/20 text-green-300 border-green-500/40'
                  : 'text-gray-500 hover:text-green-300 hover:bg-green-500/10 border-white/10'
              }`}
            >
              حاضر
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="glassmorphism rounded-xl border-t-2 border-t-sky-500 flex flex-col">
      <div className="p-3 border-b border-white/5 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Briefcase className="h-3.5 w-3.5" />
            مكتب
            <span className="text-sky-400/70">({filtered.length})</span>
          </span>
          {canManage && filtered.length > 0 && (
            <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="accent-military-primary h-3.5 w-3.5 rounded"
              />
              تحديد الكل ({filtered.length})
            </label>
          )}
        </div>
        <div className="relative w-full sm:w-72 order-last sm:order-none">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم..."
            className="w-full bg-military-900/60 border border-white/10 rounded-lg py-1.5 pr-8 pl-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-military-accent/50"
          />
        </div>
      </div>

      {/* شريط التطبيق على المحدد */}
      {canManage && selected.length > 0 && (
        <div className="px-3 py-2 bg-military-primary/15 border-b border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-white">
            محدد: {selected.length}
          </span>
          <button
            type="button"
            onClick={() => applyStatus('حاضر')}
            className="text-[11px] px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30"
          >
            الكل حاضر
          </button>
          <button
            type="button"
            onClick={() => applyStatus('إجازة')}
            className="text-[11px] px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
          >
            الكل إجازة
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-[11px] px-2 py-1 rounded text-gray-500 hover:text-gray-300"
          >
            ✕ إلغاء التحديد
          </button>
        </div>
      )}

      <div className="p-3 flex flex-col gap-1.5">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-600 text-xs py-6 border border-dashed border-white/10 rounded-lg">
                {assignments.length === 0
                  ? 'مفيش عساكر مكتب في النقطة — اضغط «تعيين أفراد» وسمّيهم «مكتب»'
                  : 'لا نتائج للبحث'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
                {filtered.map(row)}
              </div>
            )}
      </div>
    </div>
  )
}

// ==================== Shift Column Component ====================
const ShiftColumn: React.FC<{
  shift: Shift
  pointId: string
  assignments: LineAssignment[]
  canManage: boolean
  onDelete: (id: string) => void
  onTransfer: (assignment: LineAssignment) => void
  onStatusChange: (id: string, status: string) => void
  onAdd: (shiftId: string, pointId: string) => void
  selectedIds: string[]
  onToggleSelect: (id: string) => void
}> = ({ shift, pointId, assignments, canManage, onDelete, onTransfer, onStatusChange, onAdd, selectedIds, onToggleSelect }) => {
  const shiftBg =
    shift.order === 1
      ? 'border-t-green-500'
      : shift.order === 2
        ? 'border-t-yellow-500'
        : 'border-t-red-500'

  return (
    <div className={`glassmorphism rounded-xl border-t-2 ${shiftBg} flex flex-col`}>
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShiftBadge shift={shift} />
            <span className="text-[10px] text-gray-500">{assignments.length}</span>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-gray-400 hover:text-military-accent"
              onClick={() => onAdd(shift.id, pointId)}
              title="إضافة فرد"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-2 flex flex-col gap-2 flex-1 min-h-[80px]">
        {assignments.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-4">لا يوجد أفراد</div>
        ) : (
          assignments.map((a) => (
            <PersonnelCard
              key={a.id}
              assignment={a}
              canManage={canManage}
              onDelete={onDelete}
              onTransfer={onTransfer}
              onStatusChange={onStatusChange}
              selected={selectedIds.includes(a.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ==================== Assign Modal ====================
/** القيمة الخاصة في قائمة «التعيين» لما يكون العسكري في المكتب */
const OFFICE_DUTY = '__office__'

const AssignModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  points: LinePoint[]
  shifts: Shift[]
  personnelList: Personnel[]
  /** العساكر اللي عندهم تعيين حالي — بيتشالوا من قائمة الاختيار */
  assignedIds?: string[]
  preSelectedPointId?: string
  /** العمالة اللي المستخدم ضغط زرار + فيها — بتتقترح كاختيار أول لكل صف */
  preSelectedShiftId?: string
  onSubmit: (assignments: Partial<LineAssignment>[]) => Promise<boolean>
}> = ({ isOpen, onClose, points, shifts, personnelList, assignedIds = [], preSelectedPointId, preSelectedShiftId, onSubmit }) => {
  const [selectedPointId, setSelectedPointId] = useState('')
  const [defaultDuty, setDefaultDuty] = useState('')
  const [assignments, setAssignments] = useState<
    { personnelId: string; duty: string; status: string; notes: string }[]
  >([])
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')

  // تطبيق الاختيار المسبق عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      setSelectedPointId(preSelectedPointId || '')
      setDefaultDuty(preSelectedShiftId || '')
      setAssignments([])
      setValidationError('')
    }
  }, [isOpen, preSelectedPointId, preSelectedShiftId])

  const linePersonnel = personnelList.filter((p) => p.unit === 'الخط')

  /**
   * عساكر الخط المتاحين لهذا الصف: اللي مش متعلَّم في نفس الفاتورة
   * ولسه مالوش تعيين حالي. متختارش واحد مرتين والسيرفر يرفض بعدين.
   */
  const availableFor = (index: number): Personnel[] => {
    const taken = new Set(assignedIds)
    assignments.forEach((a, i) => {
      if (i !== index && a.personnelId) taken.add(a.personnelId)
    })
    return linePersonnel.filter((p) => !taken.has(p.id))
  }

  // كل العمالات النشطة متاحة للتعيين — العمالة في إجازة النهارده بتتسجل عادي
  const availableShifts = shifts.filter((s) => s.isActive)
  // أول عمالة نشطة — العنصر النائب لصفوف «مكتب» (عمود shiftId مطلوب في القاعدة)
  const fallbackShiftId = availableShifts[0]?.id || ''

  /** خيارات التعيين لكل صف: العمالات الـ3 + «مكتب» */
  const dutyOptions = [
    ...availableShifts.map((s) => ({ value: s.id, label: s.name })),
    { value: OFFICE_DUTY, label: 'مكتب' }
  ]

  const handleAddPersonnel = () => {
    setAssignments([
      ...assignments,
      { personnelId: '', duty: defaultDuty || fallbackShiftId, status: 'حاضر', notes: '' }
    ])
  }

  const handleRemovePersonnel = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index))
  }

  const handlePersonnelChange = (index: number, field: string, value: string) => {
    const updated = [...assignments]
    ;(updated[index] as any)[field] = value
    setAssignments(updated)
  }

  /**
   * تغيير التعيين: عمالة ⇄ مكتب.
   * - «مكتب»  ⇒ الحالة إجازة تلقائيًا ومش بيدخل دوران العمالات
   * - عمالة   ⇒ الحالة ترجع حاضر (كانت اتغيرت بسبب المكتب)
   */
  const handleDutyChange = (index: number, value: string) => {
    const updated = [...assignments]
    const row = { ...updated[index] }
    if (value === OFFICE_DUTY) {
      row.duty = value
      row.status = 'إجازة'
    } else {
      row.duty = value
      if (row.status === 'إجازة') row.status = 'حاضر'
    }
    updated[index] = row
    setAssignments(updated)
  }

  const handleSubmit = async () => {
    setValidationError('')

    if (!selectedPointId) {
      setValidationError('يجب اختيار النقطة')
      return
    }
    if (assignments.length === 0) {
      setValidationError('يجب إضافة فرد واحد على الأقل')
      return
    }
    const hasEmptyPersonnel = assignments.some((a) => !a.personnelId)
    if (hasEmptyPersonnel) {
      setValidationError('يجب اختيار جميع الأفراد')
      return
    }
    const hasEmptyDuty = assignments.some((a) => !a.duty)
    if (hasEmptyDuty || !fallbackShiftId) {
      setValidationError('اختر «التعيين» لكل فرد (عمالة أو مكتب)')
      return
    }

    setSubmitting(true)
    const payload: Partial<LineAssignment>[] = []
    for (const a of assignments) {
      if (!a.personnelId) continue
      const isOffice = a.duty === OFFICE_DUTY
      payload.push({
        personnelId: a.personnelId,
        linePointId: selectedPointId,
        // shiftId مطلوب في القاعدة — صفوف «مكتب» بتاخد أول عمالة كعنصر نائب
        shiftId: isOffice ? fallbackShiftId : a.duty,
        status: isOffice ? 'إجازة' : a.status || 'حاضر',
        officeDuty: isOffice,
        notes: a.notes || null
      })
    }

    const success = await onSubmit(payload)
    setSubmitting(false)
    if (success) {
      setAssignments([])
      setSelectedPointId('')
      setDefaultDuty('')
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تعيين أفراد على الخط"
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button variant="accent" onClick={handleSubmit} loading={submitting}>
            حفظ التعيينات
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="النقطة"
          options={[
            { value: '', label: 'اختر النقطة' },
            ...points.map((p) => ({ value: p.id, label: p.name }))
          ]}
          value={selectedPointId}
          onChange={(e) => setSelectedPointId(e.target.value)}
        />

        {validationError && (
          <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">
            {validationError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* ترويسة الجدول */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-300">الأفراد</span>
              <span className="text-[11px] text-gray-500">
                المتاح {availableFor(-1).length} من {linePersonnel.length} — اكتب أي جزء من الاسم أو
                الرقم
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleAddPersonnel}>
              <Plus className="h-4 w-4 mr-1" /> إضافة فرد
            </Button>
          </div>

          {assignments.length > 0 && (
            <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-semibold text-gray-500">
              <span className="col-span-4">الفرد</span>
              <span className="col-span-3">التعيين</span>
              <span className="col-span-2">الحالة</span>
              <span className="col-span-2">ملاحظات</span>
              <span className="col-span-1" />
            </div>
          )}

          {assignments.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-6 border border-dashed border-white/10 rounded-lg">
              اضغط «إضافة فرد» للبدء
            </div>
          )}

          {assignments.map((a, index) => {
            const isOffice = a.duty === OFFICE_DUTY
            return (
              <div
                key={index}
                className={`grid grid-cols-12 gap-2 items-start rounded-lg p-2 border ${
                  isOffice
                    ? 'bg-sky-500/10 border-sky-500/30'
                    : 'bg-military-900/40 border-white/5'
                }`}
              >
                <div className="col-span-4">
                  <PersonnelSelect
                    label=""
                    required={false}
                    value={a.personnelId}
                    clearOnFocus
                    placeholder="🔍 ابحث بالاسم أو الرقم..."
                    personnel={availableFor(index)}
                    onChange={(v) => handlePersonnelChange(index, 'personnelId', v)}
                  />
                </div>
                <div className="col-span-3">
                  <select
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none ${
                      isOffice
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-bold'
                        : 'bg-military-900 border-white/10 text-white hover:border-white/20 focus:border-military-primary'
                    }`}
                    value={a.duty}
                    onChange={(e) => handleDutyChange(index, e.target.value)}
                  >
                    <option value="" className="bg-military-800">
                      اختر…
                    </option>
                    {dutyOptions.map((o) => (
                      <option key={o.value} value={o.value} className="bg-military-800">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <select
                    className="w-full bg-military-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white hover:border-white/20 focus:border-military-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    value={a.status}
                    disabled={isOffice}
                    title={isOffice ? 'عسكري المكتب حالته إجازة تلقائيًا' : undefined}
                    onChange={(e) => handlePersonnelChange(index, 'status', e.target.value)}
                  >
                    {LINE_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-military-800">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="—"
                    value={a.notes}
                    onChange={(e) => handlePersonnelChange(index, 'notes', e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex justify-end pt-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleRemovePersonnel(index)}
                    title="إزالة الصف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

// ==================== Transfer Modal ====================
const TransferModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  assignment: LineAssignment | null
  points: LinePoint[]
  shifts: Shift[]
  onTransferPoint: (personnelId: string, newPointId: string) => Promise<boolean>
  onTransferShift: (personnelId: string, newShiftId: string) => Promise<boolean>
  onTransferBoth: (personnelId: string, newPointId: string, newShiftId: string) => Promise<boolean>
}> = ({ isOpen, onClose, assignment, points, shifts, onTransferPoint, onTransferShift, onTransferBoth }) => {
  const [newPointId, setNewPointId] = useState('')
  const [newShiftId, setNewShiftId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isOpen && assignment) {
      setNewPointId(assignment.linePointId)
      setNewShiftId(assignment.shiftId)
      setMessage('')
    }
  }, [isOpen, assignment])

  if (!assignment) return null

  const pointChanged = newPointId && newPointId !== assignment.linePointId
  const shiftChanged = newShiftId && newShiftId !== assignment.shiftId

  const handleSubmit = async () => {
    setMessage('')
    if (!pointChanged && !shiftChanged) {
      setMessage('لم يتم تغيير النقطة أو العمالة')
      return
    }
    setSubmitting(true)
    let ok = false
    if (pointChanged && shiftChanged) {
      ok = await onTransferBoth(assignment.personnelId, newPointId, newShiftId)
    } else if (pointChanged) {
      ok = await onTransferPoint(assignment.personnelId, newPointId)
    } else {
      ok = await onTransferShift(assignment.personnelId, newShiftId)
    }
    setSubmitting(false)
    if (ok) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`نقل العسكري: ${assignment.personnel?.fullName || ''}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button variant="accent" onClick={handleSubmit} loading={submitting}>
            تأكيد النقل
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="text-xs text-gray-400 bg-white/5 p-2 rounded-lg">
          الحالي: {assignment.linePoint?.name || ''} • {assignment.shift?.name || ''}
        </div>
        <Select
          label="النقطة الجديدة"
          options={points.filter(p => p.isActive).map((p) => ({ value: p.id, label: p.name }))}
          value={newPointId}
          onChange={(e) => setNewPointId(e.target.value)}
        />
        <Select
          label="العمالة الجديدة"
          options={shifts.filter(s => s.isActive).map((s) => ({ value: s.id, label: s.name }))}
          value={newShiftId}
          onChange={(e) => setNewShiftId(e.target.value)}
        />
        {message && (
          <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">
            {message}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ==================== Main Dashboard ====================
export const LineDailyDashboard: React.FC = () => {
  const {
    shifts,
    points,
    assignments,
    currentLeaveShift,
    loading,
    error,
    fetchShifts,
    fetchPoints,
    fetchAssignments,
    fetchCurrentLeaveShift,
    bulkAddAssignments,
    removeAssignment,
    setOfficeDuty,
    transferPoint,
    transferShift,
    transferBoth,
    clearError
  } = useLineStore()

  const { user } = useAuthStore()
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [transferAssignment, setTransferAssignment] = useState<LineAssignment | null>(null)
  const [preSelectedPointId, setPreSelectedPointId] = useState<string | undefined>(undefined)
  const [preSelectedShiftId, setPreSelectedShiftId] = useState<string | undefined>(undefined)
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set())
  // فلتر الحالة — بيتشغل من كروت الملخص
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  // كل عساكر الخط (جلب مخصص غير مقيد بترقيم الصفحات — مودال التعيين كان يعرض أول 10 فقط)
  const [lineSoldiers, setLineSoldiers] = useState<Personnel[]>([])
  // التحديد الجماعي: Assignment Ids (مش حددي بنقطة — التحديد بيمشي معاه)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const soldiersPromise = getPersonnel({ unit: 'الخط', page: 1, limit: 1000 })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setLineSoldiers(res.data)
      })
      .catch(() => {})
    await Promise.all([
      soldiersPromise,
      fetchShifts(),
      fetchPoints(),
      fetchAssignments(),
      fetchCurrentLeaveShift(today)
    ])
  }, [fetchShifts, fetchPoints, fetchAssignments, fetchCurrentLeaveShift])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData()
  }

  const handlePrintPDF = () => {
    const url = getDailyReportPDFUrl()
    window.open(url, '_blank')
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التعيين؟')) {
      await removeAssignment(id)
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    }
  }

  // تعليم/فكّ «عسكري مكتب» + إجبار الحالة — السيرفر هو اللي بيحسب الحالة المتبقية
  const handleOfficeToggle = async (
    items: { id: string; officeDuty: boolean; status?: string }[]
  ) => {
    const ok = await setOfficeDuty(items)
    if (ok) setSelectedIds([])
  }

  /** تغيير حالة عسكري واحد من الكارت — بيتزامن مع تمام سجل الفرد */
  const handleStatusChange = async (id: string, status: string) => {
    const a = assignments.find((x) => x.id === id)
    if (!a) return
    await handleOfficeToggle([{ id, officeDuty: !!a.officeDuty, status }])
  }

  /** يطبّق حالة على كل المحدد في نقطة واحدة (من أي عمالة فيها) */
  const applySelectedStatus = async (pointId: string, status: string) => {
    const ids = new Set(selectedIds)
    const items = (allByPoint[pointId] || [])
      .filter((a) => ids.has(a.id))
      .map((a) => ({ id: a.id, officeDuty: !!a.officeDuty, status }))
    if (items.length) await handleOfficeToggle(items)
  }

  /** المحدد في نقطة معيّنة (عشان شريط الإجراء يبان تحت هيدر النقطة) */
  const selectedInPoint = (pointId: string): number =>
    (allByPoint[pointId] || []).filter((a) => selectedIds.includes(a.id)).length

  const canManage = canManageLineAssignments(user)

  const handleTransferPoint = async (personnelId: string, newPointId: string) => {
    return await transferPoint(personnelId, newPointId)
  }

  const handleTransferShift = async (personnelId: string, newShiftId: string) => {
    return await transferShift(personnelId, newShiftId)
  }

  const handleTransferBoth = async (personnelId: string, newPointId: string, newShiftId: string) => {
    return await transferBoth(personnelId, newPointId, newShiftId)
  }

  // زر + جوه عمود عمالة: النقطة والعمالة مقترحتين لكل صف جديد
  const handleAddFromPoint = (shiftId: string, pointId: string) => {
    setPreSelectedPointId(pointId)
    setPreSelectedShiftId(shiftId)
    setIsAssignModalOpen(true)
  }

  // زر "تعيين أفراد" العام: النقطة فاضية والعمالة فاضية
  const handleGeneralAssign = () => {
    setPreSelectedPointId(undefined)
    setPreSelectedShiftId(undefined)
    setIsAssignModalOpen(true)
  }

  const togglePoint = (pointId: string) => {
    const newExpanded = new Set(expandedPoints)
    if (newExpanded.has(pointId)) {
      newExpanded.delete(pointId)
    } else {
      newExpanded.add(pointId)
    }
    setExpandedPoints(newExpanded)
  }

  // Group assignments by point and shift
  const visibleAssignments = statusFilter
    ? assignments.filter((a) => (a.status || 'غير محدد') === statusFilter)
    : assignments

  const groupedAssignments: Record<string, Record<string, LineAssignment[]>> = {}
  // عساكر المكتب مش بياخدوا دوران في العمالات — بيتجمعوا لوحدهم
  // (من كل التعيينات مش المتفلترة، عشانفلتر الحالة ما يخفيش حد عن قسم المكتب)
  const officeAssignments: Record<string, LineAssignment[]> = {}
  // كل تعيينات كل نقطة (من غير فلتر الحالة) — عشان العدّاد يبقى ثابت
  const allByPoint: Record<string, LineAssignment[]> = {}
  for (const a of assignments) {
    if (!allByPoint[a.linePointId]) allByPoint[a.linePointId] = []
    allByPoint[a.linePointId].push(a)
    if (a.officeDuty) {
      if (!officeAssignments[a.linePointId]) officeAssignments[a.linePointId] = []
      officeAssignments[a.linePointId].push(a)
    }
  }
  for (const a of visibleAssignments) {
    if (a.officeDuty) continue
    if (!groupedAssignments[a.linePointId]) groupedAssignments[a.linePointId] = {}
    if (!groupedAssignments[a.linePointId][a.shiftId]) groupedAssignments[a.linePointId][a.shiftId] = []
    groupedAssignments[a.linePointId][a.shiftId].push(a)
  }

  // Calculate summary stats — من كل التعيينات (مش المتفلترة) عشان الكروت ما تتغيرش
  const statusCounts: Record<string, number> = {}
  assignments.forEach((a) => {
    const statusName = a.status || 'غير محدد'
    statusCounts[statusName] = (statusCounts[statusName] || 0) + 1
  })

  // الكروت: الإجمالي يشيل الفلتر، وكل حالة ت-toggle فلترها + سكرول للجدول
  const scrollToGrid = (): void => {
    requestAnimationFrame(() =>
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    )
  }
  const toggleStatus = (status: string): void => {
    setStatusFilter((prev) => (prev === status ? null : status))
    scrollToGrid()
  }
  const clearStatus = (): void => {
    setStatusFilter(null)
    scrollToGrid()
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">تعيينات الخط الحالية</h2>
          <p className="text-sm text-gray-400">
            التعيين الحالي لكل عسكري حسب النقاط والعمالات
          </p>
          {currentLeaveShift && (
            <p className="text-xs text-yellow-400 mt-1">
              الدورة {currentLeaveShift.cycleNumber} - العمالة في إجازة: {currentLeaveShift.shiftName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="accent" startIcon={<Plus className="h-4 w-4" />} onClick={handleGeneralAssign}>
              تعيين أفراد
            </Button>
          )}
          <Button variant="secondary" startIcon={<Printer className="h-4 w-4" />} onClick={handlePrintPDF}>
            طباعة PDF
          </Button>
          <Button variant="secondary" startIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh}>
            تحديث
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            ✕
          </Button>
        </div>
      )}

      {/* Summary Cards — كل كارت يعمل فلتر للحالة */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          type="button"
          onClick={clearStatus}
          title="عرض كل التعيينات"
          className={`glassmorphism p-4 rounded-xl text-center transition-all cursor-pointer ${
            statusFilter === null
              ? 'border-military-accent bg-military-primary/10'
              : 'hover:border-military-accent/50 hover:bg-military-primary/5'
          }`}
        >
          <div className="text-2xl font-black text-white">{assignments.length}</div>
          <div className="text-xs text-gray-400 mt-1">إجمالي</div>
        </button>
        {LINE_STATUSES.map((status) => {
          const active = statusFilter === status
          const color = STATUS_COLORS[status] || '#6b7280'
          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              title={`عرض ${status} فقط`}
              className={`glassmorphism p-4 rounded-xl text-center transition-all cursor-pointer ${
                active ? 'bg-military-primary/10 border-military-accent' : 'hover:bg-military-primary/5 hover:border-military-accent/50'
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
        🔗 غيّر حالة أي عسكري من الكارت (أو حدّد كذا واحد واستخدم أزرار الحالة) — التغيير بيتزامن
        مع «تمام» سجل الفرد وكروت «التمامات المؤثرة على القوة» بالصفحة الرئيسية. وأي تعديل في
        تمام الفرد من تاب الأفراد بيظهر هنا فورًا.
      </p>

      {/* Points × Shifts Grid */}
      <div ref={gridRef} className="flex flex-col gap-4 scroll-mt-4">
        {statusFilter && (
          <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
            <span className="text-sm font-bold text-white">
              عرض {statusFilter} فقط ({visibleAssignments.length} من {assignments.length})
            </span>
            <Button variant="ghost" size="sm" onClick={clearStatus}>
              ✕ إلغاء الفلتر
            </Button>
          </div>
        )}

        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-military-accent" />
          تعيينات الخط
        </h3>

        {loading && assignments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
        ) : points.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            لا توجد نقاط مسجلة. أضف نقاطاً من تبويب "إدارة النقاط"
          </div>
        ) : (
          points.filter(p => p.isActive).map((point) => {
            const isExpanded = expandedPoints.has(point.id) || expandedPoints.size === 0
            const pointAssignments = groupedAssignments[point.id] || {}
            const pointAll = allByPoint[point.id] || []
            const officeInPoint = (officeAssignments[point.id] || []).length
            const totalInPoint = pointAll.length
            const showOffice = !!point.hasOfficeDuty

            return (
              <div key={point.id} className="glassmorphism rounded-xl overflow-hidden">
                {/* Point Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => togglePoint(point.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-military-accent/20 flex items-center justify-center">
                      <span className="text-military-accent font-bold text-sm">{point.order || '?'}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{point.name}</h4>
                      {point.description && (
                        <span className="text-xs text-gray-400">{point.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {showOffice && officeInPoint > 0 && (
                      <Badge variant="secondary">{officeInPoint} مكتب</Badge>
                    )}
                    <Badge variant="primary">{totalInPoint} فرد</Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* شريط التحديد الجماعي — بيظهر تحت هيدر النقطة أول ما تحدد حد */}
                {isExpanded && canManage && selectedInPoint(point.id) > 0 && (
                  <div
                    className="mx-4 mb-3 px-3 py-2 bg-military-primary/15 border border-military-accent/30 rounded-lg flex flex-wrap items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs font-bold text-white">
                      محدد في النقطة دي: {selectedInPoint(point.id)}
                    </span>
                    <button
                      type="button"
                      onClick={() => applySelectedStatus(point.id, 'حاضر')}
                      className="text-xs px-2.5 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30"
                    >
                      الكل حاضر
                    </button>
                    <button
                      type="button"
                      onClick={() => applySelectedStatus(point.id, 'إجازة')}
                      className="text-xs px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                    >
                      الكل إجازة
                    </button>
                    <button
                      type="button"
                      onClick={() => applySelectedStatus(point.id, 'غياب')}
                      className="text-xs px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                    >
                      الكل غياب
                    </button>
                    <button
                      type="button"
                      onClick={() => applySelectedStatus(point.id, 'سجن')}
                      className="text-xs px-2.5 py-1 rounded bg-stone-500/20 text-stone-300 border border-stone-500/40 hover:bg-stone-500/30"
                    >
                      الكل سجن
                    </button>
                    <button
                      type="button"
                      onClick={() => applySelectedStatus(point.id, 'مرضي')}
                      className="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                    >
                      الكل مرضي
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="text-xs px-2 py-1 rounded text-gray-400 hover:text-gray-200"
                    >
                      ✕ إلغاء التحديد
                    </button>
                  </div>
                )}

                {/* Shifts Grid */}
                {isExpanded && (
                  <div className="p-4 pt-0 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {shifts.filter(s => s.isActive).map((shift) => (
                        <ShiftColumn
                          key={shift.id}
                          shift={shift}
                          pointId={point.id}
                          assignments={pointAssignments[shift.id] || []}
                          canManage={canManage}
                          onDelete={handleDelete}
                          onTransfer={(a) => setTransferAssignment(a)}
                          onStatusChange={handleStatusChange}
                          onAdd={handleAddFromPoint}
                          selectedIds={selectedIds}
                          onToggleSelect={toggleSelect}
                        />
                      ))}
                    </div>
                    {showOffice && (
                      <OfficeColumn
                        assignments={officeAssignments[point.id] || []}
                        canManage={canManage}
                        onToggle={handleOfficeToggle}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Assign Modal */}
      <AssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        points={points}
        shifts={shifts}
        personnelList={lineSoldiers}
        assignedIds={assignments.map((a) => a.personnelId)}
        preSelectedPointId={preSelectedPointId}
        preSelectedShiftId={preSelectedShiftId}
        onSubmit={bulkAddAssignments}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferAssignment !== null}
        onClose={() => setTransferAssignment(null)}
        assignment={transferAssignment}
        points={points}
        shifts={shifts}
        onTransferPoint={handleTransferPoint}
        onTransferShift={handleTransferShift}
        onTransferBoth={handleTransferBoth}
      />
    </div>
  )
}
