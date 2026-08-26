import { Request, Response, NextFunction } from "express";
import { penaltiesService } from "./penalties.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class PenaltiesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await penaltiesService.getAll();
      return successResponse(res, records, "تم جلب سجلات العقوبات بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getByPersonnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId } = req.params;
      const records = await penaltiesService.getByPersonnelId(personnelId);
      return successResponse(res, records, "تم جلب سجل عقوبات الفرد بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const record = await penaltiesService.create(data);
      return successResponse(res, record, "تم تسجيل العقوبة بنجاح", 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      const record = await penaltiesService.update(id, data);
      return successResponse(res, record, "تم تحديث سجل العقوبة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await penaltiesService.delete(id);
      return successResponse(res, null, "تم حذف سجل العقوبة بنجاح");
    } catch (err) {
      next(err);
    }
  }
}

export const penaltiesController = new PenaltiesController();
