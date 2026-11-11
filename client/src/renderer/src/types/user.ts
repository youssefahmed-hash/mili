/** الأدوار المتاحة:
 *  admin            → مدير النظام (يشوف كل حاجة، يدير المستخدمين)
 *  internal_manager → مدير داخلية (زي المدير في الصلاحيات، بس نطاقه عساكر الداخلية)
 *  user             → مستخدم عادي
 */
export type UserRole = 'admin' | 'internal_manager' | 'user'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام',
  internal_manager: 'مدير داخلية',
  user: 'مستخدم'
}

export interface User {
  id: string
  username: string
  fullName: string
  role: UserRole
  userType: 'داخلية' | 'حربية'
  department: string
  degree: 'جندي' | 'صف ضابط' | 'ضابط'
  createdAt: string
}

export interface RegisterPayload {
  username: string
  password?: string
  fullName?: string
  userType?: 'داخلية' | 'حربية'
  department?: string
  degree?: 'جندي' | 'صف ضابط' | 'ضابط'
  role?: UserRole
}