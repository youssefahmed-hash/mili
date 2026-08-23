"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message, statusCode = 200, pagination) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, message = "حدث خطأ ما", statusCode = 500, errors) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
exports.errorResponse = errorResponse;
