import { Router } from "express";
import { securityController } from "./security.controller";

const router = Router();

router.get("/", securityController.getAll);
router.get("/personnel/:personnelId", securityController.getByPersonnel);
router.post("/", securityController.create);
router.put("/:id", securityController.update);
router.delete("/:id", securityController.delete);

export default router;
