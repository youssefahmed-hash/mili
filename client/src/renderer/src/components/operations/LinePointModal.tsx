import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { LinePoint } from '../../types/personnel'

interface LinePointModalProps {
  isOpen: boolean
  onClose: () => void
  point?: LinePoint | null
  onSubmit: (data: Partial<LinePoint>) => Promise<boolean>
}

export const LinePointModal: React.FC<LinePointModalProps> = ({
  isOpen,
  onClose,
  point,
  onSubmit
}) => {
  const isEdit = !!point
  const [name, setName] = useState(point?.name || '')
  const [description, setDescription] = useState(point?.description || '')
  const [order, setOrder] = useState(point?.order?.toString() || '1')
  const [isActive, setIsActive] = useState(point?.isActive ?? true)
  const [hasOfficeDuty, setHasOfficeDuty] = useState(point?.hasOfficeDuty ?? false)
  const [submitting, setSubmitting] = useState(false)

  // المودال بيفضل mounted — لازم نعبّي الحقول من جديد كل ما يفتح (خصوصًا للتعديل)
  useEffect(() => {
    if (!isOpen) return
    setName(point?.name || '')
    setDescription(point?.description || '')
    setOrder(point?.order?.toString() || '1')
    setIsActive(point?.isActive ?? true)
    setHasOfficeDuty(point?.hasOfficeDuty ?? false)
    setSubmitting(false)
  }, [isOpen, point])

  const handleSubmit = async () => {
    if (!name) return
    setSubmitting(true)
    const success = await onSubmit({
      name,
      description: description || null,
      order: parseInt(order) || 1,
      isActive,
      hasOfficeDuty
    })
    setSubmitting(false)
    if (success) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'تعديل النقطة' : 'إضافة نقطة جديدة'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button variant="accent" onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="اسم النقطة *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: نقطة 1 - الكوبري"
        />
        <Input
          label="الوصف"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف اختياري للنقطة"
        />
        <Input
          label="الترتيب"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          min={1}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          <label className="text-sm text-gray-300">نشطة</label>
        </div>
        <div className="flex items-start gap-2 bg-military-900/50 border border-white/5 rounded-lg p-3">
          <input
            type="checkbox"
            checked={hasOfficeDuty}
            onChange={(e) => setHasOfficeDuty(e.target.checked)}
            className="rounded mt-0.5"
          />
          <div className="flex flex-col gap-0.5">
            <label className="text-sm text-gray-200 font-bold">قسم المكتب في النقطة</label>
            <span className="text-xs text-gray-500">
              يضيف قسم «مكتب» في شبكة الخط اليومي، تقدر من فيه تحدد أي فرد في النقطة
              وتحوّله إجازة أو حاضر. مش كل النقط ليها قسم مكتب.
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
