import "reflect-metadata";
import { DataSource } from "typeorm";
import { Personnel } from "../entities/Personnel";
import { Document } from "../entities/Document";
import { Vacation } from "../entities/Vacation";
import { Form } from "../entities/Form";
import { ClinicRecord } from "../entities/ClinicRecord";
import { OperationRecord } from "../entities/OperationRecord";
import { SecurityRecord } from "../entities/SecurityRecord";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "123",
    database: process.env.DB_NAME || "military_personnel_db",
    synchronize: true, // Auto-create tables in development
    logging: false,
    entities: [Personnel, Document, Vacation, Form, ClinicRecord, OperationRecord, SecurityRecord],
    migrations: [],
    subscribers: [],
});
