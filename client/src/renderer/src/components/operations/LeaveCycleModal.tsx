import React, { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useLineStore } from '../../store/lineStore'
import { addDaysYmd } from '../../utils/vacationDates'
import { matchesAnySearch } from '../../utils/arabicSearch'

export const LeaveCycleModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const {
    leaveCycles,
    shifts,
    assignments,
    error: storeError,
    fetchLeaveCycles,
    fetchShifts,
    fetchAssignments,
    initLeaveCycle,
    nextLeaveCycle
  } = useLineStore()

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [shiftId, setShiftId] = useState('')
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [vacationType, setVacationType] = useState('إجازة سنوية')
  const [cycle, setCycle] = useState('14')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [soldierSearch, setSoldierSearch] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchLeaveCycles()
      fetchShifts()
      fetchAssignments()
      setMessage('')
    }
  }, [isOpen, fetchLeaveCycles, fetchShifts, fetchAssignments])

  // عساكر العمالة المختارة — كلهم محددين افتراضيًا للنزول
  const shiftAssignments = assignments.filter((a) => a.shiftId === shiftId)

  // بحث داخل عساكر العمالة دي (الاسم / الرقم العسكري / الرتبة)
  const visibleSoldiers = shiftAssignments.filter((a) => {
    const p = a.personnel
    return matchesAnySearch([p?.fullName, p?.militaryId, p?.rank], soldierSearch)
  })

  const allVisibleChecked =
    visibleSoldiers.length > 0 && visibleSoldiers.every((a) => checkedIds.includes(a.personnelId))
  const appliedKey = useRef('')
  useEffect(() => {
    const key = `${shiftId}:${shiftAssignments.length}`
    if (shiftId && appliedKey.current !== key) {
      appliedKey.current = key
      setCheckedIds(shiftAssignments.map((a) => a.personnelId))
    }
    if (!shiftId) {
      appliedKey.current = ''
      setCheckedIds([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftId, assignments])

  const toggleSoldier = (pid: string) => {
    setCheckedIds((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]))
  }

  const handleInitialize = async () => {
    if (!startDate) return
    if (!shiftId) {
      setMessage('يجب اختيار العمالة التي ستبدأ الإجازة')
      return
    }
    setMessage('')
    setSubmitting(true)
    await initLeaveCycle(startDate, shiftId, checkedIds, {
      vacationType,
      cycle,
      expectedReturnDate: expectedReturnDate || undefined,
      notes: notes || null
    })
    await fetchAssignments()
    setSubmitting(false)
  }

  const handleGenerateNext = async () => {
    setSubmitting(true)
    await nextLeaveCycle()
    await fetchAssignments()
    setSubmitting(false)
  }

  const shiftName = (order: number) =>
    order === 1 ? 'العماله الأولى' : order === 2 ? 'العماله الثانية' : 'العماله الثالثة'

  const shiftColor = (order: number) =>
    order === 1 ? 'text-green-400' : order === 2 ? 'text-yellow-400' : 'text-red-400'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="دورة الإجازات"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* بدء إجازة عمالة — نموذج موحد: العمالة + العساكر + بيانات الإجازة */}
        <div className="glassmorphism p-4 rounded-xl">
          <h4 className="text-sm font-bold text-military-accent mb-3">تسجيل إجازة خط (دورة جديدة 14 يوم)</h4>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-40">
              <Select
                label="العمالة التي ستبدأ الإجازة"
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                options={[
                  { value: '', label: 'اختر العمالة' },
                  ...shifts.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name }))
                ]}
              />
            </div>
            <div className="flex-1 min-w-40">
              <Select
                label="نوع الإجازة"
                value={vacationType}
                onChange={(e) => setVacationType(e.target.value)}
                options={[
                  { value: 'إجازة سنوية', label: 'إجازة سنوية' },
                  { value: 'إجازة خط', label: 'إجازة خط' },
                  { value: 'إجازة ميدانية', label: 'إجازة ميدانية' },
                  { value: 'إجازة مرضية', label: 'إجازة مرضية' },
                  { value: 'إجازة عارضة', label: 'إجازة عارضة' },
                  { value: 'مأمورية خارجية', label: 'مأمورية خارجية' }
                ]}
              />
            </div>
            <div className="flex-1 min-w-32">
              <Input
                label="مدة التواجد بالقطاع قبل النزول (يوم)"
                type="number"
                min={1}
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                placeholder="14"
              />
            </div>
            <Input
              label="تاريخ بدء الإجازة"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (!expectedReturnDate) setExpectedReturnDate(addDaysYmd(e.target.value, 13))
              }}
              className="flex-1"
            />
            <Input
              label="تاريخ العودة (تلقائي 14 يوم)"
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="mt-3">
            <Input
              label="ملاحظات / عذر الإجازة"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب تفاصيل إضافية..."
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="accent"
              onClick={handleInitialize}
              loading={submitting}
            >
              + تسجيل إجازة
            </Button>
          </div>
          {shiftId && (
            <div className="mt-3">
              <label className="text-sm font-semibold text-gray-300">
                العساكر النازلين من هذه العمالة ({checkedIds.length} محدد)
              </label>
              {shiftAssignments.length === 0 ? (
                <p className="text-xs text-gray-500 mt-1">لا يوجد عساكر معينين على هذه العمالة حاليًا</p>
              ) : (
                <>
                  <div className="relative mt-2">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                    <input
                      type="text"
                      value={soldierSearch}
                      onChange={(e) => setSoldierSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو الرقم العسكري..."
                      className="w-full bg-military-900/60 border border-white/10 rounded-lg py-1.5 pr-8 pl-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-military-accent/50"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allVisibleChecked}
                        onChange={() => {
                          const visibleIds = visibleSoldiers.map((a) => a.personnelId)
                          setCheckedIds((prev) =>
                            allVisibleChecked
                              ? prev.filter((id) => !visibleIds.includes(id))
                              : [...new Set([...prev, ...visibleIds])]
                          )
                        }}
                        className="accent-military-primary h-3.5 w-3.5 rounded"
                      />
                      تحديد المعروض ({visibleSoldiers.length} من {shiftAssignments.length})
                    </label>
                    {soldierSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => setSoldierSearch('')}
                        className="text-[11px] text-gray-500 hover:text-gray-300"
                      >
                        ✕ مسح البحث
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-military-900 divide-y divide-white/5">
                    {visibleSoldiers.length === 0 ? (
                      <p className="p-3 text-xs text-gray-500">لا توجد نتائج لـ «{soldierSearch}»</p>
                    ) : (
                      visibleSoldiers.map((a) => (
                        <label
                          key={a.id}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-military-primary/10 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="accent-military-primary"
                            checked={checkedIds.includes(a.personnelId)}
                            onChange={() => toggleSoldier(a.personnelId)}
                          />
                          {a.personnel?.fullName || '—'} ({a.personnel?.militaryId || '—'}) -{' '}
                          {a.personnel?.rank || ''}
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
              <p className="text-[11px] text-gray-500 mt-1">
                المحددون تُسجل لهم إجازة خط فعالة فورًا وتظهر في سجلاتهم
              </p>
            </div>
          )}
          {message && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg mt-2">
              {message}
            </div>
          )}
          {storeError && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg mt-2">
              {storeError}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            عند البدء تُزامن الحالات تلقائيًا: عمالة الإجازة (حاضر ← إجازة)،
            وعمالة الإجازة السابقة فقط (إجازة ← حاضر). باقي الحالات (مرضي/سجن/مهمة...) لا تُمس.
            التنبيهات والتقارير تُحسب تلقائيًا من الدورة.
          </p>
        </div>

        {/* Generate Next */}
        {leaveCycles.length > 0 && (
          <div className="glassmorphism p-4 rounded-xl">
            <h4 className="text-sm font-bold text-military-accent mb-3">إنشاء الدورة التالية</h4>
            <Button
              variant="secondary"
              onClick={handleGenerateNext}
              loading={submitting}
            >
              إنشاء الدورة التالية
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              سيتم إنشاء دورة جديدة تبدأ بعد انتهاء الدورة الحالية (العمالة حسب التسلسل التلقائي) مع مزامنة الحالات تلقائيًا
            </p>
          </div>
        )}

        {/* Current Cycles */}
        <div className="glassmorphism p-4 rounded-xl">
          <h4 className="text-sm font-bold text-military-accent mb-3">الدورات المسجلة</h4>
          {leaveCycles.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              لا توجد دورات مسجلة. قم بالتهيئة أولاً.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {leaveCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex items-center justify-between p-3 bg-military-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-bold">
                      الدورة {cycle.cycleNumber}
                    </span>
                    <span className={`font-bold text-sm ${shiftColor(cycle.shift?.order || 0)}`}>
                      {cycle.shift?.name || shiftName(cycle.shift?.order || 0)} في إجازة
                    </span>
                    <span className="text-xs text-gray-400">
                      {cycle.leaveStartDate} → {cycle.leaveEndDate}
                    </span>
                  </div>
                  <Badge variant={cycle.isActive ? 'success' : 'secondary'}>
                    {cycle.isActive ? 'نشطة' : 'منتهية'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
