export interface User {
  id: string
  username: string
  fullName: string
  role: 'admin' | 'user'
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
  role?: 'admin' | 'user'
}
