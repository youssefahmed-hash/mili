"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const security_controller_1 = require("./security.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/", security_controller_1.securityController.getAll);
router.get("/personnel/:personnelId", security_controller_1.securityController.getByPersonnel);
router.post("/", security_controller_1.securityController.create);
router.put("/:id", security_controller_1.securityController.update);
router.delete("/:id", security_controller_1.securityController.delete);
exports.default = router;
