"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emergency_controller_1 = require("./emergency.controller");
const userScope_1 = require("../../middlewares/userScope");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
// القائمة: أي مستخدم مصادق (تُفلتر بالـscope داخل الـservice)
router.get("/", userScope_1.requireAuthScope, emergency_controller_1.emergencyController.list);
// الإنشاء والحذف: أدمن أو عمليات (الاعتماد للأدمن فقط أدناه)
router.post("/", userScope_1.requireAdminOrOperations, emergency_controller_1.emergencyController.create);
router.delete("/:id", userScope_1.requireAdminOrOperations, emergency_controller_1.emergencyController.remove);
// الاعتماد/الرفض: أدمن فقط
router.post("/:id/approve", userScope_1.requireAuthScope, auth_middleware_1.requireAdmin, emergency_controller_1.emergencyController.approve);
router.post("/:id/reject", userScope_1.requireAuthScope, auth_middleware_1.requireAdmin, emergency_controller_1.emergencyController.reject);
exports.default = router;
