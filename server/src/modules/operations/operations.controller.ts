import { Request, Response, NextFunction } from "express";
import { operationsService } from "./operations.service";
import { successResponse } from "../../utils/apiResponse";

export class OperationsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await operationsService.getAll();
      return successResponse(res, records, "تم جلب سجلات العمليات بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getByPersonnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId } = req.params;
      const records = await operationsService.getByPersonnelId(personnelId);
      return successResponse(res, records, "تم جلب سجلات العمليات بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await operationsService.create(req.body);
      return successResponse(res, record, "تم إصدار أمر التحرك بنجاح", 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await operationsService.update(id, req.body);
      return successResponse(res, record, "تم تحديث سجل العملية بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await operationsService.delete(id);
      return successResponse(res, null, "تم حذف سجل العملية بنجاح");
    } catch (err) {
      next(err);
    }
  }
}

export const operationsController = new OperationsController();
