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

  @Column({ type: "varchar", length: 500 })
  event!: string;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({
    type: "varchar",
    length: 100,
    default: "قيد المراجعة"
  })
  status!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  eventTime!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
