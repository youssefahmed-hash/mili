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
