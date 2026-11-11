"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const operations_controller_1 = require("./operations.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/", operations_controller_1.operationsController.getAll);
router.get("/personnel/:personnelId", operations_controller_1.operationsController.getByPersonnel);
router.post("/", operations_controller_1.operationsController.create);
router.put("/:id", operations_controller_1.operationsController.update);
router.delete("/:id", operations_controller_1.operationsController.delete);
exports.default = router;
