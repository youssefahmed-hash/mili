"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const personnel_controller_1 = require("./personnel.controller");
const upload_1 = require("../../middlewares/upload");
const userScope_1 = require("../../middlewares/userScope");
const router = (0, express_1.Router)();
router.get("/", userScope_1.requireAuthScope, personnel_controller_1.personnelController.getAll);
router.get("/strength", userScope_1.requireAuthScope, personnel_controller_1.personnelController.getStrength);
router.get("/stats", userScope_1.requireAuthScope, personnel_controller_1.personnelController.getStats);
router.get("/vacation-lineup", userScope_1.requireAuthScope, personnel_controller_1.personnelController.getVacationLineup);
router.get("/:id", userScope_1.requireAuthScope, personnel_controller_1.personnelController.getOne);
router.post("/", userScope_1.requireAuthScope, upload_1.upload.fields([
    { name: "photo" },
    { name: "cardImage" },
    { name: "carnetImage" },
    { name: "formImage" }
]), personnel_controller_1.personnelController.create);
router.put("/:id", userScope_1.requireAuthScope, upload_1.upload.fields([
    { name: "photo" },
    { name: "carnetImage" },
    { name: "cardImage" },
    { name: "formImage" }
]), personnel_controller_1.personnelController.update);
router.delete("/:id", userScope_1.requireAuthScope, personnel_controller_1.personnelController.delete);
exports.default = router;
