import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm";
import { PharmacyBatch } from "./PharmacyBatch";
import { PharmacyDispenseItem } from "./PharmacyDispenseItem";

/** وحدات البيع المدعومة — الترتيب من الأكبر للأصغر. الحبة هي الوحدة الأساسية للتخزين. */
export const PHARMACY_UNITS = ["كرتونة", "علبة", "شريط", "حبة"] as const;
export type PharmacyUnit = (typeof PHARMACY_UNITS)[number];

export const normalizeUnit = (raw: unknown): PharmacyUnit => {
    const v = String(raw ?? "").trim();
    return (PHARMACY_UNITS as readonly string[]).includes(v) ? (v as PharmacyUnit) : "حبة";
};

/**
 * صنف الدواء (تصنيف الأدوية).
 * code فريد — فاضي مسموح (أكثر من صنف بدون كود)، لكن التكرار مرفوض.
 * التقسيم: كم حبة في الشريط، كم شريط في العلبة، كم علبة في الكرتونة.
 * الحبة هي الوحدة الأساسية — كل الكميات بتتخزّن بالحبة.
 */
@Entity("pharmacy_drugs")
export class PharmacyDrug {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    /** الاسم بالإنجليزي — للبحث اللاتيني */
    @Column({ type: "varchar", length: 255, nullable: true })
    nameEn!: string | null;

    /** كود الدواء — فريد (فاضي مسموح) */
    @Column({ type: "varchar", length: 100, nullable: true, unique: true })
    code!: string | null;

    // ===== أعمدة البحث المطبّعة (影子) =====
    // Postgres مش بيعرف يطبّع الحروف العربية، فنخزّن نسخة مطبّعة وقت الحفظ
    // (ة→ه، ى→ي، أإآ→ا) ونبحث عليها. العرض بيستخدم name الأصلي.
    @Column({ type: "varchar", length: 255 })
    nameNorm!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    nameEnNorm!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    codeNorm!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    barcode!: string | null;

    // الوحدات المتاحة للصرف لهذا الصنف
    @Column({ type: "boolean", default: false })
    allowCarton!: boolean;

    @Column({ type: "boolean", default: false })
    allowBox!: boolean;

    @Column({ type: "boolean", default: false })
    allowStrip!: boolean;

    /** الحبة متاحة دايماً (الوحدة الأساسية) */
    @Column({ type: "boolean", default: true })
    allowPill!: boolean;

    // ===== التقسيم =====
    /** عدد الحبات في الشريط الواحد */
    @Column({ type: "int", default: 1 })
    pillsPerStrip!: number;

    /** عدد الشرايط في العلبة الواحدة */
    @Column({ type: "int", default: 1 })
    stripsPerBox!: number;

    /** عدد العلب في الكرتونة الواحدة */
    @Column({ type: "int", default: 1 })
    boxesPerCarton!: number;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @OneToMany(() => PharmacyBatch, (b) => b.drug)
    batches!: PharmacyBatch[];

    @OneToMany(() => PharmacyDispenseItem, (i) => i.drug)
    dispenseItems!: PharmacyDispenseItem[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
