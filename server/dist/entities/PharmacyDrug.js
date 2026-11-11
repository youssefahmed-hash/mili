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
exports.PharmacyDrug = exports.normalizeUnit = exports.PHARMACY_UNITS = void 0;
const typeorm_1 = require("typeorm");
const PharmacyBatch_1 = require("./PharmacyBatch");
const PharmacyDispenseItem_1 = require("./PharmacyDispenseItem");
/** وحدات البيع المدعومة — الترتيب من الأكبر للأصغر. الحبة هي الوحدة الأساسية للتخزين. */
exports.PHARMACY_UNITS = ["كرتونة", "علبة", "شريط", "حبة"];
const normalizeUnit = (raw) => {
    const v = String(raw ?? "").trim();
    return exports.PHARMACY_UNITS.includes(v) ? v : "حبة";
};
exports.normalizeUnit = normalizeUnit;
/**
 * صنف الدواء (تصنيف الأدوية).
 * code فريد — فاضي مسموح (أكثر من صنف بدون كود)، لكن التكرار مرفوض.
 * التقسيم: كم حبة في الشريط، كم شريط في العلبة، كم علبة في الكرتونة.
 * الحبة هي الوحدة الأساسية — كل الكميات بتتخزّن بالحبة.
 */
let PharmacyDrug = class PharmacyDrug {
};
exports.PharmacyDrug = PharmacyDrug;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PharmacyDrug.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], PharmacyDrug.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], PharmacyDrug.prototype, "nameEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true, unique: true }),
    __metadata("design:type", Object)
], PharmacyDrug.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], PharmacyDrug.prototype, "nameNorm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", Object)
], PharmacyDrug.prototype, "nameEnNorm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], PharmacyDrug.prototype, "codeNorm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], PharmacyDrug.prototype, "barcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], PharmacyDrug.prototype, "allowCarton", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], PharmacyDrug.prototype, "allowBox", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], PharmacyDrug.prototype, "allowStrip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], PharmacyDrug.prototype, "allowPill", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], PharmacyDrug.prototype, "pillsPerStrip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], PharmacyDrug.prototype, "stripsPerBox", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], PharmacyDrug.prototype, "boxesPerCarton", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], PharmacyDrug.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PharmacyBatch_1.PharmacyBatch, (b) => b.drug),
    __metadata("design:type", Array)
], PharmacyDrug.prototype, "batches", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PharmacyDispenseItem_1.PharmacyDispenseItem, (i) => i.drug),
    __metadata("design:type", Array)
], PharmacyDrug.prototype, "dispenseItems", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PharmacyDrug.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PharmacyDrug.prototype, "updatedAt", void 0);
exports.PharmacyDrug = PharmacyDrug = __decorate([
    (0, typeorm_1.Entity)("pharmacy_drugs")
], PharmacyDrug);
