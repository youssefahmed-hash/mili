import React, { useState } from 'react'
import { Eye, Edit3, Trash2, FilePlus, ChevronRight, ChevronLeft, Printer } from 'lucide-react'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'
import { printPersonnelDossier } from './PersonnelDossier'
import { displayRank } from '../../utils/rankDisplay'
import type { Personnel } from '../../types/personnel'
import { resolveFileUrl } from '../../utils/fileUrl'
import { isManager } from '../../constants/permissions'

// مؤثرات القوة — تظهر كـ badge جنب اسم الفرد زي كلمة «مستجد»
const CONDITION_BADGES: { key: keyof Personnel; label: string; className: string }[] = [
  {
    key: 'condWeaponBan',
    label: 'منع سلاح',
    className: 'text-red-300 bg-red-500/15 border-red-500/30'
  },
  {
    key: 'condNeuro',
    label: 'نفسية وعصبية',
    className: 'text-violet-300 bg-violet-500/15 border-violet-500/30'
  },
  {
    key: 'condStruckDischarged',
    label: 'شطب مسرح',
    className: 'text-orange-300 bg-orange-500/15 border-orange-500/30'
  },
  {
    key: 'condStruckRetained',
    label: 'شطب غير مسرح',
    className: 'text-amber-300 bg-amber-500/15 border-amber-500/30'
  }
]

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
  onCompleteClick: (row: Personnel) => void
  onDeleteClick: (row: Personnel) => void
  canManage?: boolean
}

export const PersonnelTable: React.FC<PersonnelTableProps> = ({
  loading,
  data,
  pagination,
  onPageChange,
  onViewClick,
  onEditClick,
  onCompleteClick,
  onDeleteClick,
  canManage = true
}) => {
  const user = useAuthStore((s) => s.user)
  const isAdmin = isManager(user)
  const [printingId, setPrintingId] = useState<string | null>(null)

  const handlePrintDossier = async (row: Personnel): Promise<void> => {
    if (printingId) return
    setPrintingId(row.id)
    try {
      await printPersonnelDossier(row.id, user?.fullName || user?.username || 'المدير')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`فشل طباعة الملف الشامل: ${msg}`)
    } finally {
      setPrintingId(null)
    }
  }

  const statusBadgeVariants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    'داخل القطاع': 'success',
    اجازه: 'warning',
    ماموريه: 'secondary',
    'عرض مستشفى': 'danger',
    'مستشفى خارجي': 'danger',
    محكمه: 'danger',
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
              src={resolveFileUrl(row.photo) || ''}
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
          {(row.personnelType || '').includes('مستجد') && (
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded px-1.5 py-0.5">
              مستجد
            </span>
          )}
          {CONDITION_BADGES.filter((c) => Boolean(row[c.key])).map((c) => (
            <span
              key={c.key}
              className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${c.className}`}
            >
              {c.key === 'condWeaponBan' ? row.weaponBanType || c.label : c.label}
            </span>
          ))}
        </div>
      )
    },
    { key: 'rank', label: 'الرتبة', render: (row) => displayRank(row.rank, row.personnelType) },
    { key: 'militaryId', label: 'الرقم العسكري' },
    { key: 'unit', label: 'القسم', render: (row) => row.unit || 'بدون قسم' },
    { key: 'sectorDistribution', label: 'التوزيع', render: (row) => row.sectorDistribution || '—' },
    {
      key: 'workBeforeEnlistment',
      label: 'العمل قبل التجنيد',
      render: (row) => row.workBeforeEnlistment || '—'
    },
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
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
              onClick={() => handlePrintDossier(row)}
              disabled={printingId === row.id}
              title="طباعة الملف الشامل (PDF)"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
              onClick={() => onEditClick(row)}
              title="تعديل البيانات"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
            onClick={() => onCompleteClick(row)}
            title="استكمال بيانات (إضافة فقط)"
          >
            <FilePlus className="h-4 w-4" />
          </Button>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              onClick={() => onDeleteClick(row)}
              title="حذف السجل"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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
