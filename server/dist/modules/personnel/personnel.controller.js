"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personnelController = exports.PersonnelController = void 0;
const personnel_service_1 = require("./personnel.service");
const documents_service_1 = require("../documents/documents.service");
const apiResponse_1 = require("../../utils/apiResponse");
const userScope_1 = require("../../middlewares/userScope");
const ATTACHMENT_DOC_TYPES = [
    { field: "cardImage", type: "personnelCard" },
    { field: "carnetImage", type: "personnelCarnet" },
    { field: "formImage", type: "personnelForm" }
];
async function createAttachmentDocuments(personnelId, files) {
    for (const { field, type } of ATTACHMENT_DOC_TYPES) {
        const file = files?.[field]?.[0];
        if (file) {
            await documents_service_1.documentsService.create({
                personnelId,
                type,
                fileUrl: `/uploads/documents/${file.filename}`
            });
        }
    }
}
/**
 * يضمن إن السجل المطلوب داخل نطاق المستخدم قبل أي قراءة/تعديل/حذف.
 * مدير النظام (null) = الكل | مدير داخلية = نطاق داخلية | مستخدم عادي = نطاقه.
 * السجل خارج النطاق يرجع 404 (مش 403) عشان ما نكشفش وجوده.
 */
const ensureInScope = async (id, req) => {
    const scopeUser = req.scopeUser;
    if (!scopeUser)
        return null;
    const personnel = await personnel_service_1.personnelService.findOne(id);
    if (!personnel)
        return null;
    const allowed = (0, userScope_1.allowedPersonnelTypes)(scopeUser);
    if (allowed === null)
        return personnel; // مدير النظام = الكل
    return allowed.includes(personnel.personnelType) ? personnel : null;
};
class PersonnelController {
    async getAll(req, res, next) {
        try {
            const { search, ranks, rank, unit, status, statusNe, personnelType, sector, includeRecruits, condition, dischargeMonth, workBeforeEnlistment, page, limit } = req.query;
            // النطاق من المستخدم المصادق عليه فقط — يتجاهل أي طلب خارج النطاق
            const allowedTypes = (0, userScope_1.allowedPersonnelTypes)(req.scopeUser);
            const filters = {
                search: search,
                ranks: ranks,
                rank: rank,
                unit: unit,
                status: status,
                statusNe: statusNe,
                personnelType: personnelType,
                sector: sector,
                dischargeMonth: dischargeMonth,
                workBeforeEnlistment: workBeforeEnlistment,
                includeRecruits: includeRecruits === 'true' || includeRecruits === '1',
                condition: condition,
                allowedTypes,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            };
            const result = await personnel_service_1.personnelService.findAll(filters);
            return (0, apiResponse_1.successResponse)(res, result.items, "تم جلب الأفراد بنجاح", 200, {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getOne(req, res, next) {
        try {
            const { id } = req.params;
            const personnel = await ensureInScope(id, req);
            if (!personnel) {
                return (0, apiResponse_1.errorResponse)(res, "الفرد العسكري غير موجود", 404);
            }
            return (0, apiResponse_1.successResponse)(res, personnel, "تم جلب بيانات الفرد العسكري بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body;
            const files = req.files;
            if (files?.photo?.[0]) {
                data.photo = `/uploads/photos/${files.photo[0].filename}`;
            }
            // منع تسجيل فرد خارج نطاق المستخدم (مدير داخلية ما يسجّلش حربية)
            const allowedOnCreate = (0, userScope_1.allowedPersonnelTypes)(req.scopeUser);
            if (Array.isArray(allowedOnCreate)) {
                const requested = String(data.personnelType || '').trim();
                if (!requested || !allowedOnCreate.includes(requested)) {
                    return (0, apiResponse_1.errorResponse)(res, "نوع الفرد خارج نطاق صلاحياتك", 403);
                }
            }
            const personnel = await personnel_service_1.personnelService.create(data);
            await createAttachmentDocuments(personnel.id, files);
            return (0, apiResponse_1.successResponse)(res, personnel, "تم إضافة الفرد العسكري بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await ensureInScope(id, req);
            if (!existing) {
                return (0, apiResponse_1.errorResponse)(res, "الفرد العسكري غير موجود", 404);
            }
            const data = req.body;
            const files = req.files;
            if (files?.photo?.[0]) {
                data.photo = `/uploads/photos/${files.photo[0].filename}`;
            }
            const personnel = await personnel_service_1.personnelService.update(id, data);
            await createAttachmentDocuments(personnel.id, files);
            return (0, apiResponse_1.successResponse)(res, personnel, "تم تحديث بيانات الفرد العسكري بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await ensureInScope(id, req);
            if (!existing) {
                return (0, apiResponse_1.errorResponse)(res, "الفرد العسكري غير موجود", 404);
            }
            await personnel_service_1.personnelService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف الفرد العسكري وجميع بياناته المرتبطة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getVacationLineup(req, res, next) {
        try {
            const { date } = req.query;
            // الـscope من المستخدم المصادق عليه فقط (requireAuthScope) — لا query param.
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return (0, apiResponse_1.errorResponse)(res, 'غير مصرح بالدخول', 401);
            }
            const result = await personnel_service_1.personnelService.getVacationLineup(date, {
                userRole: scopeUser?.role,
                userDepartment: scopeUser?.department,
                allowedTypes: (0, userScope_1.allowedPersonnelTypes)(scopeUser)
            });
            return (0, apiResponse_1.successResponse)(res, result, "تم جلب طابور الإجازات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getStrength(req, res, next) {
        try {
            // الـscope من المستخدم المصادق عليه فقط (requireAuthScope)
            const scopeUser = req.scopeUser;
            if (!scopeUser) {
                return (0, apiResponse_1.errorResponse)(res, 'غير مصرح بالدخول', 401);
            }
            const result = await personnel_service_1.personnelService.getStrength({
                userRole: scopeUser?.role,
                userType: scopeUser?.userType,
                userDepartment: scopeUser?.department
            });
            return (0, apiResponse_1.successResponse)(res, result, "تم جلب إجمالي القوة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getStats(req, res, next) {
        try {
            const { search, ranks, rank, unit, status, statusNe, personnelType, sector, includeRecruits, condition, dischargeMonth, workBeforeEnlistment } = req.query;
            const allowedTypes = (0, userScope_1.allowedPersonnelTypes)(req.scopeUser);
            const result = await personnel_service_1.personnelService.getStats({
                search: search,
                ranks: ranks,
                rank: rank,
                unit: unit,
                status: status,
                statusNe: statusNe,
                personnelType: personnelType,
                sector: sector,
                dischargeMonth: dischargeMonth,
                workBeforeEnlistment: workBeforeEnlistment,
                includeRecruits: includeRecruits === 'true' || includeRecruits === '1',
                condition: condition,
                allowedTypes
            });
            return (0, apiResponse_1.successResponse)(res, result, "تم جلب إحصاءات القائمة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PersonnelController = PersonnelController;
exports.personnelController = new PersonnelController();
