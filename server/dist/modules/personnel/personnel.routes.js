"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const personnel_controller_1 = require("./personnel.controller");
const upload_1 = require("../../middlewares/upload");
const router = (0, express_1.Router)();
router.get("/", personnel_controller_1.personnelController.getAll);
router.get("/vacation-lineup", personnel_controller_1.personnelController.getVacationLineup);
router.get("/:id", personnel_controller_1.personnelController.getOne);
router.post("/", upload_1.upload.fields([
    { name: "photo" },
    { name: "cardImage" },
    { name: "carnetImage" },
    { name: "formImage" }
]), personnel_controller_1.personnelController.create);
router.put("/:id", upload_1.upload.fields([
    { name: "photo" },
    { name: "carnetImage" },
    { name: "cardImage" },
    { name: "formImage" }
]), personnel_controller_1.personnelController.update);
router.delete("/:id", personnel_controller_1.personnelController.delete);
exports.default = router;
