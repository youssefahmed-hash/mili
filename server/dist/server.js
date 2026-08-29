"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const data_source_1 = require("./config/data-source");
const auth_service_1 = require("./modules/auth/auth.service");
const vacations_service_1 = require("./modules/vacations/vacations.service");
const PORT = process.env.PORT || 5000;
console.log("إعداد الاتصال بقاعدة البيانات...");
data_source_1.AppDataSource.initialize()
    .then(async () => {
    console.log("تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.");
    await auth_service_1.authService.seedAdmin();
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
})
    .catch((error) => {
    console.error("فشل الاتصال بقاعدة البيانات:", error);
    process.exit(1);
});
