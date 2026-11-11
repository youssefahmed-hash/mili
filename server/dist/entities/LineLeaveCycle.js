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
exports.LineLeaveCycle = void 0;
const typeorm_1 = require("typeorm");
const Shift_1 = require("./Shift");
let LineLeaveCycle = class LineLeaveCycle {
};
exports.LineLeaveCycle = LineLeaveCycle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LineLeaveCycle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], LineLeaveCycle.prototype, "shiftId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Shift_1.Shift, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "shiftId" }),
    __metadata("design:type", Shift_1.Shift)
], LineLeaveCycle.prototype, "shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], LineLeaveCycle.prototype, "leaveStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], LineLeaveCycle.prototype, "leaveEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 14 }),
    __metadata("design:type", Number)
], LineLeaveCycle.prototype, "cycleDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], LineLeaveCycle.prototype, "cycleNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], LineLeaveCycle.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LineLeaveCycle.prototype, "createdAt", void 0);
exports.LineLeaveCycle = LineLeaveCycle = __decorate([
    (0, typeorm_1.Entity)("line_leave_cycles")
], LineLeaveCycle);
