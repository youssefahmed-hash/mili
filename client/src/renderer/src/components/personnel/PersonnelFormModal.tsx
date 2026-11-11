import React, { useState, useEffect } from 'react'
import { usePersonnelStore } from '../../store/personnelStore'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Upload } from 'lucide-react'
import type { Personnel, PersonnelType } from '../../types/personnel'
import { resolveFileUrl, isPdf } from '../../utils/fileUrl'
import { getRankCategory } from '../../constants/categories'
import { getDepartmentOptions } from '../../constants/departments'
import {
  PERSONNEL_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  WEAPON_BAN_TYPE_OPTIONS,
  HOSPITAL_OPTIONS,
  TAMAM_OPTIONS
} from '../../constants/personnelFields'
import { useAuthStore } from '../../store/authStore'
import { canManage, visiblePersonnelTypes, isManager } from '../../constants/permissions'
import { MaskContext } from '../ui/maskContext'

const ATTACHMENTS = [
  { key: 'cardImage', label: 'صورة البطاقة (اختياري)', hint: 'صورة أو ملف PDF' },
  { key: 'carnetImage', label: 'صورة الكارنيه (اختياري)', hint: 'صورة أو ملف PDF' },
  { key: 'formImage', label: 'صورة النموذج (اختياري)', hint: 'صورة أو ملف PDF' }
] as const

const PERFORMANCE_OPTIONS = [
  { value: '', label: 'بدون تقييم' },
  { value: 'ممتاز', label: 'ممتاز' },
  { value: 'جيد جداً', label: 'جيد جداً' },
  { value: 'جيد', label: 'جيد' },
  { value: 'مقبول', label: 'مقبول' },
  { value: 'ضعيف', label: 'ضعيف' }
]

interface PersonnelFormModalProps {
  isOpen: boolean
  onClose: () => void
  target?: Personnel | null // If target exists, we are editing
  mode?: 'create' | 'edit' | 'complete'
}

