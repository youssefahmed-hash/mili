import { Request, Response, NextFunction } from "express";
import { vacationsService } from "./vacations.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class VacationsController {
    async getByPersonnel(req: Request, res: Response, next: NextFunction) {
        try {
            const { personnelId } = req.params;
            const vacations = await vacationsService.getByPersonnelId(personnelId);
            return successResponse(res, vacations, "تم جلب سجل الإجازات بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body;
            const vacation = await vacationsService.create(data);
            return successResponse(res, vacation, "تم تسجيل الإجازة بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body;
            const vacation = await vacationsService.update(id, data);
            return successResponse(res, vacation, "تم تحديث بيانات الإجازة بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await vacationsService.delete(id);
            return successResponse(res, null, "تم حذف الإجازة بنجاح");
        } catch (err) {
            next(err);
        }
    }
}

export const vacationsController = new VacationsController();
