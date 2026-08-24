import { Request, Response, NextFunction } from "express";
import { clinicService } from "./clinic.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class ClinicController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await clinicService.getAll();
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

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await clinicService.create(req.body);
      return successResponse(res, record, "تم تسجيل الكشف الطبي بنجاح", 201);
    } catch (err) {
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
