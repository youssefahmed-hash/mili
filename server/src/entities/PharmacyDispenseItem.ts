import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from "typeorm";
import { PharmacyDispense } from "./PharmacyDispense";
import { PharmacyBatch } from "./PharmacyBatch";
import { PharmacyDrug, PharmacyUnit } from "./PharmacyDrug";

/**
 * سطر صرف واحد: صنف + دفعة + كمية.
 * qtyPillsAlways بالحبة (الوحدة الأساسية).
 * expirySnapshot و batchNumber مخزّنين كنسخة ثابتة — لو الدفعة اتمسحت بعدين
 * السجل التاريخي يفضل يعرض الصلاحية الأصلية.
 */
@Entity("pharmacy_dispense_items")
export class PharmacyDispenseItem {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    dispenseId!: string;

    @ManyToOne(() => PharmacyDispense, (d) => d.items, { onDelete: "CASCADE" })
    @JoinColumn({ name: "dispenseId" })
    dispense!: PharmacyDispense;

    @Column({ type: "uuid" })
    batchId!: string;

    @ManyToOne(() => PharmacyBatch, (b) => b.dispenseItems, { onDelete: "CASCADE" })
    @JoinColumn({ name: "batchId" })
    batch!: PharmacyBatch;

    /** مفكوك عمداً — للبحث السريع في سجلات صنف */
    @Column({ type: "uuid" })
    drugId!: string;

    @ManyToOne(() => PharmacyDrug, (d) => d.dispenseItems, { onDelete: "CASCADE" })
    @JoinColumn({ name: "drugId" })
    drug!: PharmacyDrug;

    /** الكمية المصروفة بالحبة */
    @Column({ type: "int" })
    qtyPills!: number;

    /** وحدة الصرف المعروضة (علبة/شريط/حبة) */
    @Column({ type: "varchar", length: 20, default: "حبة" })
    unit!: PharmacyUnit;

    @Column({ type: "int", default: 1 })
    qty!: number;

    /** نسخة ثابتة من صلاحية الدفعة وقت الصرف */
    @Column({ type: "date" })
    expirySnapshot!: Date;

    @Column({ type: "varchar", length: 100, nullable: true })
    batchNumberSnapshot!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}
