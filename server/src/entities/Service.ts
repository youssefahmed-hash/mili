import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Personnel } from "./Personnel";

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, (personnel) => personnel.services, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({ type: "varchar", length: 5 })
    startTime!: string;

    @Column({ type: "varchar", length: 5 })
    endTime!: string;

    @Column({ type: "date" })
    serviceDay!: Date;

    @Column({ type: "varchar", length: 255 })
    location!: string;

    @Column({ type: "varchar", length: 255 })
    department!: string;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}
