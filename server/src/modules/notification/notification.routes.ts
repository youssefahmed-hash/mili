import { Router } from "express";
import { notificationController } from "./notification.controller";
import { requireAuthScope, requireAdminScope } from "../../middlewares/userScope";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول.
router.use(requireAuth);

router.get("/current", requireAuthScope, notificationController.getCurrent);
// إعدادات التناوب: قراءة لكل مسجّل، تعديل للأدمن فقط.
router.get("/settings", requireAuthScope, notificationController.getSettings);
router.put("/settings", requireAdminScope, requireAuthScope, notificationController.updateSettings);

export default router;
