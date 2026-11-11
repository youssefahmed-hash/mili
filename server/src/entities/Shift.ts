import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("shifts")
export class Shift {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, type: "varchar", length: 100 })
  name!: string; // "العماله الأولى", "العماله الثانية", "العماله الثالثة"

  @Column({ type: "int", default: 0 })
  order!: number; // 1, 2, 3

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
