"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const penalties_controller_1 = require("./penalties.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/", penalties_controller_1.penaltiesController.getAll);
router.get("/personnel/:personnelId", penalties_controller_1.penaltiesController.getByPersonnel);
router.post("/", penalties_controller_1.penaltiesController.create);
router.put("/:id", penalties_controller_1.penaltiesController.update);
router.delete("/:id", penalties_controller_1.penaltiesController.delete);
exports.default = router;
