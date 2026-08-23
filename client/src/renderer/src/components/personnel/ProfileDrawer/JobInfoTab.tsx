import React from 'react'
import { Badge } from '../../ui/Badge'
import type { Personnel } from '../../../types/personnel'

interface JobInfoTabProps {
  data: Personnel
}

export const JobInfoTab: React.FC<JobInfoTabProps> = ({ data }) => {
  const categoryLabels: Record<string, string> = {
    soldier: 'جندي',
    non_commissioned_officer: 'ضابط صف',
    officer: 'ضابط'
  }

  const statusBadgeVariants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
    'على رأس العمل': 'success',
    إجازة: 'warning',
    موقوف: 'danger',
    'منتهية خدمته': 'secondary'
  }

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'غير مسجل'
    return new Date(dateStr).toLocaleDateString('ar-EG')
  }

  const jobItems = [
    { label: 'الفئة العسكرية', value: categoryLabels[data.category] || data.category },
    { label: 'الرتبة الحالية', value: data.rank },
    { label: 'الرقم العسكري', value: data.militaryId },
    { label: 'الوحدة العسكرية', value: data.unit },
    { label: 'القسم / الفرع', value: data.department || 'غير مسجل' },
    { label: 'التخصص العسكري', value: data.specialization || 'غير مسجل' },
    { label: 'تاريخ التعيين بالخدمة', value: formatDate(data.appointmentDate) },
    { label: 'تاريخ بدء الخدمة الفعلية', value: formatDate(data.serviceStartDate) },
    {
      label: 'الحالة العسكرية حالياً',
      value: <Badge variant={statusBadgeVariants[data.status] || 'success'}>{data.status}</Badge>
    },
    { label: 'تقييم الأداء الأخير', value: data.performanceRating || 'غير مسجل' },
    { label: 'تاريخ آخر ترقية مستلمة', value: formatDate(data.lastPromotionDate) },
    { label: 'تاريخ الترقية القادمة المستحقة', value: formatDate(data.nextPromotionDate) }
  ]

  return (
    <div className="flex flex-col gap-4 text-start">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1"
          >
            <span className="text-xs text-gray-500 font-bold">{item.label}</span>
            <div className="text-sm font-semibold text-gray-200">{item.value}</div>
          </div>
        ))}
      </div>

      {data.notes && (
        <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
          <span className="text-xs text-gray-500 font-bold">ملاحظات عسكرية عامة</span>
          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{data.notes}</p>
        </div>
      )}
    </div>
  )
}
