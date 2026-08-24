"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Personnel_1 = require("../entities/Personnel");
const Document_1 = require("../entities/Document");
const Vacation_1 = require("../entities/Vacation");
const Form_1 = require("../entities/Form");
const ClinicRecord_1 = require("../entities/ClinicRecord");
const OperationRecord_1 = require("../entities/OperationRecord");
const SecurityRecord_1 = require("../entities/SecurityRecord");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "123",
    database: process.env.DB_NAME || "military_personnel_db",
    synchronize: true, // Auto-create tables in development
    logging: false,
    entities: [Personnel_1.Personnel, Document_1.Document, Vacation_1.Vacation, Form_1.Form, ClinicRecord_1.ClinicRecord, OperationRecord_1.OperationRecord, SecurityRecord_1.SecurityRecord],
    migrations: [],
    subscribers: [],
});
