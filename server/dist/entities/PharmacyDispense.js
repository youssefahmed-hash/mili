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
exports.PharmacyDispense = void 0;
const typeorm_1 = require("typeorm");
const Personnel_1 = require("./Personnel");
const ClinicRecord_1 = require("./ClinicRecord");
const PharmacyDispenseItem_1 = require("./PharmacyDispenseItem");
/**
 * عملية صرف دواء واحدة — مربوطة دائماً بعسكري، وممكن تتربط بكشف طبي.
 * الصرف بيخصم من PharmacyBatch.qtyRemainingPills (الحبة) — داخل transaction.
 */
let PharmacyDispense = class PharmacyDispense {
};
exports.PharmacyDispense = PharmacyDispense;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PharmacyDispense.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], PharmacyDispense.prototype, "clinicRecordId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ClinicRecord_1.ClinicRecord, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "clinicRecordId" }),
    __metadata("design:type", Object)
], PharmacyDispense.prototype, "clinicRecord", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PharmacyDispense.prototype, "personnelId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Personnel_1.Personnel, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "personnelId" }),
    __metadata("design:type", Personnel_1.Personnel)
], PharmacyDispense.prototype, "personnel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", default: () => "now()" }),
    __metadata("design:type", Date)
], PharmacyDispense.prototype, "dispensedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], PharmacyDispense.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PharmacyDispense.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PharmacyDispenseItem_1.PharmacyDispenseItem, (i) => i.dispense, { cascade: true }),
    __metadata("design:type", Array)
], PharmacyDispense.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PharmacyDispense.prototype, "createdAt", void 0);
exports.PharmacyDispense = PharmacyDispense = __decorate([
    (0, typeorm_1.Entity)("pharmacy_dispenses")
], PharmacyDispense);
