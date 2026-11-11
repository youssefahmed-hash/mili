import React, { useState } from 'react'
import { UserPlus, FilterX, CalendarPlus, Search, X } from 'lucide-react'
import { usePersonnelStore } from '../../store/personnelStore'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { getDepartmentOptionsForUser } from '../../constants/departments'
import { TAMAM_OPTIONS } from '../../constants/personnelFields'

interface PersonnelToolbarProps {
  onAddClick: () => void
  onBulkClick?: () => void
}

export const PersonnelToolbar: React.FC<PersonnelToolbarProps> = ({ onAddClick, onBulkClick }) => {
  const { filters, setFilters, clearFilters } = usePersonnelStore()
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const authUser = useAuthStore((s) => s.user)
  // نص مكتوب فوراً، وبيتأخر ٣٠٠ مللي قبل ما يتبعت للسيرفر
  const [term, setTerm] = useState(searchQuery)

  React.useEffect(() => {
    const t = setTimeout(() => setSearchQuery(term), 300)
    return () => clearTimeout(t)
  }, [term, setSearchQuery])

  const statusOptions = [
    { value: '', label: 'كل الحالات' },
    ...TAMAM_OPTIONS
  ]

  // الأقسام حسب نوع المستخدم: حربية → حربية فقط، داخلية → داخلية فقط، الأدمن → القسمين
  const unitOptions = [
    { value: '', label: 'كل الأقسام' },
    ...getDepartmentOptionsForUser(authUser).map((o) => ({ value: o.value, label: o.label }))
  ]

  const handleFilterChange = (key: string, value: string): void => {
    setFilters({ [key]: value || undefined })
  }

  const hasActiveFilters = Boolean(
    filters.status ||
      filters.unit ||
      filters.sector ||
      filters.dischargeMonth ||
      filters.workBeforeEnlistment ||
      searchQuery
  )

  const handleReset = (): void => {
    setTerm('')
    setSearchQuery('')
    clearFilters()
  }

  return (
    <div className="glassmorphism p-4 rounded-xl flex flex-col gap-4">
      {/* البحث الذكي — الاسم / الرقم العسكري / القسم / الفصيلة / النوع / التليفون / التواريخ... */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearchQuery(term)
            }}
            placeholder="ابحث بالاسم، الرقم العسكري، القسم، الفصيلة، التليفون، التاريخ... (اكتب أكتر من كلمة للفلترة)"
            className="w-full bg-military-900/60 border border-white/10 rounded-lg py-2 pr-9 pl-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-military-accent/50"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm('')}
              title="مسح البحث"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="w-full md:w-auto flex justify-end gap-2">
          {onBulkClick && (
            <Button
              variant="secondary"
              onClick={onBulkClick}
              startIcon={<CalendarPlus className="h-4 w-4" />}
            >
              تسجيل إجازة
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onAddClick}
            startIcon={<UserPlus className="h-4.5 w-4.5" />}
          >
            إضافة فرد عسكري جديد
          </Button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-3 w-full">
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
        <div className="w-[160px]">
          <Input
            placeholder="بحث بتوزيع القطاع..."
            value={filters.sector || ''}
            onChange={(e) => handleFilterChange('sector', e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-red-400 hover:text-red-300 font-semibold"
            startIcon={<FilterX className="h-4 w-4" />}
          >
            إعادة تعيين
          </Button>
        )}

        {/* آخر حقلين من الشمال: تاريخ التسريح (شهر/سنة) + العمل قبل التجنيد */}
        <div className="w-[190px] flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-400">
            بحث بتاريخ التسريح (شهر/سنة)
          </span>
          <Input
            type="month"
            title="بحث بتاريخ التسريح — اختر الشهر والسنة"
            value={filters.dischargeMonth || ''}
            onChange={(e) => handleFilterChange('dischargeMonth', e.target.value)}
          />
        </div>
        <div className="w-[190px]">
          <Input
            type="search"
            title="بحث بالعمل قبل التجنيد"
            placeholder="بحث بالعمل قبل التجنيد..."
            value={filters.workBeforeEnlistment || ''}
            onChange={(e) => handleFilterChange('workBeforeEnlistment', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
