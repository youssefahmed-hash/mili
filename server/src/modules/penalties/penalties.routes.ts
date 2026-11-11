import { Router } from "express";
import { penaltiesController } from "./penalties.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/", penaltiesController.getAll);
router.get("/personnel/:personnelId", penaltiesController.getByPersonnel);
router.post("/", penaltiesController.create);
router.put("/:id", penaltiesController.update);
router.delete("/:id", penaltiesController.delete);

export default router;
