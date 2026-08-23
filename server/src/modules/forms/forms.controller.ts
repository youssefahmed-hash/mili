import { Request, Response, NextFunction } from "express";
import { formsService } from "./forms.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class FormsController {
    async getByPersonnel(req: Request, res: Response, next: NextFunction) {
        try {
            const { personnelId } = req.params;
            const forms = await formsService.getByPersonnelId(personnelId);
            return successResponse(res, forms, "تم جلب النماذج بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body;

            // If form image file is uploaded
            if (req.file) {
                data.fileUrl = `/uploads/forms/${req.file.filename}`;
            }

            const form = await formsService.create(data);
            return successResponse(res, form, "تم إنشاء النموذج بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body;

            // If replacing form image file
            if (req.file) {
                data.fileUrl = `/uploads/forms/${req.file.filename}`;
            }

            const form = await formsService.update(id, data);
            return successResponse(res, form, "تم تحديث بيانات النموذج بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await formsService.delete(id);
            return successResponse(res, null, "تم حذف النموذج بنجاح");
        } catch (err) {
            next(err);
        }
    }
}

export const formsController = new FormsController();
