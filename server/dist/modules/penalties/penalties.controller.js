"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.penaltiesController = exports.PenaltiesController = void 0;
const penalties_service_1 = require("./penalties.service");
const apiResponse_1 = require("../../utils/apiResponse");
class PenaltiesController {
    async getAll(req, res, next) {
        try {
            const records = await penalties_service_1.penaltiesService.getAll();
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات العقوبات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const records = await penalties_service_1.penaltiesService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجل عقوبات الفرد بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body;
            const record = await penalties_service_1.penaltiesService.create(data);
            return (0, apiResponse_1.successResponse)(res, record, "تم تسجيل العقوبة بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const record = await penalties_service_1.penaltiesService.update(id, data);
            return (0, apiResponse_1.successResponse)(res, record, "تم تحديث سجل العقوبة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await penalties_service_1.penaltiesService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف سجل العقوبة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PenaltiesController = PenaltiesController;
exports.penaltiesController = new PenaltiesController();
