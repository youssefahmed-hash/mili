import { Request, Response, NextFunction } from "express";
import { pharmacyService } from "./pharmacy.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";
import { ScopedRequest } from "../../middlewares/userScope";

const errMsg = (e: unknown): string =>
    e instanceof Error ? e.message : "حدث خطأ أثناء تنفيذ العملية";

export class PharmacyController {
    // ===================== الأصناف =====================
    async getDrugs(req: Request, res: Response, next: NextFunction) {
        try {
            const { search } = req.query;
            const drugs = await pharmacyService.getDrugs(search as string | undefined);
            return successResponse(res, drugs, "تم جلب الأصناف بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async getDrug(req: Request, res: Response, next: NextFunction) {
        try {
            const drug = await pharmacyService.getDrug(req.params.id);
            if (!drug) return errorResponse(res, "الصنف غير موجود", 404);
            return successResponse(res, drug, "تم جلب الصنف بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async createDrug(req: Request, res: Response, next: NextFunction) {
        try {
            const drug = await pharmacyService.createDrug(req.body);
            return successResponse(res, drug, "تم إضافة الصنف بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    async updateDrug(req: Request, res: Response, next: NextFunction) {
        try {
            const drug = await pharmacyService.updateDrug(req.params.id, req.body);
            return successResponse(res, drug, "تم تحديث الصنف بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async deleteDrug(req: Request, res: Response, next: NextFunction) {
        try {
            await pharmacyService.deleteDrug(req.params.id);
            return successResponse(res, null, "تم حذف الصنف بنجاح");
        } catch (err) {
            next(err);
        }
    }

    // ===================== الدفعات =====================
    async getBatches(req: Request, res: Response, next: NextFunction) {
        try {
            const { drugId, available, expiringMonths } = req.query;
            const batches = await pharmacyService.getBatches({
                drugId: drugId as string | undefined,
                availableOnly: available === "1" || available === "true",
                expiringMonths: expiringMonths ? parseInt(expiringMonths as string, 10) : undefined
            });
            return successResponse(res, batches, "تم جلب الشحنات بنجاح");
        } catch (err) {
            next(err);
        }
    }

    async createBatch(req: Request, res: Response, next: NextFunction) {
        try {
            const batch = await pharmacyService.createBatch(req.body);
            return successResponse(res, batch, "تم تسجيل الشحنة بنجاح", 201);
        } catch (err) {
            next(err);
        }
    }

    async deleteBatch(req: Request, res: Response, next: NextFunction) {
        try {
            await pharmacyService.deleteBatch(req.params.id);
            return successResponse(res, null, "تم حذف الشحنة بنجاح");
        } catch (err) {
            next(err);
        }
    }

    /** دفعات صنف مرتبة FEFO + رايات — للصرف ونافذة التنبيه */
    async getFEFO(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await pharmacyService.getDrugBatchesForFEFO(req.params.drugId);
            return successResponse(res, data, "تم جلب الدفعات بنجاح");
        } catch (err) {
            next(err);
        }
    }

    // ===================== الصلاحية =====================
    async getExpiring(req: Request, res: Response, next: NextFunction) {
        try {
            const { months } = req.query;
            const data = await pharmacyService.getExpiring(
                months ? parseInt(months as string, 10) : 3
            );
            return successResponse(res, data, "تم جلب تقرير الصلاحية بنجاح");
        } catch (err) {
            next(err);
        }
    }

    // ===================== الرواكد =====================
    async getDeadStock(req: Request, res: Response, next: NextFunction) {
        try {
            const { days } = req.query;
            const data = await pharmacyService.getDeadStock(
                days ? parseInt(days as string, 10) : 90
            );
            return successResponse(res, data, "تم جلب تقرير الرواكد بنجاح");
        } catch (err) {
            next(err);
        }
    }

    // ===================== الصرف =====================
    async dispense(req: Request, res: Response, next: NextFunction) {
        try {
            const scopeUser = (req as ScopedRequest).scopeUser;
            const result = await pharmacyService.dispense({
                ...req.body,
                createdBy: scopeUser?.id ?? null
            });
            return successResponse(
                res,
                result,
                result.warnings?.length
                    ? "تم الصرف مع تنبيهات"
                    : "تم صرف الأدوية بنجاح",
                201
            );
        } catch (err: any) {
            // نافذة تأكيد FEFO: 409 مع تفاصيل التقسيم
            if (err?.needsConfirm) {
                return res.status(409).json({
                    success: false,
                    message: err.message,
                    needsConfirm: true,
                    splitWarnings: err.splitWarnings
                });
            }
            next(err);
        }
    }

    async getDispenses(req: Request, res: Response, next: NextFunction) {
        try {
            const { personnelId, clinicRecordId } = req.query;
            const list = await pharmacyService.getDispenses({
                personnelId: personnelId as string | undefined,
                clinicRecordId: clinicRecordId as string | undefined
            });
            return successResponse(res, list, "تم جلب سجل الصرف بنجاح");
        } catch (err) {
            next(err);
        }
    }
}

export const pharmacyController = new PharmacyController();
