import React from 'react'
import { Badge } from '../../ui/Badge'
import type { Personnel } from '../../../types/personnel'
import { getRankCategory } from '../../../constants/categories'
import { displayRank } from '../../../utils/rankDisplay'

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
    'مستشفى خارجي': 'danger',
    محكمه: 'danger',
    غياب: 'danger',
    'علامه 91': 'warning'
  }

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'غير مسجل'
    return new Date(dateStr).toLocaleDateString('ar-EG')
  }

  const isInternalType = (data.personnelType || '').includes('داخلية')
  const rankCategory =
    data.rank === 'ضابط'
      ? 'officer'
      : data.rank === 'صف ضابط'
        ? 'non_commissioned_officer'
        : getRankCategory(data.rank)
  const isOfficerOrNco = rankCategory === 'officer' || rankCategory === 'non_commissioned_officer'

  const card = (label: string, value: React.ReactNode) => (
    <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-bold">{label}</span>
      <div className="text-sm font-semibold text-gray-200">{value}</div>
    </div>
  )
  const grid = (items: { label: string; value: React.ReactNode }[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>{card(item.label, item.value)}</React.Fragment>
      ))}
    </div>
  )
  const sectionTitle = (t: string) => (
    <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
      {t}
    </h4>
  )

  const jobItems = [
    { label: 'الفئة العسكرية', value: categoryLabels[data.category] || data.category },
    { label: 'الرتبة الحالية', value: displayRank(data.rank, data.personnelType) || data.rank },
    { label: 'الرقم العسكري', value: data.militaryId },
    { label: 'حربية / داخلية', value: data.personnelType },
    {
      label: 'التمام',
      value: <Badge variant={statusBadgeVariants[data.status] || 'secondary'}>{data.status}</Badge>
    }
  ]

  // البيانات العسكرية حسب القطاع (مطابقة لنموذج التسجيل)
  const militaryItems = !isInternalType
    ? [
        { label: 'السلاح', value: data.weapon || 'غير مسجل' },
        { label: 'تاريخ الالتحاق بالخدمة', value: formatDate(data.enlistmentDate) },
        { label: 'تاريخ التسريح', value: formatDate(data.dischargeDate) },
        { label: 'تاريخ الضم', value: formatDate(data.joiningDate) },
        { label: 'مدة الخدمة', value: data.serviceDuration || 'غير مسجل' },
        { label: 'فصيلة الدم', value: data.bloodType || 'غير مسجل' }
      ]
    : [
        { label: 'رقم الشرطة', value: data.policeNumber || 'غير مسجل' },
        { label: 'تاريخ الالتحاق بالخدمة', value: formatDate(data.enlistmentDate) },
        { label: 'تاريخ التسريح', value: formatDate(data.dischargeDate) },
        { label: 'تاريخ التأميد', value: formatDate(data.joiningDate) },
        { label: 'مدة الخدمة', value: data.serviceDuration || 'غير مسجل' },
        { label: 'فصيلة الدم', value: data.bloodType || 'غير مسجل' }
      ]

  const officerItems = isOfficerOrNco
    ? [
        { label: 'رقم الأقدمية', value: data.seniorityNumber || 'غير مسجل' },
        { label: 'تاريخ التعيين', value: formatDate(data.appointmentDate) },
        { label: 'تاريخ بدء الخدمة الفعلية', value: formatDate(data.serviceStartDate) },
        { label: 'تاريخ آخر ترقية', value: formatDate(data.lastPromotionDate) },
        { label: 'تاريخ الترقية المستحقة', value: formatDate(data.nextPromotionDate) }
      ]
    : []

  const behaviorItems = [
    { label: 'تقييم الأداء الأخير', value: data.performanceRating || 'غير مسجل' },
    { label: 'تقييم السلوك داخل الوحدة', value: data.behaviorInUnit || 'غير مسجل' },
    { label: 'تقييم السلوك من المرؤوسين', value: data.subordinates || 'غير مسجل' },
    { label: 'تقييم السلوك من الرئيس', value: data.supervisor || 'غير مسجل' }
  ]

  const conditionList = [
    data.condWeaponBan && (data.weaponBanType || 'منع سلاح'),
    data.condNeuro && 'نفسية وعصبية',
    data.condStruckDischarged && 'شطب مسرح',
    data.condStruckRetained && 'شطب غير مسرح'
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-col gap-6 text-start">
      {sectionTitle('البيانات الوظيفية')}
      {grid(jobItems)}

      {/* القسم / الإدارة — يظهر فقط للأفراد الموزعين (غير المستجدين) */}
      {!data.rank?.includes('مستجد') && !data.personnelType?.includes('مستجد') && (
        <div className="flex flex-col gap-3">
          {grid([{ label: 'القسم أو الإدارة', value: data.unit || 'بدون قسم' }])}
        </div>
      )}

      {/* اسم المستشفى — تحت القسم أو الإدارة مباشرة */}
      {data.hospitalName && (
        <div className="flex flex-col gap-3">
          {grid([{ label: 'اسم المستشفى', value: data.hospitalName }])}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sectionTitle(
          isInternalType ? 'البيانات العسكرية (داخلية)' : 'البيانات العسكرية (حربية)'
        )}
        {grid(militaryItems)}
      </div>

      {officerItems.length > 0 && (
        <div className="flex flex-col gap-3">
          {sectionTitle(rankCategory === 'officer' ? 'بيانات الضابط' : 'بيانات صف الضابط')}
          {grid(officerItems)}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sectionTitle('قسم تقييم السلوك')}
        {grid(behaviorItems)}
      </div>

      <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
        <span className="text-xs text-gray-500 font-bold">المؤثرات على القوة</span>
        <div className="flex flex-wrap gap-2">
          {conditionList.length === 0 ? (
            <span className="text-sm text-gray-500">لا يوجد</span>
          ) : (
            conditionList.map((t) => (
              <span
                key={t}
                className="text-xs font-bold text-red-300 bg-red-500/15 border border-red-500/30 rounded px-2 py-1"
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      {data.notes && (
        <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
          <span className="text-xs text-gray-500 font-bold">ملاحظات</span>
          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{data.notes}</p>
        </div>
      )}
    </div>
  )
}
