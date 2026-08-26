import { Request, Response, NextFunction } from "express";
import { rewardsService } from "./rewards.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

export class RewardsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await rewardsService.getAll();
      return successResponse(res, records, "تم جلب سجلات المكافآت بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async getByPersonnel(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId } = req.params;
      const records = await rewardsService.getByPersonnelId(personnelId);
      return successResponse(res, records, "تم جلب سجل مكافآت الفرد بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const record = await rewardsService.create(data);
      return successResponse(res, record, "تم تسجيل المكافأة بنجاح", 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      const record = await rewardsService.update(id, data);
      return successResponse(res, record, "تم تحديث سجل المكافأة بنجاح");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await rewardsService.delete(id);
      return successResponse(res, null, "تم حذف سجل المكافأة بنجاح");
    } catch (err) {
      next(err);
    }
  }
}

export const rewardsController = new RewardsController();
