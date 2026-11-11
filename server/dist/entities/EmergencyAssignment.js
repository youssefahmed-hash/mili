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
exports.EmergencyAssignment = void 0;
const typeorm_1 = require("typeorm");
const Personnel_1 = require("./Personnel");
const LinePoint_1 = require("./LinePoint");
const Shift_1 = require("./Shift");
/**
 * تعيين طوارئ ثنائي الاتجاه بنطاق تاريخ حر:
 * - weekType='personnel' (خط → أفراد): عسكري خط ينزل في أسبوع الأفراد. يتطلب personnel.unit === 'الخط'.
 * - weekType='line' (أفراد → خط): عسكري أفراد ينزل في أسبوع الخط. يتطلب personnel.unit !== 'الخط' + نقطة + عمالة.
 * لا يمس إجازات الأفراد ولا دوران الخط ولا التعيينات الدائمة.
 */
let EmergencyAssignment = class EmergencyAssignment {
};
exports.EmergencyAssignment = EmergencyAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EmergencyAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], EmergencyAssignment.prototype, "personnelId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Personnel_1.Personnel, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "personnelId" }),
    __metadata("design:type", Personnel_1.Personnel)
], EmergencyAssignment.prototype, "personnel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20 }),
    __metadata("design:type", String)
], EmergencyAssignment.prototype, "weekType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], EmergencyAssignment.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], EmergencyAssignment.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], EmergencyAssignment.prototype, "linePointId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => LinePoint_1.LinePoint, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "linePointId" }),
    __metadata("design:type", Object)
], EmergencyAssignment.prototype, "linePoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], EmergencyAssignment.prototype, "shiftId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Shift_1.Shift, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "shiftId" }),
    __metadata("design:type", Object)
], EmergencyAssignment.prototype, "shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], EmergencyAssignment.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "معتمدة" }),
    __metadata("design:type", String)
], EmergencyAssignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EmergencyAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EmergencyAssignment.prototype, "updatedAt", void 0);
exports.EmergencyAssignment = EmergencyAssignment = __decorate([
    (0, typeorm_1.Entity)("emergency_assignments"),
    (0, typeorm_1.Index)(["personnelId"]),
    (0, typeorm_1.Index)(["weekType", "startDate", "endDate"])
], EmergencyAssignment);
