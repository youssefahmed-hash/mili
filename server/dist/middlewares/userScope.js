"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrOperations = exports.requireLineWrite = exports.isLineOnlyScope = exports.isOperationsScope = exports.requireAdminScope = exports.requireClinicDispense = exports.isAdminScope = exports.requireClinicWrite = exports.canManageClinic = exports.allowedPersonnelTypes = exports.isManagerScope = exports.isSuperAdminScope = exports.requireAuthScope = void 0;
const auth_middleware_1 = require("../modules/auth/auth.middleware");
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
/**
 * توثيق + تحميل بيانات الـscope من قاعدة البيانات (مصدر الحقيقة).
 * - يتحقق من الـJWT عبر requireAuth (401 عند غياب/فساد التوكن).
 * - يحمّل role و department الطازجة من جدول users (تعكس أي تعديل إداري بدون إعادة login).
 * - يرفض أي scope قادم من query/body — الـscope يُشتق من المستخدم المصادق عليه فقط.
 */
const requireAuthScope = (req, res, next) => {
    (0, auth_middleware_1.requireAuth)(req, res, () => {
        void (async () => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
                    return;
                }
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                const dbUser = await userRepo.findOne({ where: { id: userId } });
                if (!dbUser) {
                    res.status(401).json({ success: false, message: 'جلسة غير صالحة' });
                    return;
                }
                req.scopeUser = {
                    id: dbUser.id,
                    role: dbUser.role,
                    department: (dbUser.department || '').trim(),
                    userType: (dbUser.userType || '').trim(),
                    degree: (dbUser.degree || '').trim()
                };
                next();
            }
            catch {
                res.status(500).json({ success: false, message: 'خطأ داخلي في التحقق من الجلسة' });
            }
        })();
    });
};
exports.requireAuthScope = requireAuthScope;
/**
 * مدير النظام vs مدير الداخلية.
 * - admin: صلاحية كاملة + نطاق الكل.
 * - internal_manager: زي المدير في الصلاحيات (يشوف كل التبويبات)، بس نطاقه عساكر الداخلية.
 */
const isSuperAdminScope = (scopeUser) => scopeUser?.role === 'admin';
exports.isSuperAdminScope = isSuperAdminScope;
const isManagerScope = (scopeUser) => scopeUser?.role === 'admin' || scopeUser?.role === 'internal_manager';
exports.isManagerScope = isManagerScope;
/**
 * أنواع الأفراد المسموح لكل userType بيشوفها — مصدر الحقيقة في الـBackend.
 * admin: الكل (null = بدون فلتر).
 * internal_manager / داخلية: داخلية + تشغيل حربيه + مستجد داخلية.
 * حربية: حربية + تشغيل حربيه + مستجد حربية.
 * قيم غير معروفة → قائمة فاضية (fail-closed، لا تسريب).
 */
const allowedPersonnelTypes = (scopeUser) => {
    if (!scopeUser)
        return [];
    if (scopeUser.role === 'admin')
        return null;
    const department = (scopeUser.department || '').trim();
    // العيادة: تسجّل كشوفات لكل الأفراد (حربية + داخلية + تشغيل + مستجدين)
    // عشان الطبيب يقدر يختار أي عسكري من أي تبعية وقت تسجيل الكشف.
    if (department === 'عيادة') {
        return ['حربية', 'داخلية', 'تشغيل حربيه', 'مستجد حربية', 'مستجد داخلية'];
    }
    if (scopeUser.role === 'internal_manager') {
        return ['داخلية', 'تشغيل حربيه', 'مستجد داخلية'];
    }
    const type = (scopeUser.userType || '').trim();
    if (type === 'حربية')
        return ['حربية', 'تشغيل حربيه', 'مستجد حربية'];
    if (type === 'داخلية')
        return ['داخلية', 'تشغيل حربيه', 'مستجد داخلية'];
    return [];
};
exports.allowedPersonnelTypes = allowedPersonnelTypes;
/**
 * صلاحية تعديل بيانات العيادة والصيدلية.
 * - المديران (نظام/داخلية) → كل حاجة.
 * - غير الجندي → يعدّل (يضابط/صف ضابط).
 * - الجندي → عرض فقط (ممنوع الصرف والتعديل على المخزون).
 *fail-closed: بدون scope → 403.
 */
