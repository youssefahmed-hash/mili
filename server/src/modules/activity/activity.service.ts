import { AppDataSource } from "../../config/data-source";
import { ActivityLog } from "../../entities/ActivityLog";
import { normalizedColumnSql, normalizedLike } from "../../utils/arabicSearch";

export interface ActivityLogFilters {
    page?: number;
    limit?: number;
    module?: string;
    action?: string;
    search?: string;
    from?: string;
    to?: string;
    /** هل المستخدم الحالي مدير نظام؟ غير المدير مايشوفش سجلات المستخدمين/الملف الشخصي */
    isSuperAdmin?: boolean;
}

export interface ActivityLogEntry {
    userId?: string | null;
    userName?: string | null;
    userRole?: string | null;
    userDepartment?: string | null;
    module: string;
    moduleLabel: string;
    action: string;
    entityId?: string | null;
    title?: string | null;
    details?: Record<string, unknown> | null;
}

/** الوحدات المخفية عن غير مدير النظام (بيانات مستخدمين/حسابات) */
const ADMIN_ONLY_MODULES = ["users", "profile", "auth"];

const toDate = (value?: string): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

export class ActivityService {
    private get repository() {
        return AppDataSource.getRepository(ActivityLog);
    }

    /** كتابة سجل جديد — لا ترمي خطأ لو فشلت الكتابة (ما تعطّلش الطلب الأصلي) */
    async log(entry: ActivityLogEntry): Promise<void> {
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
        } catch (err) {
            console.error("[activity] failed to write log:", err);
        }
    }

    async findAll(filters: ActivityLogFilters) {
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
            const like = normalizedLike(search);
            qb.andWhere(
                `(${normalizedColumnSql("log.title")} LIKE :like
                  OR ${normalizedColumnSql('log."userName"')} LIKE :like
                  OR ${normalizedColumnSql("log.\"moduleLabel\"")} LIKE :like
                  OR ${normalizedColumnSql("COALESCE(log.details->>'searchText', '')")} LIKE :like
                  OR ${normalizedColumnSql("COALESCE(log.details->>'summary', '')")} LIKE :like)`,
                { like }
            );
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
    async countSince(since: string | undefined, isSuperAdmin: boolean) {
        const qb = this.repository.createQueryBuilder("log");
        const sinceDate = toDate(since);
        if (sinceDate) {
            qb.where("log.createdAt > :since", { since: sinceDate });
        } else {
            qb.where("1 = 1");
        }
        if (!isSuperAdmin) {
            qb.andWhere("log.module NOT IN (:...hiddenModules)", { hiddenModules: ADMIN_ONLY_MODULES });
        }
        const count = await qb.getCount();
        return { count, serverTime: new Date().toISOString() };
    }
}

export const activityService = new ActivityService();
