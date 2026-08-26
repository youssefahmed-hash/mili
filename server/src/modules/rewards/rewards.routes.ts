import { Router } from "express";
import { rewardsController } from "./rewards.controller";

const router = Router();

router.get("/", rewardsController.getAll);
router.get("/personnel/:personnelId", rewardsController.getByPersonnel);
router.post("/", rewardsController.create);
router.put("/:id", rewardsController.update);
router.delete("/:id", rewardsController.delete);

export default router;
