import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, Stethoscope, Heart, Printer, Download, Eye, Pill, PackagePlus, CalendarClock } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { PersonnelSelect } from '../ui/PersonnelSelect'
import { Tabs } from '../ui/Tabs'
import { RECORD_TABS, TAB_RANK_MAP } from '../../constants/categories'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { visibleCategories } from '../../constants/permissions'
import { matchesAnySearch } from '../../utils/arabicSearch'
import { getClinicRecords, createClinicRecord, deleteClinicRecord, getClinicRecordsForPrint, getClinicByPersonnel } from '../../api/clinic.api'
import { generateClinicPDF } from './ClinicPDFGenerator'
import { ClinicPersonDrawer } from './ClinicPersonDrawer'
import { PharmacyDrugsTab } from './pharmacy/PharmacyDrugsTab'
import { PharmacyBatchesTab } from './pharmacy/PharmacyBatchesTab'
import { PharmacyExpiringTab } from './pharmacy/PharmacyExpiringTab'
import { DispenseEditor } from './pharmacy/DispenseEditor'
import { canManage } from '../../constants/permissions'
import { getPharmacyDispenses } from '../../api/pharmacy.api'
import { formatDateAr, todayYmd } from '../../utils/vacationDates'
import { displayRank } from '../../utils/rankDisplay'
import type { ClinicRecord, DispenseLine, PharmacyDispenseItem } from '../../types/personnel'

/** التبويبات الرئيسية داخل صفحة العيادة */
type ClinicTabId = 'exams' | 'drugs' | 'batches' | 'expiring'
const CLINIC_TABS: { id: ClinicTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'exams', label: 'الكشوفات', icon: Stethoscope },
  { id: 'drugs', label: 'الأدوية', icon: Pill },
  { id: 'batches', label: 'المشتريات', icon: PackagePlus },
  { id: 'expiring', label: 'الأقرب انتهاءً', icon: CalendarClock }
]

/** تاريخ محلي بصيغة YYYY-MM-DD (لتواريخ الإنشاء UTC) */
const localYmd = (value?: string | Date | null): string => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value).slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** تاريخ الكشف الفعلي — لو مفيش تاريخ كشف نستخدم تاريخ الإنشاء */
const effectiveExamYmd = (r: ClinicRecord): string =>
  r.examinationDate ? String(r.examinationDate).slice(0, 10) : localYmd(r.createdAt)

