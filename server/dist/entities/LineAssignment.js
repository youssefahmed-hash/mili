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
exports.LineAssignment = void 0;
const typeorm_1 = require("typeorm");
const Personnel_1 = require("./Personnel");
const LinePoint_1 = require("./LinePoint");
const Shift_1 = require("./Shift");
let LineAssignment = class LineAssignment {
};
exports.LineAssignment = LineAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LineAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], LineAssignment.prototype, "personnelId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Personnel_1.Personnel, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "personnelId" }),
    __metadata("design:type", Personnel_1.Personnel)
], LineAssignment.prototype, "personnel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], LineAssignment.prototype, "linePointId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => LinePoint_1.LinePoint, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "linePointId" }),
    __metadata("design:type", LinePoint_1.LinePoint)
], LineAssignment.prototype, "linePoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], LineAssignment.prototype, "shiftId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Shift_1.Shift, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "shiftId" }),
    __metadata("design:type", Shift_1.Shift)
], LineAssignment.prototype, "shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "حاضر" }),
    __metadata("design:type", String)
], LineAssignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LineAssignment.prototype, "officeDuty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", Object)
], LineAssignment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LineAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LineAssignment.prototype, "updatedAt", void 0);
exports.LineAssignment = LineAssignment = __decorate([
    (0, typeorm_1.Entity)("line_assignments"),
    (0, typeorm_1.Unique)(["personnelId"])
], LineAssignment);
