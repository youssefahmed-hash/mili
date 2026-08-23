import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Document } from "./Document";
import { Vacation } from "./Vacation";
import { Form } from "./Form";

export type PersonnelCategory = 'soldier' | 'non_commissioned_officer' | 'officer';
export type PersonnelStatus = 'على رأس العمل' | 'إجازة' | 'موقوف' | 'منتهية خدمته';

@Entity("personnel")
export class Personnel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    fullName!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    photo!: string | null;

    @Column({
        type: "enum",
        enum: ['soldier', 'non_commissioned_officer', 'officer']
    })
    category!: PersonnelCategory;

    @Column({ type: "varchar", length: 100 })
    rank!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    militaryId!: string;

    @Column({ type: "varchar", length: 14, unique: true })
    nationalId!: string;

    @Column({ type: "date" })
    birthDate!: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    birthPlace!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    maritalStatus!: string | null;

    @Column({ type: "varchar", length: 255 })
    unit!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    department!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    specialization!: string | null;

    @Column({ type: "date", nullable: true })
    appointmentDate!: Date | null;

    @Column({ type: "date", nullable: true })
    serviceStartDate!: Date | null;

    @Column({
        type: "enum",
        enum: ['على رأس العمل', 'إجازة', 'موقوف', 'منتهية خدمته'],
        default: 'على رأس العمل'
    })
    status!: PersonnelStatus;

    @Column({ type: "varchar", length: 255, nullable: true })
    education!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    phone!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    email!: string | null;

    @Column({ type: "text", nullable: true })
    address!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    emergencyContact!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    emergencyPhone!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    performanceRating!: string | null;

    @Column({ type: "date", nullable: true })
    lastPromotionDate!: Date | null;

    @Column({ type: "date", nullable: true })
    nextPromotionDate!: Date | null;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Document, (document) => document.personnel, { cascade: true })
    documents!: Document[];

    @OneToMany(() => Vacation, (vacation) => vacation.personnel, { cascade: true })
    vacations!: Vacation[];

    @OneToMany(() => Form, (form) => form.personnel, { cascade: true })
    forms!: Form[];
}
