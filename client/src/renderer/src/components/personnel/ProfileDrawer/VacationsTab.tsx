import React, { useState, useEffect, useCallback } from 'react'
import {
  getVacationsByPersonnel,
  createVacation,
  updateVacation,
  deleteVacation
} from '../../../api/vacations.api'
import { Table, Column } from '../../ui/Table'
import { Select } from '../../ui/Select'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Plus, Trash2, Pencil, MinusCircle, PlusCircle } from 'lucide-react'
import type { Personnel, Vacation } from '../../../types/personnel'
import {
  addDaysYmd,
  effectiveReturnYmd,
  formatDateAr,
  leaveDurationDays,
  toYmdInput
} from '../../../utils/vacationDates'

interface VacationsTabProps {
  data: Personnel
  canManage?: boolean
}

/** الحد الأقصى لأيام الخصم من الإجازة */
const MAX_DEDUCTION_DAYS = 14
/** الحد الأقصى لأيام المد للإجازة */
const MAX_EXTENSION_DAYS = 30

type AdjustType = 'deduct' | 'extend'

export const VacationsTab: React.FC<VacationsTabProps> = ({ data, canManage = true }) => {
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [vacationType, setVacationType] = useState('إجازة سنوية')
  const [cycle, setCycle] = useState('28')
  const [startDate, setStartDate] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // نافذة الخصم/المد على إجازة موجودة بالفعل
  const [adjustRow, setAdjustRow] = useState<Vacation | null>(null)
  const [adjustType, setAdjustType] = useState<AdjustType>('deduct')
  const [adjustDays, setAdjustDays] = useState('1')
  const [adjusting, setAdjusting] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  const fetchVacations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getVacationsByPersonnel(data.id)
      if (res.success) {
        setVacations(res.data)
      }
    } catch {
      setError('فشل تحميل سجل الإجازات')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVacations()
  }, [fetchVacations])

  const resetForm = (): void => {
    setEditingId(null)
    setVacationType('إجازة سنوية')
    setCycle('28')
    setStartDate('')
    setExpectedReturnDate('')
    setNotes('')
  }

  const handleEdit = (row: Vacation): void => {
    setEditingId(row.id)
    setVacationType(row.vacationType)
    setCycle(row.cycle || '28')
    setStartDate(toYmdInput(row.startDate))
    setExpectedReturnDate(toYmdInput(row.expectedReturnDate))
    setNotes(row.notes || '')
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!startDate) {
      setError('الرجاء تحديد تاريخ بدء الإجازة')
      return
    }
    const returnDate = expectedReturnDate || addDaysYmd(startDate, 13)

    setSubmitting(true)
    setError(null)

    try {
      const res = editingId
        ? await updateVacation(editingId, {
            vacationType,
            cycle,
            startDate,
            expectedReturnDate: returnDate,
            notes
          })
        : await createVacation({
            personnelId: data.id,
            vacationType,
            cycle,
            startDate,
            expectedReturnDate: returnDate,
            notes,
            status: 'معلقة'
          })
      if (res.success) {
        resetForm()
        fetchVacations()
      } else {
        setError(res.message || (editingId ? 'فشل تحديث الإجازة' : 'فشل تسجيل الإجازة'))
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'حدث خطأ أثناء حفظ الإجازة')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذه الإجازة؟')) return
    try {
      const res = await deleteVacation(id)
      if (res.success) {
        fetchVacations()
      }
    } catch {
      setError('فشل حذف الإجازة')
    }
  }

  /** فتح نافذة الخصم أو المد على إجازة موجودة */
  const openAdjust = (row: Vacation, type: AdjustType): void => {
    setAdjustRow(row)
    setAdjustType(type)
    setAdjustDays('1')
    setAdjustError(null)
  }

  const closeAdjust = (): void => {
    setAdjustRow(null)
    setAdjustError(null)
    setAdjusting(false)
  }

  const currentDeduction = (row: Vacation): number => Math.max(0, row.deductionDays || 0)
  const currentExtension = (row: Vacation): number => Math.max(0, row.extensionDays || 0)

  /** أقصى أيام يمكن إضافتها للخصم (مع ترك يوم واحد على الأقل من الإجازة) */
  const maxDeductNow = (row: Vacation): number => {
    const totalDays = leaveDurationDays(row.startDate, row.expectedReturnDate)
    const maxTotal = Math.max(0, Math.min(MAX_DEDUCTION_DAYS, totalDays - 1))
    return Math.max(0, maxTotal - currentDeduction(row))
  }

  const maxExtendNow = (row: Vacation): number =>
    Math.max(0, MAX_EXTENSION_DAYS - currentExtension(row))

  const previewReturn = (row: Vacation, type: AdjustType, days: number): string => {
    const deduction = currentDeduction(row) + (type === 'deduct' ? days : 0)
    const extension = currentExtension(row) + (type === 'extend' ? days : 0)
    return effectiveReturnYmd(row.expectedReturnDate, deduction, extension)
  }

  const handleApplyAdjust = async (): Promise<void> => {
    if (!adjustRow) return
    const maxDays = adjustType === 'deduct' ? maxDeductNow(adjustRow) : maxExtendNow(adjustRow)
    const days = Math.trunc(Number(adjustDays) || 0)
    if (days < 1) {
      setAdjustError('أدخل عدد أيام صحيح (يوم واحد على الأقل)')
      return
    }
    if (days > maxDays) {
      setAdjustError(
        adjustType === 'deduct'
          ? `أقصى خصم متاح الآن ${maxDays} يوم (لازم تفضل يوم على الأقل من الإجازة)`
          : `أقصى مد متاح الآن ${maxDays} يوم`
      )
      return
    }

    const nextDeduction = currentDeduction(adjustRow) + (adjustType === 'deduct' ? days : 0)
    const nextExtension = currentExtension(adjustRow) + (adjustType === 'extend' ? days : 0)

    setAdjusting(true)
    setAdjustError(null)
    try {
      const res = await updateVacation(adjustRow.id, {
        deductionDays: nextDeduction,
        extensionDays: nextExtension
      })
      if (res.success) {
        closeAdjust()
        fetchVacations()
      } else {
        setAdjustError(res.message || 'فشل تعديل الإجازة')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setAdjustError(e.response?.data?.message || 'حدث خطأ أثناء تعديل الإجازة')
    } finally {
      setAdjusting(false)
    }
  }

  const typeOptions = [
    { value: 'إجازة سنوية', label: 'إجازة سنوية' },
    { value: 'إجازة ميدانية', label: 'إجازة ميدانية' },
    { value: 'إجازة مرضية', label: 'إجازة مرضية' },
    { value: 'إجازة عارضة', label: 'إجازة عارضة' },
    { value: 'مأمورية خارجية', label: 'مأمورية خارجية' }
  ]

  const statusBadgeVariants: Record<string, 'success' | 'danger' | 'warning' | 'primary'> = {
    معتمدة: 'success',
    مرفوضة: 'danger',
    معلقة: 'warning',
    نشطة: 'primary'
  }

  const columns: Column<Vacation>[] = [
    { key: 'vacationType', label: 'نوع الإجازة' },
    {
      key: 'cycle',
      label: 'الدورة',
      render: (row) => (row.cycle ? `كل ${row.cycle} يوم` : '—')
    },
    {
      key: 'startDate',
      label: 'تاريخ البدء',
      render: (row) => <span>{formatDateAr(row.startDate)}</span>
    },
    {
      key: 'expectedReturnDate',
      label: 'تاريخ العودة',
      render: (row) => {
        const effective = effectiveReturnYmd(
          row.expectedReturnDate,
          row.deductionDays,
          row.extensionDays
        )
        const adjusted = effective !== toYmdInput(row.expectedReturnDate)
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-white">{formatDateAr(effective)}</span>
            {adjusted && (
              <span className="text-[11px] text-gray-500">
                الأساسي: {formatDateAr(row.expectedReturnDate)}
              </span>
            )}
          </div>
        )
      }
    },
    {
      key: 'adjustments',
      label: 'خصم / مد',
      render: (row) => {
        const deduction = currentDeduction(row)
        const extension = currentExtension(row)
        if (!deduction && !extension) return <span className="text-gray-500">—</span>
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            {deduction > 0 && <span className="text-red-400 font-bold">خصم {deduction} يوم</span>}
            {extension > 0 && (
              <span className="text-emerald-400 font-bold">مد {extension} يوم</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'duration',
      label: 'مدة الإجازة (يوم)',
      render: (row) => {
        const effective = effectiveReturnYmd(
          row.expectedReturnDate,
          row.deductionDays,
          row.extensionDays
        )
        const d = leaveDurationDays(row.startDate, effective)
        return <span>{d} يوم</span>
      }
    },
    {
      key: 'status',
      label: 'التمام',
      render: (row) => (
        <Badge variant={statusBadgeVariants[row.status] || 'warning'}>{row.status}</Badge>
      )
    },
    { key: 'notes', label: 'الملاحظات' },
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
              className="p-1 text-red-400 hover:bg-red-500/10 rounded"
              onClick={() => openAdjust(row, 'deduct')}
              title="خصم أيام من هذه الإجازة"
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
          )}
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
              onClick={() => openAdjust(row, 'extend')}
              title="مد أيام لهذه الإجازة"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          )}
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-blue-400 hover:bg-blue-500/10 rounded"
              onClick={() => handleEdit(row)}
              title="تعديل السجل"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
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

  const adjustMax = adjustRow
    ? adjustType === 'deduct'
      ? maxDeductNow(adjustRow)
      : maxExtendNow(adjustRow)
    : 0
  const adjustDaysNumber = Math.trunc(Number(adjustDays) || 0)
  const adjustPreview =
    adjustRow && adjustDaysNumber > 0
      ? previewReturn(adjustRow, adjustType, Math.min(adjustDaysNumber, Math.max(adjustMax, 0)))
      : ''

  return (
    <div className="flex flex-col gap-6 text-start">
      <form
        onSubmit={handleSubmit}
        className="glassmorphism p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
      >
        <div className="md:col-span-1">
          <Select
            label="نوع الإجازة"
            options={typeOptions}
            value={vacationType}
            onChange={(e) => setVacationType(e.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="مدة التواجد بالقطاع قبل النزول (يوم)"
            type="number"
            min={1}
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            placeholder="28"
          />
        </div>
        <div>
          <Input
            label="تاريخ بدء الإجازة"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (!editingId) setExpectedReturnDate(addDaysYmd(e.target.value, 13))
            }}
          />
        </div>
        <div>
          <Input
            label="تاريخ العودة (تلقائي 14 يوم إجازة)"
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="ملاحظات / عذر الإجازة"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب تفاصيل إضافية..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            startIcon={editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {editingId ? 'تحديث الإجازة' : 'تسجيل إجازة'}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              إلغاء
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">سجلات وموافقات الإجازات</h4>
        <p className="text-xs text-gray-500">
          للخصم أو المد من إجازة مسجّلة: استخدم أزرار <span className="text-red-400">−</span> (خصم)
          و <span className="text-emerald-400">+</span> (مد) في عمود الإجراءات.
        </p>
        <Table columns={columns} data={vacations} loading={loading} />
      </div>

      {/* نافذة الخصم / المد على إجازة موجودة */}
      {adjustRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeAdjust}
        >
          <div
            className="w-full max-w-md glassmorphism rounded-xl border border-white/10 p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {adjustType === 'deduct' ? (
                <MinusCircle className="h-5 w-5 text-red-400" />
              ) : (
                <PlusCircle className="h-5 w-5 text-emerald-400" />
              )}
              <h3 className="text-lg font-black text-white">
                {adjustType === 'deduct' ? 'خصم أيام من الإجازة' : 'مد أيام للإجازة'}
              </h3>
            </div>

            <div className="text-sm text-gray-400 flex flex-col gap-1">
              <span>
                نوع الإجازة: <span className="text-gray-200">{adjustRow.vacationType}</span>
              </span>
              <span>
                من {formatDateAr(adjustRow.startDate)} إلى{' '}
                <span className="text-gray-200">
                  {formatDateAr(
                    effectiveReturnYmd(
                      adjustRow.expectedReturnDate,
                      adjustRow.deductionDays,
                      adjustRow.extensionDays
                    )
                  )}
                </span>
              </span>
              {(currentDeduction(adjustRow) > 0 || currentExtension(adjustRow) > 0) && (
                <span className="text-xs">
                  الحالي:{' '}
                  {currentDeduction(adjustRow) > 0 && (
                    <span className="text-red-400">خصم {currentDeduction(adjustRow)} يوم</span>
                  )}
                  {currentDeduction(adjustRow) > 0 && currentExtension(adjustRow) > 0 && ' / '}
                  {currentExtension(adjustRow) > 0 && (
                    <span className="text-emerald-400">مد {currentExtension(adjustRow)} يوم</span>
                  )}
                </span>
              )}
            </div>

            <Input
              label={`عدد الأيام (${adjustType === 'deduct' ? 'خصم' : 'مد'}) — المتاح ${adjustMax} يوم`}
              type="number"
              min={1}
              max={Math.max(adjustMax, 1)}
              value={adjustDays}
              onChange={(e) => setAdjustDays(e.target.value)}
            />

            {adjustPreview && (
              <div className="rounded-lg bg-military-900/60 border border-white/5 px-4 py-2 text-sm">
                <span className="text-gray-400">العودة بعد التعديل: </span>
                <span className="font-black text-emerald-400">{formatDateAr(adjustPreview)}</span>
              </div>
            )}

            {adjustError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg text-xs font-bold">
                {adjustError}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <Button variant="secondary" onClick={closeAdjust} disabled={adjusting}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handleApplyAdjust}
                loading={adjusting}
                disabled={adjustMax <= 0}
              >
                {adjustType === 'deduct' ? 'تأكيد الخصم' : 'تأكيد المد'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
