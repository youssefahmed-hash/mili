import { Router } from "express";
import { activityController } from "./activity.controller";
import { requireAuth } from "../auth/auth.middleware";
import { requireAuthScope } from "../../middlewares/userScope";

const router = Router();

// سجل التحديثات متاح لكل المستخدمين المسجلين (بدون استثناء).
router.use(requireAuth);
router.get("/", requireAuthScope, activityController.getAll);
router.get("/count", requireAuthScope, activityController.count);

export default router;
