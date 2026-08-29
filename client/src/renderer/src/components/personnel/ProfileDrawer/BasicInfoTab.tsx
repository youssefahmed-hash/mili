import React from 'react'
import type { Personnel } from '../../../types/personnel'
import { useAuthStore } from '../../../store/authStore'
import { canManage } from '../../../constants/permissions'

interface BasicInfoTabProps {
  data: Personnel
}

const MASKED_TEXT = 'مسجل — ليس لديك صلاحية برؤيته'

const InfoCard = ({
  label,
  value,
  masked = false
}: {
  label: string
  value: string | null
  masked?: boolean
}): React.ReactElement => {
  const display = masked ? MASKED_TEXT : value || 'غير مسجل'
  return (
    <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-bold">{label}</span>
      <span className={`text-sm font-semibold ${masked ? 'text-gray-500 italic' : 'text-gray-200'}`}>
        {display}
      </span>
    </div>
  )
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ data }) => {
  const user = useAuthStore((s) => s.user)
  const manage = canManage(user)

  const infoItems = [
    { label: 'الاسم الكامل', value: data.fullName },
    { label: 'الرقم القومي (14 رقماً)', value: data.nationalId },
    {
      label: 'تاريخ الميلاد',
      value: data.birthDate ? new Date(data.birthDate).toLocaleDateString('ar-EG') : 'غير مسجل'
    },
    { label: 'محل الميلاد', value: data.birthPlace || 'غير مسجل' },
    { label: 'محل الإقامة', value: data.residencePlace || 'غير مسجل' },
    { label: 'الحالة الاجتماعية', value: data.maritalStatus || 'غير مسجل', masked: !manage },
    { label: 'العمل قبل التجنيد', value: data.workBeforeEnlistment || 'غير مسجل' },
    { label: 'عدد أفراد الأسرة', value: data.familyMembersCount || 'غير مسجل', masked: !manage },
    { label: 'سكن الوالد والوالدة', value: data.parentsLivingSeparately || 'غير مسجل', masked: !manage },
    { label: 'تاريخ إضافة السجل', value: new Date(data.createdAt).toLocaleString('ar-EG') }
  ]

  return (
    <div className="flex flex-col gap-6 text-start">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infoItems.map((item, idx) => (
          <InfoCard key={idx} label={item.label} value={item.value} masked={item.masked} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Father */}
        <div className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
          <h5 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-2">
            بيانات الوالد
          </h5>
          <InfoCard label="الحالة الصحية" value={data.fatherHealthStatus} masked={!manage} />
          <InfoCard label="العمل" value={data.fatherWork} masked={!manage} />
          <InfoCard label="رقم الهاتف" value={data.fatherPhone} masked={!manage} />
        </div>

        {/* Mother */}
        <div className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
          <h5 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-2">
            بيانات الوالدة
          </h5>
          <InfoCard label="الحالة الصحية" value={data.motherHealthStatus} masked={!manage} />
          <InfoCard label="العمل" value={data.motherWork} masked={!manage} />
          <InfoCard label="رقم الهاتف" value={data.motherPhone} masked={!manage} />
        </div>
      </div>
    </div>
  )
}
