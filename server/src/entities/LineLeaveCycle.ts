import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Shift } from "./Shift";

@Entity("line_leave_cycles")
export class LineLeaveCycle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  shiftId!: string;

  @ManyToOne(() => Shift, { onDelete: "CASCADE" })
  @JoinColumn({ name: "shiftId" })
  shift!: Shift;

  @Column({ type: "date" })
  leaveStartDate!: Date;

  @Column({ type: "date" })
  leaveEndDate!: Date;

  @Column({ type: "int", default: 14 })
  cycleDays!: number;

  @Column({ type: "int", default: 1 })
  cycleNumber!: number; // 1, 2, 3, 4... تسلسل الدورات

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
