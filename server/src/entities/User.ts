import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

/** الأدوار المتاحة:
 *  admin            → مدير النظام (يشوف كل حاجة)
 *  internal_manager → مدير داخلية (زي المدير في الصلاحيات، بس نطاقه داخلية فقط)
 *  user             → مستخدم عادي
 */
export type UserRole = 'admin' | 'internal_manager' | 'user'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  username!: string

  @Column()
  password!: string

  @Column({ default: '' })
  fullName!: string

  @Column({ type: 'varchar', default: 'user' })
  role!: UserRole

  @Column({ type: 'varchar', default: 'حربية' })
  userType!: 'داخلية' | 'حربية'

  @Column({ default: '' })
  department!: string

  @Column({ type: 'varchar', default: 'جندي' })
  degree!: 'جندي' | 'صف ضابط' | 'ضابط'

  @CreateDateColumn()
  createdAt!: Date
}
