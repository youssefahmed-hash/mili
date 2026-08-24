"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicController = exports.ClinicController = void 0;
const clinic_service_1 = require("./clinic.service");
const apiResponse_1 = require("../../utils/apiResponse");
class ClinicController {
    async getAll(req, res, next) {
        try {
            const records = await clinic_service_1.clinicService.getAll();
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات العيادة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const records = await clinic_service_1.clinicService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات العيادة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const record = await clinic_service_1.clinicService.create(req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم تسجيل الكشف الطبي بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const record = await clinic_service_1.clinicService.update(id, req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم تحديث سجل العيادة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await clinic_service_1.clinicService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف سجل العيادة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ClinicController = ClinicController;
exports.clinicController = new ClinicController();
