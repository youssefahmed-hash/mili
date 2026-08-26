import { Router } from "express";
import { personnelController } from "./personnel.controller";
import { upload } from "../../middlewares/upload";

const router = Router();

router.get("/", personnelController.getAll);
router.get("/vacation-lineup", personnelController.getVacationLineup);
router.get("/:id", personnelController.getOne);
router.post(
  "/",
  upload.fields([
    { name: "photo" },
    { name: "cardImage" },
    { name: "carnetImage" },
    { name: "formImage" }
  ]),
  personnelController.create
);
router.put(
  "/:id",
  upload.fields([
    { name: "photo" },
    { name: "carnetImage" },
    { name: "cardImage" },
    { name: "formImage" }
  ]),
  personnelController.update
);
router.delete("/:id", personnelController.delete);

export default router;
