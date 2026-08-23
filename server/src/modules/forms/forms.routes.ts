import { Router } from "express";
import { formsController } from "./forms.controller";
import { upload } from "../../middlewares/upload";

const router = Router();

router.get("/personnel/:personnelId", formsController.getByPersonnel);
router.post("/", upload.single("file"), formsController.create);
router.put("/:id", upload.single("file"), formsController.update);
router.delete("/:id", formsController.delete);

export default router;
