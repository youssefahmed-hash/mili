import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index
} from "typeorm";

/**
 * سجل تحديثات النظام — يُكتب تلقائيًا من middleware عام على كل طلب
 * POST/PUT/PATCH/DELETE ناجح، عشان كل المستخدمين يعرفوا «إيه اللي اتغير».
 */
@Entity("activity_logs")
export class ActivityLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", nullable: true })
    userId!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    userName!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    userRole!: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    userDepartment!: string | null;

    /** مفتاح الوحدة: personnel / operations / security / clinic ... */
    @Column({ type: "varchar", length: 50 })
    module!: string;

    /** اسم الوحدة بالعربي للعرض */
    @Column({ type: "varchar", length: 120 })
    moduleLabel!: string;

    /** create / update / delete / transfer / bulk / dispense ... */
    @Column({ type: "varchar", length: 30 })
    action!: string;

    /** معرّف السجل المتأثر (لو متاح) */
    @Column({ type: "varchar", length: 255, nullable: true })
    entityId!: string | null;

    /** اسم/عنوان السجل المتأثر: اسم الفرد، اسم المأمورية، اسم الدواء ... */
    @Column({ type: "varchar", length: 500, nullable: true })
    title!: string | null;

    /** تفاصيل التغيير: { summary, fields: [{ label, value, from, to }], path, method } */
    @Column({ type: "jsonb", nullable: true })
    details!: Record<string, unknown> | null;

    @Index()
    @CreateDateColumn()
    createdAt!: Date;
}
