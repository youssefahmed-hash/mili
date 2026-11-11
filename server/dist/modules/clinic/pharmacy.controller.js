"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pharmacyController = exports.PharmacyController = void 0;
const pharmacy_service_1 = require("./pharmacy.service");
const apiResponse_1 = require("../../utils/apiResponse");
const errMsg = (e) => e instanceof Error ? e.message : "حدث خطأ أثناء تنفيذ العملية";
class PharmacyController {
    // ===================== الأصناف =====================
    async getDrugs(req, res, next) {
        try {
            const { search } = req.query;
            const drugs = await pharmacy_service_1.pharmacyService.getDrugs(search);
            return (0, apiResponse_1.successResponse)(res, drugs, "تم جلب الأصناف بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getDrug(req, res, next) {
        try {
            const drug = await pharmacy_service_1.pharmacyService.getDrug(req.params.id);
            if (!drug)
                return (0, apiResponse_1.errorResponse)(res, "الصنف غير موجود", 404);
            return (0, apiResponse_1.successResponse)(res, drug, "تم جلب الصنف بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async createDrug(req, res, next) {
        try {
            const drug = await pharmacy_service_1.pharmacyService.createDrug(req.body);
            return (0, apiResponse_1.successResponse)(res, drug, "تم إضافة الصنف بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async updateDrug(req, res, next) {
        try {
            const drug = await pharmacy_service_1.pharmacyService.updateDrug(req.params.id, req.body);
            return (0, apiResponse_1.successResponse)(res, drug, "تم تحديث الصنف بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async deleteDrug(req, res, next) {
        try {
            await pharmacy_service_1.pharmacyService.deleteDrug(req.params.id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف الصنف بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    // ===================== الدفعات =====================
    async getBatches(req, res, next) {
        try {
            const { drugId, available, expiringMonths } = req.query;
            const batches = await pharmacy_service_1.pharmacyService.getBatches({
                drugId: drugId,
                availableOnly: available === "1" || available === "true",
                expiringMonths: expiringMonths ? parseInt(expiringMonths, 10) : undefined
            });
            return (0, apiResponse_1.successResponse)(res, batches, "تم جلب الشحنات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async createBatch(req, res, next) {
        try {
            const batch = await pharmacy_service_1.pharmacyService.createBatch(req.body);
            return (0, apiResponse_1.successResponse)(res, batch, "تم تسجيل الشحنة بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async deleteBatch(req, res, next) {
        try {
            await pharmacy_service_1.pharmacyService.deleteBatch(req.params.id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف الشحنة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    /** دفعات صنف مرتبة FEFO + رايات — للصرف ونافذة التنبيه */
    async getFEFO(req, res, next) {
        try {
            const data = await pharmacy_service_1.pharmacyService.getDrugBatchesForFEFO(req.params.drugId);
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب الدفعات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    // ===================== الصلاحية =====================
    async getExpiring(req, res, next) {
        try {
            const { months } = req.query;
            const data = await pharmacy_service_1.pharmacyService.getExpiring(months ? parseInt(months, 10) : 3);
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب تقرير الصلاحية بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    // ===================== الرواكد =====================
    async getDeadStock(req, res, next) {
        try {
            const { days } = req.query;
            const data = await pharmacy_service_1.pharmacyService.getDeadStock(days ? parseInt(days, 10) : 90);
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب تقرير الرواكد بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    // ===================== الصرف =====================
    async dispense(req, res, next) {
        try {
            const scopeUser = req.scopeUser;
            const result = await pharmacy_service_1.pharmacyService.dispense({
                ...req.body,
                createdBy: scopeUser?.id ?? null
            });
            return (0, apiResponse_1.successResponse)(res, result, result.warnings?.length
                ? "تم الصرف مع تنبيهات"
                : "تم صرف الأدوية بنجاح", 201);
        }
        catch (err) {
            // نافذة تأكيد FEFO: 409 مع تفاصيل التقسيم
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
    async getDispenses(req, res, next) {
        try {
            const { personnelId, clinicRecordId } = req.query;
            const list = await pharmacy_service_1.pharmacyService.getDispenses({
                personnelId: personnelId,
                clinicRecordId: clinicRecordId
            });
            return (0, apiResponse_1.successResponse)(res, list, "تم جلب سجل الصرف بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PharmacyController = PharmacyController;
exports.pharmacyController = new PharmacyController();
