"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const data_source_1 = require("../../config/data-source");
const User_1 = require("../../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'mili_jwt_secret_2024';
const SALT_ROUNDS = 10;
function sanitize(u) {
    const { password, ...rest } = u;
    return rest;
}
class AuthService {
    constructor() {
        this.repo = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    async register(input) {
        const existing = await this.repo.findOne({ where: { username: input.username } });
        if (existing) {
            const e = new Error('اسم المستخدم موجود بالفعل');
            e.status = 409;
            throw e;
        }
        const hashed = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
        const user = this.repo.create({
            username: input.username,
            password: hashed,
            fullName: input.fullName || '',
            userType: input.userType || 'حربية',
            department: input.department || '',
            role: input.role === 'admin' ? 'admin' : 'user'
        });
        const saved = await this.repo.save(user);
        return sanitize(saved);
    }
    async login(username, password) {
        const user = await this.repo.findOne({ where: { username } });
        if (!user) {
            const e = new Error('بيانات الدخول غير صحيحة');
            e.status = 401;
            throw e;
        }
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok) {
            const e = new Error('بيانات الدخول غير صحيحة');
            e.status = 401;
            throw e;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        return { token, user: sanitize(user) };
    }
    async getById(id) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            const e = new Error('المستخدم غير موجود');
            e.status = 404;
            throw e;
        }
        return sanitize(user);
    }
    async list() {
        const users = await this.repo.find({ order: { createdAt: 'DESC' } });
        return users.map(sanitize);
    }
    async update(id, input) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            const e = new Error('المستخدم غير موجود');
            e.status = 404;
            throw e;
        }
        if (input.fullName !== undefined)
            user.fullName = input.fullName;
        if (input.department !== undefined)
            user.department = input.department;
        if (input.userType !== undefined)
            user.userType = input.userType;
        if (input.role !== undefined)
            user.role = input.role;
        if (input.password)
            user.password = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
        const saved = await this.repo.save(user);
        return sanitize(saved);
    }
    async updateProfile(id, input) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            const e = new Error('المستخدم غير موجود');
            e.status = 404;
            throw e;
        }
        if (input.fullName !== undefined)
            user.fullName = input.fullName;
        if (input.department !== undefined)
            user.department = input.department;
        const saved = await this.repo.save(user);
        return sanitize(saved);
    }
    async changePassword(id, currentPassword, newPassword) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            const e = new Error('المستخدم غير موجود');
            e.status = 404;
            throw e;
        }
        const ok = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!ok) {
            const e = new Error('كلمة المرور الحالية غير صحيحة');
            e.status = 400;
            throw e;
        }
        if (!newPassword || newPassword.length < 4) {
            const e = new Error('كلمة المرور الجديدة قصيرة جداً (4 أحرف على الأقل)');
            e.status = 400;
            throw e;
        }
        user.password = await bcryptjs_1.default.hash(newPassword, SALT_ROUNDS);
        const saved = await this.repo.save(user);
        return sanitize(saved);
    }
    async delete(id) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user) {
            const e = new Error('المستخدم غير موجود');
            e.status = 404;
            throw e;
        }
        await this.repo.remove(user);
        return { id };
    }
    async seedAdmin() {
        const count = await this.repo.count();
        if (count === 0) {
            const hashed = await bcryptjs_1.default.hash('admin123', SALT_ROUNDS);
            const admin = this.repo.create({
                username: 'admin',
                password: hashed,
                fullName: 'مدير النظام',
                role: 'admin',
                userType: 'حربية',
                department: 'عمليات'
            });
            await this.repo.save(admin);
            console.log('[seed] تم إنشاء مدير افتراضي (admin / admin123)');
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
