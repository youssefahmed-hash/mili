"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardsController = exports.RewardsController = void 0;
const rewards_service_1 = require("./rewards.service");
const apiResponse_1 = require("../../utils/apiResponse");
class RewardsController {
    async getAll(req, res, next) {
        try {
            const records = await rewards_service_1.rewardsService.getAll();
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجلات المكافآت بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const records = await rewards_service_1.rewardsService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, records, "تم جلب سجل مكافآت الفرد بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body;
            const record = await rewards_service_1.rewardsService.create(data);
            return (0, apiResponse_1.successResponse)(res, record, "تم تسجيل المكافأة بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const record = await rewards_service_1.rewardsService.update(id, data);
            return (0, apiResponse_1.successResponse)(res, record, "تم تحديث سجل المكافأة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await rewards_service_1.rewardsService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف سجل المكافأة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RewardsController = RewardsController;
exports.rewardsController = new RewardsController();
