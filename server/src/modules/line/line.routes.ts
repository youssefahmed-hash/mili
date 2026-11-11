import { Router } from "express";
import { requireAuth } from "../../modules/auth/auth.middleware";
import { requireLineWrite } from "../../middlewares/userScope";
import {
  shiftController,
  linePointController,
  lineAssignmentController,
  lineLeaveCycleController,
  lineReportController
} from "./line.controller";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

// ==================== Shifts (قراءة فقط) ====================
router.get("/shifts", shiftController.getAll);

// ==================== Points ====================
router.get("/points", linePointController.getAll);
router.post("/points", requireLineWrite, linePointController.create);
router.put("/points/:id", requireLineWrite, linePointController.update);
router.delete("/points/:id", requireLineWrite, linePointController.delete);

// ==================== Assignments ====================
router.get("/assignments", lineAssignmentController.getAll);
router.get("/assignments/report", lineAssignmentController.getDailyReport);
router.get("/assignments/current", lineAssignmentController.getCurrentAssignment);
router.get("/assignments/:id", lineAssignmentController.getById);
router.post("/assignments", requireLineWrite, lineAssignmentController.create);
router.post("/assignments/bulk", requireLineWrite, lineAssignmentController.bulkCreate);
router.post("/assignments/office-duty", requireLineWrite, lineAssignmentController.setOfficeDuty);
router.post("/assignments/transfer/point", requireLineWrite, lineAssignmentController.transferPoint);
router.post("/assignments/transfer/shift", requireLineWrite, lineAssignmentController.transferShift);
router.post("/assignments/transfer/both", requireLineWrite, lineAssignmentController.transferBoth);
router.put("/assignments/:id", requireLineWrite, lineAssignmentController.update);
router.delete("/assignments/:id", requireLineWrite, lineAssignmentController.delete);

// ==================== Leave Cycles ====================
router.get("/leave-cycles", lineLeaveCycleController.getAll);
router.get("/leave-cycles/current", lineLeaveCycleController.getCurrent);
router.get("/leave-cycles/current-leave-shift", lineLeaveCycleController.getCurrentLeaveShift);
router.post("/leave-cycles/initialize", requireLineWrite, lineLeaveCycleController.initialize);
router.post("/leave-cycles/generate-next", requireLineWrite, lineLeaveCycleController.generateNext);

// ==================== Reports ====================
router.get("/report/daily", lineReportController.getDailyReport);
router.get("/report/daily/pdf", lineReportController.getDailyReportPDF);

export default router;
