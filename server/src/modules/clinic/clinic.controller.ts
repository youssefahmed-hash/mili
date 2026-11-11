import { Request, Response, NextFunction } from "express";
import { clinicService } from "./clinic.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class ClinicController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { fromDate, toDate } = req.query;
      const records = await clinicService.getAll({
        fromDate: fromDate as string,
        toDate: toDate as string
      });
      return successResponse(res, records, "تم جلب سجلات العيادة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getByPersonnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId } = req.params;
      const records = await clinicService.getByPersonnelId(personnelId);
      return successResponse(res, records, "تم جلب سجلات العيادة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getForPrint(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId, fromDate, toDate } = req.query;
      const records = await clinicService.getForPrint({
        personnelId: personnelId as string,
        fromDate: fromDate as string,
        toDate: toDate as string
      });
      return successResponse(res, records, "تم جلب سجلات الطباعة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await clinicService.create(req.body);
      const warnings = (record as { dispense?: { warnings?: string[] } })?.dispense?.warnings;
      return successResponse(
        res,
        record,
        warnings?.length ? "تم تسجيل الكشف والصرف مع تنبيهات" : "تم تسجيل الكشف الطبي بنجاح",
        201
      );
    } catch (err: any) {
      // نافذة تأكيد FEFO أثناء إنشاء الكشف: 409 مع تفاصيل التقسيم (والتنفيذ مرجوع بالكامل)
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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await clinicService.update(id, req.body);
      return successResponse(res, record, "تم تحديث سجل العيادة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await clinicService.delete(id);
      return successResponse(res, null, "تم حذف سجل العيادة بنجاح");
    } catch (err) {
      next(err);
    }
  }
}

export const clinicController = new ClinicController();
