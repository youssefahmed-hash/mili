"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const apiResponse_1 = require("../../utils/apiResponse");
class AuthController {
    async register(req, res, next) {
        try {
            const user = await auth_service_1.authService.register(req.body);
            return (0, apiResponse_1.successResponse)(res, user, 'تم إنشاء الحساب بنجاح', 201);
        }
        catch (err) {
            next(err);
        }
    }
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const result = await auth_service_1.authService.login(username, password);
            return (0, apiResponse_1.successResponse)(res, result, 'تم تسجيل الدخول بنجاح');
        }
        catch (err) {
            next(err);
        }
    }
    async me(req, res, next) {
        try {
            const user = await auth_service_1.authService.getById(req.user.id);
            return (0, apiResponse_1.successResponse)(res, user, 'تم جلب بيانات المستخدم');
        }
        catch (err) {
            next(err);
        }
    }
    async list(req, res, next) {
        try {
            const users = await auth_service_1.authService.list();
            return (0, apiResponse_1.successResponse)(res, users, 'تم جلب المستخدمين');
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const user = await auth_service_1.authService.register(req.body);
            return (0, apiResponse_1.successResponse)(res, user, 'تم إنشاء المستخدم بنجاح', 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const user = await auth_service_1.authService.update(req.params.id, req.body);
            return (0, apiResponse_1.successResponse)(res, user, 'تم تحديث بيانات المستخدم');
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const user = await auth_service_1.authService.updateProfile(req.user.id, req.body);
            return (0, apiResponse_1.successResponse)(res, user, 'تم تحديث الملف الشخصي');
        }
        catch (err) {
            next(err);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await auth_service_1.authService.changePassword(req.user.id, currentPassword, newPassword);
            return (0, apiResponse_1.successResponse)(res, user, 'تم تغيير كلمة المرور بنجاح');
        }
        catch (err) {
            next(err);
        }
    }
    async remove(req, res, next) {
        try {
            await auth_service_1.authService.delete(req.params.id);
            return (0, apiResponse_1.successResponse)(res, null, 'تم حذف المستخدم');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
