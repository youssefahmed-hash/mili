"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineReportController = exports.lineLeaveCycleController = exports.lineAssignmentController = exports.linePointController = exports.shiftController = exports.LineReportController = exports.LineLeaveCycleController = exports.LineAssignmentController = exports.LinePointController = exports.ShiftController = void 0;
const line_service_1 = require("./line.service");
const apiResponse_1 = require("../../utils/apiResponse");
// ==================== Shift Controller (قراءة فقط) ====================
class ShiftController {
    async getAll(req, res, next) {
        try {
            const data = await line_service_1.shiftService.getAll();
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب العمالات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ShiftController = ShiftController;
// ==================== LinePoint Controller ====================
class LinePointController {
    async getAll(req, res, next) {
        try {
            const data = await line_service_1.linePointService.getAll();
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب النقاط بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = await line_service_1.linePointService.create(req.body);
            return (0, apiResponse_1.successResponse)(res, data, "تم إنشاء النقطة بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const data = await line_service_1.linePointService.update(req.params.id, req.body);
            return (0, apiResponse_1.successResponse)(res, data, "تم تحديث النقطة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await line_service_1.linePointService.delete(req.params.id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف النقطة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.LinePointController = LinePointController;
// ==================== LineAssignment Controller ====================
class LineAssignmentController {
    async getAll(req, res, next) {
        try {
            const { pointId, shiftId, personnelId } = req.query;
            const data = await line_service_1.lineAssignmentService.getAll({
                pointId: pointId,
                shiftId: shiftId,
                personnelId: personnelId
            });
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب التعيينات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const data = await line_service_1.lineAssignmentService.getById(req.params.id);
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب التعيين بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = await line_service_1.lineAssignmentService.create(req.body);
            return (0, apiResponse_1.successResponse)(res, data, "تم إنشاء التعيين بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async bulkCreate(req, res, next) {
        try {
            const data = await line_service_1.lineAssignmentService.bulkCreate(req.body);
            return (0, apiResponse_1.successResponse)(res, data, "تم إنشاء التعيينات بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const data = await line_service_1.lineAssignmentService.update(req.params.id, req.body);
            return (0, apiResponse_1.successResponse)(res, data, "تم تحديث التعيين بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await line_service_1.lineAssignmentService.delete(req.params.id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف التعيين بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    /** تعليم/فكّ «عسكري مكتب» + إجبار الحالة (إجازة/حاضر) */
    async setOfficeDuty(req, res, next) {
        try {
            const { items } = req.body;
            const data = await line_service_1.lineAssignmentService.setOfficeDuty(items);
            return (0, apiResponse_1.successResponse)(res, data, "تم تحديث عساكر المكتب بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getCurrentAssignment(req, res, next) {
        try {
            const { personnelId } = req.query;
            if (!personnelId)
                throw new Error("يجب تحديد معرف الفرد");
            const data = await line_service_1.lineAssignmentService.getCurrentAssignment(personnelId);
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب التعيين الحالي بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async transferPoint(req, res, next) {
        try {
            const { personnelId, newPointId } = req.body;
            if (!personnelId || !newPointId)
                throw new Error("يجب تحديد الفرد والنقطة الجديدة");
            const data = await line_service_1.lineAssignmentService.transferPoint(personnelId, newPointId);
            return (0, apiResponse_1.successResponse)(res, data, "تم نقل النقطة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async transferShift(req, res, next) {
        try {
            const { personnelId, newShiftId } = req.body;
            if (!personnelId || !newShiftId)
                throw new Error("يجب تحديد الفرد والعمالة الجديدة");
            const data = await line_service_1.lineAssignmentService.transferShift(personnelId, newShiftId);
            return (0, apiResponse_1.successResponse)(res, data, "تم نقل العمالة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async transferBoth(req, res, next) {
        try {
            const { personnelId, newPointId, newShiftId } = req.body;
            if (!personnelId || !newPointId || !newShiftId)
                throw new Error("يجب تحديد الفرد والنقطة والعمالة الجديدة");
            const data = await line_service_1.lineAssignmentService.transferBoth(personnelId, newPointId, newShiftId);
            return (0, apiResponse_1.successResponse)(res, data, "تم نقل النقطة والعمالة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getDailyReport(req, res, next) {
        try {
            const data = await line_service_1.lineReportService.getDailyReport();
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب التقرير بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.LineAssignmentController = LineAssignmentController;
// ==================== LineLeaveCycle Controller ====================
class LineLeaveCycleController {
    async getAll(req, res, next) {
        try {
            const data = await line_service_1.lineLeaveCycleService.getAll();
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب دورات الإجازات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getCurrent(req, res, next) {
        try {
            const data = await line_service_1.lineLeaveCycleService.getCurrent();
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب الدورة الحالية بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async initialize(req, res, next) {
        try {
            const { startDate, shiftId, personnelIds, vacationType, cycle, expectedReturnDate, notes } = req.body;
            if (!startDate)
                throw new Error("يجب تحديد تاريخ البداية");
            if (personnelIds !== undefined && !Array.isArray(personnelIds)) {
                return (0, apiResponse_1.errorResponse)(res, "personnelIds يجب أن تكون مصفوفة", 400);
            }
            const data = await line_service_1.lineLeaveCycleService.initializeCycle(startDate, shiftId, personnelIds, {
                vacationType,
                cycle,
                expectedReturnDate,
                notes: notes ?? null
            });
            return (0, apiResponse_1.successResponse)(res, data, "تم تهيئة الدورة بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async generateNext(req, res, next) {
        try {
            const data = await line_service_1.lineLeaveCycleService.generateNextCycle();
            return (0, apiResponse_1.successResponse)(res, data, "تم إنشاء الدورة التالية بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async getCurrentLeaveShift(req, res, next) {
        try {
            const { date } = req.query;
            if (!date)
                throw new Error("يجب تحديد التاريخ");
            const data = await line_service_1.lineLeaveCycleService.getCurrentLeaveShift(date);
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب العمالة في الإجازة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.LineLeaveCycleController = LineLeaveCycleController;
// ==================== LineReport Controller ====================
class LineReportController {
    async getDailyReport(req, res, next) {
        try {
            const data = await line_service_1.lineReportService.getDailyReport();
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب التقرير اليومي بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getDailyReportPDF(req, res, next) {
        try {
            const html = await line_service_1.lineReportService.generateDailyReportPDF();
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.send(html);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.LineReportController = LineReportController;
// Singleton instances
exports.shiftController = new ShiftController();
exports.linePointController = new LinePointController();
exports.lineAssignmentController = new LineAssignmentController();
exports.lineLeaveCycleController = new LineLeaveCycleController();
exports.lineReportController = new LineReportController();
