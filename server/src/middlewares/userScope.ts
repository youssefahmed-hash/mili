import { Response, NextFunction } from 'express';
import { AuthRequest, requireAuth } from '../modules/auth/auth.middleware';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

export interface ScopeUser {
  id: string;
  role: string;
  department: string;
  userType: string;
  /** الرتبة الوظيفية (جندي / صف ضابط / ضابط) — نحتاجها لصلاحيات العيادة والصيدلية */
  degree: string;
}

export interface ScopedRequest extends AuthRequest {
  scopeUser?: ScopeUser;
}

/**
 * توثيق + تحميل بيانات الـscope من قاعدة البيانات (مصدر الحقيقة).
 * - يتحقق من الـJWT عبر requireAuth (401 عند غياب/فساد التوكن).
 * - يحمّل role و department الطازجة من جدول users (تعكس أي تعديل إداري بدون إعادة login).
 * - يرفض أي scope قادم من query/body — الـscope يُشتق من المستخدم المصادق عليه فقط.
 */
export const requireAuthScope = (
  req: ScopedRequest,
  res: Response,
  next: NextFunction
): void => {
  requireAuth(req, res, () => {
    void (async () => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
          return;
        }
        const userRepo = AppDataSource.getRepository(User);
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
      } catch {
        res.status(500).json({ success: false, message: 'خطأ داخلي في التحقق من الجلسة' });
      }
    })();
  });
};

/**
 * مدير النظام vs مدير الداخلية.
 * - admin: صلاحية كاملة + نطاق الكل.
 * - internal_manager: زي المدير في الصلاحيات (يشوف كل التبويبات)، بس نطاقه عساكر الداخلية.
 */
export const isSuperAdminScope = (scopeUser?: ScopeUser): boolean =>
    scopeUser?.role === 'admin';

export const isManagerScope = (scopeUser?: ScopeUser): boolean =>
    scopeUser?.role === 'admin' || scopeUser?.role === 'internal_manager';

/**
 * أنواع الأفراد المسموح لكل userType بيشوفها — مصدر الحقيقة في الـBackend.
 * admin: الكل (null = بدون فلتر).
 * internal_manager / داخلية: داخلية + تشغيل حربيه + مستجد داخلية.
 * حربية: حربية + تشغيل حربيه + مستجد حربية.
 * قيم غير معروفة → قائمة فاضية (fail-closed، لا تسريب).
 */
export const allowedPersonnelTypes = (scopeUser?: ScopeUser): string[] | null => {
    if (!scopeUser) return [];
    if (scopeUser.role === 'admin') return null;
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
    if (type === 'حربية') return ['حربية', 'تشغيل حربيه', 'مستجد حربية'];
    if (type === 'داخلية') return ['داخلية', 'تشغيل حربيه', 'مستجد داخلية'];
    return [];
};

/**
 * صلاحية تعديل بيانات العيادة والصيدلية.
 * - المديران (نظام/داخلية) → كل حاجة.
 * - غير الجندي → يعدّل (يضابط/صف ضابط).
 * - الجندي → عرض فقط (ممنوع الصرف والتعديل على المخزون).
 *fail-closed: بدون scope → 403.
 */
export const canManageClinic = (scopeUser?: ScopeUser): boolean => {
    if (!scopeUser) return false;
    if (isManagerScope(scopeUser)) return true;
    return scopeUser.degree !== 'جندي';
};

export const requireClinicWrite = (
    req: ScopedRequest,
    res: Response,
    next: NextFunction
): void => {
    requireAuthScope(req, res, () => {
        if (!req.scopeUser || !canManageClinic(req.scopeUser)) {
            res.status(403).json({
                success: false,
                message: 'الصرف وتعديل المخزون متاحان لضابط العيادة أو المدير فقط'
            });
            return;
        }
        next();
    });
};

export const isAdminScope = (scopeUser?: ScopeUser): boolean => {
    return scopeUser?.role === 'admin';
};

/** أدمن فقط (مصادقة + scope محمّل) — لإعدادات التناوب وإدارة المستخدمين. */
/**
 * صرف دواء (سواء endpoint مستقل أو جوه تسجيل كشف).
 * الجندي يقدر يسجّل كشف طبي، بس **مش** يصرف دوا — فالحراسة على وجود
 * payload الصرف نفسه مش على الراوت كله.
 * fail-closed: بدون scope → 403.
 */
export const requireClinicDispense = (
    req: ScopedRequest,
    res: Response,
    next: NextFunction
): void => {
    requireAuthScope(req, res, () => {
        const hasDispense =
            !!(req.body as { dispense?: { items?: unknown[] } } | undefined)?.dispense?.items?.length;
        if (!hasDispense) {
            next(); // مفيش صرف — يسجّل كشف عادي وخلاص
            return;
        }
        if (!req.scopeUser || !canManageClinic(req.scopeUser)) {
            res.status(403).json({
                success: false,
                message: 'صرف دواء متاح لضابط العيادة أو المدير فقط'
            });
            return;
        }
        next();
    });
};

export const requireAdminScope = (
    req: ScopedRequest,
    res: Response,
    next: NextFunction
): void => {
    requireAuthScope(req, res, () => {
        if (!req.scopeUser || req.scopeUser.role !== 'admin') {
            res.status(403).json({ success: false, message: 'غير مصرح بهذه العملية' });
            return;
        }
        next();
    });
};

export const isOperationsScope = (scopeUser?: ScopeUser): boolean => {
  const dept = scopeUser?.department;
  return dept === 'عمليات حربية' || dept === 'عمليات داخلية';
};

/**
 * قسم الشئون (شئون داخلية / شئون مجندين): وصول لبيانات الخط للعرض فقط
 * (مكان العسكري على الخط + تمامه) — ممنوع أي إضافة/تعديل/نقل/حذف.
 */
export const isLineOnlyScope = (scopeUser?: ScopeUser): boolean => {
  const dept = (scopeUser?.department || '').trim();
  return dept === 'شئون داخلية' || dept === 'شئون مجندين';
};

/** حارس تعديلات الخط: يمنع قسم الشئون من أي عملية كتابة (المديرون مستثنون). */
export const requireLineWrite = (
  req: ScopedRequest,
  res: Response,
  next: NextFunction
): void => {
  requireAuthScope(req, res, () => {
    const s = req.scopeUser;
    if (!s) {
      res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
      return;
    }
    if (isLineOnlyScope(s) && !isManagerScope(s)) {
      res.status(403).json({
        success: false,
        message: 'حساب الشئون للعرض فقط — غير مصرح بتعديل بيانات الخط'
      });
      return;
    }
    next();
  });
};

/**
 * أدمن أو عمليات (أي درجة): مسموح بإدارة الطوارئ (إنشاء/حذف).
 * إعدادات التناوب تظل أدمن فقط (requireAdmin).
 */
export const requireAdminOrOperations = (
  req: ScopedRequest,
  res: Response,
  next: NextFunction
): void => {
  requireAuthScope(req, res, () => {
    const s = req.scopeUser;
    if (!s) {
      res.status(401).json({ success: false, message: 'غير مصرح بالدخول' });
      return;
    }
    if (s.role === 'admin' || s.role === 'internal_manager' || isOperationsScope(s)) {
      next();
      return;
    }
    res.status(403).json({ success: false, message: 'غير مصرح بهذه العملية' });
  });
};
