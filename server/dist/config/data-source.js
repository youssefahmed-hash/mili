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
const Service_1 = require("../entities/Service");
const Reward_1 = require("../entities/Reward");
const Penalty_1 = require("../entities/Penalty");
const User_1 = require("../entities/User");
const Shift_1 = require("../entities/Shift");
const LinePoint_1 = require("../entities/LinePoint");
const LineAssignment_1 = require("../entities/LineAssignment");
const LineLeaveCycle_1 = require("../entities/LineLeaveCycle");
const NotificationSettings_1 = require("../entities/NotificationSettings");
const EmergencyAssignment_1 = require("../entities/EmergencyAssignment");
const GuardAbsence_1 = require("../entities/GuardAbsence");
const PharmacyDrug_1 = require("../entities/PharmacyDrug");
const PharmacyBatch_1 = require("../entities/PharmacyBatch");
const PharmacyDispense_1 = require("../entities/PharmacyDispense");
const PharmacyDispenseItem_1 = require("../entities/PharmacyDispenseItem");
const ActivityLog_1 = require("../entities/ActivityLog");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "123",
    database: process.env.DB_NAME || "military_personnel_db",
    synchronize: true, // Auto-create tables in development
    logging: false,
    entities: [Personnel_1.Personnel, Document_1.Document, Vacation_1.Vacation, Form_1.Form, ClinicRecord_1.ClinicRecord, OperationRecord_1.OperationRecord, SecurityRecord_1.SecurityRecord, Service_1.Service, Reward_1.Reward, Penalty_1.Penalty, User_1.User, Shift_1.Shift, LinePoint_1.LinePoint, LineAssignment_1.LineAssignment, LineLeaveCycle_1.LineLeaveCycle, NotificationSettings_1.NotificationSettings, EmergencyAssignment_1.EmergencyAssignment, GuardAbsence_1.GuardAbsence, PharmacyDrug_1.PharmacyDrug, PharmacyBatch_1.PharmacyBatch, PharmacyDispense_1.PharmacyDispense, PharmacyDispenseItem_1.PharmacyDispenseItem, ActivityLog_1.ActivityLog],
    migrations: [],
    subscribers: [],
});
