import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Personnel } from "./Personnel";

export type FormType = 'نموذج 1 أفراد' | 'نموذج 2 أفراد';

@Entity("forms")
export class Form {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, (personnel) => personnel.forms, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({
        type: "enum",
        enum: ['نموذج 1 أفراد', 'نموذج 2 أفراد']
    })
    formType!: FormType;

    @Column({ type: "varchar", length: 255 })
    formName!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: "varchar", length: 100, default: "مسودة" })
    status!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    fileUrl!: string | null;
}
