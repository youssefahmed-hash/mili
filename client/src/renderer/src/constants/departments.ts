// ==================== أقسام/وحدات الأفراد ====================
// كل قسم تابع لنوع واحد (حربية / داخلية). الاختيارات في كل الشاشات بتتفلتر حسب النوع،
// ومدير النظام فقط بيشوف القسمين مع بعض.

export const MILITARY_DEPARTMENTS = [
  'الخط',
  'عمليات',
  'منوب',
  'افراد',
  'شبكه عسكريه',
  'منظومه',
  'اشاره',
  'متابعة ظباط',
  'شئون معنويه',
  'صيانه و اعطال',
  'امن حربية',
  'مراقبه',
  'مهندسين',
  'منشاء',
  'كانتين ظباط',
  'حملة حربية',
  'عيادة',
  'وقود',
  // «جنايني» و«خدمات» قسمين منفصلين لحربية والتشغيل
  'جنايني',
  'خدمات',
  // اختيار «بدون قسم» بيشيل الفرد من قسمه القديم وبيخليه بلا قسم
  'بدون قسم'
] as const;

export const INTERNAL_DEPARTMENTS = [
  'شئون مجندين',
  'شئون ضباط',
  'تعين',
  'مقصف',
  'متابعة ضباط',
  'تأمين قطاع شرق',
  'علاقات',
  'أسلحة وذخيرة',
  'عهدة',
  'ماليات',
  'تدريب',
  // «سرية الأمن» هي قسم الأمن للعساكر الداخلية (مش بنكررها باسم «امن داخلية»)
  'سرية الأمن',
  'عمليات داخلية',
  'حملة داخلية',
  'مغسلة',
  'حمامات',
  'فرن',
  'خدمات',
  // اختيار «بدون قسم» بيشيل الفرد من قسمه القديم وبيخليه بلا قسم
  'بدون قسم'
] as const;

export type DepartmentType = 'داخلية' | 'حربية';

export const getDepartmentOptions = (
  type: DepartmentType
): { value: string; label: string }[] =>
  (type === 'داخلية' ? INTERNAL_DEPARTMENTS : MILITARY_DEPARTMENTS).map((d) => ({
    value: d,
    label: d
  }));

/** كل الأقسام (حربية + داخلية) بدون تكرار — لمدير النظام */
export const getAllDepartmentOptions = (): { value: string; label: string }[] => {
  const seen = new Set<string>();
  const all = [...MILITARY_DEPARTMENTS, ...INTERNAL_DEPARTMENTS];
  const unique = all.filter((d) => {
    if (seen.has(d)) return false;
    seen.add(d);
    return true;
  });
  // «بدون قسم» تفضل آخر اختيار في القايمة دايمًا
  const ordered = [
    ...unique.filter((d) => d !== 'بدون قسم'),
    ...unique.filter((d) => d === 'بدون قسم')
  ];
  return ordered.map((d) => ({ value: d, label: d }));
};

/**
 * اختيارات الأقسام حسب نوع المستخدم:
 * - مدير النظام → القسمين (حربية + داخلية)
 * - حربية → أقسام حربية فقط
 * - داخلية → أقسام داخلية فقط
 */
export const getDepartmentOptionsForUser = (
  user?: { role?: string; userType?: string } | null
): { value: string; label: string }[] => {
  if (!user) return getAllDepartmentOptions();
  if (user.role === 'admin') return getAllDepartmentOptions();
  return getDepartmentOptions(user.userType === 'داخلية' ? 'داخلية' : 'حربية');
};

// أقسام المستخدمين في المنظومة (صلاحيات الوصول للتبويبات - منظومة مختلفة)
// القسم يعتمد على نوع المستخدم (حربية / داخلية)
export const USER_SECTIONS_BY_TYPE: Record<DepartmentType, string[]> = {
  حربية: ['أفراد', 'عمليات حربية', 'عيادة', 'أمن حربية'],
  داخلية: ['شئون داخلية', 'شئون مجندين', 'عمليات داخلية', 'عيادة', 'أمن داخلية']
};

/** القسم ده تابع لأنواع إيه؟ (بعض الأقسام مشتركة زي العيادة) */
export const getSectionTypes = (section: string): DepartmentType[] => {
  const types: DepartmentType[] = [];
  if (USER_SECTIONS_BY_TYPE['حربية'].includes(section)) types.push('حربية');
  if (USER_SECTIONS_BY_TYPE['داخلية'].includes(section)) types.push('داخلية');
  return types;
};

export const getUserSectionOptions = (
  type?: DepartmentType
): { value: string; label: string }[] => {
  const list = type
    ? USER_SECTIONS_BY_TYPE[type]
    : [...USER_SECTIONS_BY_TYPE['حربية'], ...USER_SECTIONS_BY_TYPE['داخلية']];
  return list.map((d) => ({ value: d, label: d }));
};

// الدرجات الوظيفية للمستخدم
export const USER_DEGREES = ['جندي', 'صف ضابط', 'ضابط'];

export const getUserDegreeOptions = (): { value: string; label: string }[] =>
  USER_DEGREES.map((d) => ({ value: d, label: d }));
