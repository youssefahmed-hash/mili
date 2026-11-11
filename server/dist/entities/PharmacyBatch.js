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
exports.PharmacyBatch = void 0;
const typeorm_1 = require("typeorm");
const PharmacyDrug_1 = require("./PharmacyDrug");
const PharmacyDispenseItem_1 = require("./PharmacyDispenseItem");
/**
 * شحنة/دفعة دواء واحدة — تميّز بتاريخ الصلاحية ورقم التشغيلة.
 * كل الكميات بتتخزّن بالحبة (الوحدة الأساسية) عشان الـFEFO يبقى مقارنة رقمين.
 *   qtyReceived       = الكمية كما وردت (بوحدة الشراء)
 *   qtyReceivedPills  = qtyReceived محوّل بالحبة
 *   qtyRemainingPills = المتبقي — ينقص بالصرف
 */
let PharmacyBatch = class PharmacyBatch {
};
exports.PharmacyBatch = PharmacyBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PharmacyBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PharmacyBatch.prototype, "drugId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PharmacyDrug_1.PharmacyDrug, (d) => d.batches, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "drugId" }),
    __metadata("design:type", PharmacyDrug_1.PharmacyDrug)
], PharmacyBatch.prototype, "drug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], PharmacyBatch.prototype, "batchNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], PharmacyBatch.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "حبة" }),
    __metadata("design:type", String)
], PharmacyBatch.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], PharmacyBatch.prototype, "qtyReceived", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], PharmacyBatch.prototype, "qtyReceivedPills", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], PharmacyBatch.prototype, "qtyRemainingPills", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], PharmacyBatch.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], PharmacyBatch.prototype, "invoiceNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], PharmacyBatch.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PharmacyBatch.prototype, "purchasePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PharmacyBatch.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PharmacyDispenseItem_1.PharmacyDispenseItem, (i) => i.batch),
    __metadata("design:type", Array)
], PharmacyBatch.prototype, "dispenseItems", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PharmacyBatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PharmacyBatch.prototype, "updatedAt", void 0);
exports.PharmacyBatch = PharmacyBatch = __decorate([
    (0, typeorm_1.Entity)("pharmacy_batches")
], PharmacyBatch);
