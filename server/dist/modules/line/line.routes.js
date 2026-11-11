"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const userScope_1 = require("../../middlewares/userScope");
const line_controller_1 = require("./line.controller");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
// ==================== Shifts (قراءة فقط) ====================
router.get("/shifts", line_controller_1.shiftController.getAll);
// ==================== Points ====================
router.get("/points", line_controller_1.linePointController.getAll);
router.post("/points", userScope_1.requireLineWrite, line_controller_1.linePointController.create);
router.put("/points/:id", userScope_1.requireLineWrite, line_controller_1.linePointController.update);
router.delete("/points/:id", userScope_1.requireLineWrite, line_controller_1.linePointController.delete);
// ==================== Assignments ====================
router.get("/assignments", line_controller_1.lineAssignmentController.getAll);
router.get("/assignments/report", line_controller_1.lineAssignmentController.getDailyReport);
router.get("/assignments/current", line_controller_1.lineAssignmentController.getCurrentAssignment);
router.get("/assignments/:id", line_controller_1.lineAssignmentController.getById);
router.post("/assignments", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.create);
router.post("/assignments/bulk", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.bulkCreate);
router.post("/assignments/office-duty", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.setOfficeDuty);
router.post("/assignments/transfer/point", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.transferPoint);
router.post("/assignments/transfer/shift", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.transferShift);
router.post("/assignments/transfer/both", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.transferBoth);
router.put("/assignments/:id", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.update);
router.delete("/assignments/:id", userScope_1.requireLineWrite, line_controller_1.lineAssignmentController.delete);
// ==================== Leave Cycles ====================
router.get("/leave-cycles", line_controller_1.lineLeaveCycleController.getAll);
router.get("/leave-cycles/current", line_controller_1.lineLeaveCycleController.getCurrent);
router.get("/leave-cycles/current-leave-shift", line_controller_1.lineLeaveCycleController.getCurrentLeaveShift);
router.post("/leave-cycles/initialize", userScope_1.requireLineWrite, line_controller_1.lineLeaveCycleController.initialize);
router.post("/leave-cycles/generate-next", userScope_1.requireLineWrite, line_controller_1.lineLeaveCycleController.generateNext);
// ==================== Reports ====================
router.get("/report/daily", line_controller_1.lineReportController.getDailyReport);
router.get("/report/daily/pdf", line_controller_1.lineReportController.getDailyReportPDF);
exports.default = router;
