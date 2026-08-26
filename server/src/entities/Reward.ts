import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Personnel } from "./Personnel";

@Entity("rewards")
export class Reward {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid" })
    personnelId!: string;

    @ManyToOne(() => Personnel, (personnel) => personnel.rewards, { onDelete: "CASCADE" })
    @JoinColumn({ name: "personnelId" })
    personnel!: Personnel;

    @Column({ type: "varchar", length: 255 })
    rewardType!: string;

    @Column({ type: "date" })
    rewardDate!: Date;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}
