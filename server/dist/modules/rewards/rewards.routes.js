"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rewards_controller_1 = require("./rewards.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/", rewards_controller_1.rewardsController.getAll);
router.get("/personnel/:personnelId", rewards_controller_1.rewardsController.getByPersonnel);
router.post("/", rewards_controller_1.rewardsController.create);
router.put("/:id", rewards_controller_1.rewardsController.update);
router.delete("/:id", rewards_controller_1.rewardsController.delete);
exports.default = router;
