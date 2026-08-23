"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const errorHandler = (err, req, res, next) => {
    console.error("Express Error Handler Captured Exception:", err);
    // Multer upload errors
    if (err.code === "LIMIT_FILE_SIZE") {
        return (0, apiResponse_1.errorResponse)(res, "حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.", 400);
    }
    // TypeORM unique constraint errors (e.g. militaryId or nationalId duplicate)
    if (err.code === "23505") {
        return (0, apiResponse_1.errorResponse)(res, "الرقم العسكري أو الرقم القومي مسجل بالفعل في النظام لجندي آخر.", 400, err.detail);
    }
    const message = err.message || "حدث خطأ داخلي في الخادم";
    const status = err.status || 500;
    return (0, apiResponse_1.errorResponse)(res, message, status, process.env.NODE_ENV === "development" ? err.stack : undefined);
};
exports.errorHandler = errorHandler;
