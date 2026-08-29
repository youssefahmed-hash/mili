import type { User } from '../types/user'

// الأقسام (القسم في اليوزر) المسموح لكل وحدة/تبويب الظهور لها.
export const MODULE_SECTIONS: Record<string, string[]> = {
  'الأفراد': ['أفراد', 'شئون داخلية'],
  'العمليات': ['عمليات حربية', 'عمليات داخلية'],
  'العيادة': ['عيادة'],
  'الأمن': ['أمن'],
  'طابور الخدمات': ['أفراد', 'شئون داخلية'],
  'طابور الاجازات': ['عمليات حربية', 'شئون داخلية', 'أفراد'],
  'اعتماد الإجازات': ['أفراد', 'شئون داخلية', 'عمليات حربية', 'عمليات داخلية'],
  'المستخدمين': [], // الأدمن فقط
  'الإعدادات': ['أفراد', 'شئون داخلية', 'عمليات حربية', 'عمليات داخلية', 'عيادة', 'أمن']
}

// ترتيب العرض عند الحاجة لاختيار تبويب بديل للمستخدم غير المصرح له
const FALLBACK_ORDER = [
  'الأمن',
  'الأفراد',
  'العمليات',
  'العيادة',
  'طابور الخدمات',
  'طابور الاجازات',
  'الإعدادات'
]

// صلاحيات الدرجة (الرتبة):
// - جندي: إدخال بيانات (خدمات/إجازات) فقط، بدون عرض أو تعديل بيانات الأفراد.
// - صف ضابط / ضابط: عرض وتعديل بيانات الأفراد.
// - الأدمن: كامل الصلاحيات.
export const canViewPersonnel = (user: User | null): boolean => {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.degree !== 'جندي'
}

export const canEditPersonnel = (user: User | null): boolean => {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.degree === 'صف ضابط' || user.degree === 'ضابط'
}

// الفئات (رتب الأفراد) اللي المستخدم مسموح له يشوف بياناتها.
// جندي ← جنود فقط | صف ضابط ← جنود + صف ضباط | ضابط/أدمن ← الكل.
const DEGREE_VISIBLE_CATEGORIES: Record<string, string[]> = {
  'جندي': ['soldier'],
  'صف ضابط': ['soldier', 'non_commissioned_officer'],
  'ضابط': ['soldier', 'non_commissioned_officer', 'officer']
}

export const visibleCategories = (user: User | null): string[] => {
  if (!user) return []
  if (user.role === 'admin') return ['soldier', 'non_commissioned_officer', 'officer']
  return DEGREE_VISIBLE_CATEGORIES[user.degree] ?? ['soldier']
}

// هل يمكنه التعديل/الحذف (أو الاعتماد)؟ الجندي يضيف/يسجل فقط، بدون تعديل أو حذف.
export const canManage = (user: User | null): boolean => {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.degree !== 'جندي'
}

// هل يمكن للزائر فتح تبويب «الأفراد»؟
// - الأدمن / صف ضابط / ضابط: نعم (عرض وتعديل كامل).
// - جندي: نعم فقط لو كان قسمه أحد أقسام إدخال البيانات («أفراد» أو «شئون داخلية»)، وشاشته تكون إدخال فقط (إضافة + استكمال، بيانات مسجلة مقنّعة).
export const canAccessPersonnelTab = (user: User | null): boolean => {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.degree !== 'جندي') return true
  return user.department === 'أفراد' || user.department === 'شئون داخلية'
}

// هل يمكن للزائر الوصول للتبويب؟ (الأفراد محكوم بصلاحية الدرجة، الباقي بصلاحية القسم)
export const canAccessTab = (user: User | null, tab: string): boolean => {
  if (tab === 'الأفراد') return canAccessPersonnelTab(user)
  return canAccessModule(user, tab)
}

// أنواع الأفراد (حربية / داخلية / تشغيل حربيه) اللي المستخدم مسموح له يشوفها.
// تشغيل حربيه مشترك: بينه للحربيه والداخليه. الأدمن يشوف الكل (مصفوفة فاضية = بدون فلتر).
export const visiblePersonnelTypes = (user: User | null): string[] => {
  if (!user || user.role === 'admin') return []
  return user.userType === 'داخلية'
    ? ['داخلية', 'تشغيل حربيه']
    : ['حربية', 'تشغيل حربيه']
}

export const canAccessModule = (user: User | null, tab: string): boolean => {
  if (!user) return false
  if (user.role === 'admin') return true
  const allowed = MODULE_SECTIONS[tab]
  if (!allowed || allowed.length === 0) return false
  return allowed.includes(user.department)
}

export const firstAccessibleTab = (user: User | null): string => {
  if (!user) return 'الإعدادات'
  const found = FALLBACK_ORDER.find((t) => canAccessTab(user, t))
  return found ?? 'الإعدادات'
}
