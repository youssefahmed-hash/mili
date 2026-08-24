import { Request, Response, NextFunction } from "express";
import { personnelService } from "./personnel.service";
import { documentsService } from "../documents/documents.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

const ATTACHMENT_DOC_TYPES = [
    { field: "cardImage", type: "personnelCard" },
    { field: "carnetImage", type: "personnelCarnet" },
    { field: "formImage", type: "personnelForm" }
] as const;

async function createAttachmentDocuments(
    personnelId: string,
    files: Record<string, Express.Multer.File[]>
) {
    for (const { field, type } of ATTACHMENT_DOC_TYPES) {
        const file = files?.[field]?.[0];
        if (file) {
            await documentsService.create({
                personnelId,
                type,
                fileUrl: `/uploads/documents/${file.filename}`
            });
        }
    }
}

export class PersonnelController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { search, ranks, rank, unit, status, page, limit } = req.query;
            const filters = {
                search: search as string,
                ranks: ranks as string,
                rank: rank as string,
                unit: unit as string,
                status: status as any,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
            };

            const result = await personnelService.findAll(filters);
            return successResponse(res, result.items, "تم جلب الأفراد بنجاح", 200, {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            });
        } catch (err) {
            next(err);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const personnel = await personnelService.findOne(id);
            if (!personnel) {
                return errorResponse(res, "الفرد العسكري غير موجود", 404);
            }
            return successResponse(res, personnel, "تم جلب بيانات الفرد العسكري بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body;
            const files = req.files as Record<string, Express.Multer.File[]>;

            if (files?.photo?.[0]) {
                data.photo = `/uploads/photos/${files.photo[0].filename}`;
            }

            const personnel = await personnelService.create(data);
            await createAttachmentDocuments(personnel.id, files);
            return successResponse(res, personnel, "تم إضافة الفرد العسكري بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body;
            const files = req.files as Record<string, Express.Multer.File[]>;

            if (files?.photo?.[0]) {
                data.photo = `/uploads/photos/${files.photo[0].filename}`;
            }

            const personnel = await personnelService.update(id, data);
            await createAttachmentDocuments(personnel.id, files);
            return successResponse(res, personnel, "تم تحديث بيانات الفرد العسكري بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await personnelService.delete(id);
            return successResponse(res, null, "تم حذف الفرد العسكري وجميع بياناته المرتبطة بنجاح");
        } catch (err) {
            next(err);
        }
    }
}

export const personnelController = new PersonnelController();
