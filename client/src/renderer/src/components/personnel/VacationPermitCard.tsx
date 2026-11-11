import React, { useMemo } from 'react'
import { toLocalDate } from '../../utils/vacationDates'
import { displayRank } from '../../utils/rankDisplay'

export type PermitTemplateType = 'internal' | 'military'

export interface VacationPermitData {
  id?: string
  fullName?: string
  rank?: string
  grade?: string | null
  militaryId?: string
  startDate?: string
  returnDate?: string
  personnelType?: string | null
  templateType?: PermitTemplateType
  isBlank?: boolean
}

export const getPermitTemplateForPersonnel = (
  personnelType?: string | null,
  overrideTemplate?: PermitTemplateType | 'auto'
): PermitTemplateType => {
  if (overrideTemplate && overrideTemplate !== 'auto') {
    return overrideTemplate
  }
  if (!personnelType) return 'military'

  const normalized = personnelType.trim()
  // Operations ("تشغيل حربيه" or "تشغيل") and Police ("داخلية") use internal permit
  if (normalized.includes('تشغيل') || normalized.includes('داخلية')) {
    return 'internal'
  }
  // Military ("حربية") uses military permit
  return 'military'
}

export interface VacationPermitCardProps {
  data: VacationPermitData
  templateType?: PermitTemplateType | 'auto'
  // For internal permit:
  sectorTitle?: string
  departmentTitle?: string
  // For military permit (تصريح إجازة حربية):
  authorityTitle?: string
  commandTitle?: string
  militarySectorTitle?: string
  timePrefix?: string
  useArabicDigits?: boolean
  className?: string
  scale?: number
}

const toArabicDigits = (str: string | number): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(str).replace(/[0-9]/g, (w) => arabicDigits[+w])
}

const formatPermitDate = (dateStr?: string, useArabic = true): { day: string; month: string; year: string } => {
  if (!dateStr) {
    return { day: '   ', month: '   ', year: useArabic ? '٢٠٢٦' : '2026' }
  }
  const d = toLocalDate(dateStr)
  if (!d) {
    return { day: '   ', month: '   ', year: useArabic ? '٢٠٢٦' : '2026' }
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear())

  return {
    day: useArabic ? toArabicDigits(day) : day,
    month: useArabic ? toArabicDigits(month) : month,
    year: useArabic ? toArabicDigits(year) : year
  }
}

const formatGradeDisplay = (
  grade?: string | null,
  rank?: string,
  useArabic = true,
  templateType: PermitTemplateType = 'military'
): string => {
  const base = (grade || rank || (templateType === 'military' ? 'جندي' : 'مجند 2')).trim()
  const withDigits = useArabic ? toArabicDigits(base) : base

  if (templateType === 'military') {
    return withDigits
  } else {
    // For internal: convert جندي to مجند ٢
    if (withDigits.includes('جندي')) {
      return useArabic ? 'مـــــــــجند ٢          ' : 'مجـــــــند 2'
    }
    return withDigits
  }
}

