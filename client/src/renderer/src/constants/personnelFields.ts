export const PERSONNEL_TYPE_OPTIONS = [
  { value: 'حربية', label: 'حربية' },
  { value: 'داخلية', label: 'داخلية' },
  { value: 'تشغيل حربيه', label: 'تشغيل حربيه' }
]

export const TAMAM_OPTIONS = [
  'داخل القطاع',
  'اجازه',
  'ماموريه',
  'ملحق منطقه',
  'ملحق جهاز سطع',
  'ملحق جهاز الامن',
  'ملحق ك9',
  'مسح امن جهاز',
  'مسح امنى مركز تدريب',
  'عرض مستشفى',
  'غياب',
  'علامه 91',
  'نويبع'
].map((d) => ({ value: d, label: d }))

export const WEAPON_BAN_OPTIONS = [
  { value: 'غير ممنوع', label: 'غير ممنوع' },
  { value: 'ممنوع', label: 'ممنوع' }
]
