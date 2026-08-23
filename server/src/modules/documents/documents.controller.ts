import { Request, Response, NextFunction } from "express";
import { documentsService } from "./documents.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class DocumentsController {
    async getByPersonnel(req: Request, res: Response, next: NextFunction) {
        try {
            const { personnelId } = req.params;
            const docs = await documentsService.getByPersonnelId(personnelId);
            return successResponse(res, docs, "تم جلب المستندات بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async uploadDoc(req: Request, res: Response, next: NextFunction) {
        try {
            const { personnelId, type } = req.body;
            if (!req.file) {
                return errorResponse(res, "الرجاء رفع ملف المستند", 400);
            }

            if (!personnelId || !type) {
                return errorResponse(res, "الرجاء توفير معرف الفرد ونوع المستند", 400);
            }

            const fileUrl = `/uploads/documents/${req.file.filename}`;
            const doc = await documentsService.create({
                personnelId,
                type,
                fileUrl
            });

            return successResponse(res, doc, "تم رفع وحفظ المستند بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    async deleteDoc(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await documentsService.delete(id);
            return successResponse(res, null, "تم حذف المستند بنجاح");
        } catch (err) {
            next(err);
        }
    }
}

export const documentsController = new DocumentsController();
