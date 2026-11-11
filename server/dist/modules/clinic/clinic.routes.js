"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clinic_controller_1 = require("./clinic.controller");
const pharmacy_controller_1 = require("./pharmacy.controller");
const auth_middleware_1 = require("../../modules/auth/auth.middleware");
const userScope_1 = require("../../middlewares/userScope");
const router = (0, express_1.Router)();
// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(auth_middleware_1.requireAuth);
// ===== الصيدلية =====
// العرض متاح لكل داخل العيادة (منهم الجندي — مفيد يلاقي الدواء).
// التعديل والصرف: requireClinicWrite (ضابط/مدير فقط).
router.get("/pharmacy/drugs", pharmacy_controller_1.pharmacyController.getDrugs);
router.get("/pharmacy/drugs/:drugId/batches", pharmacy_controller_1.pharmacyController.getFEFO);
router.get("/pharmacy/drugs/:id", pharmacy_controller_1.pharmacyController.getDrug);
router.post("/pharmacy/drugs", userScope_1.requireClinicWrite, pharmacy_controller_1.pharmacyController.createDrug);
router.put("/pharmacy/drugs/:id", userScope_1.requireClinicWrite, pharmacy_controller_1.pharmacyController.updateDrug);
router.delete("/pharmacy/drugs/:id", userScope_1.requireClinicWrite, pharmacy_controller_1.pharmacyController.deleteDrug);
router.get("/pharmacy/batches", pharmacy_controller_1.pharmacyController.getBatches);
router.post("/pharmacy/batches", userScope_1.requireClinicWrite, pharmacy_controller_1.pharmacyController.createBatch);
router.delete("/pharmacy/batches/:id", userScope_1.requireClinicWrite, pharmacy_controller_1.pharmacyController.deleteBatch);
router.get("/pharmacy/expiring", pharmacy_controller_1.pharmacyController.getExpiring);
router.get("/pharmacy/deadstock", pharmacy_controller_1.pharmacyController.getDeadStock);
router.get("/pharmacy/dispenses", pharmacy_controller_1.pharmacyController.getDispenses);
router.post("/pharmacy/dispense", userScope_1.requireClinicWrite, pharmacy_controller_1.pharmacyController.dispense);
// ===== سجلات العيادة (كما هي) =====
// ملاحظة: /pharmacy/* مُعرّفة فوق /:id عشان ما تُلتقطش كسجل عيادة.
router.get("/", clinic_controller_1.clinicController.getAll);
router.get("/personnel/:personnelId", clinic_controller_1.clinicController.getByPersonnel);
router.get("/print", clinic_controller_1.clinicController.getForPrint);
// تسجيل كشف — الجندي يقدر يسجّل كشف، بس لو فيه صرف دوا لازم صلاحية الصرف
router.post("/", userScope_1.requireClinicDispense, clinic_controller_1.clinicController.create);
router.put("/:id", clinic_controller_1.clinicController.update);
router.delete("/:id", clinic_controller_1.clinicController.delete);
exports.default = router;