const canManageClinic = (scopeUser) => {
    if (!scopeUser)
        return false;
    if ((0, exports.isManagerScope)(scopeUser))
        return true;
    return scopeUser.degree !== 'جندي';
};
exports.canManageClinic = canManageClinic;
const requireClinicWrite = (req, res, next) => {
    (0, exports.requireAuthScope)(req, res, () => {
        if (!req.scopeUser || !(0, exports.canManageClinic)(req.scopeUser)) {
            res.status(403).json({
                success: false,
                message: 'الصرف وتعديل المخزون متاحان لضابط العيادة أو المدير فقط'
            });
            return;
        }
        next();
    });
};
exports.requireClinicWrite = requireClinicWrite;
const isAdminScope = (scopeUser) => {
    return scopeUser?.role === 'admin';
};
exports.isAdminScope = isAdminScope;
/** أدمن فقط (مصادقة + scope محمّل) — لإعدادات التناوب وإدارة المستخدمين. */
/**
 * صرف دواء (سواء endpoint مستقل أو جوه تسجيل كشف).
 * الجندي يقدر يسجّل كشف طبي، بس **مش** يصرف دوا — فالحراسة على وجود
 * payload الصرف نفسه مش على الراوت كله.
 * fail-closed: بدون scope → 403.
 */
const requireClinicDispense = (req, res, next) => {
    (0, exports.requireAuthScope)(req, res, () => {
        const hasDispense = !!req.body?.dispense?.items?.length;
        if (!hasDispense) {
            next(); // مفيش صرف — يسجّل كشف عادي وخلاص
            return;
        }
        if (!req.scopeUser || !(0, exports.canManageClinic)(req.scopeUser)) {
            res.status(403).json({
                success: false,
                message: 'صرف دواء متاح لضابط العيادة أو المدير فقط'
            });
            return;
        }
        next();
    });
};
exports.requireClinicDispense = requireClinicDispense;
const requireAdminScope = (req, res, next) => {
    (0, exports.requireAuthScope)(req, res, () => {
        if (!req.scopeUser || req.scopeUser.role !== 'admin') {
            res.status(403).json({ success: false, message: 'غير مصرح بهذه العملية' });
            return;
        }
        next();
    });
};
exports.requireAdminScope = requireAdminScope;
const isOperationsScope = (scopeUser) => {
    const dept = scopeUser?.department;
    return dept === 'عمليات حربية' || dept === 'عمليات داخلية';
};
exports.isOperationsScope = isOperationsScope;
/**
 * قسم الشئون (شئون داخلية / شئون مجندين): وصول لبيانات الخط للعرض فقط
 * (مكان العسكري على الخط + تمامه) — ممنوع أي إضافة/تعديل/نقل/حذف.
 */
const isLineOnlyScope = (scopeUser) => {
    const dept = (scopeUser?.department || '').trim();
    return dept === 'شئون داخلية' || dept === 'شئون مجندين';
};
exports.isLineOnlyScope = isLineOnlyScope;
/** حارس تعديلات الخط: يمنع قسم الشئون من أي عملية كتابة (المديرون مستثنون). */
const requireLineWrite = (req, res, next) => {
    (0, exports.requireAuthScope)(req, res, () => {
        const s = req.scopeUser;
        if (!s) {
            res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
            return;
        }
        if ((0, exports.isLineOnlyScope)(s) && !(0, exports.isManagerScope)(s)) {
            res.status(403).json({
                success: false,
                message: 'حساب الشئون للعرض فقط — غير مصرح بتعديل بيانات الخط'
            });
            return;
        }
        next();
    });
};
exports.requireLineWrite = requireLineWrite;
/**
 * أدمن أو عمليات (أي درجة): مسموح بإدارة الطوارئ (إنشاء/حذف).
 * إعدادات التناوب تظل أدمن فقط (requireAdmin).
 */
const requireAdminOrOperations = (req, res, next) => {
    (0, exports.requireAuthScope)(req, res, () => {
        const s = req.scopeUser;
        if (!s) {
            res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
            return;
        }
        if (s.role === 'admin' || s.role === 'internal_manager' || (0, exports.isOperationsScope)(s)) {
            next();
            return;
        }
        res.status(403).json({ success: false, message: 'غير مصرح بهذه العملية' });
    });
};
exports.requireAdminOrOperations = requireAdminOrOperations;
