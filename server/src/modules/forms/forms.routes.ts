import { Router } from "express";
import { formsController } from "./forms.controller";
import { upload } from "../../middlewares/upload";
import { requireAuth } from "../../modules/auth/auth.middleware";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

router.get("/personnel/:personnelId", formsController.getByPersonnel);
router.post("/", upload.single("file"), formsController.create);
router.put("/:id", upload.single("file"), formsController.update);
router.delete("/:id", formsController.delete);

export default router;
