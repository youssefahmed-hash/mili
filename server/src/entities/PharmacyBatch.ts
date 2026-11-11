import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm";
import { PharmacyDrug, PharmacyUnit } from "./PharmacyDrug";
import { PharmacyDispenseItem } from "./PharmacyDispenseItem";

/**
 * شحنة/دفعة دواء واحدة — تميّز بتاريخ الصلاحية ورقم التشغيلة.
 * كل الكميات بتتخزّن بالحبة (الوحدة الأساسية) عشان الـFEFO يبقى مقارنة رقمين.
 *   qtyReceived       = الكمية كما وردت (بوحدة الشراء)
 *   qtyReceivedPills  = qtyReceived محوّل بالحبة
 *   qtyRemainingPills = المتبقي — ينقص بالصرف
 */
@Entity("pharmacy_batches")
export class PharmacyBatch {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    drugId!: string;

    @ManyToOne(() => PharmacyDrug, (d) => d.batches, { onDelete: "CASCADE" })
    @JoinColumn({ name: "drugId" })
    drug!: PharmacyDrug;

    /** رقم التشغيلة (Batch Number) من علبة الدواء */
    @Column({ type: "varchar", length: 100, nullable: true })
    batchNumber!: string | null;

    /** تاريخ انتهاء الصلاحية — أساس اختيار FEFO */
    @Column({ type: "date" })
    expiryDate!: Date;

    /** وحدة الشراء (كرتونة/علبة/شريط/حبة) */
    @Column({ type: "varchar", length: 20, default: "حبة" })
    unit!: PharmacyUnit;

    /** الكمية الواردة بوحدة الشراء */
    @Column({ type: "int" })
    qtyReceived!: number;

    /** الكمية الواردة محوّلة بالحبة */
    @Column({ type: "int" })
    qtyReceivedPills!: number;

    /** المتبقي بالحبة — 0 يعني خلصت الشحنة */
    @Column({ type: "int", default: 0 })
    qtyRemainingPills!: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    supplier!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    invoiceNo!: string | null;

    @Column({ type: "date", nullable: true })
    purchaseDate!: Date | null;

    /** سعر شراء الوحدة — بيتخزّن للمرحلة القادمة (الأسعار/الربح)، مش مستخدم في الحسابات حالياً */
    @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
    purchasePrice!: string | null;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @OneToMany(() => PharmacyDispenseItem, (i) => i.batch)
    dispenseItems!: PharmacyDispenseItem[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
