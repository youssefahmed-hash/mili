import { Router } from "express";
import { operationsController } from "./operations.controller";

const router = Router();

router.get("/", operationsController.getAll);
router.get("/personnel/:personnelId", operationsController.getByPersonnel);
router.post("/", operationsController.create);
router.put("/:id", operationsController.update);
router.delete("/:id", operationsController.delete);

export default router;
