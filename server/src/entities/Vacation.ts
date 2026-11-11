import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Personnel } from "./Personnel";

@Entity("vacations")
export class Vacation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, (personnel) => personnel.vacations, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({ type: "varchar", length: 255 })
    vacationType!: string;

    @Column({ type: "varchar", length: 10, nullable: true })
    cycle!: string | null;

    @Column({ type: "date" })
    startDate!: Date;

    @Column({ type: "date" })
    expectedReturnDate!: Date;

    /** أيام خصم من الإجازة (0 إلى 14) — بتقلّل تاريخ العودة */
    @Column({ type: "int", default: 0 })
    deductionDays!: number;

    /** أيام مد للإجازة (0 إلى 30) — بتزوّد تاريخ العودة */
    @Column({ type: "int", default: 0 })
    extensionDays!: number;

    @Column({ type: "varchar", length: 100, default: "معلقة" })
    status!: string;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}
