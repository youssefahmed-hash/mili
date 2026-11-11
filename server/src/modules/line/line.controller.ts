import { Request, Response, NextFunction } from "express";
import {
  shiftService,
  linePointService,
  lineAssignmentService,
  lineLeaveCycleService,
  lineReportService
} from "./line.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";

// ==================== Shift Controller (قراءة فقط) ====================
export class ShiftController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await shiftService.getAll();
      return successResponse(res, data, "تم جلب العمالات بنجاح");
    } catch (err) { next(err); }
  }
}

// ==================== LinePoint Controller ====================
export class LinePointController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await linePointService.getAll();
      return successResponse(res, data, "تم جلب النقاط بنجاح");
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await linePointService.create(req.body);
      return successResponse(res, data, "تم إنشاء النقطة بنجاح", 201);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await linePointService.update(req.params.id, req.body);
      return successResponse(res, data, "تم تحديث النقطة بنجاح");
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await linePointService.delete(req.params.id);
      return successResponse(res, null, "تم حذف النقطة بنجاح");
    } catch (err) { next(err); }
  }
}

// ==================== LineAssignment Controller ====================
export class LineAssignmentController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { pointId, shiftId, personnelId } = req.query;
      const data = await lineAssignmentService.getAll({
        pointId: pointId as string,
        shiftId: shiftId as string,
        personnelId: personnelId as string
      });
      return successResponse(res, data, "تم جلب التعيينات بنجاح");
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineAssignmentService.getById(req.params.id);
      return successResponse(res, data, "تم جلب التعيين بنجاح");
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineAssignmentService.create(req.body);
      return successResponse(res, data, "تم إنشاء التعيين بنجاح", 201);
    } catch (err) { next(err); }
  }

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineAssignmentService.bulkCreate(req.body);
      return successResponse(res, data, "تم إنشاء التعيينات بنجاح", 201);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineAssignmentService.update(req.params.id, req.body);
      return successResponse(res, data, "تم تحديث التعيين بنجاح");
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await lineAssignmentService.delete(req.params.id);
      return successResponse(res, null, "تم حذف التعيين بنجاح");
    } catch (err) { next(err); }
  }

  /** تعليم/فكّ «عسكري مكتب» + إجبار الحالة (إجازة/حاضر) */
  async setOfficeDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      const data = await lineAssignmentService.setOfficeDuty(items);
      return successResponse(res, data, "تم تحديث عساكر المكتب بنجاح");
    } catch (err) { next(err); }
  }

  async getCurrentAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId } = req.query;
      if (!personnelId) throw new Error("يجب تحديد معرف الفرد");
      const data = await lineAssignmentService.getCurrentAssignment(personnelId as string);
      return successResponse(res, data, "تم جلب التعيين الحالي بنجاح");
    } catch (err) { next(err); }
  }

  async transferPoint(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId, newPointId } = req.body;
      if (!personnelId || !newPointId) throw new Error("يجب تحديد الفرد والنقطة الجديدة");
      const data = await lineAssignmentService.transferPoint(personnelId, newPointId);
      return successResponse(res, data, "تم نقل النقطة بنجاح");
    } catch (err) { next(err); }
  }

  async transferShift(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId, newShiftId } = req.body;
      if (!personnelId || !newShiftId) throw new Error("يجب تحديد الفرد والعمالة الجديدة");
      const data = await lineAssignmentService.transferShift(personnelId, newShiftId);
      return successResponse(res, data, "تم نقل العمالة بنجاح");
    } catch (err) { next(err); }
  }

  async transferBoth(req: Request, res: Response, next: NextFunction) {
    try {
      const { personnelId, newPointId, newShiftId } = req.body;
      if (!personnelId || !newPointId || !newShiftId) throw new Error("يجب تحديد الفرد والنقطة والعمالة الجديدة");
      const data = await lineAssignmentService.transferBoth(personnelId, newPointId, newShiftId);
      return successResponse(res, data, "تم نقل النقطة والعمالة بنجاح");
    } catch (err) { next(err); }
  }

  async getDailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineReportService.getDailyReport();
      return successResponse(res, data, "تم جلب التقرير بنجاح");
    } catch (err) { next(err); }
  }
}

// ==================== LineLeaveCycle Controller ====================
export class LineLeaveCycleController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineLeaveCycleService.getAll();
      return successResponse(res, data, "تم جلب دورات الإجازات بنجاح");
    } catch (err) { next(err); }
  }

  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineLeaveCycleService.getCurrent();
      return successResponse(res, data, "تم جلب الدورة الحالية بنجاح");
    } catch (err) { next(err); }
  }

  async initialize(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, shiftId, personnelIds, vacationType, cycle, expectedReturnDate, notes } = req.body;
      if (!startDate) throw new Error("يجب تحديد تاريخ البداية");
      if (personnelIds !== undefined && !Array.isArray(personnelIds)) {
        return errorResponse(res, "personnelIds يجب أن تكون مصفوفة", 400);
      }
      const data = await lineLeaveCycleService.initializeCycle(startDate, shiftId, personnelIds, {
        vacationType,
        cycle,
        expectedReturnDate,
        notes: notes ?? null
      });
      return successResponse(res, data, "تم تهيئة الدورة بنجاح", 201);
    } catch (err) { next(err); }
  }

  async generateNext(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineLeaveCycleService.generateNextCycle();
      return successResponse(res, data, "تم إنشاء الدورة التالية بنجاح", 201);
    } catch (err) { next(err); }
  }

  async getCurrentLeaveShift(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      if (!date) throw new Error("يجب تحديد التاريخ");
      const data = await lineLeaveCycleService.getCurrentLeaveShift(date as string);
      return successResponse(res, data, "تم جلب العمالة في الإجازة بنجاح");
    } catch (err) { next(err); }
  }
}

// ==================== LineReport Controller ====================
export class LineReportController {
  async getDailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lineReportService.getDailyReport();
      return successResponse(res, data, "تم جلب التقرير اليومي بنجاح");
    } catch (err) { next(err); }
  }

  async getDailyReportPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const html = await lineReportService.generateDailyReportPDF();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } catch (err) { next(err); }
  }
}

// Singleton instances
export const shiftController = new ShiftController();
export const linePointController = new LinePointController();
export const lineAssignmentController = new LineAssignmentController();
export const lineLeaveCycleController = new LineLeaveCycleController();
export const lineReportController = new LineReportController();
