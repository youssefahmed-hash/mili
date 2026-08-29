import app from "./app";
import { AppDataSource } from "./config/data-source";
import { authService } from "./modules/auth/auth.service";
import { vacationsService } from "./modules/vacations/vacations.service";

const PORT = process.env.PORT || 5000;

console.log("إعداد الاتصال بقاعدة البيانات...");

AppDataSource.initialize()
    .then(async () => {
        console.log("تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.");
        await authService.seedAdmin();
        try {
            await vacationsService.syncAllPersonnelStatuses();
            console.log("تم مزامنة حالات الأفراد مع الإجازات النشطة.");
        } catch (err) {
            console.error("تعذر مزامنة حالات الأفراد:", err);
        }
        app.listen(PORT, () => {
            console.log(`خادم إدارة الأفراد العسكرية يعمل بنجاح على: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("فشل الاتصال بقاعدة البيانات:", error);
        process.exit(1);
    });
