"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const data_source_1 = require("./config/data-source");
const PORT = process.env.PORT || 5000;
console.log("إعداد الاتصال بقاعدة البيانات...");
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.");
    app_1.default.listen(PORT, () => {
        console.log(`خادم إدارة الأفراد العسكرية يعمل بنجاح على: http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("فشل الاتصال بقاعدة البيانات:", error);
    process.exit(1);
});
