import React, { useEffect, useState } from 'react'
import { Briefcase, ChevronLeft, ChevronRight, UserRound } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { displayRank } from '../../utils/rankDisplay'
import { formatDateAr } from '../../utils/vacationDates'
import { resolveFileUrl } from '../../utils/fileUrl'
import type { Personnel } from '../../types/personnel'

// ==================== wizard بيانات المستجد ====================
// بيتفتح لما تدوس على اسم المستجد في تاب التوزيع:
// خطوة 1 البيانات الأساسية — خطوة 2 البيانات الوظيفية والعسكرية.

const STEPS = [
  { id: 'basic', label: 'البيانات الأساسية', icon: UserRound },
  { id: 'job', label: 'البيانات الوظيفية', icon: Briefcase }
] as const

const valueOrDash = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

const dateOrDash = (v?: string | null): string => (v ? formatDateAr(v) : '—')

const Field: React.FC<{ label: string; value: React.ReactNode; wide?: boolean }> = ({
  label,
  value,
  wide
}) => (
  <div
    className={`rounded-lg border border-white/5 bg-military-900/40 px-3 py-2 ${
      wide ? 'sm:col-span-2' : ''
    }`}
  >
    <div className="text-[11px] text-gray-500">{label}</div>
    <div className="mt-0.5 break-words text-sm font-semibold text-gray-200">{value}</div>
  </div>
)

interface RecruitDetailsWizardProps {
  recruit: Personnel | null
  isOpen: boolean
  onClose: () => void
}

export const RecruitDetailsWizard: React.FC<RecruitDetailsWizardProps> = ({
  recruit,
  isOpen,
  onClose
}) => {
  const [step, setStep] = useState(0)

  // كل ما يتفتح مستجد جديد نبدأ من الخطوة الأولى
  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen, recruit?.id])

  if (!recruit) return null

  const photo = resolveFileUrl(recruit.photo)
  const isLast = step === STEPS.length - 1

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        إغلاق
      </Button>
      {step > 0 && (
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          startIcon={<ChevronRight className="h-4 w-4" />}
        >
          السابق
        </Button>
      )}
      {!isLast && (
        <Button
          variant="primary"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          endIcon={<ChevronLeft className="h-4 w-4" />}
        >
          التالي
        </Button>
      )}
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ملف المستجد — ${recruit.fullName}`}
      size="xl"
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        {/* هوية المستجد */}
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-military-900/40 p-3">
          {photo ? (
            <img
              src={photo}
              alt={recruit.fullName}
              className="h-16 w-16 flex-shrink-0 rounded-xl border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-military-800 text-2xl font-black text-military-accent">
              {(recruit.fullName || '?').trim().charAt(0)}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-lg font-black text-white">{recruit.fullName}</span>
            <span className="text-xs text-gray-400">
              {displayRank(recruit.rank, recruit.personnelType) || recruit.rank || '—'} /{' '}
              {recruit.militaryId || '—'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="warning">{recruit.personnelType}</Badge>
              {recruit.status && <Badge variant="secondary">{recruit.status}</Badge>}
            </div>
          </div>
        </div>

        {/* مؤشر الخطوات */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const active = idx === step
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(idx)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'border-military-primary bg-military-primary/10 text-white'
                    : 'border-white/5 bg-military-900/40 text-gray-400 hover:text-white'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    active ? 'bg-military-primary text-white' : 'bg-military-700 text-gray-300'
                  }`}
                >
                  {idx + 1}
                </span>
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* الخطوة 1: البيانات الأساسية */}
        {step === 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="الاسم بالكامل" value={valueOrDash(recruit.fullName)} wide />
            <Field label="الرقم القومي" value={valueOrDash(recruit.nationalId)} />
            <Field label="تاريخ الميلاد" value={dateOrDash(recruit.birthDate)} />
            <Field label="محل الميلاد" value={valueOrDash(recruit.birthPlace)} />
            <Field label="محل الإقامة" value={valueOrDash(recruit.residencePlace)} />
            <Field label="الحالة الاجتماعية" value={valueOrDash(recruit.maritalStatus)} />
            <Field label="عدد أفراد الأسرة" value={valueOrDash(recruit.familyMembersCount)} />
            <Field label="رقم الهاتف" value={valueOrDash(recruit.phone)} />
            <Field label="البريد الإلكتروني" value={valueOrDash(recruit.email)} />
            <Field label="العنوان" value={valueOrDash(recruit.address)} wide />
            <Field label="شخص للاتصال في الطوارئ" value={valueOrDash(recruit.emergencyContact)} />
            <Field label="هاتف الطوارئ" value={valueOrDash(recruit.emergencyPhone)} />
          </div>
        )}

        {/* الخطوة 2: البيانات الوظيفية والعسكرية */}
        {step === 1 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="الرتبة"
              value={displayRank(recruit.rank, recruit.personnelType) || valueOrDash(recruit.rank)}
            />
            <Field label="الرقم العسكري" value={valueOrDash(recruit.militaryId)} />
            <Field label="النوع" value={valueOrDash(recruit.personnelType)} />
            <Field label="القسم / الإدارة" value={recruit.unit || 'لم يُوزَّع بعد'} />
            <Field label="التمام" value={valueOrDash(recruit.status)} />
            <Field label="التخصص" value={valueOrDash(recruit.specialization)} />
            <Field label="العمل قبل التجنيد" value={valueOrDash(recruit.workBeforeEnlistment)} />
            <Field label="المؤهل" value={valueOrDash(recruit.qualification)} />
            <Field label="المستوى التعليمي" value={valueOrDash(recruit.education)} />
            <Field label="تاريخ الالتحاق بالخدمة" value={dateOrDash(recruit.enlistmentDate)} />
            <Field label="تاريخ الضم / التأميد" value={dateOrDash(recruit.joiningDate)} />
            <Field label="تاريخ التعيين" value={dateOrDash(recruit.appointmentDate)} />
            <Field
              label="تاريخ بدء الخدمة الفعلية"
              value={dateOrDash(recruit.serviceStartDate)}
            />
            <Field label="تاريخ التسريح" value={dateOrDash(recruit.dischargeDate)} />
            <Field label="مدة الخدمة" value={valueOrDash(recruit.serviceDuration)} />
            <Field label="فصيلة الدم" value={valueOrDash(recruit.bloodType)} />
            <Field label="السلاح" value={valueOrDash(recruit.weapon)} />
            <Field label="رقم الشرطة" value={valueOrDash(recruit.policeNumber)} />
            <Field label="رقم الأقدمية" value={valueOrDash(recruit.seniorityNumber)} />
          </div>
        )}
      </div>
    </Modal>
  )
}
