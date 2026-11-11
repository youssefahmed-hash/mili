import { NextFunction, Response } from "express";
import { AuthRequest } from "../modules/auth/auth.middleware";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Personnel } from "../entities/Personnel";
import { LinePoint } from "../entities/LinePoint";
import { PharmacyDrug } from "../entities/PharmacyDrug";
import { Vacation } from "../entities/Vacation";
import { Service } from "../entities/Service";
import { OperationRecord } from "../entities/OperationRecord";
import { SecurityRecord } from "../entities/SecurityRecord";
import { Reward } from "../entities/Reward";
import { Penalty } from "../entities/Penalty";
import { ClinicRecord } from "../entities/ClinicRecord";
import { GuardAbsence } from "../entities/GuardAbsence";
import { LineAssignment } from "../entities/LineAssignment";
import { activityService } from "../modules/activity/activity.service";

/**
 * سجل تحديثات النظام — middleware عام.
 * بيسجّل كل طلب POST/PUT/PATCH/DELETE ناجح (2xx) مع:
 *   مين عملها + الوحدة + نوع العملية + اسم السجل المتأثر + الحقول اللي اتغيّرت.
 * مستثنى: تسجيل الدخول، تغيير كلمة السر، وطلبات السجل نفسه.
 */

interface ActivityRequest extends AuthRequest {
    activityContext?: {
        before?: Record<string, unknown> | null;
        preTitle?: string | null;
    };
}

interface ModuleInfo {
    module: string;
    label: string;
}

const MODULE_RULES: Array<{ test: RegExp; info: ModuleInfo }> = [
    { test: /^\/api\/clinic\/pharmacy/, info: { module: "pharmacy", label: "الصيدلية" } },
    { test: /^\/api\/clinic/, info: { module: "clinic", label: "العيادة" } },
    { test: /^\/api\/auth\/users/, info: { module: "users", label: "المستخدمين" } },
    { test: /^\/api\/auth\/me/, info: { module: "profile", label: "الملف الشخصي" } },
    { test: /^\/api\/auth/, info: { module: "auth", label: "تسجيل الدخول" } },
    { test: /^\/api\/personnel/, info: { module: "personnel", label: "الأفراد" } },
    { test: /^\/api\/vacations/, info: { module: "vacations", label: "الإجازات" } },
    { test: /^\/api\/services/, info: { module: "services", label: "الخدمات" } },
    { test: /^\/api\/operations/, info: { module: "operations", label: "العمليات" } },
    { test: /^\/api\/security/, info: { module: "security", label: "الأمن" } },
    { test: /^\/api\/rewards/, info: { module: "rewards", label: "المكافآت" } },
    { test: /^\/api\/penalties/, info: { module: "penalties", label: "الجزاءات" } },
    { test: /^\/api\/line/, info: { module: "line", label: "الخط" } },
    { test: /^\/api\/absence/, info: { module: "absence", label: "الغياب" } },
    { test: /^\/api\/forms/, info: { module: "forms", label: "النماذج" } },
    { test: /^\/api\/documents/, info: { module: "documents", label: "المستندات" } },
    { test: /^\/api\/notification/, info: { module: "notification", label: "إعدادات التناوب" } }
];

const SKIP_EXACT = new Set(["/api/auth/login", "/api/auth/change-password"]);
const SKIP_PREFIXES = ["/api/activity"];

