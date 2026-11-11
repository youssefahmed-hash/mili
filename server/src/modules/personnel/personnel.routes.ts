import { Router } from "express";
import { personnelController } from "./personnel.controller";
import { upload } from "../../middlewares/upload";
import { requireAuthScope } from "../../middlewares/userScope";

const router = Router();

router.get("/", requireAuthScope, personnelController.getAll);
router.get("/strength", requireAuthScope, personnelController.getStrength);
router.get("/stats", requireAuthScope, personnelController.getStats);
router.get("/vacation-lineup", requireAuthScope, personnelController.getVacationLineup);
router.get("/:id", requireAuthScope, personnelController.getOne);
router.post(
    "/",
    requireAuthScope,
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
    requireAuthScope,
    upload.fields([
        { name: "photo" },
        { name: "carnetImage" },
        { name: "cardImage" },
        { name: "formImage" }
    ]),
    personnelController.update
);
router.delete("/:id", requireAuthScope, personnelController.delete);

export default router;
