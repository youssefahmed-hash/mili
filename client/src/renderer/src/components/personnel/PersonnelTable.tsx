import React from 'react'
import { Eye, Edit3, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { Personnel } from '../../types/personnel'

interface PersonnelTableProps {
  loading: boolean
  data: Personnel[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onViewClick: (row: Personnel) => void
  onEditClick: (row: Personnel) => void
  onDeleteClick: (row: Personnel) => void
}

export const PersonnelTable: React.FC<PersonnelTableProps> = ({
  loading,
  data,
  pagination,
  onPageChange,
  onViewClick,
  onEditClick,
  onDeleteClick
}) => {
  const statusBadgeVariants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    'داخل القطاع': 'success',
    اجازه: 'warning',
    ماموريه: 'secondary',
    'عرض مستشفى': 'danger',
    غياب: 'danger',
    'علامه 91': 'warning'
  }

  const columns: Column<Personnel>[] = [
    {
      key: 'fullName',
      label: 'الاسم بالكامل',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.photo ? (
            <img
              src={`http://localhost:5000${row.photo}`}
              alt={row.fullName}
              className="h-9 w-9 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-military-700 flex items-center justify-center border border-white/5 text-gray-300 font-bold">
              {row.fullName.charAt(0)}
            </div>
          )}
          <span
            className="font-bold text-white hover:text-military-primary transition-colors cursor-pointer"
            onClick={() => onViewClick(row)}
          >
            {row.fullName}
          </span>
        </div>
      )
    },
    { key: 'rank', label: 'الرتبة' },
    { key: 'militaryId', label: 'الرقم العسكري' },
    { key: 'unit', label: 'قسم - نقطه' },
    {
      key: 'status',
      label: 'الحالة',
      render: (row) => (
        <Badge variant={statusBadgeVariants[row.status] || 'success'}>{row.status}</Badge>
      )
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
            onClick={() => onViewClick(row)}
            title="عرض الملف الكامل"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
            onClick={() => onEditClick(row)}
            title="تعديل البيانات"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            onClick={() => onDeleteClick(row)}
            title="حذف السجل"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const hasPreviousPage = pagination.page > 1
  const hasNextPage = pagination.page < pagination.totalPages

  return (
    <div className="flex flex-col gap-4">
      <Table columns={columns} data={data} loading={loading} />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border border-white/5 bg-military-800/20 px-6 py-4 rounded-lg">
          <span className="text-sm text-gray-400 font-semibold">
            عرض الصفحة <strong className="text-white">{pagination.page}</strong> من أصل{' '}
            <strong className="text-white">{pagination.totalPages}</strong> (إجمالي{' '}
            <strong className="text-white">{pagination.total}</strong> سجل)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasPreviousPage}
              onClick={() => onPageChange(pagination.page - 1)}
              startIcon={<ChevronRight className="h-4 w-4" />}
            >
              السابق
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => onPageChange(pagination.page + 1)}
              endIcon={<ChevronLeft className="h-4 w-4" />}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
