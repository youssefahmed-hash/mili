import type { User } from '../types/user'

// الأقسام (القسم في اليوزر) المسموح لكل وحدة/تبويب الظهور لها.
// ملاحظة: الدرجة (جندي/صف ضابط/ضابط) ستُضاف لاحقاً لتدقيق أكثر — حالياً التحكم بالقسم فقط.
export const MODULE_SECTIONS: Record<string, string[]> = {
  'الأفراد': ['أفراد', 'شئون داخلية'],
  'العمليات': ['عمليات حربية', 'عمليات داخلية'],
  'العيادة': ['عيادة'],
  'الأمن': ['أمن'],
  'طابور الخدمات': ['أفراد', 'شئون داخلية'],
  'طابور الاجازات': ['عمليات حربية', 'شئون داخلية', 'أفراد'],
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

export const canAccessModule = (user: User | null, tab: string): boolean => {
  if (!user) return false
  if (user.role === 'admin') return true
  const allowed = MODULE_SECTIONS[tab]
  if (!allowed || allowed.length === 0) return false
  return allowed.includes(user.department)
}

export const firstAccessibleTab = (user: User | null): string => {
  if (!user) return 'الإعدادات'
  const found = FALLBACK_ORDER.find((t) => canAccessModule(user, t))
  return found ?? 'الإعدادات'
}
