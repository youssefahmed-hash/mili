"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const absence_controller_1 = require("./absence.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/open", absence_controller_1.absenceController.getOpen);
router.get("/personnel/:personnelId", absence_controller_1.absenceController.getByPersonnel);
router.post("/", absence_controller_1.absenceController.create);
router.post("/:id/return", absence_controller_1.absenceController.recordReturn);
router.put("/:id", absence_controller_1.absenceController.update);
router.delete("/:id", absence_controller_1.absenceController.delete);
exports.default = router;
