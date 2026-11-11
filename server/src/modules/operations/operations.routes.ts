import { Router } from "express";
import { operationsController } from "./operations.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/", operationsController.getAll);
router.get("/personnel/:personnelId", operationsController.getByPersonnel);
router.post("/", operationsController.create);
router.put("/:id", operationsController.update);
router.delete("/:id", operationsController.delete);

export default router;