const FIELD_LABELS: Array<[string, string]> = [
    // الأفراد
    ["fullName", "الاسم"],
    ["rank", "الرتبة"],
    ["category", "الفئة"],
    ["militaryId", "الرقم العسكري"],
    ["nationalId", "الرقم القومي"],
    ["policeNumber", "رقم الشرطة"],
    ["personnelType", "النوع"],
    ["unit", "القسم أو الإدارة"],
    ["status", "التمام"],
    ["hospitalName", "اسم المستشفى"],
    ["specialization", "التخصص"],
    ["weapon", "السلاح"],
    ["birthDate", "تاريخ الميلاد"],
    ["enlistmentDate", "تاريخ التجنيد"],
    ["dischargeDate", "تاريخ التسريح"],
    ["appointmentDate", "تاريخ التعيين"],
    ["serviceStartDate", "بداية الخدمة"],
    ["joiningDate", "تاريخ الالتحاق"],
    ["promotionCurrentRankDate", "ترقية الرتبة الحالية"],
    ["promotionCurrentGradeDate", "ترقية الدرجة الحالية"],
    ["promotionHigherRankDate", "ترقية الرتبة الأعلى"],
    ["promotionHigherGradeDate", "ترقية الدرجة الأعلى"],
    ["seniorityNumber", "رقم الأقدمية"],
    ["grade", "الدرجة"],
    ["guardCount", "عدد الحراسات"],
    ["workBeforeEnlistment", "المهنة قبل التجنيد"],
    ["qualification", "المؤهل"],
    ["education", "المستوى التعليمي"],
    ["phone", "الهاتف"],
    ["address", "العنوان"],
    ["notes", "ملاحظات"],
    ["condWeaponBan", "منع سلاح"],
    ["weaponBanType", "نوع منع السلاح"],
    ["condNeuro", "نفسية وعصبية"],
    ["condStruckDischarged", "شطب مسرح"],
    ["condStruckRetained", "شطب غير مسرح"],
    ["isRecruit", "مستجد"],
    ["sectorDistribution", "توزيع القطاع"],
    ["lastLeaveReturnDate", "آخر عودة من إجازة"],
    // الإجازات
    ["vacationType", "نوع الإجازة"],
    ["startDate", "من تاريخ"],
    ["endDate", "إلى تاريخ"],
    ["expectedReturnDate", "تاريخ العودة المتوقع"],
    ["deductionDays", "خصم من الإجازة (أيام)"],
    ["extensionDays", "مد الإجازة (أيام)"],
    ["actualReturnDate", "تاريخ العودة الفعلي"],
    ["returnDate", "تاريخ العودة"],
    ["reason", "السبب"],
    // العمليات
    ["missionName", "اسم المأمورية"],
    ["location", "المكان"],
    ["missionDate", "تاريخ المأمورية"],
    // الخدمات / الأمن / المكافآت / الجزاءات
    ["serviceType", "نوع الخدمة"],
    ["serviceDate", "تاريخ الخدمة"],
    ["securityType", "نوع الأمن"],
    ["recordType", "نوع السجل"],
    ["recordDate", "التاريخ"],
    ["rewardType", "نوع المكافأة"],
    ["rewardDate", "تاريخ المكافأة"],
    ["penaltyType", "نوع الجزاء"],
    ["penaltyDate", "تاريخ الجزاء"],
    // العيادة
    ["diagnosis", "التشخيص"],
    ["treatment", "العلاج"],
    ["visitDate", "تاريخ الكشف"],
    ["complaint", "الشكوى"],
    ["prescription", "الروشتة"],
    // الصيدلية
    ["name", "الاسم"],
    ["nameEn", "الاسم بالإنجليزي"],
    ["code", "الكود"],
    ["barcode", "الباركود"],
    ["quantity", "الكمية"],
    ["expiryDate", "تاريخ الانتهاء"],
    ["batchNumber", "رقم التشغيلة"],
    ["allowCarton", "سماح الكرتونة"],
    ["allowBox", "سماح العلبة"],
    ["allowStrip", "سماح الشريط"],
    ["allowPill", "سماح الحبة"],
    ["pillsPerStrip", "حبات/شريط"],
    ["stripsPerBox", "شرايط/علبة"],
    ["boxesPerCarton", "علب/كرتونة"],
    // الخط
    ["pointId", "النقطة"],
    ["shiftId", "الوردية"],
    ["personnelId", "الفرد"],
    ["officeDuty", "عسكري مكتب"],
    ["description", "الوصف"],
    ["isActive", "نشط"],
    ["hasOfficeDuty", "عسكري مكتب"],
    ["order", "الترتيب"],
    ["weeklyRotationStartDate", "بداية التناوب"],
    ["firstTurn", "أول دور"],
    // الغياب
    ["absenceType", "نوع الغياب"],
    // النماذج والمستندات
    ["formType", "نوع النموذج"],
    ["title", "العنوان"],
    ["type", "النوع"],
    ["fileUrl", "الملف"],
    // المستخدمين
    ["username", "اسم المستخدم"],
    ["role", "الدور"],
    ["department", "القسم"],
    ["degree", "الدرجة"],
    ["userType", "النوع"],
    // عام
    ["date", "التاريخ"]
];

const FIELD_LABEL_MAP = new Map(FIELD_LABELS);

const SKIP_KEYS = new Set([
    "password",
    "newPassword",
    "currentPassword",
    "token",
    "photo",
    "file",
    "files",
    "cardImage",
    "carnetImage",
    "formImage",
    "dispense",
    "items",
    "batchId",
    "drugId",
    "leaveCycleId",
    "id"
]);

