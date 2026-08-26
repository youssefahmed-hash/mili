import { Request, Response, NextFunction } from "express";
import { servicesService } from "./services.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class ServicesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await servicesService.getAll();
      return successResponse(res, records, "تم جلب سجلات الخدمات بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getByPersonnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId } = req.params;
      const records = await servicesService.getByPersonnelId(personnelId);
      return successResponse(res, records, "تم جلب سجل خدمات الفرد بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const record = await servicesService.create(data);
      return successResponse(res, record, "تم تسجيل الخدمة بنجاح", 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      const record = await servicesService.update(id, data);
      return successResponse(res, record, "تم تحديث سجل الخدمة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await servicesService.delete(id);
      return successResponse(res, null, "تم حذف سجل الخدمة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getLineup(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      const lineup = await servicesService.getServicesLineup(date);
      return successResponse(res, lineup, "تم جلب طابور الخدمات بنجاح");
    } catch (err) {
      next(err);
    }
  }
}

export const servicesController = new ServicesController();
