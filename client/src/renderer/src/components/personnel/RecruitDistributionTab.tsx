import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRightLeft,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Users,
  AlertTriangle
} from 'lucide-react'
import { getPersonnel, updatePersonnel } from '../../api/personnel.api'
import { MILITARY_DEPARTMENTS, INTERNAL_DEPARTMENTS } from '../../constants/departments'
import { matchesAnySearch } from '../../utils/arabicSearch'
import { displayRank } from '../../utils/rankDisplay'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { RecruitDetailsWizard } from './RecruitDetailsWizard'
import type { Personnel } from '../../types/personnel'

// ==================== توزيع المستجدين ====================
// تاب لمدير النظام فقط: بيعرض كل المستجدين (حربية / داخلية / تشغيل) وبيسمح
// بتوزيع كل مستجد على النوع + القسم المناسب في خطوة واحدة.

type DistributionType = 'حربية' | 'داخلية' | 'تشغيل'

const RECRUIT_TYPES = ['مستجد حربية', 'مستجد داخلية', 'مستجد تشغيل']

const TYPE_OPTIONS = [
  { value: '', label: 'اختر النوع...' },
  { value: 'حربية', label: 'حربية' },
  { value: 'داخلية', label: 'داخلية' },
  { value: 'تشغيل', label: 'تشغيل' }
]

/** أقسام النوع المختار — «تشغيل» بيستخدم أقسام الحربية (لأن النوع المخزَّن «تشغيل حربيه») */
const departmentsFor = (type: string): string[] => {
  if (type === 'داخلية') return [...INTERNAL_DEPARTMENTS]
  if (type === 'حربية' || type === 'تشغيل') return [...MILITARY_DEPARTMENTS]
  return []
}

/** النوع اللي بيتخزن فعليًا في قاعدة البيانات */
const resolvePersonnelType = (type: DistributionType): string =>
  type === 'تشغيل' ? 'تشغيل حربيه' : type

const recruitBadgeVariant = (
  type: string
): 'warning' | 'primary' | 'success' | 'secondary' => {
  if (type === 'مستجد حربية') return 'warning'
  if (type === 'مستجد داخلية') return 'primary'
  if (type === 'مستجد تشغيل') return 'success'
  return 'secondary'
}

interface RowChoice {
  type: string
  department: string
}

interface RecruitDistributionTabProps {
  /** بعد نجاح أي توزيع — لتحديث قائمة الأفراد في الخلفية */
  onDistributed?: () => void
}

