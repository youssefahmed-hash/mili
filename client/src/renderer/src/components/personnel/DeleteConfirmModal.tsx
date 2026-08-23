import React, { useState } from 'react'
import { usePersonnelStore } from '../../store/personnelStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { AlertTriangle } from 'lucide-react'
import type { Personnel } from '../../types/personnel'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  target: Personnel | null
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  target
}) => {
  const { removePersonnel, fetchPersonnelList, error: storeError } = usePersonnelStore()
  const [loading, setLoading] = useState(false)

  if (!target) return null

  const handleDelete = async (): Promise<void> => {
    setLoading(true)
    const success = await removePersonnel(target.id)
    setLoading(false)
    if (success) {
      fetchPersonnelList()
      onClose()
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        إلغاء
      </Button>
      <Button variant="danger" onClick={handleDelete} loading={loading}>
        تأكيد الحذف النهائي
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تأكيد حذف سجل الفرد العسكري"
      footer={footer}
      size="sm"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-3 bg-red-500/10 rounded-full text-red-500">
          <AlertTriangle className="h-10 w-10 animate-bounce" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-white mb-2">هل أنت متأكد من الحذف؟</h4>
          <p className="text-sm text-gray-400">
            أنت على وشك حذف سجل الفرد العسكري:{' '}
            <strong className="text-white">{target.fullName}</strong> (الرقم العسكري:{' '}
            {target.militaryId}) نهائياً من النظام.
          </p>
          <p className="text-xs text-red-400 mt-3 font-semibold bg-red-500/5 p-2 rounded border border-red-500/10">
            تحذير: سيتم حذف كافة المستندات، سجل الإجازات والنماذج العسكرية المرتبطة بهذا الفرد ولا
            يمكن استرجاعها.
          </p>
        </div>
        {storeError && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs font-bold">
            {storeError}
          </div>
        )}
      </div>
    </Modal>
  )
}
