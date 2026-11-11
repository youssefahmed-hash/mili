import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Personnel } from "./Personnel";
import { LinePoint } from "./LinePoint";
import { Shift } from "./Shift";

export type EmergencyWeekType = 'personnel' | 'line';

/**
 * تعيين طوارئ ثنائي الاتجاه بنطاق تاريخ حر:
 * - weekType='personnel' (خط → أفراد): عسكري خط ينزل في أسبوع الأفراد. يتطلب personnel.unit === 'الخط'.
 * - weekType='line' (أفراد → خط): عسكري أفراد ينزل في أسبوع الخط. يتطلب personnel.unit !== 'الخط' + نقطة + عمالة.
 * لا يمس إجازات الأفراد ولا دوران الخط ولا التعيينات الدائمة.
 */
@Entity("emergency_assignments")
@Index(["personnelId"])
@Index(["weekType", "startDate", "endDate"])
export class EmergencyAssignment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({ type: "varchar", length: 20 })
    weekType!: EmergencyWeekType;

    @Column({ type: "date" })
    startDate!: string;

    @Column({ type: "date" })
    endDate!: string;

    @Column({ type: "uuid", nullable: true })
    linePointId!: string | null;

    @ManyToOne(() => LinePoint, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "linePointId" })
    linePoint!: LinePoint | null;

    @Column({ type: "uuid", nullable: true })
    shiftId!: string | null;

    @ManyToOne(() => Shift, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "shiftId" })
    shift!: Shift | null;

    @Column({ type: "uuid", nullable: true })
    createdBy!: string | null;

    // حالة الاعتماد: الإنشاء دائمًا معلق، والفعالية للمعتمدة فقط.
    // default معتمدة حتى تظل الصفوف المنشأة قبل نظام الاعتماد فعالة بدون ترحيل.
    @Column({ type: "varchar", length: 20, default: "معتمدة" })
    status!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
