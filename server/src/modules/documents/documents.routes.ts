import { Router } from "express";
import { documentsController } from "./documents.controller";
import { upload } from "../../middlewares/upload";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/personnel/:personnelId", documentsController.getByPersonnel);
router.post("/upload", upload.single("file"), documentsController.uploadDoc);
router.delete("/:id", documentsController.deleteDoc);

export default router;
