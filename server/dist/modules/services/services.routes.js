"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_controller_1 = require("./services.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/", services_controller_1.servicesController.getAll);
router.get("/lineup", services_controller_1.servicesController.getLineup);
router.get("/personnel/:personnelId", services_controller_1.servicesController.getByPersonnel);
router.post("/", services_controller_1.servicesController.create);
router.put("/:id", services_controller_1.servicesController.update);
router.delete("/:id", services_controller_1.servicesController.delete);
exports.default = router;
