import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Personnel } from "./Personnel";

/**
 * سجل الغياب — سطر لكل مرة غياب (سجل تاريخي).
 * returnDate = null يعني لسه مش راجع.
 */
@Entity("guard_absences")
export class GuardAbsence {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({ type: "date" })
    startDate!: Date;

    /** تاريخ العودة — null طول ما الفرد لسه في حالة غياب */
    @Column({ type: "date", nullable: true })
    returnDate!: Date | null;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}