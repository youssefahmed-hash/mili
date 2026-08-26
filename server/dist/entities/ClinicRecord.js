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
exports.ClinicRecord = void 0;
const typeorm_1 = require("typeorm");
const Personnel_1 = require("./Personnel");
let ClinicRecord = class ClinicRecord {
};
exports.ClinicRecord = ClinicRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ClinicRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], ClinicRecord.prototype, "personnelId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Personnel_1.Personnel, (personnel) => personnel.clinicRecords, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "personnelId" }),
    __metadata("design:type", Personnel_1.Personnel)
], ClinicRecord.prototype, "personnel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], ClinicRecord.prototype, "examinationType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 100,
        default: "لائق"
    }),
    __metadata("design:type", String)
], ClinicRecord.prototype, "medicalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], ClinicRecord.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], ClinicRecord.prototype, "examinationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "حربية" }),
    __metadata("design:type", String)
], ClinicRecord.prototype, "clinicType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], ClinicRecord.prototype, "carnetNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], ClinicRecord.prototype, "specialty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], ClinicRecord.prototype, "diagnosis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], ClinicRecord.prototype, "treatment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ClinicRecord.prototype, "createdAt", void 0);
exports.ClinicRecord = ClinicRecord = __decorate([
    (0, typeorm_1.Entity)("clinic_records")
], ClinicRecord);
