import React from 'react'
import { UserPlus, FilterX } from 'lucide-react'
import { usePersonnelStore } from '../../store/personnelStore'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

interface PersonnelToolbarProps {
  onAddClick: () => void
}

export const PersonnelToolbar: React.FC<PersonnelToolbarProps> = ({ onAddClick }) => {
  const { filters, setFilters, clearFilters } = usePersonnelStore()

  const statusOptions = [
    { value: '', label: 'كل الحالات' },
    { value: 'داخل القطاع', label: 'داخل القطاع' },
    { value: 'اجازه', label: 'اجازه' },
    { value: 'ماموريه', label: 'ماموريه' },
    { value: 'ملحق منطقه', label: 'ملحق منطقه' },
    { value: 'ملحق جهاز سطع', label: 'ملحق جهاز سطع' },
    { value: 'ملحق جهاز الامن', label: 'ملحق جهاز الامن' },
    { value: 'ملحق ك9', label: 'ملحق ك9' },
    { value: 'مسح امن جهاز', label: 'مسح امن جهاز' },
    { value: 'مسح امنى مركز تدريب', label: 'مسح امنى مركز تدريب' },
    { value: 'عرض مستشفى', label: 'عرض مستشفى' },
    { value: 'غياب', label: 'غياب' },
    { value: 'علامه 91', label: 'علامه 91' },
    { value: 'نويبع', label: 'نويبع' }
  ]

  const unitOptions = [
    { value: '', label: 'كل الوحدات' },
    { value: 'الكتيبة الأولى', label: 'الكتيبة الأولى' },
    { value: 'الكتيبة الثانية', label: 'الكتيبة الثانية' },
    { value: 'الكتيبة الثالثة', label: 'الكتيبة الثالثة' },
    { value: 'اللواء الرابع عشر', label: 'اللواء الرابع عشر' },
    { value: 'قيادة المنطقة الشرقية', label: 'قيادة المنطقة الشرقية' },
    { value: 'مقر القيادة العامة', label: 'مقر القيادة العامة' }
  ]

  const handleFilterChange = (key: string, value: string): void => {
    setFilters({ [key]: value || undefined })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined)

  return (
    <div className="glassmorphism p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="w-[160px]">
          <Select
            options={unitOptions}
            value={filters.unit || ''}
            onChange={(e) => handleFilterChange('unit', e.target.value)}
          />
        </div>
        <div className="w-[140px]">
          <Select
            options={statusOptions}
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-400 hover:text-red-300 font-semibold"
            startIcon={<FilterX className="h-4 w-4" />}
          >
            إعادة تعيين
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full md:w-auto flex justify-end">
        <Button
          variant="primary"
          onClick={onAddClick}
          startIcon={<UserPlus className="h-4.5 w-4.5" />}
        >
          إضافة فرد عسكري جديد
        </Button>
      </div>
    </div>
  )
}
