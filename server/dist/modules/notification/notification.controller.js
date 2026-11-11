"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const apiResponse_1 = require("../../utils/apiResponse");
class NotificationController {
    async getCurrent(req, res, next) {
        try {
            // ?date=YYYY-MM-DD اختياري للاختبار/العرض فقط — لا يغير تاريخ النظام
            const { date } = req.query;
            // الـscope من المستخدم المصادق عليه فقط (requireAuthScope) — لا query param.
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return (0, apiResponse_1.errorResponse)(res, 'غير مصرح بالدخول', 401);
            }
            const data = await notification_service_1.notificationService.getCurrentNotification(date, { role: scopeUser?.role, department: scopeUser?.department });
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب إشعار الإجازات الحالي بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getSettings(req, res, next) {
        try {
            const data = await notification_service_1.notificationService.getSettings();
            return (0, apiResponse_1.successResponse)(res, data, "تم جلب إعدادات التناوب بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async updateSettings(req, res, next) {
        try {
            const { weeklyRotationStartDate, firstTurn } = req.body;
            if (weeklyRotationStartDate === undefined && firstTurn === undefined) {
                return (0, apiResponse_1.errorResponse)(res, "يجب تحديد تاريخ بداية التناوب أو أول دور", 400);
            }
            if (weeklyRotationStartDate !== undefined && weeklyRotationStartDate !== null &&
                !/^\d{4}-\d{2}-\d{2}$/.test(weeklyRotationStartDate)) {
                return (0, apiResponse_1.errorResponse)(res, "تاريخ بداية التناوب غير صالح، يجب أن يكون بصيغة YYYY-MM-DD", 400);
            }
            if (firstTurn !== undefined && firstTurn !== null && !["personnel", "line"].includes(firstTurn)) {
                return (0, apiResponse_1.errorResponse)(res, "أول دور يجب أن يكون: personnel أو line", 400);
            }
            const data = await notification_service_1.notificationService.updateSettings({ weeklyRotationStartDate, firstTurn });
            return (0, apiResponse_1.successResponse)(res, data, "تم تحديث إعدادات التناوب بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
