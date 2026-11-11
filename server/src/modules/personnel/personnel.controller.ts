import { Request, Response, NextFunction } from "express";
import { personnelService } from "./personnel.service";
import { documentsService } from "../documents/documents.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";
import { ScopedRequest, allowedPersonnelTypes } from "../../middlewares/userScope";

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

/**
 * يضمن إن السجل المطلوب داخل نطاق المستخدم قبل أي قراءة/تعديل/حذف.
 * مدير النظام (null) = الكل | مدير داخلية = نطاق داخلية | مستخدم عادي = نطاقه.
 * السجل خارج النطاق يرجع 404 (مش 403) عشان ما نكشفش وجوده.
 */
const ensureInScope = async (id: string, req: ScopedRequest) => {
    const scopeUser = req.scopeUser;
    if (!scopeUser) return null;
    const personnel = await personnelService.findOne(id);
    if (!personnel) return null;
    const allowed = allowedPersonnelTypes(scopeUser);
    if (allowed === null) return personnel; // مدير النظام = الكل
    return allowed.includes(personnel.personnelType) ? personnel : null;
};

export class PersonnelController {
    async getAll(req: ScopedRequest, res: Response, next: NextFunction) {
        try {
            const { search, ranks, rank, unit, status, statusNe, personnelType, sector, includeRecruits, condition, dischargeMonth, workBeforeEnlistment, page, limit } = req.query;
            // النطاق من المستخدم المصادق عليه فقط — يتجاهل أي طلب خارج النطاق
            const allowedTypes = allowedPersonnelTypes(req.scopeUser);
            const filters = {
                search: search as string,
                ranks: ranks as string,
                rank: rank as string,
                unit: unit as string,
                status: status as any,
                statusNe: statusNe as string,
                personnelType: personnelType as string,
                sector: sector as string,
                dischargeMonth: dischargeMonth as string,
                workBeforeEnlistment: workBeforeEnlistment as string,
                includeRecruits: includeRecruits === 'true' || includeRecruits === '1',
                condition: condition as string,
                allowedTypes,
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
            const personnel = await ensureInScope(id, req as ScopedRequest);
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

            // منع تسجيل فرد خارج نطاق المستخدم (مدير داخلية ما يسجّلش حربية)
            const allowedOnCreate = allowedPersonnelTypes((req as ScopedRequest).scopeUser);
            if (Array.isArray(allowedOnCreate)) {
                const requested = String(data.personnelType || '').trim();
                if (!requested || !allowedOnCreate.includes(requested)) {
                    return errorResponse(res, "نوع الفرد خارج نطاق صلاحياتك", 403);
                }
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
            const existing = await ensureInScope(id, req as ScopedRequest);
            if (!existing) {
                return errorResponse(res, "الفرد العسكري غير موجود", 404);
            }
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
            const existing = await ensureInScope(id, req as ScopedRequest);
            if (!existing) {
                return errorResponse(res, "الفرد العسكري غير موجود", 404);
            }
            await personnelService.delete(id);
            return successResponse(res, null, "تم حذف الفرد العسكري وجميع بياناته المرتبطة بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async getVacationLineup(req: Request, res: Response, next: NextFunction) {
        try {
            const { date } = req.query;
            // الـscope من المستخدم المصادق عليه فقط (requireAuthScope) — لا query param.
            const scopeUser = (req as ScopedRequest).scopeUser;
            if (!scopeUser) {
                return errorResponse(res, 'غير مصرح بالدخول', 401);
            }
            const result = await personnelService.getVacationLineup(date as string | undefined, {
                userRole: scopeUser?.role,
                userDepartment: scopeUser?.department,
                allowedTypes: allowedPersonnelTypes(scopeUser)
            });
            return successResponse(res, result, "تم جلب طابور الإجازات بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async getStrength(req: Request, res: Response, next: NextFunction) {
        try {
            // الـscope من المستخدم المصادق عليه فقط (requireAuthScope)
            const scopeUser = (req as ScopedRequest).scopeUser;
            if (!scopeUser) {
                return errorResponse(res, 'غير مصرح بالدخول', 401);
            }
            const result = await personnelService.getStrength({
                userRole: scopeUser?.role,
                userType: scopeUser?.userType,
                userDepartment: scopeUser?.department
            });
            return successResponse(res, result, "تم جلب إجمالي القوة بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async getStats(req: ScopedRequest, res: Response, next: NextFunction) {
        try {
            const { search, ranks, rank, unit, status, statusNe, personnelType, sector, includeRecruits, condition, dischargeMonth, workBeforeEnlistment } = req.query;
            const allowedTypes = allowedPersonnelTypes(req.scopeUser);
            const result = await personnelService.getStats({
                search: search as string,
                ranks: ranks as string,
                rank: rank as string,
                unit: unit as string,
                status: status as any,
                statusNe: statusNe as string,
                personnelType: personnelType as string,
                sector: sector as string,
                dischargeMonth: dischargeMonth as string,
                workBeforeEnlistment: workBeforeEnlistment as string,
                includeRecruits: includeRecruits === 'true' || includeRecruits === '1',
                condition: condition as string,
                allowedTypes
            });
            return successResponse(res, result, "تم جلب إحصاءات القائمة بنجاح");
        } catch (err) {
            next(err);
        }
    }
}

export const personnelController = new PersonnelController();
