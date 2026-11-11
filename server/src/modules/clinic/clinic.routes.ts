import { Router } from "express";
import { clinicController } from "./clinic.controller";
import { pharmacyController } from "./pharmacy.controller";
import { requireAuth } from "../../modules/auth/auth.middleware";
import { requireClinicWrite, requireClinicDispense } from "../../middlewares/userScope";

const router = Router();

// كل مسارات هذا الموديول تتطلب تسجيل دخول (token) — حماية شاملة من router واحد.
router.use(requireAuth);

// ===== الصيدلية =====
// العرض متاح لكل داخل العيادة (منهم الجندي — مفيد يلاقي الدواء).
// التعديل والصرف: requireClinicWrite (ضابط/مدير فقط).
router.get("/pharmacy/drugs", pharmacyController.getDrugs);
router.get("/pharmacy/drugs/:drugId/batches", pharmacyController.getFEFO);
router.get("/pharmacy/drugs/:id", pharmacyController.getDrug);
router.post("/pharmacy/drugs", requireClinicWrite, pharmacyController.createDrug);
router.put("/pharmacy/drugs/:id", requireClinicWrite, pharmacyController.updateDrug);
router.delete("/pharmacy/drugs/:id", requireClinicWrite, pharmacyController.deleteDrug);

router.get("/pharmacy/batches", pharmacyController.getBatches);
router.post("/pharmacy/batches", requireClinicWrite, pharmacyController.createBatch);
router.delete("/pharmacy/batches/:id", requireClinicWrite, pharmacyController.deleteBatch);

router.get("/pharmacy/expiring", pharmacyController.getExpiring);
router.get("/pharmacy/deadstock", pharmacyController.getDeadStock);
router.get("/pharmacy/dispenses", pharmacyController.getDispenses);
router.post("/pharmacy/dispense", requireClinicWrite, pharmacyController.dispense);

// ===== سجلات العيادة (كما هي) =====
// ملاحظة: /pharmacy/* مُعرّفة فوق /:id عشان ما تُلتقطش كسجل عيادة.
router.get("/", clinicController.getAll);
router.get("/personnel/:personnelId", clinicController.getByPersonnel);
router.get("/print", clinicController.getForPrint);
// تسجيل كشف — الجندي يقدر يسجّل كشف، بس لو فيه صرف دوا لازم صلاحية الصرف
router.post("/", requireClinicDispense, clinicController.create);
router.put("/:id", clinicController.update);
router.delete("/:id", clinicController.delete);

export default router;
