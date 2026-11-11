"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const data_source_1 = require("./config/data-source");
const auth_service_1 = require("./modules/auth/auth.service");
const vacations_service_1 = require("./modules/vacations/vacations.service");
const line_service_1 = require("./modules/line/line.service");
const personnel_service_1 = require("./modules/personnel/personnel.service");
const PORT = process.env.PORT || 5000;
console.log("إعداد الاتصال بقاعدة البيانات...");
data_source_1.AppDataSource.initialize()
    .then(async () => {
    console.log("تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.");
    await auth_service_1.authService.seedAdmin();
    await auth_service_1.authService.normalizeDepartmentNames();
    await line_service_1.shiftService.seed();
    console.log("تم تهيئة العمالات الثلاث بنجاح.");
    try {
        const moved = await personnel_service_1.personnelService.normalizeAffectedUnits();
        if (moved > 0) {
            console.log(`[personnel] تم نقل ${moved} فرد عليهم مؤثر على القوة إلى قسم «شئون مجندين».`);
        }
    }
    catch (err) {
        console.error("تعذر توحيد قسم الأفراد اللي عليهم مؤثرات:", err);
    }
    try {
        const rolled = await vacations_service_1.vacationsService.rollOverdueCycles();
        if (rolled > 0) {
            console.log(`[vacations] تم ترحيل ${rolled} سجل إجازة إلى دورته الجديدة.`);
        }
    }
    catch (err) {
        console.error("تعذر ترحيل دورات الإجازات:", err);
    }
    try {
        await vacations_service_1.vacationsService.syncAllPersonnelStatuses();
        console.log("تم مزامنة حالات الأفراد مع الإجازات النشطة.");
    }
    catch (err) {
        console.error("تعذر مزامنة حالات الأفراد:", err);
    }
    app_1.default.listen(PORT, () => {
        console.log(`خادم إدارة الأفراد العسكرية يعمل بنجاح على: http://localhost:${PORT}`);
    });
    // فحص دوري (كل 30 دقيقة): ترحيل الدورات المنتهية + تحديث حالات الأفراد
    // عشان الريسيت يحصل تلقائيًا حتى لو السيرفر شغال بدون إعادة تشغيل.
    const cycleCheckTimer = setInterval(async () => {
        try {
            const rolled = await vacations_service_1.vacationsService.rollOverdueCycles();
            if (rolled > 0) {
                console.log(`[vacations] ترحيل دوري: ${rolled} سجل إجازة.`);
            }
            await vacations_service_1.vacationsService.syncAllPersonnelStatuses();
        }
        catch (err) {
            console.error("تعذر الفحص الدوري للإجازات:", err);
        }
    }, 30 * 60 * 1000);
    cycleCheckTimer.unref();
})
    .catch((error) => {
    console.error("فشل الاتصال بقاعدة البيانات:", error);
    process.exit(1);
});
