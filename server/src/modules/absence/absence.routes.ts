import { Router } from "express";
import { absenceController } from "./absence.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/open", absenceController.getOpen);
router.get("/personnel/:personnelId", absenceController.getByPersonnel);
router.post("/", absenceController.create);
router.post("/:id/return", absenceController.recordReturn);
router.put("/:id", absenceController.update);
router.delete("/:id", absenceController.delete);

export default router;