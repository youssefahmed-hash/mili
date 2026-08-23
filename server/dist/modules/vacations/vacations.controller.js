"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vacationsController = exports.VacationsController = void 0;
const vacations_service_1 = require("./vacations.service");
const apiResponse_1 = require("../../utils/apiResponse");
class VacationsController {
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const vacations = await vacations_service_1.vacationsService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, vacations, "تم جلب سجل الإجازات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body;
            const vacation = await vacations_service_1.vacationsService.create(data);
            return (0, apiResponse_1.successResponse)(res, vacation, "تم تسجيل الإجازة بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const vacation = await vacations_service_1.vacationsService.update(id, data);
            return (0, apiResponse_1.successResponse)(res, vacation, "تم تحديث بيانات الإجازة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await vacations_service_1.vacationsService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف الإجازة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VacationsController = VacationsController;
exports.vacationsController = new VacationsController();
