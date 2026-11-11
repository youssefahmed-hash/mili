import { Response, NextFunction } from "express";
import { activityService } from "./activity.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";
import { ScopedRequest } from "../../middlewares/userScope";

export class ActivityController {
    async getAll(req: ScopedRequest, res: Response, next: NextFunction) {
        try {
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return errorResponse(res, "غير مصرح بالدخول", 401);
            }
            const { page, limit, module, action, search, from, to } = req.query;
            const result = await activityService.findAll({
                page: page ? parseInt(String(page), 10) : undefined,
                limit: limit ? parseInt(String(limit), 10) : undefined,
                module: module ? String(module) : undefined,
                action: action ? String(action) : undefined,
                search: search ? String(search) : undefined,
                from: from ? String(from) : undefined,
                to: to ? String(to) : undefined,
                isSuperAdmin: scopeUser.role === "admin"
            });
            return successResponse(res, result.items, "تم جلب سجل التحديثات بنجاح", 200, {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            });
        } catch (err) {
            next(err);
        }
    }

    async count(req: ScopedRequest, res: Response, next: NextFunction) {
        try {
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return errorResponse(res, "غير مصرح بالدخول", 401);
            }
            const since = req.query.since ? String(req.query.since) : undefined;
            const result = await activityService.countSince(since, scopeUser.role === "admin");
            return successResponse(res, result, "تم جلب عدد التحديثات الجديدة");
        } catch (err) {
            next(err);
        }
    }
}

export const activityController = new ActivityController();
