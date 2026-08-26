import { Router } from "express";
import { servicesController } from "./services.controller";

const router = Router();

router.get("/", servicesController.getAll);
router.get("/lineup", servicesController.getLineup);
router.get("/personnel/:personnelId", servicesController.getByPersonnel);
router.post("/", servicesController.create);
router.put("/:id", servicesController.update);
router.delete("/:id", servicesController.delete);

export default router;
