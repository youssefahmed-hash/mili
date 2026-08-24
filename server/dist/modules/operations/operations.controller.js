"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsController = exports.OperationsController = void 0;
const operations_service_1 = require("./operations.service");
const apiResponse_1 = require("../../utils/apiResponse");
class OperationsController {
    async getAll(req, res, next) {
        try {
            const records = await operations_service_1.operationsService.getAll();
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات العمليات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const records = await operations_service_1.operationsService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات العمليات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const record = await operations_service_1.operationsService.create(req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم إصدار أمر التحرك بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const record = await operations_service_1.operationsService.update(id, req.body);
            return (0, apiResponse_1.successResponse)(res, record, "تم تحديث سجل العملية بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await operations_service_1.operationsService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف سجل العملية بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OperationsController = OperationsController;
exports.operationsController = new OperationsController();
