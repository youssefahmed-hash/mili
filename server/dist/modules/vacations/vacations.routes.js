"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vacations_controller_1 = require("./vacations.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/personnel/:personnelId", vacations_controller_1.vacationsController.getByPersonnel);
router.get("/", vacations_controller_1.vacationsController.getAll);
router.post("/", vacations_controller_1.vacationsController.create);
router.post("/bulk", vacations_controller_1.vacationsController.bulkCreate);
router.put("/:id", vacations_controller_1.vacationsController.update);
router.delete("/:id", vacations_controller_1.vacationsController.delete);
exports.default = router;
