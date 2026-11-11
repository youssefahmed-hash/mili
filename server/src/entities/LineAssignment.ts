import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique
} from "typeorm";
import { Personnel } from "./Personnel";
import { LinePoint } from "./LinePoint";
import { Shift } from "./Shift";

@Entity("line_assignments")
@Unique(["personnelId"])
export class LineAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  personnelId!: string;

  @ManyToOne(() => Personnel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "personnelId" })
  personnel!: Personnel;

  @Column({ type: "uuid" })
  linePointId!: string;

  @ManyToOne(() => LinePoint, { onDelete: "CASCADE" })
  @JoinColumn({ name: "linePointId" })
  linePoint!: LinePoint;

  @Column({ type: "uuid" })
  shiftId!: string;

  @ManyToOne(() => Shift, { onDelete: "CASCADE" })
  @JoinColumn({ name: "shiftId" })
  shift!: Shift;

  @Column({ type: "varchar", length: 50, default: "حاضر" })
  status!: string;

  /**
   * مُعلَّم كـ«عسكري مكتب» في النقطة.
   * الظاهر في عمود «عسكري مكتب» ومش بياخد دوران في العماله (الأولى/الثانية/الثالثة).
   */
  @Column({ default: false })
  officeDuty!: boolean;

  @Column({ type: "varchar", length: 500, nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
