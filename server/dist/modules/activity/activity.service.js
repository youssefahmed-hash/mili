"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityService = exports.ActivityService = void 0;
const data_source_1 = require("../../config/data-source");
const ActivityLog_1 = require("../../entities/ActivityLog");
const arabicSearch_1 = require("../../utils/arabicSearch");
/** الوحدات المخفية عن غير مدير النظام (بيانات مستخدمين/حسابات) */
const ADMIN_ONLY_MODULES = ["users", "profile", "auth"];
const toDate = (value) => {
    if (!value)
        return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};
class ActivityService {
    get repository() {
        return data_source_1.AppDataSource.getRepository(ActivityLog_1.ActivityLog);
    }
    /** كتابة سجل جديد — لا ترمي خطأ لو فشلت الكتابة (ما تعطّلش الطلب الأصلي) */
    async log(entry) {
        try {
            const record = this.repository.create({
                userId: entry.userId ?? null,
                userName: entry.userName ?? null,
                userRole: entry.userRole ?? null,
                userDepartment: entry.userDepartment ?? null,
                module: entry.module,
                moduleLabel: entry.moduleLabel,
                action: entry.action,
                entityId: entry.entityId ?? null,
                title: entry.title ? entry.title.slice(0, 500) : null,
                details: entry.details ?? null
            });
            await this.repository.save(record);
        }
        catch (err) {
            console.error("[activity] failed to write log:", err);
        }
    }
    async findAll(filters) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 30));
        const qb = this.repository
            .createQueryBuilder("log")
            .orderBy("log.createdAt", "DESC")
            .addOrderBy("log.id", "DESC");
        if (!filters.isSuperAdmin) {
            qb.andWhere("log.module NOT IN (:...hiddenModules)", { hiddenModules: ADMIN_ONLY_MODULES });
        }
        if (filters.module) {
            qb.andWhere("log.module = :module", { module: filters.module });
        }
        if (filters.action) {
            qb.andWhere("log.action = :action", { action: filters.action });
        }
        const from = toDate(filters.from);
        if (from) {
            qb.andWhere("log.createdAt >= :from", { from });
        }
        const to = toDate(filters.to);
        if (to) {
            // «إلى تاريخ» شامل اليوم كله
            const end = new Date(to.getTime());
            end.setDate(end.getDate() + 1);
            qb.andWhere("log.createdAt < :to", { to: end });
        }
        const search = (filters.search || "").trim();
        if (search) {
            const like = (0, arabicSearch_1.normalizedLike)(search);
            qb.andWhere(`(${(0, arabicSearch_1.normalizedColumnSql)("log.title")} LIKE :like
                  OR ${(0, arabicSearch_1.normalizedColumnSql)('log."userName"')} LIKE :like
                  OR ${(0, arabicSearch_1.normalizedColumnSql)("log.\"moduleLabel\"")} LIKE :like
                  OR ${(0, arabicSearch_1.normalizedColumnSql)("COALESCE(log.details->>'searchText', '')")} LIKE :like
                  OR ${(0, arabicSearch_1.normalizedColumnSql)("COALESCE(log.details->>'summary', '')")} LIKE :like)`, { like });
        }
        const [items, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit))
        };
    }
    /** عدد التحديثات الجديدة بعد لحظة معيّنة (لعرض badge في التاب) */
    async countSince(since, isSuperAdmin) {
        const qb = this.repository.createQueryBuilder("log");
        const sinceDate = toDate(since);
        if (sinceDate) {
            qb.where("log.createdAt > :since", { since: sinceDate });
        }
        else {
            qb.where("1 = 1");
        }
        if (!isSuperAdmin) {
            qb.andWhere("log.module NOT IN (:...hiddenModules)", { hiddenModules: ADMIN_ONLY_MODULES });
        }
        const count = await qb.getCount();
        return { count, serverTime: new Date().toISOString() };
    }
}
exports.ActivityService = ActivityService;
exports.activityService = new ActivityService();
