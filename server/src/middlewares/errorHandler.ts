import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/apiResponse";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("Express Error Handler Captured Exception:", err);

    // Multer upload errors
    if (err.code === "LIMIT_FILE_SIZE") {
        return errorResponse(res, "حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.", 400);
    }

    // TypeORM unique constraint errors (e.g. militaryId or nationalId duplicate)
    if (err.code === "23505") {
        return errorResponse(
            res,
            "الرقم العسكري أو الرقم القومي مسجل بالفعل في النظام لجندي آخر.",
            400,
            err.detail
        );
    }

    const message = err.message || "حدث خطأ داخلي في الخادم";
    const status = err.status || 500;

    return errorResponse(res, message, status, process.env.NODE_ENV === "development" ? err.stack : undefined);
};
