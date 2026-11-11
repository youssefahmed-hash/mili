import type { User } from '../types/user'
import { getSectionTypes } from './departments'

// ==================== الأدوار ====================
// مدير النظام: كل حاجة + إدارة المستخدمين.
// مدير داخلية: زي المدير في الصلاحيات والتبويبات، بس نطاقه عساكر الداخلية.
export const isSuperAdmin = (user: User | null): boolean => !!user && user.role === 'admin'
export const isInternalManager = (user: User | null): boolean =>
  !!user && user.role === 'internal_manager'
export const isManager = (user: User | null): boolean =>
  isSuperAdmin(user) || isInternalManager(user)

// الأقسام (القسم في اليوزر) المسموح لكل وحدة/تبويب الظهور لها.
export const MODULE_SECTIONS: Record<string, string[]> = {
  'الصفحة الرئيسية': [], // الأدمن فقط
  'الأفراد': ['أفراد', 'شئون داخلية'],
  // قسم الشئون (شئون داخلية / شئون مجندين): تاب العمليات فقط — عرض عساكر الخط (مكانه/تمامه) للقراءة فقط
  'العمليات': ['عمليات حربية', 'عمليات داخلية', 'شئون داخلية', 'شئون مجندين'],
  'العيادة': ['عيادة'],
  'الأمن': ['أمن', 'أمن حربية', 'أمن داخلية'],
  'المستخدمين': [], // الأدمن فقط
  'تنبيهات الإجازات': [], // الأدمن فقط
  'الإعدادات': ['أفراد', 'شئون داخلية', 'عمليات حربية', 'عمليات داخلية', 'عيادة', 'أمن', 'أمن حربية', 'أمن داخلية'],
  'الخط اليومي': ['عمليات حربية', 'عمليات داخلية', 'الخط'],
  'إدارة النقاط': ['عمليات حربية', 'عمليات داخلية', 'الخط'],
  'دورة الإجازات': ['عمليات حربية', 'عمليات داخلية', 'الخط'],
  'التقارير': ['عمليات حربية', 'عمليات داخلية', 'الخط']
}

// ترتيب العرض عند الحاجة لاختيار تبويب بديل للمستخدم غير المصرح له
const FALLBACK_ORDER = [
  'الصفحة الرئيسية',
  'الأمن',
  'الأفراد',
  'العمليات',
  'العيادة',
  'الإعدادات'
]

// صلاحيات الدرجة (الرتبة):
// - جندي: إدخال بيانات (خدمات/إجازات) فقط، بدون عرض أو تعديل بيانات الأفراد.
// - صف ضابط / ضابط: عرض وتعديل بيانات الأفراد.
// - الأدمن: كامل الصلاحيات.
export const canViewPersonnel = (user: User | null): boolean => {
  if (!user) return false
  if (isManager(user)) return true
  return user.degree !== 'جندي'
}

export const canEditPersonnel = (user: User | null): boolean => {
  if (!user) return false
  if (isManager(user)) return true
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
  if (isManager(user)) return ['soldier', 'non_commissioned_officer', 'officer']
  return DEGREE_VISIBLE_CATEGORIES[user.degree] ?? ['soldier']
}

// هل يمكنه التعديل/الحذف (أو الاعتماد)؟ الجندي يضيف/يسجل فقط، بدون تعديل أو حذف.
export const canManage = (user: User | null): boolean => {
  if (!user) return false
  if (isManager(user)) return true
  return user.degree !== 'جندي'
}

// هل يمكنه إدارة تعيينات الخط (إضافة/تعديل/نقل)؟ صف ضابط + ضابط + المديران.
// قسم الشئون (شئون داخلية / شئون مجندين) استثناء: عرض فقط لمكان العسكري وتمامه.
export const canManageLineAssignments = (user: User | null): boolean => {
  if (!user) return false
  if (isManager(user)) return true
  if (isLineOnlyUser(user)) return false
  return user.degree !== 'جندي'
}

// قسم الشئون (شئون داخلية / شئون مجندين): وصول لتاب العمليات فقط، وبشاشة «أفراد الخط»
// للقراءة فقط (مكان العسكري على الخط + تمامه) — بدون إضافة/تعديل/نقل/حذف وبدون فتح ملف الفرد.
export const isLineOnlyUser = (user: User | null): boolean => {
  if (!user) return false
  const department = (user.department || '').trim()
  return department === 'شئون داخلية' || department === 'شئون مجندين'
}

