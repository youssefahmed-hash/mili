import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";
import { ScopedRequest } from "../../middlewares/userScope";

export class NotificationController {
    async getCurrent(req: Request, res: Response, next: NextFunction) {
        try {
            // ?date=YYYY-MM-DD اختياري للاختبار/العرض فقط — لا يغير تاريخ النظام
            const { date } = req.query;
            // الـscope من المستخدم المصادق عليه فقط (requireAuthScope) — لا query param.
            const scopeUser = (req as ScopedRequest).scopeUser;
            if (!scopeUser) {
                return errorResponse(res, 'غير مصرح بالدخول', 401);
            }
            const data = await notificationService.getCurrentNotification(
                date as string | undefined,
                { role: scopeUser?.role, department: scopeUser?.department }
            );
            return successResponse(res, data, "تم جلب إشعار الإجازات الحالي بنجاح");
        } catch (err) { next(err); }
    }

    async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await notificationService.getSettings();
            return successResponse(res, data, "تم جلب إعدادات التناوب بنجاح");
        } catch (err) { next(err); }
    }

    async updateSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const { weeklyRotationStartDate, firstTurn } = req.body;
            if (weeklyRotationStartDate === undefined && firstTurn === undefined) {
                return errorResponse(res, "يجب تحديد تاريخ بداية التناوب أو أول دور", 400);
            }
            if (weeklyRotationStartDate !== undefined && weeklyRotationStartDate !== null &&
                !/^\d{4}-\d{2}-\d{2}$/.test(weeklyRotationStartDate)) {
                return errorResponse(res, "تاريخ بداية التناوب غير صالح، يجب أن يكون بصيغة YYYY-MM-DD", 400);
            }
            if (firstTurn !== undefined && firstTurn !== null && !["personnel", "line"].includes(firstTurn)) {
                return errorResponse(res, "أول دور يجب أن يكون: personnel أو line", 400);
            }
            const data = await notificationService.updateSettings({ weeklyRotationStartDate, firstTurn });
            return successResponse(res, data, "تم تحديث إعدادات التناوب بنجاح");
        } catch (err) { next(err); }
    }
}

export const notificationController = new NotificationController();
