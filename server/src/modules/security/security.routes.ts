import { Router } from "express";
import { securityController } from "./security.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/", securityController.getAll);
router.get("/personnel/:personnelId", securityController.getByPersonnel);
router.post("/", securityController.create);
router.put("/:id", securityController.update);
router.delete("/:id", securityController.delete);

export default router;
