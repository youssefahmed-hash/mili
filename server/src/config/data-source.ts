import "reflect-metadata";
import { DataSource } from "typeorm";
import { Personnel } from "../entities/Personnel";
import { Document } from "../entities/Document";
import { Vacation } from "../entities/Vacation";
import { Form } from "../entities/Form";
import { ClinicRecord } from "../entities/ClinicRecord";
import { OperationRecord } from "../entities/OperationRecord";
import { SecurityRecord } from "../entities/SecurityRecord";
import { Service } from "../entities/Service";
import { Reward } from "../entities/Reward";
import { Penalty } from "../entities/Penalty";
import { User } from "../entities/User";
import { Shift } from "../entities/Shift";
import { LinePoint } from "../entities/LinePoint";
import { LineAssignment } from "../entities/LineAssignment";
import { LineLeaveCycle } from "../entities/LineLeaveCycle";
import { NotificationSettings } from "../entities/NotificationSettings";
import { EmergencyAssignment } from "../entities/EmergencyAssignment";
import { GuardAbsence } from "../entities/GuardAbsence";
import { PharmacyDrug } from "../entities/PharmacyDrug";
import { PharmacyBatch } from "../entities/PharmacyBatch";
import { PharmacyDispense } from "../entities/PharmacyDispense";
import { PharmacyDispenseItem } from "../entities/PharmacyDispenseItem";
import { ActivityLog } from "../entities/ActivityLog";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "123",
    database: process.env.DB_NAME || "military_personnel_db",
    synchronize: true, // Auto-create tables in development
    logging: false,
    entities: [Personnel, Document, Vacation, Form, ClinicRecord, OperationRecord, SecurityRecord, Service, Reward, Penalty, User, Shift, LinePoint, LineAssignment, LineLeaveCycle, NotificationSettings, EmergencyAssignment, GuardAbsence, PharmacyDrug, PharmacyBatch, PharmacyDispense, PharmacyDispenseItem, ActivityLog],
    migrations: [],
    subscribers: [],
});
