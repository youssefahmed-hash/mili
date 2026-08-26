"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesController = exports.ServicesController = void 0;
const services_service_1 = require("./services.service");
const apiResponse_1 = require("../../utils/apiResponse");
class ServicesController {
    async getAll(req, res, next) {
        try {
            const records = await services_service_1.servicesService.getAll();
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات الخدمات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const records = await services_service_1.servicesService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجل خدمات الفرد بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body;
            const record = await services_service_1.servicesService.create(data);
            return (0, apiResponse_1.successResponse)(res, record, "تم تسجيل الخدمة بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const record = await services_service_1.servicesService.update(id, data);
            return (0, apiResponse_1.successResponse)(res, record, "تم تحديث سجل الخدمة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await services_service_1.servicesService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف سجل الخدمة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getLineup(req, res, next) {
        try {
            const date = req.query.date || new Date().toISOString().slice(0, 10);
            const lineup = await services_service_1.servicesService.getServicesLineup(date);
            return (0, apiResponse_1.successResponse)(res, lineup, "تم جلب طابور الخدمات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ServicesController = ServicesController;
exports.servicesController = new ServicesController();
