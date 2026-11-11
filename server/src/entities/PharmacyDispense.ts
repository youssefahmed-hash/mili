import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn
} from "typeorm";
import { Personnel } from "./Personnel";
import { ClinicRecord } from "./ClinicRecord";
import { PharmacyDispenseItem } from "./PharmacyDispenseItem";

/**
 * عملية صرف دواء واحدة — مربوطة دائماً بعسكري، وممكن تتربط بكشف طبي.
 * الصرف بيخصم من PharmacyBatch.qtyRemainingPills (الحبة) — داخل transaction.
 */
@Entity("pharmacy_dispenses")
export class PharmacyDispense {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    /** كشف طبي (اختياري — صرف مستقل بدون كشف) */
    @Column({ type: "uuid", nullable: true })
    clinicRecordId!: string | null;

    @ManyToOne(() => ClinicRecord, { onDelete: "CASCADE", nullable: true })
    @JoinColumn({ name: "clinicRecordId" })
    clinicRecord!: ClinicRecord | null;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({ type: "timestamptz", default: () => "now()" })
    dispensedAt!: Date;

    @Column({ type: "uuid", nullable: true })
    createdBy!: string | null;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @OneToMany(() => PharmacyDispenseItem, (i) => i.dispense, { cascade: true })
    items!: PharmacyDispenseItem[];

    @CreateDateColumn()
    createdAt!: Date;
}
