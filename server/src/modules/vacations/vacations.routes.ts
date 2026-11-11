import { Router } from "express";
import { vacationsController } from "./vacations.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/personnel/:personnelId", vacationsController.getByPersonnel);
router.get("/", vacationsController.getAll);
router.post("/", vacationsController.create);
router.post("/bulk", vacationsController.bulkCreate);
router.put("/:id", vacationsController.update);
router.delete("/:id", vacationsController.delete);

export default router;
