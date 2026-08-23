import app from "./app";
import { AppDataSource } from "./config/data-source";

const PORT = process.env.PORT || 5000;

console.log("إعداد الاتصال بقاعدة البيانات...");

AppDataSource.initialize()
    .then(() => {
        console.log("تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.");
        app.listen(PORT, () => {
            console.log(`خادم إدارة الأفراد العسكرية يعمل بنجاح على: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("فشل الاتصال بقاعدة البيانات:", error);
        process.exit(1);
    });
