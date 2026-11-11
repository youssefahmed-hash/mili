"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicController = exports.ClinicController = void 0;
const clinic_service_1 = require("./clinic.service");
const apiResponse_1 = require("../../utils/apiResponse");
class ClinicController {
    async getAll(req, res, next) {
        try {
            const { fromDate, toDate } = req.query;
            const records = await clinic_service_1.clinicService.getAll({
                fromDate: fromDate,
                toDate: toDate
            });
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
    async getForPrint(req, res, next) {
        try {
            const { personnelId, fromDate, toDate } = req.query;
            const records = await clinic_service_1.clinicService.getForPrint({
                personnelId: personnelId,
                fromDate: fromDate,
                toDate: toDate
            });
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات الطباعة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const record = await clinic_service_1.clinicService.create(req.body);
            const warnings = record?.dispense?.warnings;
            return (0, apiResponse_1.successResponse)(res, record, warnings?.length ? "تم تسجيل الكشف والصرف مع تنبيهات" : "تم تسجيل الكشف الطبي بنجاح", 201);
        }
        catch (err) {
            // نافذة تأكيد FEFO أثناء إنشاء الكشف: 409 مع تفاصيل التقسيم (والتنفيذ مرجوع بالكامل)
            if (err?.needsConfirm) {
                return res.status(409).json({
                    success: false,
                    message: err.message,
                    needsConfirm: true,
                    splitWarnings: err.splitWarnings
                });
            }
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
