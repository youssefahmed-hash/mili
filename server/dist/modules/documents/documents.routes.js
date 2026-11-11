"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documents_controller_1 = require("./documents.controller");
const upload_1 = require("../../middlewares/upload");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
router.get("/personnel/:personnelId", documents_controller_1.documentsController.getByPersonnel);
router.post("/upload", upload_1.upload.single("file"), documents_controller_1.documentsController.uploadDoc);
router.delete("/:id", documents_controller_1.documentsController.deleteDoc);
exports.default = router;