export const RecruitDistributionTab: React.FC<RecruitDistributionTabProps> = ({
  onDistributed
}) => {
  const [recruits, setRecruits] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [choices, setChoices] = useState<Record<string, RowChoice>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // المستجد المفتوح في الـwizard (دوس على الاسم)
  const [wizardRecruit, setWizardRecruit] = useState<Personnel | null>(null)

  const fetchRecruits = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPersonnel({
        page: 1,
        limit: 1000,
        personnelType: RECRUIT_TYPES.join(',')
      })
      if (res.success) {
        setRecruits(res.data)
      } else {
        setError(res.message || 'فشل تحميل قائمة المستجدين')
      }
    } catch {
      setError('تعذّر تحميل قائمة المستجدين — تأكد من الاتصال بالسيرفر')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecruits()
  }, [fetchRecruits])

  const counts = useMemo(
    () => ({
      total: recruits.length,
      harb: recruits.filter((r) => r.personnelType === 'مستجد حربية').length,
      internal: recruits.filter((r) => r.personnelType === 'مستجد داخلية').length,
      ops: recruits.filter((r) => r.personnelType === 'مستجد تشغيل').length
    }),
    [recruits]
  )

  const visibleRecruits = useMemo(
    () =>
      recruits.filter((r) =>
        matchesAnySearch(
          [
            r.fullName,
            r.militaryId,
            r.nationalId,
            r.rank,
            r.personnelType,
            r.unit,
            r.workBeforeEnlistment
          ],
          search
        )
      ),
    [recruits, search]
  )

  const choiceFor = (id: string): RowChoice => choices[id] || { type: '', department: '' }

  const setRowType = (id: string, type: string): void => {
    setChoices((prev) => ({ ...prev, [id]: { type, department: '' } }))
  }

  const setRowDepartment = (id: string, department: string): void => {
    setChoices((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { type: '', department: '' }), department }
    }))
  }

  const handleDistribute = async (recruit: Personnel): Promise<void> => {
    const choice = choiceFor(recruit.id)
    if (!choice.type || !choice.department) {
      setError('اختر النوع والقسم الأول قبل التوزيع')
      setSuccess(null)
      return
    }

    setSavingId(recruit.id)
    setError(null)
    setSuccess(null)
    try {
      const formData = new FormData()
      formData.append('personnelType', resolvePersonnelType(choice.type as DistributionType))
      formData.append('unit', choice.department)
      // المستجد بيبقى جندي بعد التوزيع — الرتبة «مستجد ...» مش رتبة فعلية
      if ((recruit.rank || '').startsWith('مستجد')) {
        formData.append('rank', 'جندي')
      }
      formData.append('isRecruit', 'false')

      const res = await updatePersonnel(recruit.id, formData)
      if (!res.success) {
        setError(res.message || 'فشل توزيع المستجد')
        return
      }

      setSuccess(
        `تم توزيع ${recruit.fullName} على «${choice.department}» — ${choice.type}`
      )
      setRecruits((prev) => prev.filter((r) => r.id !== recruit.id))
      setChoices((prev) => {
        const next = { ...prev }
        delete next[recruit.id]
        return next
      })
      setWizardRecruit((prev) => (prev?.id === recruit.id ? null : prev))
      onDistributed?.()
    } catch {
      setError('تعذّر حفظ التوزيع — حاول مرة أخرى')
    } finally {
      setSavingId(null)
    }
  }

  const statCard = (label: string, value: number, tone: string): React.ReactElement => (
    <div className="rounded-lg border border-white/5 bg-military-900/40 px-3 py-2.5 text-center">
      <div className={`text-xl font-black ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-gray-400">{label}</div>
    </div>
  )

  return (
    <div className="flex w-full flex-col gap-4">
      {/* رأس التاب + الملخص */}
      <div className="glassmorphism flex flex-col gap-4 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-military-accent/15 p-2.5 text-military-accent">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">توزيع المستجدين</h3>
              <p className="text-xs text-gray-400">
                اختر النوع (حربية / داخلية / تشغيل) ثم القسم المناسب، واضغط «توزيع».
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchRecruits}
            loading={loading}
            startIcon={<RefreshCw className="h-4 w-4" />}
          >
            تحديث
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCard('إجمالي المستجدين', counts.total, 'text-white')}
          {statCard('مستجد حربية', counts.harb, 'text-amber-400')}
          {statCard('مستجد داخلية', counts.internal, 'text-blue-400')}
          {statCard('مستجد تشغيل', counts.ops, 'text-emerald-400')}
        </div>

        <div className="w-full md:w-[360px]">
          <Input
            type="search"
            placeholder="بحث بالاسم أو الرقم العسكري أو العمل قبل التجنيد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* رسائل النتيجة */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* جدول المستجدين */}
      <div className="w-full overflow-x-auto rounded-lg border border-white/5 bg-military-800/40">
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="border-b border-white/5 bg-military-800/80 text-sm font-semibold text-gray-400">
              <th className="px-4 py-3 text-start">المستجد</th>
              <th className="px-4 py-3 text-start">النوع الحالي</th>
              <th className="px-4 py-3 text-start">العمل قبل التجنيد</th>
              <th className="px-4 py-3 text-start">النوع الجديد</th>
              <th className="px-4 py-3 text-start">القسم</th>
              <th className="px-4 py-3 text-start">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-gray-300">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {Array.from({ length: 6 }).map((__, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      <div className="mx-auto h-4 w-3/4 rounded bg-military-700"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : visibleRecruits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  {recruits.length === 0
                    ? 'لا يوجد مستجدون حاليًا — كل المستجدين تم توزيعهم'
                    : 'لا يوجد مستجد مطابق لبحثك'}
                </td>
              </tr>
            ) : (
              visibleRecruits.map((recruit) => {
                const choice = choiceFor(recruit.id)
                const departmentOptions = choice.type
                  ? [
                      { value: '', label: 'اختر القسم...' },
                      ...departmentsFor(choice.type).map((d) => ({ value: d, label: d }))
                    ]
                  : [{ value: '', label: 'اختر النوع أولاً' }]

                return (
                  <tr
                    key={recruit.id}
                    className={`transition-colors ${
                      choice.type ? 'bg-military-primary/5' : 'hover:bg-military-700/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          title="اضغط لعرض البيانات الأساسية والوظيفية"
                          onClick={() => setWizardRecruit(recruit)}
                          className="w-fit cursor-pointer text-start font-bold text-white transition-colors hover:text-military-accent hover:underline"
                        >
                          {recruit.fullName}
                        </button>
                        <span className="text-xs text-gray-400">
                          {displayRank(recruit.rank, recruit.personnelType) ||
                            recruit.rank ||
                            '—'}{' '}
                          / {recruit.militaryId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={recruitBadgeVariant(recruit.personnelType)}>
                        {recruit.personnelType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {recruit.workBeforeEnlistment || '—'}
                    </td>
                    <td className="min-w-[150px] px-4 py-3">
                      <Select
                        options={TYPE_OPTIONS}
                        value={choice.type}
                        onChange={(e) => setRowType(recruit.id, e.target.value)}
                      />
                    </td>
                    <td className="min-w-[180px] px-4 py-3">
                      <Select
                        options={departmentOptions}
                        value={choice.department}
                        disabled={!choice.type}
                        onChange={(e) => setRowDepartment(recruit.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="success"
                        disabled={!choice.type || !choice.department}
                        loading={savingId === recruit.id}
                        onClick={() => handleDistribute(recruit)}
                        startIcon={<ArrowRightLeft className="h-4 w-4" />}
                      >
                        توزيع
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* تلميح صغير */}
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <Users className="h-3.5 w-3.5" />
        اضغط على اسم المستجد لعرض بياناته الأساسية والوظيفية. بعد التوزيع بيتحول المستجد تلقائيًا
        لرتبة «جندي» وبيختفي من القائمة هنا ويظهر في تاب «القائمة» تحت نوعه وقسمه الجديد.
      </p>

      {/* نافذة عرض بيانات المستجد (wizard) */}
      <RecruitDetailsWizard
        recruit={wizardRecruit}
        isOpen={!!wizardRecruit}
        onClose={() => setWizardRecruit(null)}
      />
    </div>
  )
}
