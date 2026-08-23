import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Personnel } from "./Personnel";

export type DocumentType = 'nationalIdCard' | 'militaryIdCard' | 'appointmentDocuments' | 'promotionDocuments' | 'certificates';

@Entity("documents")
export class Document {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, (personnel) => personnel.documents, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({
        type: "enum",
        enum: ['nationalIdCard', 'militaryIdCard', 'appointmentDocuments', 'promotionDocuments', 'certificates']
    })
    type!: DocumentType;

    @Column({ type: "varchar", length: 500 })
    fileUrl!: string;

    @CreateDateColumn()
    uploadedAt!: Date;
}
