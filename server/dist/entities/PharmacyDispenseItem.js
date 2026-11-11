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
exports.PharmacyDispenseItem = void 0;
const typeorm_1 = require("typeorm");
const PharmacyDispense_1 = require("./PharmacyDispense");
const PharmacyBatch_1 = require("./PharmacyBatch");
const PharmacyDrug_1 = require("./PharmacyDrug");
/**
 * سطر صرف واحد: صنف + دفعة + كمية.
 * qtyPillsAlways بالحبة (الوحدة الأساسية).
 * expirySnapshot و batchNumber مخزّنين كنسخة ثابتة — لو الدفعة اتمسحت بعدين
 * السجل التاريخي يفضل يعرض الصلاحية الأصلية.
 */
let PharmacyDispenseItem = class PharmacyDispenseItem {
};
exports.PharmacyDispenseItem = PharmacyDispenseItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PharmacyDispenseItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PharmacyDispenseItem.prototype, "dispenseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PharmacyDispense_1.PharmacyDispense, (d) => d.items, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "dispenseId" }),
    __metadata("design:type", PharmacyDispense_1.PharmacyDispense)
], PharmacyDispenseItem.prototype, "dispense", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PharmacyDispenseItem.prototype, "batchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PharmacyBatch_1.PharmacyBatch, (b) => b.dispenseItems, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "batchId" }),
    __metadata("design:type", PharmacyBatch_1.PharmacyBatch)
], PharmacyDispenseItem.prototype, "batch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], PharmacyDispenseItem.prototype, "drugId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PharmacyDrug_1.PharmacyDrug, (d) => d.dispenseItems, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "drugId" }),
    __metadata("design:type", PharmacyDrug_1.PharmacyDrug)
], PharmacyDispenseItem.prototype, "drug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], PharmacyDispenseItem.prototype, "qtyPills", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "حبة" }),
    __metadata("design:type", String)
], PharmacyDispenseItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], PharmacyDispenseItem.prototype, "qty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], PharmacyDispenseItem.prototype, "expirySnapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], PharmacyDispenseItem.prototype, "batchNumberSnapshot", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PharmacyDispenseItem.prototype, "createdAt", void 0);
exports.PharmacyDispenseItem = PharmacyDispenseItem = __decorate([
    (0, typeorm_1.Entity)("pharmacy_dispense_items")
], PharmacyDispenseItem);
