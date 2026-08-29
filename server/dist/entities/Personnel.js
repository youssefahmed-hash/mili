"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Personnel = void 0;
const typeorm_1 = require("typeorm");
const Document_1 = require("./Document");
const Vacation_1 = require("./Vacation");
const Form_1 = require("./Form");
const ClinicRecord_1 = require("./ClinicRecord");
const OperationRecord_1 = require("./OperationRecord");
const SecurityRecord_1 = require("./SecurityRecord");
const Service_1 = require("./Service");
const Reward_1 = require("./Reward");
const Penalty_1 = require("./Penalty");
let Personnel = class Personnel {
};
exports.Personnel = Personnel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Personnel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Personnel.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "photo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ['soldier', 'non_commissioned_officer', 'officer']
    }),
    __metadata("design:type", String)
], Personnel.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], Personnel.prototype, "rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, unique: true }),
    __metadata("design:type", String)
], Personnel.prototype, "militaryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 14, unique: true }),
    __metadata("design:type", String)
], Personnel.prototype, "nationalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], Personnel.prototype, "birthDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "birthPlace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "residencePlace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "maritalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "familyMembersCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "parentsLivingSeparately", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "fatherHealthStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "fatherWork", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "fatherPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "motherHealthStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "motherWork", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "motherPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Personnel.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 50,
        default: 'حربية'
    }),
    __metadata("design:type", String)
], Personnel.prototype, "personnelType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "specialization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "appointmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "serviceStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, default: 'داخل القطاع' }),
    __metadata("design:type", String)
], Personnel.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "enlistmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "dischargeDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "joiningDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "weapon", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "lastLeaveReturnDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "guardCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "seniorityNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "promotionCurrentRankDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "promotionCurrentGradeDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "promotionHigherRankDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "promotionHigherGradeDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "policeNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "reserveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "administrativeUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "militaryTrials", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "affiliatedUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "display", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "strikeOff", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "injured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "clinics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "medicalCommissionLeaves", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "weaponBan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "education", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "emergencyContact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "emergencyPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "performanceRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "lastPromotionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "nextPromotionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "workBeforeEnlistment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "behaviorInUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "subordinates", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "supervisor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], Personnel.prototype, "batchDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Personnel.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Personnel.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Document_1.Document, (document) => document.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Vacation_1.Vacation, (vacation) => vacation.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "vacations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Form_1.Form, (form) => form.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "forms", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ClinicRecord_1.ClinicRecord, (record) => record.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "clinicRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => OperationRecord_1.OperationRecord, (record) => record.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "operationsRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SecurityRecord_1.SecurityRecord, (record) => record.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "securityRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Service_1.Service, (record) => record.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "services", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Reward_1.Reward, (record) => record.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "rewards", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Penalty_1.Penalty, (record) => record.personnel, { cascade: true }),
    __metadata("design:type", Array)
], Personnel.prototype, "penalties", void 0);
exports.Personnel = Personnel = __decorate([
    (0, typeorm_1.Entity)("personnel")
], Personnel);
