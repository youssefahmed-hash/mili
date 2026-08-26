export interface User {
  id: string
  username: string
  fullName: string
  role: 'admin' | 'user'
  userType: 'داخلية' | 'حربية'
  department: string
  createdAt: string
}

export interface RegisterPayload {
  username: string
  password?: string
  fullName?: string
  userType?: 'داخلية' | 'حربية'
  department?: string
  role?: 'admin' | 'user'
}
