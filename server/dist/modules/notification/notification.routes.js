"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const userScope_1 = require("../../middlewares/userScope");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول.
router.use(auth_middleware_1.requireAuth);
router.get("/current", userScope_1.requireAuthScope, notification_controller_1.notificationController.getCurrent);
// إعدادات التناوب: قراءة لكل مسجّل، تعديل للأدمن فقط.
router.get("/settings", userScope_1.requireAuthScope, notification_controller_1.notificationController.getSettings);
router.put("/settings", userScope_1.requireAdminScope, userScope_1.requireAuthScope, notification_controller_1.notificationController.updateSettings);
exports.default = router;
