import { Router } from "express";
import { clinicController } from "./clinic.controller";

const router = Router();

router.get("/", clinicController.getAll);
router.get("/personnel/:personnelId", clinicController.getByPersonnel);
router.post("/", clinicController.create);
router.put("/:id", clinicController.update);
router.delete("/:id", clinicController.delete);

export default router;
