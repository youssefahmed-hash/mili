import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("notification_settings")
export class NotificationSettings {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "date", nullable: true })
    weeklyRotationStartDate!: string | null;

    @Column({ type: "varchar", length: 10, nullable: true })
    firstTurn!: "personnel" | "line" | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
