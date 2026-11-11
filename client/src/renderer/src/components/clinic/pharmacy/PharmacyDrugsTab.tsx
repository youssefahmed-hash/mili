import React, { useState, useEffect, useCallback } from 'react'
import {
  getPharmacyDrugs,
  createPharmacyDrug,
  updatePharmacyDrug,
  deletePharmacyDrug,
  type PharmacyDrugPayload
} from '../../../api/pharmacy.api'
import { Table, Column } from '../../ui/Table'
import { Modal } from '../../ui/Modal'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { ClickableStatCard } from '../../ui/ClickableStatCard'
import { Pill, Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'
import type { PharmacyDrug } from '../../../types/personnel'

interface Props {
  canManage: boolean
}

const emptyForm = (): PharmacyDrugPayload => ({
  name: '',
  nameEn: '',
  code: '',
  barcode: '',
  allowCarton: false,
  allowBox: true,
  allowStrip: true,
  allowPill: true,
  pillsPerStrip: 10,
  stripsPerBox: 3,
  boxesPerCarton: 1,
  notes: ''
})

const UNIT_TOGGLES: { key: keyof PharmacyDrugPayload; label: string; hint: string }[] = [
  { key: 'allowCarton', label: 'كرتونة', hint: 'مثال: 12 علبة في الكرتونة' },
  { key: 'allowBox', label: 'علبة', hint: 'مثال: 3 شرايط في العلبة' },
  { key: 'allowStrip', label: 'شريط', hint: 'مثال: 10 حبات في الشريط' },
  { key: 'allowPill', label: 'حبة', hint: 'الوحدة الأساسية — دايماً' }
]

export const PharmacyDrugsTab: React.FC<Props> = ({ canManage }) => {
  const [drugs, setDrugs] = useState<PharmacyDrug[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [outOfStockOnly, setOutOfStockOnly] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<PharmacyDrug | null>(null)
  const [form, setForm] = useState<PharmacyDrugPayload>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async (term?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPharmacyDrugs(term || undefined)
      if (res.success) setDrugs(res.data || [])
    } catch {
      setError('فشل تحميل الأصناف')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    load()
  }, [load])

  // بحث مع تأخير بسيط
  useEffect(() => {
    const t = setTimeout(() => {
      load(search)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEdit = (d: PharmacyDrug) => {
    setEditing(d)
    setForm({
      name: d.name,
      nameEn: d.nameEn || '',
      code: d.code || '',
      barcode: d.barcode || '',
      allowCarton: d.allowCarton,
      allowBox: d.allowBox,
      allowStrip: d.allowStrip,
      allowPill: d.allowPill,
      pillsPerStrip: d.pillsPerStrip,
      stripsPerBox: d.stripsPerBox,
      boxesPerCarton: d.boxesPerCarton,
      notes: d.notes || ''
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) {
      setFormError('اسم الدواء مطلوب')
      return
    }
    if (!form.allowCarton && !form.allowBox && !form.allowStrip && !form.allowPill) {
      setFormError('لازم تختار وحدة صرف واحدة على الأقل')
      return
    }
    setSubmitting(true)
    try {
      const payload = { ...form, name: form.name.trim() }
      const res = editing
        ? await updatePharmacyDrug(editing.id, payload)
        : await createPharmacyDrug(payload)
      if (res.success) {
        setIsModalOpen(false)
        await load(search)
      } else {
        setFormError(res.message || 'فشل الحفظ')
      }
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setFormError(ex.response?.data?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (d: PharmacyDrug): Promise<void> => {
    if (!confirm(`حذف الصنف «${d.name}»؟`)) return
    try {
      const res = await deletePharmacyDrug(d.id)
      if (!res.success) {
        setError(res.message || 'فشل الحذف')
        return
      }
      await load(search)
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setError(ex.response?.data?.message || 'فشل الحذف')
    }
  }

  const visible = outOfStockOnly ? drugs.filter((d) => d.outOfStock) : drugs
  const inStock = drugs.filter((d) => d.inStock).length
  const noBreakdown = drugs.filter((d) => d.pillsPerStrip <= 1 && d.stripsPerBox <= 1 && d.boxesPerCarton <= 1).length

  const columns: Column<PharmacyDrug>[] = [
    {
      key: 'name',
      label: 'الصنف',
      render: (d) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{d.name}</span>
          {d.nameEn && <span className="text-xs text-gray-400">{d.nameEn}</span>}
        </div>
      )
    },
    {
      key: 'code',
      label: 'الكود',
      render: (d) =>
        d.code ? (
          <span className="font-mono text-military-accent">{d.code}</span>
        ) : (
          <span className="text-gray-500">—</span>
        )
    },
    {
      key: 'units',
      label: 'وحدات الصرف',
      render: (d) => (
        <div className="flex flex-wrap gap-1">
          {d.unitsAvailable.map((u) => (
            <Badge key={u} variant="secondary">
              {u}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'breakdown',
      label: 'التقسيم',
      render: (d) => (
        <span className="text-xs text-gray-300 whitespace-nowrap">
          {d.breakdown.boxesPerCarton > 1 && (
            <>كرتونة={d.breakdown.boxesPerCarton} علبة · </>
          )}
          {d.breakdown.stripsPerBox > 1 && <>علبة={d.breakdown.stripsPerBox} شريط · </>}
          شريط={d.breakdown.pillsPerStrip} حبة
        </span>
      )
    },
    {
      key: 'stock',
      label: 'المتاح',
      render: (d) =>
        d.outOfStock ? (
          <Badge variant="danger">خلص</Badge>
        ) : (
          <div className="flex flex-col">
            <span className="text-emerald-300 font-bold">
              {d.stockDisplay?.علبة || 0} علبة
            </span>
            <span className="text-xs text-gray-400">{d.stockPills} حبة</span>
          </div>
        )
    },
    {
      key: 'expiry',
      label: 'أقرب صلاحية',
      render: (d) =>
        d.closestExpiry ? (
          <span className="text-xs text-gray-300">{d.closestExpiry}</span>
        ) : (
          <span className="text-gray-500">—</span>
        )
    },
    {
      key: 'batches',
      label: 'الشحنات',
      render: (d) => <span className="text-gray-300">{d.batchCount}</span>
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            label: 'الإجراءات',
            align: 'center' as const,
            render: (d: PharmacyDrug) => (
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 text-gray-400 hover:text-military-accent hover:bg-military-primary/10 rounded"
                  onClick={() => openEdit(d)}
                  title="تعديل الصنف"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                  onClick={() => remove(d)}
                  title="حذف الصنف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        ]
      : [])
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* كروت */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ClickableStatCard
          label="إجمالي الأصناف"
          value={drugs.length}
          tone="text-white"
          icon={<Pill className="h-5 w-5" />}
          hint={outOfStockOnly ? 'عرض الكل' : 'عرض الكل'}
          onClick={outOfStockOnly ? () => setOutOfStockOnly(false) : undefined}
        />
        <ClickableStatCard
          label="متاح في المخزون"
          value={inStock}
          tone="text-emerald-400"
          icon={<Package className="h-5 w-5" />}
          hint="اضغط لعرض اللي خلص"
          onClick={() => setOutOfStockOnly((p) => !p)}
        />
        <ClickableStatCard
          label="بدون تقسيم"
          value={noBreakdown}
          tone="text-amber-400"
          icon={<AlertTriangle className="h-5 w-5" />}
          hint="أصناف حبة واحدة — راجع التقسيم"
        />
      </div>

      {/* شريط الأدوات */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            label="بحث"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="اسم الدواء أو الكود..."
          />
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              ✕
            </Button>
          )}
        </div>
        {canManage && (
          <Button variant="primary" startIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            صنف جديد
          </Button>
        )}
      </div>

      {outOfStockOnly && (
        <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
          <span className="text-sm font-bold text-white">عرض الأصناف اللي خلص مخزونها ({visible.length})</span>
          <Button variant="ghost" size="sm" onClick={() => setOutOfStockOnly(false)}>
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

      {/* مودال الصنف */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? `تعديل صنف: ${editing.name}` : 'إضافة صنف دواء جديد'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={submit} loading={submitting}>
              {editing ? 'حفظ التعديلات' : 'إضافة الصنف'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="اسم الدواء *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: بنادول"
            />
            <Input
              label="الكود"
              value={form.code ?? ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="مثال: BND1042"
              warning={form.code ? undefined : 'اختياري — لو فاضي مش هيت searchable'}
            />
            <Input
              label="الاسم بالإنجليزي"
              value={form.nameEn ?? ''}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder="مثال: Panadol"
            />
            <Input
              label="الباركود"
              value={form.barcode ?? ''}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              placeholder="اختياري"
            />
          </div>

          {/* وحدات الصرف */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-300">وحدات الصرف المتاحة</span>
            <div className="flex flex-wrap gap-2">
              {UNIT_TOGGLES.map((u) => {
                const active = !!form[u.key]
                return (
                  <button
                    key={u.key}
                    type="button"
                    title={u.hint}
                    onClick={() => setForm({ ...form, [u.key]: !active })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      active
                        ? 'bg-military-accent text-white border border-military-accent'
                        : 'bg-military-900/50 text-gray-300 border border-white/10 hover:border-military-accent/50'
                    }`}
                  >
                    {u.label}
                  </button>
                )
              })}
            </div>
            <span className="text-xs text-gray-500">
              اختر الوحدات اللي بتصرف بيها — الحبة دايماً متاحة وهي الوحدة الأساسية
            </span>
          </div>

          {/* التقسيم */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-300">تقسيم العبوة</span>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="حبة في الشريط"
                type="number"
                min={1}
                value={form.pillsPerStrip}
                onChange={(e) => setForm({ ...form, pillsPerStrip: parseInt(e.target.value, 10) || 1 })}
              />
              <Input
                label="شريط في العلبة"
                type="number"
                min={1}
                value={form.stripsPerBox}
                onChange={(e) => setForm({ ...form, stripsPerBox: parseInt(e.target.value, 10) || 1 })}
              />
              <Input
                label="علبة في الكرتونة"
                type="number"
                min={1}
                value={form.boxesPerCarton}
                onChange={(e) => setForm({ ...form, boxesPerCarton: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
            <div className="bg-military-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300">
              الحساب التلقائي: شريط = <b className="text-military-accent">{form.pillsPerStrip}</b> حبة · علبة ={' '}
              <b className="text-military-accent">{form.pillsPerStrip * form.stripsPerBox}</b> حبة · كرتونة ={' '}
              <b className="text-military-accent">
                {form.pillsPerStrip * form.stripsPerBox * form.boxesPerCarton}
              </b>{' '}
              حبة
            </div>
          </div>

          <Input
            label="ملاحظات"
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="اختياري"
          />

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