// هل يمكنه إدارة إعدادات التناوب الأسبوعي؟ مدير النظام فقط (مدير داخلية لا).
export const canManageNotificationSettings = (user: User | null): boolean => {
  if (!user) return false
  return user.role === 'admin'
}

// كارت «المؤثرات على القوة» في الصفحة الرئيسية:
// المديران (نظام/داخلية) + مستخدم الشئون (شئون داخلية / شئون مجندين) — بنفس صلاحية مدير الداخلية.
export const canViewStrengthConditions = (user: User | null): boolean => {
  if (!user) return false
  if (isManager(user)) return true
  const department = (user.department || '').trim()
  return department === 'شئون داخلية' || department === 'شئون مجندين'
}

// هل يمكن للزائر فتح تبويب «الأفراد»؟
// - المديران (نظام/داخلية) / صف ضابط / ضابط: نعم (عرض وتعديل كامل).
// - جندي: نعم فقط لو كان قسمه أحد أقسام إدخال البيانات («أفراد» أو «شئون داخلية»)، وشاشته تكون إدخال فقط (إضافة + استكمال، بيانات مسجلة مقنّعة).
export const canAccessPersonnelTab = (user: User | null): boolean => {
  if (!user) return false
  // قسم العيادة: تاب الأفراد مش بيظهر ليه — شغله كله جوه تاب العيادة.
  if ((user.department || '').trim() === 'عيادة') return false
  if (isManager(user)) return true
  if (user.degree !== 'جندي') return true
  return user.department === 'أفراد' || user.department === 'شئون داخلية'
}

// هل يمكن للزائر الوصول للتبويب؟ (الأفراد والصفحة الرئيسية محكومان بقواعد خاصة، الباقي بصلاحية القسم)
export const canAccessTab = (user: User | null, tab: string): boolean => {
  if (tab === 'الأفراد') return canAccessPersonnelTab(user)
  if (tab === 'الصفحة الرئيسية') return !!user
  return canAccessModule(user, tab)
}

// أنواع الأفراد المسموح لكل userType بيشوفها (مطابقة لـallowedPersonnelTypes في الـBackend).
// مدير النظام: الكل. حربية: حربية + تشغيل + مستجد حربية. داخلية (ومدير داخلية): داخلية + تشغيل + مستجد داخلية.
export const visiblePersonnelTypes = (user: User | null): string[] => {
  if (!user || user.role === 'admin') return []
  if (isInternalManager(user)) return ['داخلية', 'تشغيل حربيه', 'مستجد داخلية']
  return user.userType === 'داخلية'
    ? ['داخلية', 'تشغيل حربيه', 'مستجد داخلية']
    : ['حربية', 'تشغيل حربيه', 'مستجد حربية']
}

// نطاق المستخدم (مطابق لمنطق الـBackend في userScope.ts):
// admin → الكل | operations (عمليات حربية/داخلية) → عساكر الخط فقط | personnel → غير الخط فقط.
export type UserScope = 'admin' | 'operations' | 'personnel'

export const getUserScope = (user: User | null): UserScope => {
  if (!user || user.role === 'admin') return 'admin'
  const dept = (user.department || '').trim()
  if (dept === 'عمليات حربية' || dept === 'عمليات داخلية') return 'operations'
  return 'personnel'
}

export const canAccessModule = (user: User | null, tab: string): boolean => {
  if (!user) return false
  // سجل تحديثات النظام: متاح لكل المستخدمين المسجلين
  if (tab === 'سجل التحديثات') return true
  // إدارة المستخدمين: مدير النظام فقط (منع تصعيد الصلاحيات من مدير داخلية)
  if (tab === 'المستخدمين') return isSuperAdmin(user)
  // إعدادات التناوب: مدير النظام فقط
  if (tab === 'تنبيهات الإجازات') return isSuperAdmin(user)
  // باقي التبويبات: المديران زي المدير
  if (isManager(user)) return true

  // غير المديرين: القسم لازم يكون تابع لنوع المستخدم (حربية/داخلية)
  // الأقسام المشتركة زي «عيادة» مسموحة للنوعين.
  const sectionTypes = getSectionTypes(user.department)
  if (sectionTypes.length > 0 && !sectionTypes.includes(user.userType)) return false

  const allowed = MODULE_SECTIONS[tab]
  if (!allowed || allowed.length === 0) return false
  return allowed.includes(user.department)
}

export const firstAccessibleTab = (user: User | null): string => {
  if (!user) return 'الإعدادات'
  const found = FALLBACK_ORDER.find((t) => canAccessTab(user, t))
  return found ?? 'الإعدادات'
}
