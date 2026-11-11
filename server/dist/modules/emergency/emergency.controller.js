"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyController = exports.EmergencyController = void 0;
const emergency_service_1 = require("./emergency.service");
const apiResponse_1 = require("../../utils/apiResponse");
class EmergencyController {
    async list(req, res, next) {
        try {
            const { weekType, activeOn, personnelId, status } = req.query;
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return (0, apiResponse_1.errorResponse)(res, 'غير مصرح بالدخول', 401);
            }
            if (weekType !== undefined && weekType !== 'personnel' && weekType !== 'line') {
                return (0, apiResponse_1.errorResponse)(res, "نوع الأسبوع يجب أن يكون: personnel أو line", 400);
            }
            const scope = { role: scopeUser.role, department: scopeUser.department };
            const statusFilter = status;
            if (statusFilter !== undefined && !["معلقة", "معتمدة", "مرفوضة"].includes(statusFilter)) {
                return (0, apiResponse_1.errorResponse)(res, "الحالة يجب أن تكون: معلقة أو معتمدة أو مرفوضة", 400);
            }
            const data = await emergency_service_1.emergencyService.list({
                weekType: weekType,
                activeOn: activeOn,
                personnelId: personnelId,
                status: statusFilter
            }, scope);
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب الطوارئ بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return (0, apiResponse_1.errorResponse)(res, 'غير مصرح بالدخول', 401);
            }
            const { personnelId, weekType, startDate, endDate, linePointId, shiftId } = req.body;
            const data = await emergency_service_1.emergencyService.create({
                personnelId,
                weekType,
                startDate,
                endDate,
                linePointId: linePointId || null,
                shiftId: shiftId || null,
                createdBy: scopeUser.id
            });
            return (0, apiResponse_1.successResponse)(res, data, "تم إنشاء الطوارئ بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async remove(req, res, next) {
        try {
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return (0, apiResponse_1.errorResponse)(res, 'غير مصرح بالدخول', 401);
            }
            await emergency_service_1.emergencyService.remove(req.params.id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف الطوارئ بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async approve(req, res, next) {
        try {
            const data = await emergency_service_1.emergencyService.approve(req.params.id);
            return (0, apiResponse_1.successResponse)(res, data, "تم اعتماد الطوارئ بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async reject(req, res, next) {
        try {
            const data = await emergency_service_1.emergencyService.reject(req.params.id);
            return (0, apiResponse_1.successResponse)(res, data, "تم رفض الطوارئ بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.EmergencyController = EmergencyController;
exports.emergencyController = new EmergencyController();
