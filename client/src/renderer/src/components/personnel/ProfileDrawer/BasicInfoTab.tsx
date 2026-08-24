import React from 'react'
import type { Personnel } from '../../../types/personnel'

interface BasicInfoTabProps {
  data: Personnel
}

const InfoCard = ({
  label,
  value
}: {
  label: string
  value: string | null
}): React.ReactElement => (
  <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-bold">{label}</span>
    <span className="text-sm font-semibold text-gray-200">{value || 'غير مسجل'}</span>
  </div>
)

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ data }) => {
  const infoItems = [
    { label: 'الاسم الكامل', value: data.fullName },
    { label: 'الرقم القومي (14 رقماً)', value: data.nationalId },
    {
      label: 'تاريخ الميلاد',
      value: data.birthDate ? new Date(data.birthDate).toLocaleDateString('ar-EG') : 'غير مسجل'
    },
    { label: 'محل الميلاد', value: data.birthPlace || 'غير مسجل' },
    { label: 'محل الإقامة', value: data.residencePlace || 'غير مسجل' },
    { label: 'الحالة الاجتماعية', value: data.maritalStatus || 'غير مسجل' },
    { label: 'العمل قبل التجنيد', value: data.workBeforeEnlistment || 'غير مسجل' },
    { label: 'عدد أفراد الأسرة', value: data.familyMembersCount || 'غير مسجل' },
    { label: 'سكن الوالد والوالدة', value: data.parentsLivingSeparately || 'غير مسجل' },
    { label: 'تاريخ إضافة السجل', value: new Date(data.createdAt).toLocaleString('ar-EG') }
  ]

  return (
    <div className="flex flex-col gap-6 text-start">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infoItems.map((item, idx) => (
          <InfoCard key={idx} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Father */}
        <div className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
          <h5 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-2">
            بيانات الوالد
          </h5>
          <InfoCard label="الحالة الصحية" value={data.fatherHealthStatus} />
          <InfoCard label="العمل" value={data.fatherWork} />
          <InfoCard label="رقم الهاتف" value={data.fatherPhone} />
        </div>

        {/* Mother */}
        <div className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
          <h5 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-2">
            بيانات الوالدة
          </h5>
          <InfoCard label="الحالة الصحية" value={data.motherHealthStatus} />
          <InfoCard label="العمل" value={data.motherWork} />
          <InfoCard label="رقم الهاتف" value={data.motherPhone} />
        </div>
      </div>
    </div>
  )
}
