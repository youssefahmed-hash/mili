export const PERSONNEL_TYPE_OPTIONS = [
  { value: 'حربية', label: 'حربية' },
  { value: 'داخلية', label: 'داخلية' },
  { value: 'تشغيل حربيه', label: 'تشغيل حربيه' },
  { value: 'مستجد حربية', label: 'مستجد حربية' },
  { value: 'مستجد داخلية', label: 'مستجد داخلية' }
]

export const CONDITION_OPTIONS = [
  { value: 'weaponBan', label: 'منع سلاح' },
  { value: 'neuro', label: 'نفسية وعصبية' },
  { value: 'struckDischarged', label: 'شطب مسرح' },
  { value: 'struckRetained', label: 'شطب غير مسرح' }
]

// أنواع «منع السلاح» — تظهر في قائمة فرعية عند اختيار «منع سلاح»
export const WEAPON_BAN_TYPE_OPTIONS = [
  { value: 'منع سلاح نفسي', label: 'منع سلاح نفسي' },
  { value: 'منع سلاح سياسي', label: 'منع سلاح سياسي' },
  { value: 'منع سلاح طبي', label: 'منع سلاح طبي' },
  { value: 'منع سلاح جنائي', label: 'منع سلاح جنائي' },
  { value: 'منع سلاح احترازي', label: 'منع سلاح احترازي' },
  { value: 'منع سلاح احترازي سياسي', label: 'منع سلاح احترازي سياسي' }
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
  'مستشفى خارجي',
  'محكمه',
  'غياب',
  'علامه 91',
  'نويبع'
].map((d) => ({ value: d, label: d }))

export const WEAPON_BAN_OPTIONS = [
  { value: 'غير ممنوع', label: 'غير ممنوع' },
  { value: 'ممنوع', label: 'ممنوع' }
]

// أسماء المستشفيات — تظهر عند اختيار «مستشفى خارجي» في التمام
export const HOSPITAL_OPTIONS = [
  { value: 'مستشفى الشرطة بالرحاب', label: 'مستشفى الشرطة بالرحاب' },
  { value: 'مستشفى احمد جلال العسكري', label: 'مستشفى احمد جلال العسكري' },
  { value: 'عيادات قوات الامن بالرويسات', label: 'عيادات قوات الامن بالرويسات' },
  { value: 'مستشفى شرم الشيخ الدولي', label: 'مستشفى شرم الشيخ الدولي' }
]
