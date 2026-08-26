import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

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
  role!: 'admin' | 'user'

  @Column({ type: 'varchar', default: 'حربية' })
  userType!: 'داخلية' | 'حربية'

  @Column({ default: '' })
  department!: string

  @CreateDateColumn()
  createdAt!: Date
}
