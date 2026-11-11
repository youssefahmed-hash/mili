import React, { useState, useCallback } from 'react'
import { getPharmacyFEFO } from '../../../api/pharmacy.api'
import { Table, Column } from '../../ui/Table'
import { Modal } from '../../ui/Modal'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { DrugSelect } from '../../ui/DrugSelect'
import { Pill, Plus, Trash2, Info } from 'lucide-react'
import type {
  PharmacyDrug,
  PharmacyUnit,
  DispenseLine,
  PharmacyFEFO,
  PharmacyBatch
} from '../../../types/personnel'

interface Props {
  lines: DispenseLine[]
  onChange: (lines: DispenseLine[]) => void
  canDispense: boolean
}

export const DispenseEditor: React.FC<Props> = ({ lines, onChange, canDispense }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  // الفاتورة الصغيرة: اختيار دواء
  const [picked, setPicked] = useState<PharmacyDrug | null>(null)
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState<PharmacyUnit>('علبة')
  const [fefo, setFefo] = useState<PharmacyFEFO | null>(null)
  const [manualBatchId, setManualBatchId] = useState<string>('')
  const [pickerError, setPickerError] = useState<string | null>(null)

  const openPicker = (): void => {
    setPicked(null)
    setQty(1)
    setManualBatchId('')
    setFefo(null)
    setPickerError(null)
    setIsPickerOpen(true)
  }

  const onDrugPicked = useCallback((d: PharmacyDrug) => {
    setPicked(d)
    setUnit(d.unitsAvailable[0] || 'حبة')
    setFefo(null)
    setManualBatchId('')
    // نجيب الدفعات مرتبة FEFO لتعرض الصلاحية قبل الإضافة
    void getPharmacyFEFO(d.id).then((res) => {
      if (res.success) {
        setFefo(res.data)
        setManualBatchId(res.data.batches.find((b) => b.isClosest)?.id || '')
      }
    })
  }, [])

  const addLine = (): void => {
    if (!picked) {
      setPickerError('اختر الصنف')
      return
    }
    if (!qty || qty < 1) {
      setPickerError('الكمية لازم تكون أكبر من صفر')
      return
    }
    if (lines.some((l) => l.drugId === picked.id)) {
      setPickerError('الصنف مضاف بالفعل — عدّل الكمية من الجدول')
      return
    }
    const batch = fefo?.batches.find((b) => b.id === manualBatchId) || fefo?.batches[0]
    onChange([
      ...lines,
      {
        drugId: picked.id,
        drugName: picked.name,
        drugCode: picked.code,
        qty,
        unit,
        batchId: batch?.id ?? null,
        expiryDate: batch?.expiryDate ?? null
      }
    ])
    setIsPickerOpen(false)
  }

  const updateLine = (drugId: string, patch: Partial<DispenseLine>): void => {
    onChange(lines.map((l) => (l.drugId === drugId ? { ...l, ...patch } : l)))
  }

  const removeLine = (drugId: string): void => {
    onChange(lines.filter((l) => l.drugId !== drugId))
  }

  const columns: Column<DispenseLine>[] = [
    {
      key: 'drug',
      label: 'الصنف',
      render: (l) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{l.drugName}</span>
          {l.drugCode && <span className="text-xs font-mono text-military-accent">{l.drugCode}</span>}
        </div>
      )
    },
    {
      key: 'unit',
      label: 'الوحدة',
      render: (l) => (
        <Select
          options={(l.unit === 'حبة'
            ? ['حبة', 'شريط', 'علبة', 'كرتونة']
            : [l.unit, 'حبة', 'شريط', 'علبة', 'كرتونة']
          )
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .map((u) => ({ value: u, label: u }))}
          value={l.unit}
          onChange={(e) => updateLine(l.drugId, { unit: e.target.value as PharmacyUnit })}
          className="py-1 text-xs"
        />
      )
    },
    {
      key: 'qty',
      label: 'الكمية',
      render: (l) => (
        <Input
          type="number"
          min={1}
          value={l.qty}
          onChange={(e) => updateLine(l.drugId, { qty: parseInt(e.target.value, 10) || 1 })}
          className="py-1 text-xs"
        />
      )
    },
    {
      key: 'expiry',
      label: 'الصلاحية',
      render: (l) =>
        l.expiryDate ? (
          <span className="text-xs text-gray-300">{l.expiryDate}</span>
        ) : (
          <span className="text-xs text-amber-400">اختيار تلقائي (FEFO)</span>
        )
    },
    ...(canDispense
      ? [
          {
            key: 'actions',
            label: '',
            align: 'center' as const,
            render: (l: DispenseLine) => (
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                onClick={() => removeLine(l.drugId)}
                title="حذف السطر"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )
          }
        ]
      : [])
  ]

  const hasMultiBatchWarning = fefo?.hasMultipleBatches ?? false

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-military-accent/25 bg-military-accent/5 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-military-accent">
          <Pill className="h-4 w-4" /> صرف دواء
        </span>
        {canDispense && (
          <Button variant="secondary" size="sm" startIcon={<Plus className="h-3.5 w-3.5" />} onClick={openPicker}>
            إضافة دواء
          </Button>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="text-xs text-gray-500">
          {canDispense ? 'اختياري — لو مفيش صرف دوا سيب القسم فاضي' : 'مفيش أصناف مصروفة'}
        </p>
      ) : (
        <Table columns={columns} data={lines} dense />
      )}

      {/* مودال اختيار دواء */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="إضافة دواء للصرف"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPickerOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={addLine} startIcon={<Plus className="h-4 w-4" />}>
              إضافة للصرف
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DrugSelect
            label="ابحث بالاسم أو الكود *"
            value={picked?.id || ''}
            onChange={() => setPicked(null)}
            onSelect={onDrugPicked}
            inStockOnly
            required
            placeholder="مثال: بنادول أو BND1042"
          />

          {picked && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="الوحدة"
                  options={picked.unitsAvailable.map((u) => ({ value: u, label: u }))}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as PharmacyUnit)}
                />
                <Input
                  label="الكمية"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              {/* FEFO — الدفعات مرتبة بالأقرب انتهاءً */}
              {fefo && fefo.batches.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-military-900/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-bold text-gray-300">
                      {fefo.batches.length === 1
                        ? 'شحنة واحدة في المخزون'
                        : `هذا الصنف فيه ${fefo.batches.length} شحنات — الأقرب انتهاءً أولاً`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {fefo.batches.map((b: PharmacyBatch) => (
                      <label
                        key={b.id}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs cursor-pointer ${
                          manualBatchId === b.id
                            ? 'bg-military-primary/20 border border-military-accent/50'
                            : 'border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={manualBatchId === b.id}
                            onChange={() => setManualBatchId(b.id)}
                            className="accent-military-primary"
                          />
                          <span className="text-gray-200">{b.expiryDate}</span>
                          <span className="text-gray-400">
                            متاح {b.remainingDisplay?.علبة || 0} علبة
                          </span>
                        </span>
                        {b.isClosest && <Badge variant="warning">الأقرب انتهاءً</Badge>}
                      </label>
                    ))}
                  </div>
                  {fefo.batches.length === 0 && (
                    <p className="text-xs text-red-400">
                      كل شحنات هذا الصنف منتهية الصلاحية — مش هيتصرف
                    </p>
                  )}
                </div>
              )}

              {hasMultiBatchWarning && (
                <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                  لو الكمية أكبر من رصيد الشحنة الأقرب، هيتم تقسيم الصرف على أكتر من شحنة وهيسألك قبل الحفظ.
                </p>
              )}
            </>
          )}

          {pickerError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs font-bold">
              {pickerError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
