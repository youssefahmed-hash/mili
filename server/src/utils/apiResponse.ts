import { Response } from "express";

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: any;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const successResponse = <T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200,
    pagination?: ApiResponse["pagination"]
): Response => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination,
    });
};

export const errorResponse = (
    res: Response,
    message: string = "حدث خطأ ما",
    statusCode: number = 500,
    errors?: any
): Response => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
