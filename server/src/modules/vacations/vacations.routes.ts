import { Router } from "express";
import { vacationsController } from "./vacations.controller";

const router = Router();

router.get("/personnel/:personnelId", vacationsController.getByPersonnel);
router.get("/", vacationsController.getAll);
router.post("/", vacationsController.create);
router.post("/bulk", vacationsController.bulkCreate);
router.put("/:id", vacationsController.update);
router.delete("/:id", vacationsController.delete);

export default router;
