import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from "typeorm";
import { Personnel } from "./Personnel";

@Entity("operations_records")
export class OperationRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  personnelId!: string;

  @ManyToOne(() => Personnel, (personnel) => personnel.operationsRecords, { onDelete: "CASCADE" })
  @JoinColumn({ name: "personnelId" })
  personnel!: Personnel;

  @Column({ type: "varchar", length: 255 })
  missionName!: string;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({
    type: "varchar",
    length: 100,
    default: "مخططة"
  })
  status!: string;

  @Column({ type: "date", nullable: true })
  missionDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
