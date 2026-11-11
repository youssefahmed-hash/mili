import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("line_points")
export class LinePoint {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, type: "varchar", length: 255 })
  name!: string; // "نقطة 1 - الكوبري", "نقطة 2 - البرج"

  @Column({ type: "varchar", length: 500, nullable: true })
  description!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  /** إظهار عمود «عسكري مكتب» في شبكة الخط اليومي — مش كل نقط فيها عساكر مكتب */
  @Column({ default: false })
  hasOfficeDuty!: boolean;

  @Column({ type: "int", default: 0 })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
