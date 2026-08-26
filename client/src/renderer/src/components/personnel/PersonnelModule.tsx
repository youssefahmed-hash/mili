import React, { useEffect, useState } from 'react'
import { usePersonnelStore } from '../../store/personnelStore'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { PersonnelToolbar } from './PersonnelToolbar'
import { PersonnelTable } from './PersonnelTable'
import { PersonnelFormModal } from './PersonnelFormModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { ProfileDrawer } from './ProfileDrawer/ProfileDrawer'
import { Tabs } from '../ui/Tabs'
import { CATEGORY_TABS, TAB_RANK_MAP } from '../../constants/categories'
import type { Personnel } from '../../types/personnel'

export const PersonnelModule: React.FC = () => {
  const { searchQuery } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const {
    personnelList,
    fetchPersonnelList,
    pagination,
    loading,
    filters,
    setFilters,
    setSelectedPersonnel
  } = usePersonnelStore()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('soldier')

  const [editTarget, setEditTarget] = useState<Personnel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Personnel | null>(null)
  const [viewTargetId, setViewTargetId] = useState<string | null>(null)

  useEffect(() => {
    setFilters({ ranks: TAB_RANK_MAP[activeTab].join(',') })
  }, [activeTab, setFilters])

  useEffect(() => {
    fetchPersonnelList(searchQuery, 1)
  }, [searchQuery, filters, fetchPersonnelList])

  const handlePageChange = (page: number): void => {
    fetchPersonnelList(searchQuery, page)
  }

  const handleAddClick = (): void => {
    setEditTarget(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (personnel: Personnel): void => {
    setEditTarget(personnel)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (personnel: Personnel): void => {
    setDeleteTarget(personnel)
    setIsDeleteOpen(true)
  }

  const handleViewClick = (personnel: Personnel): void => {
    setViewTargetId(personnel.id)
    setSelectedPersonnel(personnel)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header Area */}
      <div className="flex flex-col text-start">
        <h2 className="text-2xl font-black text-white">
          {user?.userType === 'داخلية'
            ? 'إدارة شؤون المجندين'
            : 'إدارة شؤون ضباط وأفراد القوات المسلحة'}
        </h2>
        <p className="text-sm text-gray-400">
          إضافة وتعديل بيانات الأفراد العسكريين، ومتابعة سجلات إجازاتهم، مستنداتهم ونماذج شؤون
          الأفراد الخاصة بهم.
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs tabs={CATEGORY_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Toolbar Filters + Add button */}
      <PersonnelToolbar onAddClick={handleAddClick} />

      {/* Personnel Listing Table */}
      <PersonnelTable
        loading={loading}
        data={personnelList}
        pagination={pagination}
        onPageChange={handlePageChange}
        onViewClick={handleViewClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />

      {/* Form Modal (Create / Edit) */}
      {isFormOpen && (
        <PersonnelFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          target={editTarget}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          target={deleteTarget}
        />
      )}

      {/* Side Drawer for Personnel Profile Detail view */}
      {isDrawerOpen && viewTargetId && (
        <ProfileDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setViewTargetId(null)
          }}
          personnelId={viewTargetId}
        />
      )}
    </div>
  )
}
