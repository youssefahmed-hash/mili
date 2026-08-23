import { Router } from "express";
import { personnelController } from "./personnel.controller";
import { upload } from "../../middlewares/upload";

const router = Router();

router.get("/", personnelController.getAll);
router.get("/:id", personnelController.getOne);
router.post("/", upload.single("photo"), personnelController.create);
router.put("/:id", upload.single("photo"), personnelController.update);
router.delete("/:id", personnelController.delete);

export default router;
