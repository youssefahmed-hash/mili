"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forms_controller_1 = require("./forms.controller");
const upload_1 = require("../../middlewares/upload");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/personnel/:personnelId", forms_controller_1.formsController.getByPersonnel);
router.post("/", upload_1.upload.single("file"), forms_controller_1.formsController.create);
router.put("/:id", upload_1.upload.single("file"), forms_controller_1.formsController.update);
router.delete("/:id", forms_controller_1.formsController.delete);
exports.default = router;
