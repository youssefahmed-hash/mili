import { AppDataSource } from '../../config/data-source'
import { User } from '../../entities/User'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mili_jwt_secret_2024'
const SALT_ROUNDS = 10

export interface RegisterInput {
  username: string
  password: string
  fullName?: string
  userType?: 'داخلية' | 'حربية'
  department?: string
  role?: 'admin' | 'user'
}

function sanitize(u: User) {
  const { password, ...rest } = u
  return rest
}

export class AuthService {
  private repo = AppDataSource.getRepository(User)

  async register(input: RegisterInput) {
    const existing = await this.repo.findOne({ where: { username: input.username } })
    if (existing) {
      const e: any = new Error('اسم المستخدم موجود بالفعل')
      e.status = 409
      throw e
    }
    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS)
    const user = this.repo.create({
      username: input.username,
      password: hashed,
      fullName: input.fullName || '',
      userType: input.userType || 'حربية',
      department: input.department || '',
      role: input.role === 'admin' ? 'admin' : 'user'
    })
    const saved = await this.repo.save(user)
    return sanitize(saved)
  }

  async login(username: string, password: string) {
    const user = await this.repo.findOne({ where: { username } })
    if (!user) {
      const e: any = new Error('بيانات الدخول غير صحيحة')
      e.status = 401
      throw e
    }
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      const e: any = new Error('بيانات الدخول غير صحيحة')
      e.status = 401
      throw e
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    return { token, user: sanitize(user) }
  }

  async getById(id: string) {
    const user = await this.repo.findOne({ where: { id } })
    if (!user) {
      const e: any = new Error('المستخدم غير موجود')
      e.status = 404
      throw e
    }
    return sanitize(user)
  }

  async list() {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } })
    return users.map(sanitize)
  }

  async update(id: string, input: Partial<RegisterInput>) {
    const user = await this.repo.findOne({ where: { id } })
    if (!user) {
      const e: any = new Error('المستخدم غير موجود')
      e.status = 404
      throw e
    }
    if (input.fullName !== undefined) user.fullName = input.fullName
    if (input.department !== undefined) user.department = input.department
    if (input.userType !== undefined) user.userType = input.userType
    if (input.role !== undefined) user.role = input.role
    if (input.password) user.password = await bcrypt.hash(input.password, SALT_ROUNDS)
    const saved = await this.repo.save(user)
    return sanitize(saved)
  }

  async updateProfile(id: string, input: { fullName?: string; department?: string }) {
    const user = await this.repo.findOne({ where: { id } })
    if (!user) {
      const e: any = new Error('المستخدم غير موجود')
      e.status = 404
      throw e
    }
    if (input.fullName !== undefined) user.fullName = input.fullName
    if (input.department !== undefined) user.department = input.department
    const saved = await this.repo.save(user)
    return sanitize(saved)
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.repo.findOne({ where: { id } })
    if (!user) {
      const e: any = new Error('المستخدم غير موجود')
      e.status = 404
      throw e
    }
    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) {
      const e: any = new Error('كلمة المرور الحالية غير صحيحة')
      e.status = 400
      throw e
    }
    if (!newPassword || newPassword.length < 4) {
      const e: any = new Error('كلمة المرور الجديدة قصيرة جداً (4 أحرف على الأقل)')
      e.status = 400
      throw e
    }
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS)
    const saved = await this.repo.save(user)
    return sanitize(saved)
  }

  async delete(id: string) {
    const user = await this.repo.findOne({ where: { id } })
    if (!user) {
      const e: any = new Error('المستخدم غير موجود')
      e.status = 404
      throw e
    }
    await this.repo.remove(user)
    return { id }
  }

  async seedAdmin() {
    const count = await this.repo.count()
    if (count === 0) {
      const hashed = await bcrypt.hash('admin123', SALT_ROUNDS)
      const admin = this.repo.create({
        username: 'admin',
        password: hashed,
        fullName: 'مدير النظام',
        role: 'admin',
        userType: 'حربية',
        department: 'عمليات'
      })
      await this.repo.save(admin)
      console.log('[seed] تم إنشاء مدير افتراضي (admin / admin123)')
    }
  }
}

export const authService = new AuthService()
