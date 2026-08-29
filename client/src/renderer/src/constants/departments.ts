export const MILITARY_DEPARTMENTS = [
  'عمليات',
  'منوب',
  'افراد',
  'شبكه عسكريه',
  'منظومه',
  'اشاره',
  'متابعة ظباط',
  'شئون معنويه',
  'صيانه و اعطال',
  'امن',
  'مراقبه',
  'مهندسين',
  'منشاء',
  'كانتين ظباط'
]

export const INTERNAL_DEPARTMENTS = [
  'عمليات',
  'شئون مجندين',
  'شئون ضباط',
  'تعين',
  'مقصف',
  'متابعة ضباط',
  'امن'
]

export const getDepartmentOptions = (
  type: 'داخلية' | 'حربية'
): { value: string; label: string }[] =>
  (type === 'داخلية' ? INTERNAL_DEPARTMENTS : MILITARY_DEPARTMENTS).map((d) => ({
    value: d,
    label: d
  }))

// أقسام المستخدمين في المنظومة (تُستخدم لاحقاً لتحديد الصلاحيات)
// القسم يعتمد على نوع المستخدم (حربية / داخلية)
export const USER_SECTIONS_BY_TYPE: Record<'داخلية' | 'حربية', string[]> = {
  حربية: ['أفراد', 'عمليات حربية', 'عيادة', 'أمن'],
  داخلية: ['شئون داخلية', 'عمليات داخلية', 'عيادة', 'أمن']
}

export const getUserSectionOptions = (
  type?: 'داخلية' | 'حربية'
): { value: string; label: string }[] => {
  const list = type
    ? USER_SECTIONS_BY_TYPE[type]
    : [...USER_SECTIONS_BY_TYPE['حربية'], ...USER_SECTIONS_BY_TYPE['داخلية']]
  return list.map((d) => ({ value: d, label: d }))
}

// الدرجات الوظيفية للمستخدم
export const USER_DEGREES = ['جندي', 'صف ضابط', 'ضابط']

export const getUserDegreeOptions = (): { value: string; label: string }[] =>
  USER_DEGREES.map((d) => ({ value: d, label: d }))
