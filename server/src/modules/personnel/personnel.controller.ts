import { Request, Response, NextFunction } from "express";
import { personnelService } from "./personnel.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class PersonnelController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { search, category, rank, unit, status, page, limit } = req.query;
            const filters = {
                search: search as string,
                category: category as any,
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
            
            // If file uploaded via Multer
            if (req.file) {
                data.photo = `/uploads/photos/${req.file.filename}`;
            }

            const personnel = await personnelService.create(data);
            return successResponse(res, personnel, "تم إضافة الفرد العسكري بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body;

            // If file uploaded via Multer
            if (req.file) {
                data.photo = `/uploads/photos/${req.file.filename}`;
            }

            const personnel = await personnelService.update(id, data);
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
