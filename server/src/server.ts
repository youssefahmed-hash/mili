import app from "./app";
import { AppDataSource } from "./config/data-source";
import { authService } from "./modules/auth/auth.service";
import { vacationsService } from "./modules/vacations/vacations.service";
import { shiftService } from "./modules/line/line.service";
import { personnelService } from "./modules/personnel/personnel.service";

const PORT = process.env.PORT || 5000;

console.log("إعداد الاتصال بقاعدة البيانات...");

AppDataSource.initialize()
    .then(async () => {
        console.log("تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.");
        await authService.seedAdmin();
        await authService.normalizeDepartmentNames();
        await shiftService.seed();
        console.log("تم تهيئة العمالات الثلاث بنجاح.");
        try {
            const moved = await personnelService.normalizeAffectedUnits();
            if (moved > 0) {
                console.log(
                    `[personnel] تم نقل ${moved} فرد عليهم مؤثر على القوة إلى قسم «شئون مجندين».`
                );
            }
        } catch (err) {
            console.error("تعذر توحيد قسم الأفراد اللي عليهم مؤثرات:", err);
        }
        try {
            const rolled = await vacationsService.rollOverdueCycles();
            if (rolled > 0) {
                console.log(`[vacations] تم ترحيل ${rolled} سجل إجازة إلى دورته الجديدة.`);
            }
        } catch (err) {
            console.error("تعذر ترحيل دورات الإجازات:", err);
        }
        try {
            await vacationsService.syncAllPersonnelStatuses();
            console.log("تم مزامنة حالات الأفراد مع الإجازات النشطة.");
        } catch (err) {
            console.error("تعذر مزامنة حالات الأفراد:", err);
        }
        app.listen(PORT, () => {
            console.log(`خادم إدارة الأفراد العسكرية يعمل بنجاح على: http://localhost:${PORT}`);
        });

        // فحص دوري (كل 30 دقيقة): ترحيل الدورات المنتهية + تحديث حالات الأفراد
        // عشان الريسيت يحصل تلقائيًا حتى لو السيرفر شغال بدون إعادة تشغيل.
        const cycleCheckTimer = setInterval(async () => {
            try {
                const rolled = await vacationsService.rollOverdueCycles();
                if (rolled > 0) {
                    console.log(`[vacations] ترحيل دوري: ${rolled} سجل إجازة.`);
                }
                await vacationsService.syncAllPersonnelStatuses();
            } catch (err) {
                console.error("تعذر الفحص الدوري للإجازات:", err);
            }
        }, 30 * 60 * 1000);
        cycleCheckTimer.unref();
    })
    .catch((error) => {
        console.error("فشل الاتصال بقاعدة البيانات:", error);
        process.exit(1);
    });
