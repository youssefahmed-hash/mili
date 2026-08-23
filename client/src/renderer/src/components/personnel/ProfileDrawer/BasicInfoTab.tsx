import React from 'react'
import type { Personnel } from '../../../types/personnel'

interface BasicInfoTabProps {
  data: Personnel
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ data }) => {
  const infoItems = [
    { label: 'الاسم الكامل', value: data.fullName },
    { label: 'الرقم القومي (14 رقماً)', value: data.nationalId },
    {
      label: 'تاريخ الميلاد',
      value: data.birthDate ? new Date(data.birthDate).toLocaleDateString('ar-EG') : 'غير مسجل'
    },
    { label: 'محل الميلاد', value: data.birthPlace || 'غير مسجل' },
    { label: 'الحالة الاجتماعية', value: data.maritalStatus || 'غير مسجل' },
    { label: 'تاريخ إضافة السجل', value: new Date(data.createdAt).toLocaleString('ar-EG') }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
      {infoItems.map((item, idx) => (
        <div
          key={idx}
          className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1"
        >
          <span className="text-xs text-gray-500 font-bold">{item.label}</span>
          <span className="text-sm font-semibold text-gray-200">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
