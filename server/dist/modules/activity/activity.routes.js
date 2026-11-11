"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("./activity.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const userScope_1 = require("../../middlewares/userScope");
const router = (0, express_1.Router)();
// سجل التحديثات متاح لكل المستخدمين المسجلين (بدون استثناء).
router.use(auth_middleware_1.requireAuth);
router.get("/", userScope_1.requireAuthScope, activity_controller_1.activityController.getAll);
router.get("/count", userScope_1.requireAuthScope, activity_controller_1.activityController.count);
exports.default = router;