export const VacationPermitCard: React.FC<VacationPermitCardProps> = ({
  data,
  templateType = 'auto',
  sectorTitle = 'قطاع جنوب سيناء',
  departmentTitle = 'قسم الشئون الادارية',
  authorityTitle = 'هيئة الاستخبارات العسكرية',
  commandTitle = 'قيادة المنطقه (ج)',
  militarySectorTitle = 'قطاع جنوب سيناء',
  timePrefix = '',
  useArabicDigits = true,
  className = ''
}) => {
  const resolvedTemplate: PermitTemplateType = useMemo(() => {
    if (data.templateType) return data.templateType
    return getPermitTemplateForPersonnel(data.personnelType, templateType)
  }, [data.templateType, data.personnelType, templateType])

  const fromDate = formatPermitDate(data.startDate, useArabicDigits)
  const toDate = formatPermitDate(data.returnDate, useArabicDigits)
  const displayGrade = formatGradeDisplay(data.grade, data.rank ? displayRank(data.rank, data.personnelType) : data.rank, useArabicDigits, resolvedTemplate)

  return (
    <div
      className={`permit-card bg-white text-black select-none box-border text-start ${className}`}
      dir="rtl"
      style={{
        width: '64.5mm',
        height: '55mm',
        padding: '1.5mm',
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      {/* Outer double border (outer hairline) */}
      <div
        className="w-full h-full flex flex-col justify-between"
        style={{
          border: '1.2px solid #000',
          padding: '1.5px',
          boxSizing: 'border-box'
        }}
      >
        {/* Inner frame (thicker border) */}
        <div
          className="w-full h-full flex flex-col justify-between"
          style={{
            border: '1.6px solid #000',
            padding: '1.5mm 2.2mm 1mm 2.2mm',
            boxSizing: 'border-box',
            overflow: 'hidden',
            fontFamily: "'Amiri', 'Traditional Arabic', 'Cairo', Tahoma, Arial, sans-serif"
          }}
        >
          {/* Header section */}
          {resolvedTemplate === 'military' ? (
            /* 3-line centered underlined header for تصريح إجازة حربية */
            <div className="text-center flex flex-col items-center">
              <div
                className="font-bold text-black tracking-wide leading-tight underline decoration-1 underline-offset-2"
                style={{ fontSize: '8pt' }}
              >
                {authorityTitle}
              </div>
              <div
                className="font-bold text-black tracking-wide leading-tight underline decoration-1 underline-offset-2"
                style={{ fontSize: '7.8pt' }}
              >
                {commandTitle}
              </div>
              <div
                className="font-bold text-black tracking-wide leading-tight underline decoration-1 underline-offset-2 mt-0.5"
                style={{ fontSize: '8.6pt' }}
              >
                {militarySectorTitle}
              </div>
            </div>
          ) : (
            /* 2-line centered underlined header for تصريح داخلي وتشغيل */
            <div className="text-center flex flex-col items-center">
              <div
                className="font-bold text-black tracking-wide leading-tight underline decoration-1 underline-offset-2"
                style={{ fontSize: '10.5pt' }}
              >
                {sectorTitle}
              </div>
              <div
                className="font-bold text-black tracking-normal leading-tight underline decoration-1 underline-offset-2 mt-0.5"
                style={{ fontSize: '9pt' }}
              >
                {departmentTitle}
              </div>
            </div>
          )}

          {/* Grade line */}
          <div
            className="w-full flex items-baseline text-black font-bold mt-0.5 gap-4"
            style={{ fontSize: '8.5pt' }}
          >
            <span className="shrink-0">الدرجة/</span>
            <span className="font-extrabold">
              {data.isBlank ? '....................................' : displayGrade}
            </span>
          </div>

          {/* Name line: Full width */}
          <div
            className="w-full flex items-baseline text-black font-bold"
            style={{ fontSize: '8.5pt' }}
          >
            <span className="shrink-0">الاسم/</span>
            <span className="mr-2 flex-1 font-extrabold truncate text-right">
              {data.isBlank ? '..................................................' : data.fullName || '—'}
            </span>
          </div>

          {/* Statement: 'يصرح المذكور بالغياب عن الوحدة' */}
          <div
            className="w-full flex items-baseline text-black font-bold leading-tight mt-0.5"
            style={{ fontSize: '8.4pt' }}
          >
            <span>يصرح المذكور بالغياب عن الوحدة</span>
          </div>

          {/* Dates: From date line - 100% full width */}
          <div
            className="w-full flex justify-between items-baseline text-black font-bold"
            style={{ fontSize: '8.2pt' }}
          >
            <span className="shrink-0">
              من سعت {timePrefix ? `${timePrefix} ` : ''}
            </span>
            <span className="tracking-wide">
              {data.isBlank ? '/     /  ٢٠٢٦ م' : `${fromDate.day} / ${fromDate.month} / ${fromDate.year} م`}
            </span>
          </div>

          {/* Dates: To date line - 100% full width */}
          <div
            className="w-full flex justify-between items-baseline text-black font-bold"
            style={{ fontSize: '8.2pt' }}
          >
            <span className="shrink-0">
              حتي سعت {timePrefix ? `${timePrefix} ` : ''}
            </span>
            <span className="tracking-wide">
              {data.isBlank ? '/     /  ٢٠٢٦ م' : `${toDate.day} / ${toDate.month} / ${toDate.year} م`}
            </span>
          </div>

          {/* Reason statement: 'وهذا لعدم المعارضة إلية' - 100% full width, border-to-border with zero empty space */}
          <div
            className="w-full flex items-baseline text-black font-bold leading-tight mt-0.5"
            style={{ fontSize: '8.2pt' }}
          >
            {resolvedTemplate === 'internal' ? (
              <span>وهذا لعدم المعارضة الية</span>
            ) : (
              <span>وهذا لعدم المعارضة الية</span>
            )}
          </div>

          {/* Signature line: 'التوقيع (' on right edge, ')' on left edge */}
          <div
            className="w-full flex justify-between items-center text-black font-bold"
            style={{ fontSize: '8pt', color: '#000000' }}
          >
            <span className="shrink-0">التوقيع (</span>
            <span
              className="flex-1 mx-2"
              style={{
                borderBottom: resolvedTemplate === 'military' ? 'none' : '1px dotted #888888'
              }}
            ></span>
            <span className="shrink-0">)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VacationPermitCard
