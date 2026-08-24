"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityController = exports.SecurityController = void 0;
const security_service_1 = require("./security.service");
const apiResponse_1 = require("../../utils/apiResponse");
class SecurityController {
    async getAll(req, res, next) {
        try {
            const records = await security_service_1.securityService.getAll();
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب البلاغات الأمنية بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const records = await security_service_1.securityService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب البلاغات الأمنية بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const record = await security_service_1.securityService.create(req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم تسجيل البلاغ الأمني بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const record = await security_service_1.securityService.update(id, req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم تحديث البلاغ الأمني بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await security_service_1.securityService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف البلاغ الأمني بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SecurityController = SecurityController;
exports.securityController = new SecurityController();
