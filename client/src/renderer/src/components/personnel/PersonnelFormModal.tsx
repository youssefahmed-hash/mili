import React, { useState, useEffect } from 'react'
import { usePersonnelStore } from '../../store/personnelStore'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Upload } from 'lucide-react'
import type { Personnel } from '../../types/personnel'
import { resolveFileUrl, isPdf } from '../../utils/fileUrl'
import { TAB_RANK_MAP, getRankCategory } from '../../constants/categories'
import { getDepartmentOptions } from '../../constants/departments'
import {
  PERSONNEL_TYPE_OPTIONS,
  TAMAM_OPTIONS,
  WEAPON_BAN_OPTIONS
} from '../../constants/personnelFields'
import { useAuthStore } from '../../store/authStore'

const ATTACHMENTS = [
  { key: 'cardImage', label: 'صورة البطاقة', hint: 'صورة أو ملف PDF' },
  { key: 'carnetImage', label: 'صورة الكارنيه', hint: 'صورة أو ملف PDF' },
  { key: 'formImage', label: 'صورة النموذج', hint: 'صورة أو ملف PDF' }
] as const

interface PersonnelFormModalProps {
  isOpen: boolean
  onClose: () => void
  target?: Personnel | null // If target exists, we are editing
}

export const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({
  isOpen,
  onClose,
  target
}) => {
  const { addPersonnel, editPersonnel, fetchPersonnelList, error: storeError } = usePersonnelStore()
  const { user: authUser } = useAuthStore()
  const isEdit = !!target

  // Local form states
  const [fullName, setFullName] = useState('')
  const [rank, setRank] = useState('جندي')
  const [militaryId, setMilitaryId] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [residencePlace, setResidencePlace] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('أعزب')
  const [familyMembersCount, setFamilyMembersCount] = useState('')
  const [parentsLivingSeparately, setParentsLivingSeparately] = useState('معاً')
  const [fatherHealthStatus, setFatherHealthStatus] = useState('حي')
  const [fatherWork, setFatherWork] = useState('')
  const [fatherPhone, setFatherPhone] = useState('')
  const [motherHealthStatus, setMotherHealthStatus] = useState('حي')
  const [motherWork, setMotherWork] = useState('')
  const [motherPhone, setMotherPhone] = useState('')
  const [unit, setUnit] = useState(
    () => getDepartmentOptions(authUser?.userType === 'داخلية' ? 'داخلية' : 'حربية')[0]?.value || ''
  )
  const [specialization, setSpecialization] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [serviceStartDate, setServiceStartDate] = useState('')
  const [status, setStatus] = useState('داخل القطاع')
  const [education, setEducation] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [performanceRating, setPerformanceRating] = useState('ممتاز')
  const [lastPromotionDate, setLastPromotionDate] = useState('')
  const [nextPromotionDate, setNextPromotionDate] = useState('')
  const [notes, setNotes] = useState('')
  const [workBeforeEnlistment, setWorkBeforeEnlistment] = useState('')
  const [behaviorInUnit, setBehaviorInUnit] = useState('')
  const [subordinates, setSubordinates] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [batchDate, setBatchDate] = useState('')
  const [personnelType, setPersonnelType] = useState<'حربية' | 'داخلية'>(
    authUser?.userType === 'داخلية' ? 'داخلية' : 'حربية'
  )
  const [enlistmentDate, setEnlistmentDate] = useState('')
  const [dischargeDate, setDischargeDate] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [weapon, setWeapon] = useState('')
  const [lastLeaveReturnDate, setLastLeaveReturnDate] = useState('')
  const [guardCount, setGuardCount] = useState('')
  const [seniorityNumber, setSeniorityNumber] = useState('')
  const [grade, setGrade] = useState('')
  const [promotionCurrentRankDate, setPromotionCurrentRankDate] = useState('')
  const [promotionCurrentGradeDate, setPromotionCurrentGradeDate] = useState('')
  const [promotionHigherRankDate, setPromotionHigherRankDate] = useState('')
  const [promotionHigherGradeDate, setPromotionHigherGradeDate] = useState('')
  const [vacationCycle, setVacationCycle] = useState('28')
  const [vacationAnchor, setVacationAnchor] = useState('')
  const [policeNumber, setPoliceNumber] = useState('')
  const [reserveDate, setReserveDate] = useState('')
  const [administrativeUnits, setAdministrativeUnits] = useState('')
  const [militaryTrials, setMilitaryTrials] = useState('')
  const [affiliatedUnit, setAffiliatedUnit] = useState('')
  const [display, setDisplay] = useState('')
  const [strikeOff, setStrikeOff] = useState('')
  const [injured, setInjured] = useState('')
  const [clinics, setClinics] = useState('')
  const [medicalCommissionLeaves, setMedicalCommissionLeaves] = useState('')
  const [weaponBan, setWeaponBan] = useState('غير ممنوع')

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
      setMaritalStatus(target.maritalStatus || 'أعزب')
      setWorkBeforeEnlistment(target.workBeforeEnlistment || '')
      setBehaviorInUnit(target.behaviorInUnit || '')
      setSubordinates(target.subordinates || '')
      setSupervisor(target.supervisor || '')
      setBatchDate(target.batchDate ? target.batchDate.split('T')[0] : '')
      setFamilyMembersCount(target.familyMembersCount || '')
      setParentsLivingSeparately(target.parentsLivingSeparately || 'معاً')
      setFatherHealthStatus(target.fatherHealthStatus || 'حي')
      setFatherWork(target.fatherWork || '')
      setFatherPhone(target.fatherPhone || '')
      setMotherHealthStatus(target.motherHealthStatus || 'حي')
      setMotherWork(target.motherWork || '')
      setMotherPhone(target.motherPhone || '')
      setUnit(target.unit || 'الكتيبة الأولى')
      setSpecialization(target.specialization || '')
      setPersonnelType(target.personnelType || 'حربية')
      setEnlistmentDate(target.enlistmentDate ? target.enlistmentDate.split('T')[0] : '')
      setDischargeDate(target.dischargeDate ? target.dischargeDate.split('T')[0] : '')
      setJoiningDate(target.joiningDate ? target.joiningDate.split('T')[0] : '')
      setWeapon(target.weapon || '')
      setLastLeaveReturnDate(
        target.lastLeaveReturnDate ? target.lastLeaveReturnDate.split('T')[0] : ''
      )
      setGuardCount(target.guardCount != null ? String(target.guardCount) : '')
      setSeniorityNumber(target.seniorityNumber || '')
      setGrade(target.grade || '')
      setPromotionCurrentRankDate(
        target.promotionCurrentRankDate ? target.promotionCurrentRankDate.split('T')[0] : ''
      )
      setPromotionCurrentGradeDate(
        target.promotionCurrentGradeDate ? target.promotionCurrentGradeDate.split('T')[0] : ''
      )
      setPromotionHigherRankDate(
        target.promotionHigherRankDate ? target.promotionHigherRankDate.split('T')[0] : ''
      )
      setPromotionHigherGradeDate(
        target.promotionHigherGradeDate ? target.promotionHigherGradeDate.split('T')[0] : ''
      )
      setVacationCycle(target.vacationCycle || '28')
      setVacationAnchor(target.vacationAnchor ? target.vacationAnchor.split('T')[0] : '')
      setPoliceNumber(target.policeNumber || '')
      setReserveDate(target.reserveDate ? target.reserveDate.split('T')[0] : '')
      setAdministrativeUnits(
        target.administrativeUnits != null ? String(target.administrativeUnits) : ''
      )
      setMilitaryTrials(target.militaryTrials || '')
      setAffiliatedUnit(target.affiliatedUnit || '')
      setDisplay(target.display || '')
      setStrikeOff(target.strikeOff || '')
      setInjured(target.injured || '')
      setClinics(target.clinics || '')
      setMedicalCommissionLeaves(target.medicalCommissionLeaves || '')
      setWeaponBan(target.weaponBan || 'غير ممنوع')
      setAppointmentDate(target.appointmentDate ? target.appointmentDate.split('T')[0] : '')
      setServiceStartDate(target.serviceStartDate ? target.serviceStartDate.split('T')[0] : '')
      setStatus(target.status || 'داخل القطاع')
      setEducation(target.education || '')
      setPhone(target.phone || '')
      setEmail(target.email || '')
      setAddress(target.address || '')
      setEmergencyContact(target.emergencyContact || '')
      setEmergencyPhone(target.emergencyPhone || '')
      setPerformanceRating(target.performanceRating || 'ممتاز')
      setLastPromotionDate(target.lastPromotionDate ? target.lastPromotionDate.split('T')[0] : '')
      setNextPromotionDate(target.nextPromotionDate ? target.nextPromotionDate.split('T')[0] : '')
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
    if (!unit.trim()) errs.unit = 'قسم / نقطه مطلوب'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    const derivedCategory =
      (Object.keys(TAB_RANK_MAP) as Array<keyof typeof TAB_RANK_MAP>).find((cat) =>
        TAB_RANK_MAP[cat].includes(rank)
      ) || 'soldier'

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('category', derivedCategory)
    formData.append('rank', rank)
    formData.append('militaryId', militaryId)
    formData.append('nationalId', nationalId)
    formData.append('birthDate', birthDate)
    formData.append('birthPlace', birthPlace)
    formData.append('residencePlace', residencePlace)
    formData.append('maritalStatus', maritalStatus)
    if (familyMembersCount) formData.append('familyMembersCount', familyMembersCount)
    formData.append('parentsLivingSeparately', parentsLivingSeparately)
    formData.append('fatherHealthStatus', fatherHealthStatus)
    formData.append('fatherWork', fatherWork)
    formData.append('fatherPhone', fatherPhone)
    formData.append('motherHealthStatus', motherHealthStatus)
    formData.append('motherWork', motherWork)
    formData.append('motherPhone', motherPhone)
    formData.append('unit', unit)
    formData.append('personnelType', personnelType)
    if (enlistmentDate) formData.append('enlistmentDate', enlistmentDate)
    if (dischargeDate) formData.append('dischargeDate', dischargeDate)
    if (joiningDate) formData.append('joiningDate', joiningDate)
    if (weapon) formData.append('weapon', weapon)
    if (lastLeaveReturnDate) formData.append('lastLeaveReturnDate', lastLeaveReturnDate)
    if (guardCount) formData.append('guardCount', guardCount)
    if (seniorityNumber) formData.append('seniorityNumber', seniorityNumber)
    if (grade) formData.append('grade', grade)
    if (promotionCurrentRankDate)
      formData.append('promotionCurrentRankDate', promotionCurrentRankDate)
    if (promotionCurrentGradeDate)
      formData.append('promotionCurrentGradeDate', promotionCurrentGradeDate)
    if (promotionHigherRankDate) formData.append('promotionHigherRankDate', promotionHigherRankDate)
    if (promotionHigherGradeDate)
      formData.append('promotionHigherGradeDate', promotionHigherGradeDate)
    if (vacationCycle) formData.append('vacationCycle', vacationCycle)
    if (vacationAnchor) formData.append('vacationAnchor', vacationAnchor)
    if (policeNumber) formData.append('policeNumber', policeNumber)
    if (reserveDate) formData.append('reserveDate', reserveDate)
    if (administrativeUnits) formData.append('administrativeUnits', administrativeUnits)
    if (militaryTrials) formData.append('militaryTrials', militaryTrials)
    if (affiliatedUnit) formData.append('affiliatedUnit', affiliatedUnit)
    if (display) formData.append('display', display)
    if (strikeOff) formData.append('strikeOff', strikeOff)
    if (injured) formData.append('injured', injured)
    if (clinics) formData.append('clinics', clinics)
    if (medicalCommissionLeaves) formData.append('medicalCommissionLeaves', medicalCommissionLeaves)
    if (weaponBan) formData.append('weaponBan', weaponBan)
    formData.append('specialization', specialization)
    if (appointmentDate) formData.append('appointmentDate', appointmentDate)
    if (serviceStartDate) formData.append('serviceStartDate', serviceStartDate)
    if (batchDate) formData.append('batchDate', batchDate)
    formData.append('status', status)
    formData.append('education', education)
    formData.append('phone', phone)
    formData.append('email', email)
    formData.append('address', address)
    formData.append('emergencyContact', emergencyContact)
    formData.append('emergencyPhone', emergencyPhone)
    formData.append('performanceRating', performanceRating)
    if (lastPromotionDate) formData.append('lastPromotionDate', lastPromotionDate)
    if (nextPromotionDate) formData.append('nextPromotionDate', nextPromotionDate)
    formData.append('notes', notes)
    formData.append('workBeforeEnlistment', workBeforeEnlistment)
    formData.append('behaviorInUnit', behaviorInUnit)
    formData.append('subordinates', subordinates)
    formData.append('supervisor', supervisor)

    if (photoFile) {
      formData.append('photo', photoFile)
    }

    ATTACHMENTS.forEach(({ key }) => {
      const file = attachments[key]
      if (file) {
        formData.append(key, file)
      }
    })

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

  const statusOptions = TAMAM_OPTIONS

  const rankOptions = [
    { value: 'جندي', label: 'جندي' },
    { value: 'عريف', label: 'عريف' },
    { value: 'رقيب', label: 'رقيب' },
    { value: 'رقيب أول', label: 'رقيب أول' },
    { value: 'مساعد', label: 'مساعد' },
    { value: 'مساعد أول', label: 'مساعد أول' },
    { value: 'ملازم', label: 'ملازم' },
    { value: 'ملازم أول', label: 'ملازم أول' },
    { value: 'نقيب', label: 'نقيب' },
    { value: 'رائد', label: 'رائد' },
    { value: 'مقدم', label: 'مقدم' },
    { value: 'عقيد', label: 'عقيد' },
    { value: 'عميد', label: 'عميد' },
    { value: 'لواء', label: 'لواء' }
  ]

  const maritalOptions = [
    { value: 'أعزب', label: 'أعزب' },
    { value: 'متزوج', label: 'متزوج' },
    { value: 'مطلق', label: 'مطلق' },
    { value: 'أرمل', label: 'أرمل' }
  ]

  const healthOptions = [
    { value: 'حي', label: 'حي' },
    { value: 'متوفي', label: 'متوفي' }
  ]

  const parentsLivingOptions = [
    { value: 'معاً', label: 'معاً (في سكن واحد)' },
    { value: 'منفصلين', label: 'منفصلين (سكن مختلف)' }
  ]

  const unitOptions = getDepartmentOptions(authUser?.userType === 'داخلية' ? 'داخلية' : 'حربية')

  const performanceOptions = [
    { value: 'ممتاز', label: 'ممتاز' },
    { value: 'جيد جداً', label: 'جيد جداً' },
    { value: 'جيد', label: 'جيد' },
    { value: 'مقبول', label: 'مقبول' },
    { value: 'ضعيف', label: 'ضعيف' }
  ]

  const modalFooter = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        إلغاء
      </Button>
      <Button variant={isEdit ? 'accent' : 'primary'} onClick={handleSubmit} loading={loading}>
        {isEdit ? 'حفظ التغييرات' : 'تسجيل الفرد'}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'تعديل ملف الفرد العسكري' : 'تسجيل فرد عسكري جديد'}
      footer={modalFooter}
      size="2xl"
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {storeError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-start font-bold">
            {storeError}
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
              <label className="text-sm font-semibold text-gray-300">الصورة الشخصية</label>
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
              />
              <Input
                label="الرقم القومي (14 رقماً) *"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                error={errors.nationalId}
                placeholder="2950101XXXXXXXX"
                maxLength={14}
              />
              <Input
                label="تاريخ الميلاد *"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                error={errors.birthDate}
              />
              <Input
                label="محل الميلاد"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="المحافظة / المدينة"
              />
              <Input
                label="محل الإقامة"
                value={residencePlace}
                onChange={(e) => setResidencePlace(e.target.value)}
                placeholder="المحافظة / المدينة / العنوان"
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
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{hint}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section: Social & Family Info */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            البيانات الاجتماعية والأسرية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="الحالة الاجتماعية"
              options={maritalOptions}
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
            />
            <Input
              label="عدد أفراد الأسرة (الحالة المدنية)"
              type="number"
              min={0}
              value={familyMembersCount}
              onChange={(e) => setFamilyMembersCount(e.target.value)}
              placeholder="مثال: 5"
            />
            <Select
              label="سكن الوالد والوالدة"
              options={parentsLivingOptions}
              value={parentsLivingSeparately}
              onChange={(e) => setParentsLivingSeparately(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Father */}
            <div className="glassmorphism p-4 rounded-xl flex flex-col gap-4">
              <h5 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-2 text-start">
                بيانات الوالد
              </h5>
              <Select
                label="الحالة الصحية"
                options={healthOptions}
                value={fatherHealthStatus}
                onChange={(e) => setFatherHealthStatus(e.target.value)}
              />
              <Input
                label="العمل"
                value={fatherWork}
                onChange={(e) => setFatherWork(e.target.value)}
                placeholder="مثال: متقاعد / موظف"
                disabled={fatherHealthStatus === 'متوفي'}
              />
              <Input
                label="رقم الهاتف"
                value={fatherPhone}
                onChange={(e) => setFatherPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                disabled={fatherHealthStatus === 'متوفي'}
              />
            </div>

            {/* Mother */}
            <div className="glassmorphism p-4 rounded-xl flex flex-col gap-4">
              <h5 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-2 text-start">
                بيانات الوالدة
              </h5>
              <Select
                label="الحالة الصحية"
                options={healthOptions}
                value={motherHealthStatus}
                onChange={(e) => setMotherHealthStatus(e.target.value)}
              />
              <Input
                label="العمل"
                value={motherWork}
                onChange={(e) => setMotherWork(e.target.value)}
                placeholder="مثال: ربة منزل"
                disabled={motherHealthStatus === 'متوفي'}
              />
              <Input
                label="رقم الهاتف"
                value={motherPhone}
                onChange={(e) => setMotherPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                disabled={motherHealthStatus === 'متوفي'}
              />
            </div>
          </div>

          <Input
            label="العمل قبل التجنيد"
            value={workBeforeEnlistment}
            onChange={(e) => setWorkBeforeEnlistment(e.target.value)}
            placeholder="مثال: مدرس / فني / طالب"
            className="mt-4"
          />
        </div>

        {/* Section 2: Military Info */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            القسم الثاني: البيانات الوظيفية والعسكرية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="الرتبة"
              options={rankOptions}
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            />
            <Input
              label="الرقم العسكري *"
              value={militaryId}
              onChange={(e) => setMilitaryId(e.target.value)}
              error={errors.militaryId}
              placeholder="مثال: 202611099"
            />
            <Select
              label="قسم - نقطه"
              options={unitOptions}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <Select
              label="حربية / داخلية"
              options={PERSONNEL_TYPE_OPTIONS}
              value={personnelType}
              onChange={(e) => setPersonnelType(e.target.value as 'حربية' | 'داخلية')}
            />
            <Input
              label="التخصص"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="مثال: كاتب إلكتروني"
            />
            <Input
              label="تاريخ التعيين"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
            <Input
              label="تاريخ بدء الخدمة الفعلية"
              type="date"
              value={serviceStartDate}
              onChange={(e) => setServiceStartDate(e.target.value)}
            />
            <Select
              label="تقييم الأداء الأخير"
              options={performanceOptions}
              value={performanceRating}
              onChange={(e) => setPerformanceRating(e.target.value)}
            />
            <Input
              label="تاريخ آخر ترقية"
              type="date"
              value={lastPromotionDate}
              onChange={(e) => setLastPromotionDate(e.target.value)}
            />
            <Input
              label="تاريخ الترقية المستحقة"
              type="date"
              value={nextPromotionDate}
              onChange={(e) => setNextPromotionDate(e.target.value)}
            />
            <Input
              label="الدفعة"
              type="date"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
            />
            <Select
              label="تقييم السلوك داخل الوحدة"
              options={performanceOptions}
              value={behaviorInUnit}
              onChange={(e) => setBehaviorInUnit(e.target.value)}
            />
            <Select
              label="تقييم السلوك من المرؤوسين"
              options={performanceOptions}
              value={subordinates}
              onChange={(e) => setSubordinates(e.target.value)}
            />
            <Select
              label="تقييم السلوك من الرئيس"
              options={performanceOptions}
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            بيانات دورة الإجازات
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="دورة النزول (يوم)"
              options={[
                { value: '14', label: 'كل 14 يوم' },
                { value: '28', label: 'كل 28 يوم' }
              ]}
              value={vacationCycle}
              onChange={(e) => setVacationCycle(e.target.value)}
            />
            <Input
              label="تاريخ أول نزول (مرجع الدورة)"
              type="date"
              value={vacationAnchor}
              onChange={(e) => setVacationAnchor(e.target.value)}
            />
          </div>
        </div>

        {personnelType === 'حربية' &&
          (() => {
            const cat = getRankCategory(rank)
            if (cat === 'officer') {
              return (
                <div>
                  <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
                    بيانات عسكرية (ضابط - حربية)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="رقم اقدميه"
                      value={seniorityNumber}
                      onChange={(e) => setSeniorityNumber(e.target.value)}
                      placeholder="رقم الاقدمية"
                    />
                    <Input
                      label="السلاح"
                      value={weapon}
                      onChange={(e) => setWeapon(e.target.value)}
                      placeholder="مثال: مشاة"
                    />
                    <Input
                      label="تاريخ التجنيد"
                      type="date"
                      value={enlistmentDate}
                      onChange={(e) => setEnlistmentDate(e.target.value)}
                    />
                    <Input
                      label="تاريخ الضم"
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                    <Input
                      label="تاريخ ترقى للرتبه الحاليه"
                      type="date"
                      value={promotionCurrentRankDate}
                      onChange={(e) => setPromotionCurrentRankDate(e.target.value)}
                    />
                    <Input
                      label="تاريخ ترقى للرتبه الاعلى"
                      type="date"
                      value={promotionHigherRankDate}
                      onChange={(e) => setPromotionHigherRankDate(e.target.value)}
                    />
                    <Input
                      label="اخر عوده"
                      type="date"
                      value={lastLeaveReturnDate}
                      onChange={(e) => setLastLeaveReturnDate(e.target.value)}
                    />
                  </div>
                </div>
              )
            }
            if (cat === 'non_commissioned_officer') {
              return (
                <div>
                  <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
                    بيانات عسكرية (صف ضابط - حربية)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="الدرجه"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="مثال: رقيب أول"
                    />
                    <Input
                      label="رقم اقدميه"
                      value={seniorityNumber}
                      onChange={(e) => setSeniorityNumber(e.target.value)}
                      placeholder="رقم الاقدمية"
                    />
                    <Input
                      label="السلاح"
                      value={weapon}
                      onChange={(e) => setWeapon(e.target.value)}
                      placeholder="مثال: مشاة"
                    />
                    <Input
                      label="تاريخ التجنيد"
                      type="date"
                      value={enlistmentDate}
                      onChange={(e) => setEnlistmentDate(e.target.value)}
                    />
                    <Input
                      label="تاريخ الضم"
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                    <Input
                      label="تاريخ ترقى للدرجه الحاليه"
                      type="date"
                      value={promotionCurrentGradeDate}
                      onChange={(e) => setPromotionCurrentGradeDate(e.target.value)}
                    />
                    <Input
                      label="تاريخ ترقى للدرجه الاعلى"
                      type="date"
                      value={promotionHigherGradeDate}
                      onChange={(e) => setPromotionHigherGradeDate(e.target.value)}
                    />
                    <Input
                      label="اخر عوده"
                      type="date"
                      value={lastLeaveReturnDate}
                      onChange={(e) => setLastLeaveReturnDate(e.target.value)}
                    />
                  </div>
                </div>
              )
            }
            return (
              <div>
                <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
                  بيانات عسكرية (مجند - حربية)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="تاريخ التجنيد"
                    type="date"
                    value={enlistmentDate}
                    onChange={(e) => setEnlistmentDate(e.target.value)}
                  />
                  <Input
                    label="تاريخ التسريح"
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                  />
                  <Input
                    label="تاريخ الضم"
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                  />
                  <Input
                    label="السلاح"
                    value={weapon}
                    onChange={(e) => setWeapon(e.target.value)}
                    placeholder="مثال: مشاة"
                  />
                  <Input
                    label="تاريخ اخر عوده من اجازه"
                    type="date"
                    value={lastLeaveReturnDate}
                    onChange={(e) => setLastLeaveReturnDate(e.target.value)}
                  />
                  <Input
                    label="عدد الجذات"
                    type="number"
                    min={0}
                    value={guardCount}
                    onChange={(e) => setGuardCount(e.target.value)}
                    placeholder="0"
                  />
                  <Select
                    label="التمام"
                    options={statusOptions}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  />
                </div>
              </div>
            )
          })()}

        {personnelType === 'داخلية' && (
          <div>
            <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
              بيانات داخلية
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="رقم الشرطة"
                value={policeNumber}
                onChange={(e) => setPoliceNumber(e.target.value)}
                placeholder="رقم الشرطة"
              />
              <Input
                label="تاريخ التجنيد"
                type="date"
                value={enlistmentDate}
                onChange={(e) => setEnlistmentDate(e.target.value)}
              />
              <Input
                label="تاريخ الرديف"
                type="date"
                value={reserveDate}
                onChange={(e) => setReserveDate(e.target.value)}
              />
              <Input
                label="الجذات الاداريه"
                type="number"
                min={0}
                value={administrativeUnits}
                onChange={(e) => setAdministrativeUnits(e.target.value)}
                placeholder="0"
              />
              <Input
                label="المحاكمات العسكرية"
                value={militaryTrials}
                onChange={(e) => setMilitaryTrials(e.target.value)}
                placeholder="تفاصيل المحاكمات"
              />
              <Input
                label="السريه التابع لها"
                value={affiliatedUnit}
                onChange={(e) => setAffiliatedUnit(e.target.value)}
                placeholder="السرية"
              />
              <Input label="العرض" value={display} onChange={(e) => setDisplay(e.target.value)} />
              <Input
                label="الشطب"
                value={strikeOff}
                onChange={(e) => setStrikeOff(e.target.value)}
              />
              <Input
                label="المصابين"
                value={injured}
                onChange={(e) => setInjured(e.target.value)}
              />
              <Input
                label="العيادات"
                value={clinics}
                onChange={(e) => setClinics(e.target.value)}
              />
              <Input
                label="الاجازات علي القمسيون الطبي"
                value={medicalCommissionLeaves}
                onChange={(e) => setMedicalCommissionLeaves(e.target.value)}
              />
              <Select
                label="البمنع من السلاح"
                options={WEAPON_BAN_OPTIONS}
                value={weaponBan}
                onChange={(e) => setWeaponBan(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Section 3: Contact & Emergency */}
        <div>
          <h4 className="text-sm font-bold text-military-accent uppercase tracking-wider border-b border-white/5 pb-2 mb-4 text-start">
            القسم الثالث: بيانات التواصل والمستندات والاتصال بالطوارئ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="رقم الهاتف الشخصي"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@military.eg"
            />
            <Input
              label="العنوان بالكامل بالتفصيل"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المحافظة، المركز، الشارع، رقم المنزل"
              className="md:col-span-2"
            />
            <Input
              label="شخص للاتصال به بالطوارئ (الاسم بالكامل وعلاقته)"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="مثال: محمد علي حسن (الأب)"
            />
            <Input
              label="هاتف الاتصال في حالات الطوارئ"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
            <Input
              label="المستوى التعليمي / الشهادات الحاصل عليها"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="بكالوريوس / مؤهل متوسط / شهادة عليا"
              className="md:col-span-2"
            />
            <div className="md:col-span-2 flex flex-col gap-1 text-start">
              <label className="text-sm font-semibold text-gray-300">ملاحظات عامة</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-military-900 border border-white/10 hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg p-2.5 outline-none transition-colors"
                placeholder="اكتب أي تفاصيل أو ملاحظات إضافية تتعلق بالفرد هنا..."
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
