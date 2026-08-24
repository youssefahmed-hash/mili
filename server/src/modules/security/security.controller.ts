import { Request, Response, NextFunction } from "express";
import { securityService } from "./security.service";
import { successResponse } from "../../utils/apiResponse";

export class SecurityController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await securityService.getAll();
      return successResponse(res, records, "تم جلب البلاغات الأمنية بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getByPersonnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId } = req.params;
      const records = await securityService.getByPersonnelId(personnelId);
      return successResponse(res, records, "تم جلب البلاغات الأمنية بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await securityService.create(req.body);
      return successResponse(res, record, "تم تسجيل البلاغ الأمني بنجاح", 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await securityService.update(id, req.body);
      return successResponse(res, record, "تم تحديث البلاغ الأمني بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await securityService.delete(id);
      return successResponse(res, null, "تم حذف البلاغ الأمني بنجاح");
    } catch (err) {
      next(err);
    }
  }
}

export const securityController = new SecurityController();
