import React, { useState, useEffect, useCallback } from 'react'
import {
  getPharmacyBatches,
  createPharmacyBatch,
  deletePharmacyBatch,
  type PharmacyBatchPayload
} from '../../../api/pharmacy.api'
import { Table, Column } from '../../ui/Table'
import { Modal } from '../../ui/Modal'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { DrugSelect } from '../../ui/DrugSelect'
import { ClickableStatCard } from '../../ui/ClickableStatCard'
import { Package, Plus, Trash2, PackagePlus, AlertTriangle } from 'lucide-react'
import { PHARMACY_UNITS, toPills, type PharmacyBatch, type PharmacyDrug, type PharmacyUnit } from '../../../types/personnel'

interface Props {
  canManage: boolean
}

const todayYmd = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const PharmacyBatchesTab: React.FC<Props> = ({ canManage }) => {
  const [batches, setBatches] = useState<PharmacyBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'empty' | 'expired'>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [drug, setDrug] = useState<PharmacyDrug | null>(null)
  const [unit, setUnit] = useState<PharmacyUnit>('علبة')
  const [form, setForm] = useState({
    qtyReceived: 1,
    expiryDate: '',
    batchNumber: '',
    supplier: '',
    invoiceNo: '',
    purchaseDate: todayYmd(),
    purchasePrice: '',
    notes: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPharmacyBatches()
      if (res.success) setBatches(res.data || [])
    } catch {
      setError('فشل تحميل الشحنات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    load()
  }, [load])

  const openCreate = () => {
    setDrug(null)
    setUnit('علبة')
    setForm({
      qtyReceived: 1,
      expiryDate: '',
      batchNumber: '',
      supplier: '',
      invoiceNo: '',
      purchaseDate: todayYmd(),
      purchasePrice: '',
      notes: ''
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormError(null)
    if (!drug) {
      setFormError('اختر الصنف')
      return
    }
    if (!form.expiryDate) {
      setFormError('تاريخ انتهاء الصلاحية مطلوب')
      return
    }
    if (!form.qtyReceived || form.qtyReceived < 1) {
      setFormError('الكمية الواردة لازم تكون أكبر من صفر')
      return
    }
    setSubmitting(true)
    try {
      const payload: PharmacyBatchPayload = {
        drugId: drug.id,
        unit,
        qtyReceived: form.qtyReceived,
        expiryDate: form.expiryDate,
        batchNumber: form.batchNumber || null,
        supplier: form.supplier || null,
        invoiceNo: form.invoiceNo || null,
        purchaseDate: form.purchaseDate || null,
        purchasePrice: form.purchasePrice || null,
        notes: form.notes || null
      }
      const res = await createPharmacyBatch(payload)
      if (res.success) {
        setIsModalOpen(false)
        await load()
      } else {
        setFormError(res.message || 'فشل تسجيل الشحنة')
      }
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setFormError(ex.response?.data?.message || 'حدث خطأ أثناء التسجيل')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (b: PharmacyBatch): Promise<void> => {
    const name = b.drug?.name || 'الصنف'
    if (!confirm(`حذف شحنة «${name}» رقم ${b.batchNumber || '—'}؟`)) return
    try {
      const res = await deletePharmacyBatch(b.id)
      if (!res.success) {
        setError(res.message || 'فشل الحذف')
        return
      }
      await load()
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setError(ex.response?.data?.message || 'فشل الحذف')
    }
  }

  const today = todayYmd()
  const active = batches.filter((b) => b.qtyRemainingPills > 0 && b.expiryDate >= today)
  const empty = batches.filter((b) => b.qtyRemainingPills <= 0)
  const expired = batches.filter((b) => b.qtyRemainingPills > 0 && b.expiryDate < today)
  const totalPills = batches.reduce((s, b) => s + b.qtyRemainingPills, 0)

  const visible =
    filter === 'all' ? batches
    : filter === 'active' ? active
    : filter === 'empty' ? empty
    : expired

  const pillsPreview = drug ? toPills(unit, form.qtyReceived, drug.breakdown) : 0

  const columns: Column<PharmacyBatch>[] = [
    {
      key: 'drug',
      label: 'الصنف',
      render: (b) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{b.drug?.name || '—'}</span>
          {b.drug?.code && <span className="text-xs font-mono text-military-accent">{b.drug.code}</span>}
        </div>
      )
    },
    {
      key: 'batchNumber',
      label: 'رقم التشغيلة',
      render: (b) => <span className="text-xs text-gray-300">{b.batchNumber || '—'}</span>
    },
    {
      key: 'expiry',
      label: 'تاريخ الانتهاء',
      render: (b) => (
        <div className="flex flex-col">
          <span className="text-gray-200">{b.expiryDate}</span>
          {b.isExpired ? (
            <Badge variant="danger">منتهي</Badge>
          ) : b.daysToExpiry <= 92 ? (
            <span className="text-xs text-amber-400">{b.daysToExpiry} يوم</span>
          ) : (
            <span className="text-xs text-gray-500">{b.daysToExpiry} يوم</span>
          )}
        </div>
      )
    },
    {
      key: 'received',
      label: 'الوارد',
      render: (b) => (
        <span className="text-gray-300 whitespace-nowrap">
          {b.qtyReceived} {b.unit}
        </span>
      )
    },
    {
      key: 'remaining',
      label: 'المتبقي',
      render: (b) =>
        b.qtyRemainingPills <= 0 ? (
          <Badge variant="secondary">خلص</Badge>
        ) : (
          <div className="flex flex-col">
            <span className="text-emerald-300 font-bold">{b.remainingDisplay?.علبة || 0} علبة</span>
            <span className="text-xs text-gray-400">{b.qtyRemainingPills} حبة</span>
          </div>
        )
    },
    {
      key: 'supplier',
      label: 'المورد',
      render: (b) => <span className="text-xs text-gray-300">{b.supplier || '—'}</span>
    },
    {
      key: 'invoiceNo',
      label: 'رقم الفاتورة',
      render: (b) => <span className="text-xs text-gray-300">{b.invoiceNo || '—'}</span>
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            label: 'الإجراءات',
            align: 'center' as const,
            render: (b: PharmacyBatch) => (
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                onClick={() => remove(b)}
                title="حذف الشحنة"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )
          }
        ]
      : [])
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* كروت */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ClickableStatCard
          label="إجمالي الشحنات"
          value={batches.length}
          tone="text-white"
          icon={<Package className="h-5 w-5" />}
          hint="عرض الكل"
          onClick={() => setFilter('all')}
        />
        <ClickableStatCard
          label="شحنات فعالة"
          value={active.length}
          tone="text-emerald-400"
          icon={<PackagePlus className="h-5 w-5" />}
          hint="اضغط للفلترة"
          onClick={() => setFilter((f) => (f === 'active' ? 'all' : 'active'))}
        />
        <ClickableStatCard
          label="منتهية الصلاحية"
          value={expired.length}
          tone="text-red-400"
          icon={<AlertTriangle className="h-5 w-5" />}
          hint="اضغط للفلترة"
          onClick={() => setFilter((f) => (f === 'expired' ? 'all' : 'expired'))}
        />
        <ClickableStatCard
          label="إجمالي المتبقي"
          value={`${totalPills} حبة`}
          tone="text-sky-400"
          icon={<Package className="h-5 w-5" />}
          hint="مجموع كل الشحنات"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-lg font-bold text-white">سجل المشتريات (الشحنات)</h3>
        {canManage && (
          <Button variant="primary" startIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            فاتورة مشتريات جديدة
          </Button>
        )}
      </div>

      {filter !== 'all' && (
        <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
          <span className="text-sm font-bold text-white">
            عرض: {filter === 'active' ? 'الشحنات الفعالة' : filter === 'empty' ? 'الخلص' : 'المنتهية'} (
            {visible.length})
          </span>
          <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
            ✕ إلغاء الفلتر
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <Table columns={columns} data={visible} loading={loading} />

      {/* مودال فاتورة المشتريات */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="فاتورة مشتريات جديدة"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={submit} loading={submitting}>
              تسجيل الشحنة
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DrugSelect
            label="الصنف *"
            value={drug?.id || ''}
            onChange={(id) => {
              // onSelect هيجيب الكائن نفسه — هنا بنمسح لو الـid اتغيّر
              if (!id || id !== drug?.id) setDrug(null)
            }}
            onSelect={(d) => setDrug(d)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="وحدة الشراء"
              options={PHARMACY_UNITS.map((u) => ({ value: u, label: u }))}
              value={unit}
              onChange={(e) => setUnit(e.target.value as PharmacyUnit)}
            />
            <Input
              label="الكمية الواردة *"
              type="number"
              min={1}
              value={form.qtyReceived}
              onChange={(e) => setForm({ ...form, qtyReceived: parseInt(e.target.value, 10) || 0 })}
            />
            <Input
              label="تاريخ الانتهاء *"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>

          {drug && (
            <div className="bg-military-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300">
              {form.qtyReceived} {unit} = <b className="text-military-accent">{pillsPreview}</b> حبة
              {drug.breakdown.pillsPerStrip > 1 && (
                <> · المعادل {pillsPreview} / {drug.breakdown.pillsPerStrip} = {Math.ceil(pillsPreview / drug.breakdown.pillsPerStrip)} شريط</>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="رقم التشغيلة"
              value={form.batchNumber}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              placeholder="من علبة الدواء"
            />
            <Input
              label="تاريخ الشراء"
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
            />
            <Input
              label="المورد"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="اسم المورد"
            />
            <Input
              label="رقم فاتورة المورد"
              value={form.invoiceNo}
              onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              placeholder="اختياري"
            />
            <Input
              label="سعر شراء الوحدة"
              type="number"
              step="0.01"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              placeholder="اختياري — بيتخزّن بس"
            />
            <Input
              label="ملاحظات"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="اختياري"
            />
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
              {formError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}