export const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({
  isOpen,
  onClose,
  target,
  mode = 'create'
}) => {
  const { addPersonnel, editPersonnel, fetchPersonnelList, error: storeError } = usePersonnelStore()
  const { user: authUser } = useAuthStore()
  const isEdit = !!target
  const isComplete = mode === 'complete'
  const maskLocked = isComplete && !canManage(authUser)

  const typeOptions =
    isManager(authUser)
      ? PERSONNEL_TYPE_OPTIONS
      : PERSONNEL_TYPE_OPTIONS.filter((o) => visiblePersonnelTypes(authUser).includes(o.value))

  // في وضع استكمال البيانات: الحقل يقفل (read-only) لو كان له قيمة أصلاً في السجل
  const compLock = (field: string): boolean =>
    isComplete && !!target && !!(target as unknown as Record<string, unknown>)[field]

  // Local form states
  const [fullName, setFullName] = useState('')
  const [rank, setRank] = useState('جندي')
  const [militaryId, setMilitaryId] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [residencePlace, setResidencePlace] = useState('')
  const [unit, setUnit] = useState(
    () => getDepartmentOptions(authUser?.userType === 'داخلية' ? 'داخلية' : 'حربية')[0]?.value || ''
  )
  const [status, setStatus] = useState('داخل القطاع')
  const [hospitalName, setHospitalName] = useState('')
  const [qualification, setQualification] = useState('')
  const [education, setEducation] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [workBeforeEnlistment, setWorkBeforeEnlistment] = useState('')
  const [sectorDistribution, setSectorDistribution] = useState('')
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [weaponBanType, setWeaponBanType] = useState('')
  const [personnelType, setPersonnelType] = useState<PersonnelType>(
    authUser?.userType === 'داخلية' ? 'داخلية' : 'حربية'
  )
  const [enlistmentDate, setEnlistmentDate] = useState('')
  const [dischargeDate, setDischargeDate] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [weapon, setWeapon] = useState('')
  const [policeNumber, setPoliceNumber] = useState('')
  // مدة الخدمة: اختيار مزدوج — المدة (سنة/سنتين) ثم الزيادة (ب/بدون)
  const [durationYears, setDurationYears] = useState('')
  const [durationIncrease, setDurationIncrease] = useState('')
  const [bloodType, setBloodType] = useState('')
  // حقول الضباط وصف الضباط فقط
  const [appointmentDate, setAppointmentDate] = useState('')
  const [serviceStartDate, setServiceStartDate] = useState('')
  const [lastPromotionDate, setLastPromotionDate] = useState('')
  const [nextPromotionDate, setNextPromotionDate] = useState('')
  const [seniorityNumber, setSeniorityNumber] = useState('')
  // قسم تقييم السلوك
  const [performanceRating, setPerformanceRating] = useState('')
  const [behaviorInUnit, setBehaviorInUnit] = useState('')
  const [subordinates, setSubordinates] = useState('')
  const [supervisor, setSupervisor] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [attachments, setAttachments] = useState<Record<string, File | null>>({})
  const [attachmentPreviews, setAttachmentPreviews] = useState<Record<string, string | null>>({})

  const handleAttachment =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files && e.target.files[0]
      if (file) {
        setAttachments((prev) => ({ ...prev, [key]: file }))
        setAttachmentPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }))
      }
    }

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Initialize form with target details if editing
  useEffect(() => {
    if (target) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setFullName(target.fullName || '')
      setRank(target.rank || 'جندي')
      setMilitaryId(target.militaryId || '')
      setNationalId(target.nationalId || '')
      setBirthDate(target.birthDate ? target.birthDate.split('T')[0] : '')
      setBirthPlace(target.birthPlace || '')
      setResidencePlace(target.residencePlace || '')
      setWorkBeforeEnlistment(target.workBeforeEnlistment || '')
      setUnit(target.unit || 'بدون قسم')
      setPersonnelType(target.personnelType || 'حربية')
      setEnlistmentDate(target.enlistmentDate ? target.enlistmentDate.split('T')[0] : '')
      setDischargeDate(target.dischargeDate ? target.dischargeDate.split('T')[0] : '')
      setJoiningDate(target.joiningDate ? target.joiningDate.split('T')[0] : '')
      setWeapon(target.weapon || '')
      setPoliceNumber(target.policeNumber || '')
      setBloodType(target.bloodType || '')
      setQualification(target.qualification || '')
      // تفكيك مدة الخدمة المحفوظة إلى اختيارين: المدة ثم الزيادة
      const savedDuration = target.serviceDuration || ''
      setDurationYears(savedDuration.includes('سنتين') ? 'سنتين' : savedDuration.includes('سنة') ? 'سنة' : '')
      setDurationIncrease(
        savedDuration.includes('زيادة') ? (savedDuration.includes('بدون') ? 'بدون' : 'مع') : ''
      )
      setStatus(target.status || 'داخل القطاع')
      setHospitalName(target.hospitalName || '')
      setSectorDistribution(target.sectorDistribution || '')
      setSelectedConditions(
        [
          target.condWeaponBan && 'weaponBan',
          target.condNeuro && 'neuro',
          target.condStruckDischarged && 'struckDischarged',
          target.condStruckRetained && 'struckRetained'
        ].filter(Boolean) as string[]
      )
      setWeaponBanType(target.weaponBanType || '')
      setEducation(target.education || '')
      setAppointmentDate(target.appointmentDate ? target.appointmentDate.split('T')[0] : '')
      setServiceStartDate(target.serviceStartDate ? target.serviceStartDate.split('T')[0] : '')
      setLastPromotionDate(target.lastPromotionDate ? target.lastPromotionDate.split('T')[0] : '')
      setNextPromotionDate(target.nextPromotionDate ? target.nextPromotionDate.split('T')[0] : '')
      setSeniorityNumber(target.seniorityNumber || '')
      setPerformanceRating(target.performanceRating || '')
      setBehaviorInUnit(target.behaviorInUnit || '')
      setSubordinates(target.subordinates || '')
      setSupervisor(target.supervisor || '')
      setPhone(target.phone || '')
      setEmail(target.email || '')
      setAddress(target.address || '')
      setEmergencyContact(target.emergencyContact || '')
      setEmergencyPhone(target.emergencyPhone || '')
      setNotes(target.notes || '')
      if (target.photo) {
        setPhotoPreview(resolveFileUrl(target.photo))
      }
      const docTypeToKey: Record<string, string> = {
        personnelCard: 'cardImage',
        personnelCarnet: 'carnetImage',
        personnelForm: 'formImage'
      }
      ;(target.documents || []).forEach((doc) => {
        const key = docTypeToKey[doc.type]
        if (key) {
          setAttachmentPreviews((prev) => ({ ...prev, [key]: resolveFileUrl(doc.fileUrl) }))
        }
      })
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [target])

  // لما يتغير نوع التبعية، يُعاد ضبط القسم (الوحدة) على قسم صالح لنوع التبعية المختار
  useEffect(() => {
    const isInternal = personnelType.includes('داخلية')
    const opts = getDepartmentOptions(isInternal ? 'داخلية' : 'حربية')
    if (!opts.some((o) => o.value === unit)) {
      setUnit(opts[0]?.value || '')
    }
  }, [personnelType])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.fullName = 'الاسم بالكامل مطلوب'
    if (!militaryId.trim()) errs.militaryId = 'الرقم العسكري مطلوب'
    if (!nationalId.trim()) {
      errs.nationalId = 'الرقم القومي مطلوب'
    } else if (nationalId.length !== 14) {
      errs.nationalId = 'الرقم القومي يجب أن يتكون من 14 رقماً'
    }
    if (!birthDate) errs.birthDate = 'تاريخ الميلاد مطلوب'
    if (!isRecruitRecord && !unit.trim()) errs.unit = 'القسم مطلوب'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    const derivedCategory = rankCategory

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('category', derivedCategory)
    formData.append('rank', rank)
    formData.append('militaryId', militaryId)
    formData.append('nationalId', nationalId)
    formData.append('birthDate', birthDate)
    if (birthPlace) formData.append('birthPlace', birthPlace)
    if (residencePlace) formData.append('residencePlace', residencePlace)
    if (unit) formData.append('unit', unit)
    if (isRecruitRecord) formData.delete('unit')
    formData.append('personnelType', personnelType)
    if (workBeforeEnlistment) formData.append('workBeforeEnlistment', workBeforeEnlistment)
    if (qualification) formData.append('qualification', qualification)
    if (education) formData.append('education', education)
    // حقول الضباط وصف الضباط
    if (isOfficerOrNco) {
      if (seniorityNumber) formData.append('seniorityNumber', seniorityNumber)
      if (appointmentDate) formData.append('appointmentDate', appointmentDate)
      if (serviceStartDate) formData.append('serviceStartDate', serviceStartDate)
      if (lastPromotionDate) formData.append('lastPromotionDate', lastPromotionDate)
      if (nextPromotionDate) formData.append('nextPromotionDate', nextPromotionDate)
    }
    // البيانات العسكرية (حربية / داخلية)
    if (isInternalType) {
      if (policeNumber) formData.append('policeNumber', policeNumber)
    } else if (weapon) {
      formData.append('weapon', weapon)
    }
    if (enlistmentDate) formData.append('enlistmentDate', enlistmentDate)
    if (dischargeDate) formData.append('dischargeDate', dischargeDate)
    if (joiningDate) formData.append('joiningDate', joiningDate)
    const composedDuration = durationYears
      ? durationIncrease
        ? `${durationYears} ${durationIncrease === 'مع' ? 'مع سنة زيادة' : 'بدون سنة زيادة'}`
        : durationYears
      : ''
    if (composedDuration) formData.append('serviceDuration', composedDuration)
    if (bloodType) formData.append('bloodType', bloodType)
    if (sectorDistribution.trim()) formData.append('sectorDistribution', sectorDistribution.trim())
    formData.append('condWeaponBan', selectedConditions.includes('weaponBan') ? 'true' : 'false')
    if (selectedConditions.includes('weaponBan') && weaponBanType) {
      formData.append('weaponBanType', weaponBanType)
    } else {
      formData.append('weaponBanType', '')
    }
    formData.append('condNeuro', selectedConditions.includes('neuro') ? 'true' : 'false')
    formData.append('condStruckDischarged', selectedConditions.includes('struckDischarged') ? 'true' : 'false')
    formData.append('condStruckRetained', selectedConditions.includes('struckRetained') ? 'true' : 'false')
    formData.append('status', status)
    if (status === 'مستشفى خارجي' && hospitalName) {
      formData.append('hospitalName', hospitalName)
    } else {
      formData.append('hospitalName', '')
    }
    // قسم تقييم السلوك
    formData.append('performanceRating', performanceRating)
    formData.append('behaviorInUnit', behaviorInUnit)
    formData.append('subordinates', subordinates)
    formData.append('supervisor', supervisor)
    formData.append('phone', phone)
    if (email) formData.append('email', email)
    formData.append('address', address)
    if (emergencyContact) formData.append('emergencyContact', emergencyContact)
    if (emergencyPhone) formData.append('emergencyPhone', emergencyPhone)
    formData.append('notes', notes)

    if (photoFile) {
      formData.append('photo', photoFile)
    }

    ATTACHMENTS.forEach(({ key }) => {
      const file = attachments[key]
      if (file) {
        formData.append(key, file)
      }
    })

    // استكمال بيانات: لا نسمح بتعديل الحقول المملوءة مسبقاً — نرسل فقط الحقول التي كانت فارغة وأضافها المستخدم
    if (isComplete && target) {
      const origValues = target as unknown as Record<string, unknown>
      const KEEP = ['category']
      const ALL_KEYS = [
        'fullName',
        'category',
        'rank',
        'militaryId',
        'nationalId',
        'birthDate',
        'birthPlace',
        'residencePlace',
        'unit',
        'personnelType',
        'workBeforeEnlistment',
        'qualification',
        'education',
        'enlistmentDate',
        'dischargeDate',
        'joiningDate',
        'weapon',
        'policeNumber',
        'serviceDuration',
        'bloodType',
        'appointmentDate',
        'serviceStartDate',
        'lastPromotionDate',
        'nextPromotionDate',
        'seniorityNumber',
        'performanceRating',
        'behaviorInUnit',
        'subordinates',
        'supervisor',
        'sectorDistribution',
        'condWeaponBan',
        'condNeuro',
        'condStruckDischarged',
        'condStruckRetained',
        'status',
        'phone',
        'email',
        'address',
        'emergencyContact',
        'emergencyPhone',
        'notes'
      ]
      for (const key of ALL_KEYS) {
        if (KEEP.includes(key)) continue
        const orig = origValues[key]
        if (orig !== '' && orig != null) formData.delete(key)
      }
      if (origValues.photo) formData.delete('photo')
      ATTACHMENTS.forEach(({ key }) => {
        if (origValues[key]) formData.delete(key)
      })
    }

    let success = false
    if (isEdit && target) {
      success = await editPersonnel(target.id, formData)
    } else {
      success = await addPersonnel(formData)
    }

    setLoading(false)
    if (success) {
      fetchPersonnelList() // Refresh list
      onClose()
    }
  }

  const isInternalType = personnelType.includes('داخلية')
  const isRecruitRecord = rank.includes('مستجد') || personnelType.includes('مستجد')
  // تصنيف الرتبة: 'ضابط' / 'صف ضابط' عناوين عامة → نربطها بالتصنيف مباشرة
  const rankCategory =
    rank === 'ضابط' ? 'officer' : rank === 'صف ضابط' ? 'non_commissioned_officer' : getRankCategory(rank)
  // حقول الضباط والصف (تعيين/ترقية) تظهر لهم فقط — جندي ومستجد لا
  const isOfficerOrNco = rankCategory === 'officer' || rankCategory === 'non_commissioned_officer'

  const rankOptions = isInternalType
    ? [
        { value: 'جندي', label: 'جندي' },
        { value: 'صف ضابط', label: 'صف ضابط' },
        { value: 'ضابط', label: 'ضابط' },
        { value: 'مستجد داخلية', label: 'مستجد داخلية' }
      ]
    : [
        { value: 'جندي', label: 'جندي' },
        { value: 'صف ضابط', label: 'صف ضابط' },
        { value: 'ضابط', label: 'ضابط' },
        { value: 'مستجد حربية', label: 'مستجد حربية' }
      ]

  const baseUnitOptions = getDepartmentOptions(isInternalType ? 'داخلية' : 'حربية')
  const unitOptions =
    unit && !baseUnitOptions.some((o) => o.value === unit)
      ? [{ value: unit, label: unit }, ...baseUnitOptions]
      : baseUnitOptions

  const modalFooter = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        إلغاء
      </Button>
      <Button
        variant={isEdit || isComplete ? 'accent' : 'primary'}
        onClick={handleSubmit}
        loading={loading}
      >
        {isComplete ? 'حفظ البيانات المضافة' : isEdit ? 'حفظ التغييرات' : 'تسجيل الفرد'}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isComplete
          ? 'استكمال بيانات الفرد (إضافة فقط)'
          : isEdit
            ? 'تعديل ملف الفرد العسكري'
            : 'تسجيل فرد عسكري جديد'
      }
      footer={modalFooter}
      size="2xl"
    >
      <MaskContext.Provider value={maskLocked}>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-lg text-sm text-start font-bold">
          الحقول المعلمة بـ * إجبارية — باقي الحقول اختيارية (تظهر بإطار كهرماني عند تركها فارغة) ويمكن التسجيل بدونها.
        </div>
        {storeError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-start font-bold">
            {storeError}
          </div>
        )}

        {isComplete && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg text-sm text-start font-bold">
            وضع استكمال البيانات: الحقول المملوءة مغلقة ولا يمكن تعديلها — يمكنك إضافة الحقول
            الفارغة فقط، ولن يتم حفظ أي تعديل على بيانات موجودة.
          </div>
        )}

        {/* Section 1: Personal Info & Photo */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            القسم الأول: البيانات الشخصية الأساسية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Photo Upload area */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-sm font-semibold text-gray-300">الصورة الشخصية (اختياري)</label>
              <div className="relative h-32 w-32 rounded-xl bg-military-900 border border-white/10 flex items-center justify-center overflow-hidden group shadow-lg">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-500 group-hover:text-gray-300 transition-colors" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  title="اختر صورة شخصية"
                  disabled={isComplete && !!(target as unknown as Record<string, unknown>).photo}
                />
              </div>
              <span className="text-[10px] text-gray-500">مسموح بصور JPG / PNG فقط</span>
            </div>

            {/* Fields */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="الاسم بالكامل *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                placeholder="مثال: أحمد محمد علي حسن"

                disabled={compLock('fullName')}
              />
              <Input
                label="الرقم القومي (14 رقماً) *"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                error={errors.nationalId}
                placeholder="2950101XXXXXXXX"
                maxLength={14}

                disabled={compLock('nationalId')}
              />
              <Input
                label="تاريخ الميلاد *"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                error={errors.birthDate}

                disabled={compLock('birthDate')}
              />
              <Input
                label="محل الميلاد (اختياري)"
                warning={birthPlace ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="المحافظة / المدينة"

                disabled={compLock('birthPlace')}
              />
              <Input
                label="محل الإقامة (اختياري)"
                warning={residencePlace ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                value={residencePlace}
                onChange={(e) => setResidencePlace(e.target.value)}
                placeholder="المحافظة / المدينة / العنوان"

                disabled={compLock('residencePlace')}
              />
            </div>
          </div>
        </div>

        {/* Section: Attached documents (card / carnet / form) */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            الوثائق المرفقة بالملف (صورة أو PDF)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ATTACHMENTS.map(({ key, label, hint }) => {
              const preview = attachmentPreviews[key]
              const file = attachments[key]
              const pdf = file ? file.type === 'application/pdf' : preview ? isPdf(preview) : false
              return (
                <div key={key} className="flex flex-col items-center gap-2">
                  <label className="text-sm font-semibold text-gray-300">{label}</label>
                  <div className="relative h-28 w-28 rounded-xl bg-military-900 border border-white/10 flex items-center justify-center overflow-hidden group shadow-lg">
                    {preview ? (
                      pdf ? (
                        <span className="text-[11px] text-gray-400 text-center px-1">
                          ملف PDF مرفق
                        </span>
                      ) : (
                        <img src={preview} alt={label} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <Upload className="h-7 w-7 text-gray-500 group-hover:text-gray-300 transition-colors" />
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleAttachment(key)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      title={label}
                      disabled={isComplete && !!(target as unknown as Record<string, unknown>)[key]}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{hint}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 2: البيانات الشخصية */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            القسم الثاني: البيانات الشخصية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="المهنة قبل التجنيد (اختياري)"
              warning={workBeforeEnlistment ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={workBeforeEnlistment}
              onChange={(e) => setWorkBeforeEnlistment(e.target.value)}
              placeholder="مثال: مدرس / فني / طالب"

              disabled={compLock('workBeforeEnlistment')}
            />
            <Input
              label="المؤهل (اختياري)"
              warning={qualification ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="مثال: دبلوم صناعي / بكالوريوس"

              disabled={compLock('qualification')}
            />
            <Input
              label="المستوى التعليمي (اختياري)"
              warning={education ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="مثال: ثانوي / دبلوم / كلية"

              disabled={compLock('education')}
            />
          </div>
        </div>

        {/* Section 3: Military Info */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            القسم الثاني: البيانات الوظيفية والعسكرية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="الرتبة (اختياري)"
              warning={rank ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              options={rankOptions}
              value={rank}
              onChange={(e) => setRank(e.target.value)}

              disabled={compLock('rank')}
            />
            <Input
              label="الرقم العسكري *"
              value={militaryId}
              onChange={(e) => setMilitaryId(e.target.value)}
              error={errors.militaryId}
              placeholder="مثال: 202611099"

              disabled={compLock('militaryId')}
            />
            {!isRecruitRecord && (
              <Select
                label="القسم أو الإدارة"
                options={unitOptions}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                error={errors.unit}

                disabled={compLock('unit')}
              />
            )}
            {/* اسم المستشفى — يظهر تحت القسم/الإدارة عند اختيار «مستشفى خارجي» في التمام */}
            {status === 'مستشفى خارجي' && (
              <div className="md:col-span-3">
                <Select
                  label="اسم المستشفى"
                  warning={hospitalName ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                  options={[
                    { value: '', label: 'اختر اسم المستشفى' },
                    ...HOSPITAL_OPTIONS
                  ]}
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}

                  disabled={compLock('hospitalName')}
                />
              </div>
            )}
            <Select
              label="حربية / داخلية (اختياري)"
              warning={personnelType ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              options={typeOptions}
              value={personnelType}
              onChange={(e) => setPersonnelType(e.target.value as PersonnelType)}

              disabled={compLock('personnelType')}
            />
            <Select
              label="التمام"
              options={TAMAM_OPTIONS}
              value={status}
              onChange={(e) => {
                const v = e.target.value
                setStatus(v)
                // اسم المستشفى يخص «مستشفى خارجي» بس
                if (v !== 'مستشفى خارجي') setHospitalName('')
              }}

              disabled={compLock('status')}
            />
          </div>
        </div>

        {!isInternalType && (
          <div>
            <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
              القسم الثالث: البيانات العسكرية (حربية)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="السلاح (اختياري)"
                warning={weapon ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                value={weapon}
                onChange={(e) => setWeapon(e.target.value)}
                placeholder="مثال: مشاة"

                disabled={compLock('weapon')}
              />
              <Input
                label="تاريخ الالتحاق بالخدمة (اختياري)"
                warning={enlistmentDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={enlistmentDate}
                onChange={(e) => setEnlistmentDate(e.target.value)}

                disabled={compLock('enlistmentDate')}
              />
              <Input
                label="تاريخ التسريح (اختياري)"
                warning={dischargeDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}

                disabled={compLock('dischargeDate')}
              />
              <Input
                label="تاريخ الضم (اختياري)"
                warning={joiningDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}

                disabled={compLock('joiningDate')}
              />
              <Select
                label="مدة الخدمة — المدة (اختياري)"
                warning={durationYears ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                options={[
                  { value: 'سنة', label: 'سنة' },
                  { value: 'سنتين', label: 'سنتين' }
                ]}
                value={durationYears}
                onChange={(e) => {
                  setDurationYears(e.target.value)
                  if (!e.target.value) setDurationIncrease('')
                }}

                disabled={compLock('serviceDuration')}
              />
              <Select
                label="مدة الخدمة — الزيادة (اختياري)"
                warning={durationYears ? (durationIncrease ? undefined : 'اختياري — يمكن التسجيل بدونه') : 'اختار المدة الأول'}
                options={[
                  { value: 'مع', label: 'مع سنة زيادة' },
                  { value: 'بدون', label: 'بدون سنة زيادة' }
                ]}
                value={durationIncrease}
                onChange={(e) => setDurationIncrease(e.target.value)}
                disabled={!durationYears || compLock('serviceDuration')}
              />
              <Input
                label="فصيلة الدم (اختياري)"
                warning={bloodType ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                placeholder="مثال: A+"

                disabled={compLock('bloodType')}
              />
            </div>
          </div>
        )}

        {isInternalType && (
          <div>
            <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
              القسم الثالث: البيانات العسكرية (داخلية)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="رقم الشرطة (اختياري)"
                warning={policeNumber ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                value={policeNumber}
                onChange={(e) => setPoliceNumber(e.target.value)}
                placeholder="رقم الشرطة"

                disabled={compLock('policeNumber')}
              />
              <Input
                label="تاريخ الالتحاق بالخدمة (اختياري)"
                warning={enlistmentDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={enlistmentDate}
                onChange={(e) => setEnlistmentDate(e.target.value)}

                disabled={compLock('enlistmentDate')}
              />
              <Input
                label="تاريخ التسريح (اختياري)"
                warning={dischargeDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}

                disabled={compLock('dischargeDate')}
              />
              <Input
                label="تاريخ التأييد (اختياري)"
                warning={joiningDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}

                disabled={compLock('joiningDate')}
              />
              <Select
                label="مدة الخدمة — المدة (اختياري)"
                warning={durationYears ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                options={[
                  { value: 'سنة', label: 'سنة' },
                  { value: 'سنتين', label: 'سنتين' }
                ]}
                value={durationYears}
                onChange={(e) => {
                  setDurationYears(e.target.value)
                  if (!e.target.value) setDurationIncrease('')
                }}
                disabled={compLock('serviceDuration')}
              />
              <Select
                label="مدة الخدمة — الزيادة (اختياري)"
                warning={durationYears ? (durationIncrease ? undefined : 'اختياري — يمكن التسجيل بدونه') : 'اختار المدة الأول'}
                options={[
                  { value: 'مع', label: 'مع سنة زيادة' },
                  { value: 'بدون', label: 'بدون سنة زيادة' }
                ]}
                value={durationIncrease}
                onChange={(e) => setDurationIncrease(e.target.value)}
                disabled={!durationYears || compLock('serviceDuration')}
              />
              <Input
                label="فصيلة الدم (اختياري)"
                warning={bloodType ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                placeholder="مثال: A+"

                disabled={compLock('bloodType')}
              />
            </div>
          </div>
        )}

        {isOfficerOrNco && (
          <div>
            <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
              {rankCategory === 'officer' ? 'بيانات الضابط' : 'بيانات صف الضابط'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="رقم الأقدمية (اختياري)"
                warning={seniorityNumber ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                value={seniorityNumber}
                onChange={(e) => setSeniorityNumber(e.target.value)}
                placeholder="رقم الأقدمية"

                disabled={compLock('seniorityNumber')}
              />
              <Input
                label="تاريخ التعيين (اختياري)"
                warning={appointmentDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}

                disabled={compLock('appointmentDate')}
              />
              <Input
                label="تاريخ بدء الخدمة الفعلية (اختياري)"
                warning={serviceStartDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={serviceStartDate}
                onChange={(e) => setServiceStartDate(e.target.value)}

                disabled={compLock('serviceStartDate')}
              />
              <Input
                label="تاريخ آخر ترقية (اختياري)"
                warning={lastPromotionDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={lastPromotionDate}
                onChange={(e) => setLastPromotionDate(e.target.value)}

                disabled={compLock('lastPromotionDate')}
              />
              <Input
                label="تاريخ الترقية المستحقة (اختياري)"
                warning={nextPromotionDate ? undefined : 'اختياري — يمكن التسجيل بدونه'}
                type="date"
                value={nextPromotionDate}
                onChange={(e) => setNextPromotionDate(e.target.value)}

                disabled={compLock('nextPromotionDate')}
              />
            </div>
          </div>
        )}

        {/* قسم تقييم السلوك */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            قسم تقييم السلوك
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="تقييم الأداء الأخير (اختياري)"
              warning={performanceRating ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              options={PERFORMANCE_OPTIONS}
              value={performanceRating}
              onChange={(e) => setPerformanceRating(e.target.value)}

              disabled={compLock('performanceRating')}
            />
            <Select
              label="تقييم السلوك داخل الوحدة (اختياري)"
              warning={behaviorInUnit ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              options={PERFORMANCE_OPTIONS}
              value={behaviorInUnit}
              onChange={(e) => setBehaviorInUnit(e.target.value)}

              disabled={compLock('behaviorInUnit')}
            />
            <Select
              label="تقييم السلوك من المرؤوسين (اختياري)"
              warning={subordinates ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              options={PERFORMANCE_OPTIONS}
              value={subordinates}
              onChange={(e) => setSubordinates(e.target.value)}

              disabled={compLock('subordinates')}
            />
            <Select
              label="تقييم السلوك من الرئيس (اختياري)"
              warning={supervisor ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              options={PERFORMANCE_OPTIONS}
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}

              disabled={compLock('supervisor')}
            />
          </div>
        </div>

        {/* المؤثرات على القوة - تظهر لكل الأنواع */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="المؤثرات على القوة (اختياري)"
            warning={selectedConditions.length > 0 ? undefined : 'اختياري — يمكن التسجيل بدونه'}
            options={CONDITION_OPTIONS}
            value={selectedConditions[selectedConditions.length - 1] || ''}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              setSelectedConditions((prev) => {
                const next = prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                // لو اتشال «منع سلاح» نمسح نوعه
                if (!next.includes('weaponBan')) setWeaponBanType('')
                return next
              })
            }}
          />
          {/* قائمة أنواع منع السلاح — تظهر تحت تقييم السلوك من الرئيس عند اختيار «منع سلاح» */}
          {selectedConditions.includes('weaponBan') && (
            <Select
              label="نوع منع السلاح"
              warning={weaponBanType ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              options={[
                { value: '', label: 'اختر نوع منع السلاح' },
                ...WEAPON_BAN_TYPE_OPTIONS
              ]}
              value={weaponBanType}
              onChange={(e) => setWeaponBanType(e.target.value)}
            />
          )}
          {selectedConditions.length > 0 && (
            <div className="md:col-span-2 flex flex-wrap gap-2 -mt-2">
              {selectedConditions.map((v) => {
                const opt = CONDITION_OPTIONS.find((o) => o.value === v)
                return (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-military-accent/20 text-military-accent text-xs font-semibold"
                  >
                    {v === 'weaponBan' && weaponBanType ? weaponBanType : opt?.label || v}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedConditions((prev) => {
                          const next = prev.filter((x) => x !== v)
                          if (!next.includes('weaponBan')) setWeaponBanType('')
                          return next
                        })
                      }
                      className="text-white/60 hover:text-white ml-1"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 3: Contact & Emergency */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            القسم الثالث: بيانات التواصل والمستندات والاتصال بالطوارئ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="رقم الهاتف الشخصي (اختياري)"
              warning={phone ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"

              disabled={compLock('phone')}
            />
            <Input
              label="البريد الإلكتروني (اختياري)"
              warning={email ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@military.eg"

              disabled={compLock('email')}
            />
            <Input
              label="العنوان بالكامل بالتفصيل (اختياري)"
              warning={address ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المحافظة، المركز، الشارع، رقم المنزل"
              className="md:col-span-2"

              disabled={compLock('address')}
            />
            <Input
              label="شخص للاتصال به بالطوارئ (الاسم بالكامل وعلاقته) (اختياري)"
              warning={emergencyContact ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="مثال: محمد علي حسن (الأب)"

              disabled={compLock('emergencyContact')}
            />
            <Input
              label="هاتف الاتصال في حالات الطوارئ (اختياري)"
              warning={emergencyPhone ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="01XXXXXXXXX"

              disabled={compLock('emergencyPhone')}
            />
            <Input
              label="المستوى التعليمي / الشهادات الحاصل عليها (اختياري)"
              warning={education ? undefined : 'اختياري — يمكن التسجيل بدونه'}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="بكالوريوس / مؤهل متوسط / شهادة عليا"
              className="md:col-span-2"

              disabled={compLock('education')}
            />
            <div className="md:col-span-2 flex flex-col gap-1 text-start">
              <label className="text-sm font-semibold text-gray-300">ملاحظات عامة (اختياري)</label>
              {compLock('notes') && maskLocked ? (
                <div className="w-full bg-military-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-500 italic">
                  مسجل — ليس لديك صلاحية برؤيته
                </div>
              ) : (
                <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={compLock('notes')}
                  className="w-full bg-military-900 border border-white/10 hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg p-2.5 outline-none transition-colors"
                  placeholder="اكتب أي تفاصيل أو ملاحظات إضافية تتعلق بالفرد هنا..."
                />
                {!notes && <span className="text-xs text-amber-400">اختياري — يمكن التسجيل بدونه</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </form>
      </MaskContext.Provider>
    </Modal>
  )
}
