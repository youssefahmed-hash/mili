import React from 'react'
import { Badge } from '../../ui/Badge'
import type { Personnel } from '../../../types/personnel'
import { getRankCategory } from '../../../constants/categories'

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
    'داخل القطاع': 'success',
    اجازه: 'warning',
    ماموريه: 'secondary',
    'عرض مستشفى': 'danger',
    غياب: 'danger',
    'علامه 91': 'warning'
  }

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'غير مسجل'
    return new Date(dateStr).toLocaleDateString('ar-EG')
  }

  const jobItems = [
    { label: 'الفئة العسكرية', value: categoryLabels[data.category] || data.category },
    { label: 'الرتبة الحالية', value: data.rank },
    { label: 'الرقم العسكري', value: data.militaryId },
    { label: 'القسم', value: data.unit },
    { label: 'حربية / داخلية', value: data.personnelType },
    { label: 'التخصص', value: data.specialization || 'غير مسجل' },
    { label: 'تاريخ التعيين بالخدمة', value: formatDate(data.appointmentDate) },
    { label: 'تاريخ بدء الخدمة الفعلية', value: formatDate(data.serviceStartDate) },
    {
      label: 'التمام',
      value: <Badge variant={statusBadgeVariants[data.status] || 'secondary'}>{data.status}</Badge>
    },
    { label: 'تقييم الأداء الأخير', value: data.performanceRating || 'غير مسجل' },
    { label: 'تقييم السلوك داخل الوحدة', value: data.behaviorInUnit || 'غير مسجل' },
    { label: 'تاريخ آخر ترقية مستلمة', value: formatDate(data.lastPromotionDate) },
    { label: 'تاريخ الترقية القادمة المستحقة', value: formatDate(data.nextPromotionDate) },
    { label: 'الدفعة', value: formatDate(data.batchDate) },
    { label: 'تقييم السلوك من المرؤوسين', value: data.subordinates || 'غير مسجل' },
    { label: 'تقييم السلوك من الرئيس', value: data.supervisor || 'غير مسجل' }
  ]

  const militaryTitle =
    data.personnelType === 'حربية'
      ? getRankCategory(data.rank) === 'officer'
        ? 'بيانات عسكرية (ضابط)'
        : getRankCategory(data.rank) === 'non_commissioned_officer'
          ? 'بيانات عسكرية (صف ضابط)'
          : 'بيانات عسكرية (مجند)'
      : ''

  const militaryItems =
    data.personnelType === 'حربية'
      ? getRankCategory(data.rank) === 'officer'
        ? [
            { label: 'رقم اقدميه', value: data.seniorityNumber || 'غير مسجل' },
            { label: 'السلاح', value: data.weapon || 'غير مسجل' },
            { label: 'تاريخ التجنيد', value: formatDate(data.enlistmentDate) },
            { label: 'تاريخ الضم', value: formatDate(data.joiningDate) },
            {
              label: 'تاريخ ترقى للرتبه الحاليه',
              value: formatDate(data.promotionCurrentRankDate)
            },
            {
              label: 'تاريخ ترقى للرتبه الاعلى',
              value: formatDate(data.promotionHigherRankDate)
            },
            { label: 'اخر عوده', value: formatDate(data.lastLeaveReturnDate) }
          ]
        : getRankCategory(data.rank) === 'non_commissioned_officer'
          ? [
              { label: 'الدرجه', value: data.grade || 'غير مسجل' },
              { label: 'رقم اقدميه', value: data.seniorityNumber || 'غير مسجل' },
              { label: 'السلاح', value: data.weapon || 'غير مسجل' },
              { label: 'تاريخ التجنيد', value: formatDate(data.enlistmentDate) },
              { label: 'تاريخ الضم', value: formatDate(data.joiningDate) },
              {
                label: 'تاريخ ترقى للدرجه الحاليه',
                value: formatDate(data.promotionCurrentGradeDate)
              },
              {
                label: 'تاريخ ترقى للدرجه الاعلى',
                value: formatDate(data.promotionHigherGradeDate)
              },
              { label: 'اخر عوده', value: formatDate(data.lastLeaveReturnDate) }
            ]
          : [
              { label: 'تاريخ التجنيد', value: formatDate(data.enlistmentDate) },
              { label: 'تاريخ التسريح', value: formatDate(data.dischargeDate) },
              { label: 'تاريخ الضم', value: formatDate(data.joiningDate) },
              { label: 'السلاح', value: data.weapon || 'غير مسجل' },
              { label: 'تاريخ اخر عوده من اجازه', value: formatDate(data.lastLeaveReturnDate) },
              {
                label: 'عدد الجذات',
                value: data.guardCount != null ? String(data.guardCount) : 'غير مسجل'
              }
            ]
      : []

  const internalItems =
    data.personnelType === 'داخلية'
      ? [
          { label: 'رقم الشرطة', value: data.policeNumber || 'غير مسجل' },
          { label: 'تاريخ التجنيد', value: formatDate(data.enlistmentDate) },
          { label: 'تاريخ الرديف', value: formatDate(data.reserveDate) },
          {
            label: 'الجذات الاداريه',
            value: data.administrativeUnits != null ? String(data.administrativeUnits) : 'غير مسجل'
          },
          { label: 'المحاكمات العسكرية', value: data.militaryTrials || 'غير مسجل' },
          { label: 'السريه التابع لها', value: data.affiliatedUnit || 'غير مسجل' },
          { label: 'العرض', value: data.display || 'غير مسجل' },
          { label: 'الشطب', value: data.strikeOff || 'غير مسجل' },
          { label: 'المصابين', value: data.injured || 'غير مسجل' },
          { label: 'العيادات', value: data.clinics || 'غير مسجل' },
          {
            label: 'الاجازات علي القمسيون الطبي',
            value: data.medicalCommissionLeaves || 'غير مسجل'
          },
          { label: 'البمنع من السلاح', value: data.weaponBan || 'غير ممنوع' }
        ]
      : []

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

      {data.personnelType === 'حربية' && (
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 text-start">
            {militaryTitle}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {militaryItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1"
              >
                <span className="text-xs text-gray-500 font-bold">{item.label}</span>
                <div className="text-sm font-semibold text-gray-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.personnelType === 'داخلية' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internalItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1"
            >
              <span className="text-xs text-gray-500 font-bold">{item.label}</span>
              <div className="text-sm font-semibold text-gray-200">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {data.notes && (
        <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
          <span className="text-xs text-gray-500 font-bold">ملاحظات عسكرية عامة</span>
          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{data.notes}</p>
        </div>
      )}
    </div>
  )
}
