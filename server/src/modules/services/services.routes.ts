import { Router } from "express";
import { servicesController } from "./services.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/", servicesController.getAll);
router.get("/lineup", servicesController.getLineup);
router.get("/personnel/:personnelId", servicesController.getByPersonnel);
router.post("/", servicesController.create);
router.put("/:id", servicesController.update);
router.delete("/:id", servicesController.delete);

export default router;
