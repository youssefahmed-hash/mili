import { Router } from "express";
import { rewardsController } from "./rewards.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/", rewardsController.getAll);
router.get("/personnel/:personnelId", rewardsController.getByPersonnel);
router.post("/", rewardsController.create);
router.put("/:id", rewardsController.update);
router.delete("/:id", rewardsController.delete);

export default router;
