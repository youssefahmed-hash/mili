import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from "typeorm";
import { Personnel } from "./Personnel";

@Entity("clinic_records")
export class ClinicRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  personnelId!: string;

  @ManyToOne(() => Personnel, (personnel) => personnel.clinicRecords, { onDelete: "CASCADE" })
  @JoinColumn({ name: "personnelId" })
  personnel!: Personnel;

  @Column({ type: "varchar", length: 255 })
  examinationType!: string;

  @Column({
    type: "varchar",
    length: 100,
    default: "لائق"
  })
  medicalStatus!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "date", nullable: true })
  examinationDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