const BOOLEAN_KEYS = new Set([
    "condWeaponBan",
    "condNeuro",
    "condStruckDischarged",
    "condStruckRetained",
    "isRecruit",
    "officeDuty",
    "isActive",
    "hasOfficeDuty",
    "allowCarton",
    "allowBox",
    "allowStrip",
    "allowPill"
]);

const USER_CACHE_TTL = 5 * 60 * 1000;
const userCache = new Map<string, { at: number; value: { fullName: string; role: string; department: string } }>();
const personnelNameCache = new Map<string, { at: number; value: string | null }>();

/** سجلات مرتبطة بفرد — نستخرج اسمه من personnelId وقت الحذف/الإنشاء */
const PERSONNEL_LINKED_ENTITIES: Array<{ test: RegExp; entity: any }> = [
    { test: /^\/api\/vacations\//, entity: Vacation },
    { test: /^\/api\/services\//, entity: Service },
    { test: /^\/api\/operations\//, entity: OperationRecord },
    { test: /^\/api\/security\//, entity: SecurityRecord },
    { test: /^\/api\/rewards\//, entity: Reward },
    { test: /^\/api\/penalties\//, entity: Penalty },
    { test: /^\/api\/clinic\//, entity: ClinicRecord },
    { test: /^\/api\/absence\//, entity: GuardAbsence },
    { test: /^\/api\/line\/assignments\//, entity: LineAssignment }
];

const cleanPath = (url: string): string => (url || "").split("?")[0];

const resolveModule = (path: string): ModuleInfo | null => {
    for (const rule of MODULE_RULES) {
        if (rule.test.test(path)) return rule.info;
    }
    return null;
};

const resolveAction = (
    method: string,
    path: string
): { action: string; label: string } => {
    if (path.includes("/assignments/transfer/")) return { action: "transfer", label: "نقل" };
    if (path.includes("/assignments/office-duty")) return { action: "office", label: "تعيين مكتب" };
    if (path.endsWith("/assignments/bulk") || path.endsWith("/vacations/bulk")) {
        return { action: "bulk", label: "إضافة جماعية" };
    }
    if (path.includes("/pharmacy/dispense")) return { action: "dispense", label: "صرف دواء" };
    if (path.endsWith("/return")) return { action: "return", label: "تسجيل عودة" };
    if (path.includes("/leave-cycles/initialize")) return { action: "initialize", label: "تهيئة دورة الإجازات" };
    if (path.includes("/leave-cycles/generate-next")) return { action: "generate", label: "توليد دورة جديدة" };
    if (path.endsWith("/documents/upload")) return { action: "upload", label: "رفع مستند" };
    if (path.endsWith("/notification/settings")) return { action: "settings", label: "تعديل الإعدادات" };
    if (method === "POST") return { action: "create", label: "إضافة" };
    if (method === "PUT" || method === "PATCH") return { action: "update", label: "تعديل" };
    return { action: "delete", label: "حذف" };
};

const asBool = (value: unknown): boolean =>
    value === true || value === 1 || value === "1" || value === "true";

const CATEGORY_LABELS: Record<string, string> = {
    soldier: "جندي",
    non_commissioned_officer: "ضابط صف",
    officer: "ضابط"
};

const ROLE_LABELS: Record<string, string> = {
    admin: "مدير النظام",
    internal_manager: "مدير داخلية",
    user: "مستخدم"
};

const TURN_LABELS: Record<string, string> = {
    personnel: "الأفراد",
    line: "الخط"
};

/** حقول حساسة تتعرض مقنّعة في السجل العام (آخر 4 أرقام فقط) */
const SENSITIVE_KEYS = new Set(["nationalId", "phone"]);

const maskValue = (key: string, value: string | null): string | null => {
    if (!value) return value;
    if (!SENSITIVE_KEYS.has(key)) return value;
    const visible = value.slice(-4);
    const hidden = "*".repeat(Math.max(0, value.length - visible.length));
    return `${hidden}${visible}`;
};

const formatValue = (key: string, value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (BOOLEAN_KEYS.has(key)) return asBool(value) ? "نعم" : "لا";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "boolean") return value ? "نعم" : "لا";
    if (typeof value === "number") return String(value);
    if (typeof value === "object") return null;
    const text = String(value).trim();
    if (!text) return null;
    if (key === "category") return CATEGORY_LABELS[text] || text;
    if (key === "role") return ROLE_LABELS[text] || text;
    if (key === "firstTurn") return TURN_LABELS[text] || text;
    const isoDate = text.match(/^\d{4}-\d{2}-\d{2}T/);
    if (isoDate) return text.slice(0, 10);
    return text.length > 150 ? `${text.slice(0, 147)}…` : text;
};

const buildFields = (
    body: Record<string, unknown>,
    before: Record<string, unknown> | null | undefined,
    maxFields: number
): Array<{ key: string; label: string; value: string; from?: string; to?: string }> => {
    const fields: Array<{ key: string; label: string; value: string; from?: string; to?: string }> = [];
    for (const [key, label] of FIELD_LABELS) {
        if (SKIP_KEYS.has(key) || !(key in body)) continue;
        const next = formatValue(key, body[key]);
        if (before) {
            const prev = formatValue(key, before[key]);
            if (prev === next) continue;
            if (prev === null && next === null) continue;
            const prevDisplay = maskValue(key, prev);
            const nextDisplay = maskValue(key, next);
            fields.push({
                key,
                label,
                value: `${prevDisplay ?? "—"} ← ${nextDisplay ?? "—"}`,
                from: prevDisplay ?? undefined,
                to: nextDisplay ?? undefined
            });
        } else {
            if (next === null) continue;
            fields.push({ key, label, value: maskValue(key, next) as string });
        }
        if (fields.length >= maxFields) break;
    }
    return fields;
};

const extractTitle = (
    module: string,
    data: unknown,
    preTitle: string | null | undefined
): string | null => {
    if (preTitle) return preTitle;
    if (Array.isArray(data)) return data.length ? `${data.length} عنصر` : null;
    if (!data || typeof data !== "object") return null;
    const record = data as Record<string, unknown>;

    if (module === "operations" && typeof record.missionName === "string") {
        const person = record.personnel as Record<string, unknown> | undefined;
        const name = person && typeof person.fullName === "string" ? person.fullName : null;
        return name ? `${name} — ${record.missionName}` : record.missionName;
    }

    const directKeys = [
        "fullName",
        "name",
        "title",
        "shiftName",
        "drugName",
        "missionName",
        "formName",
        "username",
        "pointName"
    ];
    for (const key of directKeys) {
        const value = record[key];
        if (typeof value === "string" && value.trim()) return value.trim();
    }

    const nested = [
        (record.personnel as Record<string, unknown> | undefined)?.fullName,
        (record.point as Record<string, unknown> | undefined)?.name,
        (record.drug as Record<string, unknown> | undefined)?.name,
        (record.user as Record<string, unknown> | undefined)?.fullName
    ];
    for (const value of nested) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
};

const resolveEntityId = (req: ActivityRequest, data: unknown): string | null => {
    const body = req.body as Record<string, unknown> | undefined;
    if (body && typeof body.id === "string") return body.id;
    const params = (req.params || {}) as Record<string, string>;
    if (params.id) return params.id;
    const fromPath = cleanPath(req.originalUrl).match(
        /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i
    );
    if (fromPath?.[1]) return fromPath[1];
    if (data && typeof data === "object") {
        const id = (data as Record<string, unknown>).id;
        if (typeof id === "string") return id;
    }
    return null;
};

/** تحميل بيانات المستخدم من قاعدة البيانات (مع كاش قصير) */
const loadUserInfo = async (userId: string) => {
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.at < USER_CACHE_TTL) return cached.value;
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) return null;
    const value = {
        fullName: user.fullName || user.username,
        role: user.role,
        department: user.department || ""
    };
    userCache.set(userId, { at: Date.now(), value });
    return value;
};

const loadPersonnelName = async (personnelId: string): Promise<string | null> => {
    const cached = personnelNameCache.get(personnelId);
    if (cached && Date.now() - cached.at < USER_CACHE_TTL) return cached.value;
    const person = await AppDataSource.getRepository(Personnel).findOne({ where: { id: personnelId } });
    const name = person?.fullName || null;
    personnelNameCache.set(personnelId, { at: Date.now(), value: name });
    return name;
};

/** قبل تنفيذ الطلب: نجهّز الحالة القديمة/الاسم للسجلات اللي مش بترجّع بيانات بعد الحذف */
const captureContext = async (req: ActivityRequest): Promise<void> => {
    const path = cleanPath(req.originalUrl);
    const method = req.method.toUpperCase();
    const context: ActivityRequest["activityContext"] = {};
    const repo = AppDataSource;

    const idMatch = path.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    const id = idMatch?.[1];

    if (id && method === "DELETE") {
        if (/^\/api\/personnel\//.test(path)) {
            const p = await repo.getRepository(Personnel).findOne({ where: { id } });
            if (p) context.preTitle = p.fullName;
        } else if (/^\/api\/auth\/users\//.test(path)) {
            const u = await repo.getRepository(User).findOne({ where: { id } });
            if (u) context.preTitle = u.fullName || u.username;
        } else if (/^\/api\/line\/points\//.test(path)) {
            const point = await repo.getRepository(LinePoint).findOne({ where: { id } });
            if (point) context.preTitle = point.name;
        } else if (/^\/api\/clinic\/pharmacy\/drugs\//.test(path)) {
            const drug = await repo.getRepository(PharmacyDrug).findOne({ where: { id } });
            if (drug) context.preTitle = drug.name;
        } else {
            for (const rule of PERSONNEL_LINKED_ENTITIES) {
                if (!rule.test.test(path)) continue;
                const record = await repo.getRepository(rule.entity).findOne({ where: { id } });
                const personnelId = (record as { personnelId?: string } | null)?.personnelId;
                if (personnelId) context.preTitle = await loadPersonnelName(personnelId);
                break;
            }
        }
    }

    if (id && (method === "PUT" || method === "PATCH") && /^\/api\/personnel\//.test(path)) {
        const p = await repo.getRepository(Personnel).findOne({ where: { id } });
        if (p) context.before = p as unknown as Record<string, unknown>;
    }

    if (context.preTitle || context.before) {
        req.activityContext = context;
    }
};

const shouldTrack = (req: ActivityRequest): boolean => {
    const method = req.method.toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
    const path = cleanPath(req.originalUrl);
    if (SKIP_EXACT.has(path)) return false;
    if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
    return !!resolveModule(path);
};

export const activityLogger = (
    req: ActivityRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!shouldTrack(req)) {
        next();
        return;
    }

    const path = cleanPath(req.originalUrl);
    const moduleInfo = resolveModule(path) as ModuleInfo;
    const { action } = resolveAction(req.method.toUpperCase(), path);

    const originalJson = res.json.bind(res);
    let logged = false;

    res.json = ((body: unknown) => {
        if (!logged) {
            logged = true;
            const status = res.statusCode;
            if (status >= 200 && status < 300) {
                const responseBody = body as { success?: boolean; data?: unknown } | null;
                const success = responseBody?.success !== false;
                if (success) {
                    void (async () => {
                        try {
                            const userId = req.user?.id;
                            if (!userId) return;
                            const info = await loadUserInfo(userId);
                            if (!info) return;

                            const data = responseBody?.data;
                            const requestBody =
                                req.body && typeof req.body === "object"
                                    ? (req.body as Record<string, unknown>)
                                    : {};

                            const before = req.activityContext?.before || null;
                            const isPersonnelUpdate =
                                moduleInfo.module === "personnel" && action === "update" && before;

                            const allFields = buildFields(
                                requestBody,
                                isPersonnelUpdate ? before : null,
                                200
                            );

                            // تعديل من غير أي تغيير فعلي في الحقول → مش بنسجّل ضوضاء
                            if (isPersonnelUpdate && allFields.length === 0) return;

                            const displayLimit = action === "create" ? 8 : 15;
                            const fields = allFields.slice(0, displayLimit);
                            const summary = fields.map((f) => `${f.label}: ${f.value}`).join(" | ");
                            // نص بحث شامل لكل الحقول (حتى اللي مش معروضة في الكارت)
                            const searchText = allFields
                                .map((f) => `${f.label}: ${f.value}`)
                                .join(" | ")
                                .slice(0, 3000);
                            let title = extractTitle(
                                moduleInfo.module,
                                data,
                                req.activityContext?.preTitle
                            );
                            if (!title && typeof requestBody.personnelId === "string") {
                                title = await loadPersonnelName(requestBody.personnelId);
                            }

                            await activityService.log({
                                userId,
                                userName: info.fullName,
                                userRole: info.role,
                                userDepartment: info.department,
                                module: moduleInfo.module,
                                moduleLabel: moduleInfo.label,
                                action,
                                entityId: resolveEntityId(req, data),
                                title,
                                details: {
                                    summary: summary.slice(0, 2000),
                                    searchText,
                                    fields,
                                    path,
                                    method: req.method
                                }
                            });
                        } catch (err) {
                            console.error("[activity] logger error:", err);
                        }
                    })();
                }
            }
        }
        return originalJson(body);
    }) as Response["json"];

    void (async () => {
        try {
            await captureContext(req);
        } catch (err) {
            console.error("[activity] capture error:", err);
        }
        next();
    })();
};
