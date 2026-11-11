import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from "typeorm";
import { Personnel } from "./Personnel";

@Entity("security_records")
export class SecurityRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  personnelId!: string;

  @ManyToOne(() => Personnel, (personnel) => personnel.securityRecords, { onDelete: "CASCADE" })
  @JoinColumn({ name: "personnelId" })
  personnel!: Personnel;

  // نوع الموقف الأمني: محاكمة | جزاءات | تقييم سلوك
  @Column({ type: "varchar", length: 50, nullable: true })
  type!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  situationDate!: string | null;

  @Column({ type: "text", nullable: true })
  details!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
