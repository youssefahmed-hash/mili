import { Request, Response, NextFunction } from "express";
import { absenceService } from "./absence.service";
import { successResponse } from "../../utils/apiResponse";

export class AbsenceController {
    async getByPersonnel(req: Request, res: Response, next: NextFunction) {
        try {
            const { personnelId } = req.params;
            const records = await absenceService.getByPersonnelId(personnelId);
            return successResponse(res, records, "تم جلب سجل الغياب بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async getOpen(req: Request, res: Response, next: NextFunction) {
        try {
            const records = await absenceService.getOpen();
            return successResponse(res, records, "تم جلب الغيابات المفتوحة بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const record = await absenceService.create(req.body);
            return successResponse(res, record, "تم تسجيل الغياب بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    /** تسجيل العودة —-body اختياري: { returnDate, notes } */
    async recordReturn(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { returnDate, notes } = req.body || {};
            const record = await absenceService.recordReturn(id, returnDate, notes);
            return successResponse(res, record, "تم تسجيل العودة بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const record = await absenceService.update(id, req.body);
            return successResponse(res, record, "تم تحديث سجل الغياب بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await absenceService.delete(id);
            return successResponse(res, null, "تم حذف سجل الغياب بنجاح");
        } catch (err) {
            next(err);
        }
    }
}

export const absenceController = new AbsenceController();