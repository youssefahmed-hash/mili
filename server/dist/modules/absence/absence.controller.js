"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.absenceController = exports.AbsenceController = void 0;
const absence_service_1 = require("./absence.service");
const apiResponse_1 = require("../../utils/apiResponse");
class AbsenceController {
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const records = await absence_service_1.absenceService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجل الغياب بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getOpen(req, res, next) {
        try {
            const records = await absence_service_1.absenceService.getOpen();
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب الغيابات المفتوحة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const record = await absence_service_1.absenceService.create(req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم تسجيل الغياب بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    /** تسجيل العودة —-body اختياري: { returnDate, notes } */
    async recordReturn(req, res, next) {
        try {
            const { id } = req.params;
            const { returnDate, notes } = req.body || {};
            const record = await absence_service_1.absenceService.recordReturn(id, returnDate, notes);
            return (0, apiResponse_1.successResponse)(res, record, "تم تسجيل العودة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const record = await absence_service_1.absenceService.update(id, req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم تحديث سجل الغياب بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await absence_service_1.absenceService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف سجل الغياب بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AbsenceController = AbsenceController;
exports.absenceController = new AbsenceController();