export const ClinicDashboard: React.FC = () => {
  const [records, setRecords] = useState<ClinicRecord[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  /** التبويب الرئيسي للصفحة: الكشوفات / الأدوية / المشتريات / الأقرب انتهاءً */
  const [clinicTab, setClinicTab] = useState<ClinicTabId>('exams')
  const { searchQuery } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printMode, setPrintMode] = useState<'all' | 'personnel'>('all')
  const [printFromDate, setPrintFromDate] = useState('')
  const [printToDate, setPrintToDate] = useState('')
  const [printPersonnelId, setPrintPersonnelId] = useState('')
  const [printPersonnelName, setPrintPersonnelName] = useState('')
  const [printLoading, setPrintLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // صرف دواء مع الكشف
  const [dispenseLines, setDispenseLines] = useState<DispenseLine[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [splitWarnings, setSplitWarnings] = useState<string[]>([])
  const [submitWarning, setSubmitWarning] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  // فلتر مكان الكشف — بيتشغل من الكروت (null = الكل)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  // فلتر تاريخ الكشف — الافتراضي «النهارده» لحد ما المستخدم يغيّره
  const [examFromDate, setExamFromDate] = useState<string>(todayYmd())
  const [examToDate, setExamToDate] = useState<string>(todayYmd())
  // فتح ملف الفرد بالكامل من سجل الكشف
  const [viewPersonnelId, setViewPersonnelId] = useState<string | null>(null)
  // سجل الكشوفات السابقة للعسكري المختار (عدّاد اللوحة الجانبية)
  const [history, setHistory] = useState<ClinicRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  // فلتر جدول العيادة على عسكري محدد (من اللوحة الجانبية)
  const [filterPersonnel, setFilterPersonnel] = useState<{ id: string; name: string } | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const historyReq = useRef(0)
  const [formData, setFormData] = useState({
    personnelId: '',
    locationType: 'داخل الوحدة',
    locationAddress: '',
    notes: '',
    examinationDate: '',
    clinicType: 'حربية',
    diagnosis: '',
    treatment: ''
  })

  const fetchRecords = useCallback(async () => {    setLoading(true)
    setError(null)
    try {
      const res = await getClinicRecords()
      if (res.success) {
        setRecords(res.data)
      }
    } catch {
      setError('فشل تحميل سجلات العيادة')
    } finally {
      setLoading(false)
    }
  }, [])

  // جلب الكشوفات السابقة للعسكري المختار في مودال التسجيل (مع تجاهل الردود القديمة)
  const fetchHistory = useCallback(async (personnelId: string) => {
    const req = ++historyReq.current
    setHistoryLoading(true)
    try {
      const res = await getClinicByPersonnel(personnelId)
      if (historyReq.current !== req) return
      if (res.success && Array.isArray(res.data)) setHistory(res.data)
      else setHistory([])
    } catch {
      if (historyReq.current !== req) return
      setHistory([])
    } finally {
      if (historyReq.current === req) setHistoryLoading(false)
    }
  }, [])

  const clearHistory = useCallback(() => {
    historyReq.current++
    setHistory([])
    setHistoryLoading(false)
    setSelectedName('')
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecords()
  }, [fetchRecords])

  // الأدوية المصروفة لكل كشف — عمود «الأدوية المصروفة»
  const [dispensedByRecord, setDispensedByRecord] = useState<
    Record<string, PharmacyDispenseItem[]>
  >({})

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!records.length) {
      setDispensedByRecord({})
      return
    }
    const ids = records.map((r) => r.id)
    void getPharmacyDispenses()
      .then((all) => {
        if (!all.success) return
        const map: Record<string, PharmacyDispenseItem[]> = {}
        for (const d of all.data) {
          if (!d.clinicRecordId) continue
          if (!ids.includes(d.clinicRecordId)) continue
          map[d.clinicRecordId] = [...(map[d.clinicRecordId] || []), ...d.items]
        }
        setDispensedByRecord(map)
      })
      .catch(() => setDispensedByRecord({}))
  }, [records])

  const handleSubmit = async (confirmSplit = false): Promise<void> => {
    if (!formData.personnelId) {
      setError('الرجاء اختيار الفرد المريض')
      return
    }
    if (formData.locationType === 'خارج الوحدة' && !formData.locationAddress.trim()) {
      setError('يجب تحديد عنوان مكان الكشف خارج الوحدة')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        personnelId: formData.personnelId,
        locationType: formData.locationType,
        locationAddress: formData.locationAddress.trim() || null,
        examinationDate: formData.examinationDate || null,
        clinicType: formData.clinicType,
        diagnosis: formData.diagnosis.trim() || null,
        treatment: formData.treatment.trim() || null,
        notes: formData.notes.trim() || null,
        // حقول قديمة لم تعد تُجمع من الويزرد — قيم افتراضية للتوافق مع الداتا
        examinationType: 'كشف دوري',
        medicalStatus: 'لائق',
        carnetNumber: null,
        specialty: null,
        // صرف دواء (اختياري) — السيرفر يحفظ الكشف + الصرف + نقصان المخزون في transaction واحد
        ...(dispenseLines.length
          ? {
              dispense: {
                items: dispenseLines.map((l) => ({
                  drugId: l.drugId,
                  qty: l.qty,
                  unit: l.unit,
                  batchId: l.batchId ?? null
                })),
                confirmSplit
              }
            }
          : {})
      }
      const res = await createClinicRecord(payload)
      if (res.success) {
        const warnings = (res.data as { dispense?: { warnings?: string[] } })?.dispense?.warnings ?? []
        if (warnings.length) setSubmitWarning(warnings)
        setFormData({
          personnelId: '',
          locationType: 'داخل الوحدة',
          locationAddress: '',
          notes: '',
          examinationDate: '',
          clinicType: 'حربية',
          diagnosis: '',
          treatment: ''
        })
        setDispenseLines([])
        setSelectedType(null)
        setIsModalOpen(false)
        // لو الكشف الجديد بتاريخ برّه الفلتر الحالي، نوسّع الفلتر عشان يظهر
        // في مكانه الصح حسب تاريخه (مش يختفي بعد الحفظ).
        const createdDate = formData.examinationDate || todayYmd()
        setExamFromDate((prev) => (!prev || createdDate < prev ? createdDate : prev))
        setExamToDate((prev) => (!prev || createdDate > prev ? createdDate : prev))
        fetchRecords()
      } else {
        setError(res.message || 'فشل تسجيل الكشف الطبي')
      }
    } catch (err) {
      const e = err as {
        response?: {
          status?: number
          data?: { message?: string; needsConfirm?: boolean; splitWarnings?: string[] }
        }
      }
      const d = e.response?.data
      // 409 = الصرف محتاج تقسيم على أكتر من شحنة (FEFO) — السيرفر رجّع كل حاجة زي ما كانت
      if (e.response?.status === 409 && d?.needsConfirm) {
        setSplitWarnings(d.splitWarnings || [])
        setConfirmOpen(true)
      } else {
        setError(d?.message || 'حدث خطأ أثناء تسجيل الكشف')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل الطبي؟')) return
    try {
      await deleteClinicRecord(id)
      fetchRecords()
    } catch {
      setError('فشل حذف السجل الطبي')
    }
  }

  const handlePrint = async (): Promise<void> => {
    if (!printFromDate || !printToDate) {
      setError('يرجى تحديد نطاق التاريخ (من / إلى)')
      return
    }
    if (printMode === 'personnel' && !printPersonnelId) {
      setError('يرجى اختيار الفرد للطباعة')
      return
    }

    setPrintLoading(true)
    setError(null)
    try {
      const res = await getClinicRecordsForPrint({
        personnelId: printMode === 'personnel' ? printPersonnelId : undefined,
        fromDate: printFromDate,
        toDate: printToDate
      })
      if (res.success) {
        // خريطة الأدوية المصروفة للسجلات اللي هتطبع (مش المعروضة بس)
        const printIds = res.data.map((r) => r.id)
        let printMap: Record<string, string[]> = {}
        try {
          const all = await getPharmacyDispenses()
          if (all.success) {
            const map: Record<string, string[]> = {}
            for (const d of all.data) {
              if (!d.clinicRecordId || !printIds.includes(d.clinicRecordId)) continue
              map[d.clinicRecordId] = [
                ...(map[d.clinicRecordId] || []),
                ...d.items.map((i) => `${i.drug?.name || '—'} ${i.qty} ${i.unit}`)
              ]
            }
            printMap = map
          }
        } catch {
          printMap = {}
        }

        await generateClinicPDF({
          records: res.data,
          title: 'تقرير العيادة الطبية العسكرية',
          fromDate: printFromDate,
          toDate: printToDate,
          personnelName: printMode === 'personnel' ? printPersonnelName : undefined,
          printType: printMode,
          // الأدوية المصروفة لكل كشف
          dispensedByRecord: printMap
        })
        setIsPrintModalOpen(false)
        setPrintFromDate('')
        setPrintToDate('')
        setPrintPersonnelId('')
        setPrintPersonnelName('')
      } else {
        setError(res.message || 'فشل جلب البيانات للطباعة')
      }
    } catch {
      setError('حدث خطأ أثناء إنشاء ملف PDF')
    } finally {
      setPrintLoading(false)
    }
  }

  const q = (searchQuery || '').trim()

  // كل الكشوفات داخل نطاق التاريخ + التبويب/البحث/الفرد (بدون فلتر المكان)
  const dateScopedRecords = records
    .filter((r) => {
      if (!r.personnel) return false
      if (!TAB_RANK_MAP[activeTab].includes(r.personnel.rank)) return false
      if (filterPersonnel && r.personnelId !== filterPersonnel.id) return false
      if (!matchesAnySearch([r.personnel.fullName, r.personnel.militaryId], q)) return false
      const ymd = effectiveExamYmd(r)
      if (examFromDate && ymd < examFromDate) return false
      if (examToDate && ymd > examToDate) return false
      return true
    })
    // الترتيب حسب تاريخ الكشف (الأحدث أولًا) — مش تاريخ الإدخال.
    .sort((a, b) => {
      const da = effectiveExamYmd(a)
      const db = effectiveExamYmd(b)
      if (da !== db) return da < db ? 1 : -1
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    })

  const visibleRecords = locationFilter
    ? dateScopedRecords.filter((r) => (r.locationType || 'داخل الوحدة') === locationFilter)
    : dateScopedRecords

  // الانتقال من اللوحة الجانبية: قفل المودال + فلترة الجدول على العسكري + سكرول
  const goToFilteredRecords = (): void => {
    if (!formData.personnelId || historyLoading || history.length === 0) return
    setFilterPersonnel({
      id: formData.personnelId,
      name: selectedName || 'العسكري المختار'
    })
    // عند عرض سجل عسكري محدد نوسّع نطاق التاريخ يغطي كل كشوفاته
    const dates = history
      .map((r) => effectiveExamYmd(r))
      .filter(Boolean)
      .sort()
    if (dates.length) {
      setExamFromDate(dates[0])
      setExamToDate(dates[dates.length - 1])
    }
    setIsModalOpen(false)
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const clearPersonnelFilter = (): void => {
    setFilterPersonnel(null)
  }

  const columns: Column<ClinicRecord>[] = [
    {
      key: 'personnel',
      label: 'الفرد',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{row.personnel?.fullName ?? '—'}</span>
          <span className="text-xs text-gray-400">
            {displayRank(row.personnel?.rank, row.personnel?.personnelType) || '—'} / {row.personnel?.militaryId}
          </span>
        </div>
      )
    },
    { key: 'examinationType', label: 'الكشف', render: (row) => {
      const v = row.locationType || 'داخل الوحدة'
      const isOut = v === 'خارج الوحدة'
      return <Badge variant={isOut ? 'warning' : 'success'}>{isOut ? 'خارج الوحدة' : 'داخل الوحدة'}</Badge>
    } },
    {
      key: 'examinationDate',
      label: 'تاريخ الكشف',
      render: (row) => <span>{row.examinationDate ? formatDateAr(row.examinationDate) : '—'}</span>
    },
    { key: 'locationAddress', label: 'عنوان مكان الكشف', render: (row) => row.locationAddress || '—' },
    { key: 'diagnosis', label: 'التشخيص', render: (row) => row.diagnosis || '—' },
    { key: 'dispensed', label: 'الأدوية المصروفة', render: (row) =>
        dispensedByRecord[row.id]?.length ? (
          <div className="flex flex-col gap-0.5">
            {dispensedByRecord[row.id].slice(0, 3).map((d, i) => (
              <span key={i} className="text-xs text-emerald-300">
                {d.drug?.name || '—'} {d.qty} {d.unit}
              </span>
            ))}
            {dispensedByRecord[row.id].length > 3 && (
              <span className="text-[11px] text-gray-400">
                +{dispensedByRecord[row.id].length - 3} صنف
              </span>
            )}
          </div>
        ) : row.treatment ? (
          <span className="text-xs text-gray-400">{row.treatment}</span>
        ) : (
          '—'
        )
    },
    { key: 'notes', label: 'الملاحظات الطبية' },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-military-accent hover:bg-military-primary/10 rounded-lg transition-all"
            onClick={() => setViewPersonnelId(row.personnelId)}
            title="عرض سجل عيادة الفرد"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            onClick={() => handleDelete(row.id)}
            title="حذف السجل"
          >
            حذف
          </Button>
        </div>
      )
    }
  ]

  const medicalStats = [
    {
      label: 'كشوفات اليوم',
      value: `${dateScopedRecords.length} حالة`,
      icon: Stethoscope,
      color: 'text-blue-400',
      onClick: () => {
        setLocationFilter(null)
        setFilterPersonnel(null)
        requestAnimationFrame(() =>
          tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        )
      }
    },
    {
      label: 'خارج الوحدة',
      value: `${
        dateScopedRecords.filter((v) => v.locationType === 'خارج الوحدة').length
      } حالة`,
      icon: Heart,
      color: 'text-amber-400',
      onClick: () => {
        setLocationFilter((prev) => (prev === 'خارج الوحدة' ? null : 'خارج الوحدة'))
        setFilterPersonnel(null)
        requestAnimationFrame(() =>
          tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        )
      }
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">العيادة الطبية العسكرية</h2>
          <p className="text-sm text-gray-400">
            متابعة الكشوفات داخل الوحدة وخارجها وسجلات الكشف اليومية للأفراد.
          </p>
        </div>
        <Button
          variant="primary"
          startIcon={<Activity className="h-4 w-4" />}
          onClick={() => {
            clearHistory()
            setIsModalOpen(true)
          }}
        >
          تسجيل كشف طبي جديد
        </Button>
      </div>

      {/* ===== التبويبات الرئيسية للعيادة ===== */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        {CLINIC_TABS.map((t) => {
          const active = clinicTab === t.id
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setClinicTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                active
                  ? 'bg-military-primary/15 text-white border border-military-accent/50'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-military-700/30 border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {clinicTab !== 'exams' ? (
        <div className="flex-1">
          {clinicTab === 'drugs' && (
            <PharmacyDrugsTab canManage={canManage(user)} />
          )}
          {clinicTab === 'batches' && <PharmacyBatchesTab canManage={canManage(user)} />}
          {clinicTab === 'expiring' && <PharmacyExpiringTab />}
        </div>
      ) : (
        <>
      {/* Category Tabs */}
      <Tabs tabs={RECORD_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicalStats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <button
              key={idx}
              type="button"
              onClick={stat.onClick}
              title="اضغط للعرض"
              className="glassmorphism p-5 rounded-xl flex items-center justify-between text-start w-full
                         hover:border-military-accent/50 hover:bg-military-primary/5 transition-all cursor-pointer"
            >
              <div className="flex flex-col gap-1 text-start">
                <span className="text-xs text-gray-400 font-semibold">{stat.label}</span>
                <span className="text-2xl font-black text-white">{stat.value}</span>
              </div>
              <div className={`p-3 bg-military-900/60 rounded-lg ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Table Area */}
      <div ref={tableRef} className="flex flex-col gap-4 scroll-mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">جدول المراجعات والكشوفات الطبية اليومية</h3>
          <Button
            variant="secondary"
            startIcon={<Printer className="h-4 w-4" />}
            onClick={() => setIsPrintModalOpen(true)}
          >
            طباعة
          </Button>
        </div>
        {/* فلتر تاريخ الكشف — الافتراضي «النهارده» */}
        <div className="glassmorphism rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="من تاريخ"
              type="date"
              value={examFromDate}
              onChange={(e) => setExamFromDate(e.target.value)}
            />
            <Input
              label="إلى تاريخ"
              type="date"
              value={examToDate}
              onChange={(e) => setExamToDate(e.target.value)}
            />
          </div>
          {(examFromDate !== todayYmd() || examToDate !== todayYmd()) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setExamFromDate(todayYmd())
                  setExamToDate(todayYmd())
                }}
              >
                عرض كشوفات اليوم
              </Button>
            </div>
          )}
        </div>
        {locationFilter && (
          <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
            <span className="text-sm font-bold text-white">
              عرض كشوفات: {locationFilter} ({visibleRecords.length})
            </span>
            <Button variant="ghost" size="sm" onClick={() => setLocationFilter(null)}>
              ✕ إلغاء الفلتر
            </Button>
          </div>
        )}
        {filterPersonnel && (
          <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
            <span className="text-sm font-bold text-white">
              عرض كشوفات: {filterPersonnel.name} ({visibleRecords.length})
            </span>
            <Button variant="ghost" size="sm" onClick={clearPersonnelFilter}>
              ✕ إلغاء الفلتر
            </Button>
          </div>
        )}
        <Table columns={columns} data={visibleRecords} loading={loading} />
      </div>
        </>
      )}

      {/* اللوحة الجانبية: عدّاد الكشوفات السابقة — جنب مودال التسجيل */}
      {isModalOpen && (
        <div className="hidden lg:flex fixed z-[60] left-6 top-1/2 -translate-y-1/2 w-64">
          <button
            type="button"
            disabled={!formData.personnelId || historyLoading || history.length === 0}
            onClick={goToFilteredRecords}
            title={history.length > 0 ? 'اضغط للانتقال لسجل العسكري في صفحة العيادة' : undefined}
            className={`w-full glassmorphism rounded-xl p-4 flex flex-col items-center gap-2 border text-center transition-all ${
              formData.personnelId && history.length > 0
                ? 'cursor-pointer border-military-accent/40 hover:border-military-accent hover:bg-military-accent/10'
                : 'border-white/10 text-gray-500'
            }`}
          >
            <span className="text-2xl">🩺</span>
            <span className="text-xs font-bold text-gray-300">
              {selectedName || 'يجب اختيار فرد أولا'}
            </span>
            <span className="text-[11px] text-gray-500">الكشوفات السابقة</span>
            <span className="min-w-[36px] h-9 px-3 rounded-full bg-military-accent/20 text-military-accent flex items-center justify-center text-lg font-black">
              {historyLoading ? '...' : history.length}
            </span>
            {formData.personnelId && history.length > 0 && (
              <span className="text-[11px] text-military-accent">اضغط للانتقال لسجله ↓</span>
            )}
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل كشف طبي جديد"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={() => handleSubmit(false)} loading={submitting}>
              حفظ الكشف
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <PersonnelSelect
            value={formData.personnelId}
            onChange={(v) => {
              setFormData((p) => ({ ...p, personnelId: v }))
              if (!v) clearHistory()
            }}
            onSelect={(p) => {
              setSelectedType(p.personnelType)
              setFormData((f) => ({ ...f, clinicType: p.personnelType }))
              setSelectedName(p.fullName)
              fetchHistory(p.id)
            }}
            ranks={TAB_RANK_MAP[activeTab].join(',')}
            categories={visibleCategories(user)}
          />
          {selectedType && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">تبعية الفرد:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedType === 'حربية'
                    ? 'bg-blue-500/20 text-blue-300'
                    : selectedType === 'داخلية'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {selectedType}
              </span>
            </div>
          )}
          <Select
            label="الكشف"
            value={formData.locationType}
            onChange={(e) => setFormData((p) => ({ ...p, locationType: e.target.value, locationAddress: '' }))}
            options={[
              { value: 'داخل الوحدة', label: 'كشف داخل الوحدة' },
              { value: 'خارج الوحدة', label: 'كشف خارج الوحدة' }
            ]}
          />
          {formData.locationType === 'خارج الوحدة' && (
            <Input
              label="عنوان مكان الكشف"
              value={formData.locationAddress}
              onChange={(e) => setFormData((p) => ({ ...p, locationAddress: e.target.value }))}
              placeholder="اكتب عنوان مكان الكشف..."
            />
          )}
          <Input
            label="تاريخ الكشف"
            type="date"
            value={formData.examinationDate}
            onChange={(e) => setFormData((p) => ({ ...p, examinationDate: e.target.value }))}
          />
          <Input
            label="التشخيص"
            value={formData.diagnosis}
            onChange={(e) => setFormData((p) => ({ ...p, diagnosis: e.target.value }))}
            placeholder="التشخيص الطبي"
          />

          {/* صرف دواء — يحفظ مع الكشف في عملية واحدة */}
          <DispenseEditor
            lines={dispenseLines}
            onChange={setDispenseLines}
            canDispense={canManage(user)}
          />

          <Input
            label="توصيات الطبيب"
            value={formData.treatment}
            onChange={(e) => setFormData((p) => ({ ...p, treatment: e.target.value }))}
            placeholder="مثال: راحة أسبوع — ممنوع مجهود — مراجعة بعد أسبوعين"
          />
          <Input
            label="الملاحظات الطبية"
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            placeholder="اكتب الملاحظات..."
          />
        </div>
      </Modal>

      {/* نافذة تأكيد تقسيم الـFEFO */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="تنبيه صلاحية الأدوية"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              إلغاء — راجع الكميات
            </Button>
            <Button
              variant="accent"
              loading={submitting}
              onClick={() => {
                setConfirmOpen(false)
                void handleSubmit(true)
              }}
            >
              فهمت — صِرف وقسّم
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-300">
            الصرف هيتم تقسيمه على أكثر من شحنة — صرف الأقرب انتهاءً أولاً:
          </p>
          <ul className="flex flex-col gap-1.5">
            {splitWarnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-300 bg-amber-500/10 rounded px-2 py-1.5">
                {w}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-500">
            لحد دلوقتي ما اتحفظش حاجة — ولا الكشف ولا المخزون اتغيّروا — لسه زي ما هم.
          </p>
        </div>
      </Modal>

      {/* تنبيهات بعد الحفظ (صرف مقسّم) */}
      {submitWarning.length > 0 && (
        <div className="fixed bottom-4 start-4 z-[70] glassmorphism border border-amber-500/30 text-amber-200 p-3 rounded-xl text-xs font-bold flex flex-col gap-1">
          <span>تم الحفظ مع تنبيه:</span>
          {submitWarning.map((w, i) => (
            <span key={i}>• {w}</span>
          ))}
          <button
            type="button"
            className="text-white/60 hover:text-white text-start mt-1"
            onClick={() => setSubmitWarning([])}
          >
            ✕ إغلاق
          </button>
        </div>
      )}

      {/* Print Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="خيارات الطباعة"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPrintModalOpen(false)} disabled={printLoading}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handlePrint} loading={printLoading} startIcon={<Download className="h-4 w-4" />}>
              تحميل PDF
            </Button>
          </>
        }
        size="lg"
      >
        <div className="flex flex-col gap-6">
          {/* Print Mode Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-4">
            <button
              onClick={() => setPrintMode('all')}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                printMode === 'all'
                  ? 'bg-military-primary text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              طباعة الكل
            </button>
            <button
              onClick={() => setPrintMode('personnel')}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                printMode === 'personnel'
                  ? 'bg-military-primary text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              طباعة يوزر محدد
            </button>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="من تاريخ"
              type="date"
              value={printFromDate}
              onChange={(e) => setPrintFromDate(e.target.value)}
              required
            />
            <Input
              label="إلى تاريخ"
              type="date"
              value={printToDate}
              onChange={(e) => setPrintToDate(e.target.value)}
              required
            />
          </div>

          {/* Personnel Select (only for personnel mode) */}
          {printMode === 'personnel' && (
            <PersonnelSelect
              label="اختر الفرد"
              value={printPersonnelId}
              onChange={(v) => {
                setPrintPersonnelId(v)
                const record = records.find((p) => p.id === v)
                setPrintPersonnelName(record?.personnel?.fullName || '')
              }}
              categories={visibleCategories(user)}
            />
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
              {error}
            </div>
          )}
        </div>
      </Modal>

      {/* سجل عيادة الفرد — يفتح من زرار العرض في أي سجل كشف */}
      {viewPersonnelId && (
        <ClinicPersonDrawer
          isOpen={!!viewPersonnelId}
          onClose={() => setViewPersonnelId(null)}
          personnelId={viewPersonnelId}
        />
      )}
    </div>
  )
}
