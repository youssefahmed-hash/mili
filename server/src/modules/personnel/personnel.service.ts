import { AppDataSource } from "../../config/data-source";
import { Personnel, PersonnelCategory } from "../../entities/Personnel";
import { Vacation } from "../../entities/Vacation";
import { LineAssignment } from "../../entities/LineAssignment";
import { lineAssignmentService } from "../line/line.service";
import { vacationsService } from "../vacations/vacations.service";
import { Like, Equal } from "typeorm";
import { normalizeArabic, normalizedColumnSql, normalizedLike } from "../../utils/arabicSearch";
import fs from "fs";
import path from "path";

// Timezone-safe YYYY-MM-DD parsing/formatting (local midnight, no UTC shift)
const parseYmd = (s?: string | Date): Date => {
    if (!s) return new Date();
    if (s instanceof Date) {
        return new Date(s.getFullYear(), s.getMonth(), s.getDate());
    }
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};
const fmtYmd = (dt: Date): string => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export class PersonnelService {
    private repository = AppDataSource.getRepository(Personnel);

    /** التمامات المؤثرة على القوة — تُحتسب في «إجمالي المؤثرين» */
    private static readonly AFFECTED_STATUSES = ["غياب", "محكمه", "مستشفى خارجي", "عرض مستشفى"];

    /** القسم الذي ينتقل إليه أي فرد عليه مؤثر على القوة */
    private static readonly AFFECTED_UNIT = "شئون مجندين";

    private static RANK_TO_CATEGORY: Record<string, PersonnelCategory> = {
        'جندي': 'soldier',
        'مستجد حربية': 'soldier',
        'مستجد داخلية': 'soldier',
        'صف ضابط': 'non_commissioned_officer',
        'ضابط': 'officer',
        'عريف': 'non_commissioned_officer',
        'رقيب': 'non_commissioned_officer',
        'رقيب أول': 'non_commissioned_officer',
        'مساعد': 'non_commissioned_officer',
        'مساعد أول': 'non_commissioned_officer',
        'أمين شرطة': 'non_commissioned_officer',
        'ملازم': 'officer',
        'ملازم أول': 'officer',
        'نقيب': 'officer',
        'رائد': 'officer',
        'مقدم': 'officer',
        'عقيد': 'officer',
        'عميد': 'officer',
        'لواء': 'officer'
    };

    private resolveCategory(data: Partial<Personnel>): PersonnelCategory {
        if (data.category) return data.category as PersonnelCategory;
        if (data.rank && PersonnelService.RANK_TO_CATEGORY[data.rank]) {
            return PersonnelService.RANK_TO_CATEGORY[data.rank];
        }
        return 'soldier';
    }

    async findAll(filters: {
        search?: string;
        ranks?: string;
        rank?: string;
        unit?: string;
        status?: string;
        statusNe?: string;
        personnelType?: string;
        sector?: string;
        /** بحث بتاريخ التسريح بالشهر والسنة (YYYY-MM) */
        dischargeMonth?: string;
        /** بحث بالعمل قبل التجنيد */
        workBeforeEnlistment?: string;
        includeRecruits?: boolean;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const queryBuilder = this.buildFilteredQuery(filters);

        queryBuilder.skip(skip).take(limit).orderBy("personnel.createdAt", "DESC");

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * إحصاءات القائمة بنفس الفلاتر (للكروت): الإجمالي + العدد لكل حالة.
     * تُستخدم لحساب خارج/موجود على نطاق الفلاتر الحالية بدل صفحة واحدة.
     */
    async getStats(filters: {
        search?: string;
        ranks?: string;
        rank?: string;
        unit?: string;
        status?: string;
        statusNe?: string;
        personnelType?: string;
        sector?: string;
        /** بحث بتاريخ التسريح بالشهر والسنة (YYYY-MM) */
        dischargeMonth?: string;
        /** بحث بالعمل قبل التجنيد */
        workBeforeEnlistment?: string;
        includeRecruits?: boolean;
        condition?: string;
        allowedTypes?: string[] | null;
    }): Promise<{
        total: number;
        byStatus: Record<string, number>;
        conditions: {
            weaponBan: number;
            neuro: number;
            struckDischarged: number;
            struckRetained: number;
            /** إجمالي الأفراد اللي عليهم أي مؤثر من الأربعة (مرة واحدة للفرد) */
            total: number;
        };
    }> {
        const queryBuilder = this.buildFilteredQuery(filters);

        const rows = await queryBuilder
            .select(PersonnelService.EFFECTIVE_STATUS_SQL, "status")
            .addSelect("COUNT(*)", "count")
            .groupBy(PersonnelService.EFFECTIVE_STATUS_SQL)
            .getRawMany<{ status: string; count: string }>();

        const byStatus: Record<string, number> = {};
        let total = 0;
        for (const r of rows) {
            const c = parseInt(r.count, 10) || 0;
            byStatus[r.status || "غير محدد"] = c;
            total += c;
        }

        // عدّادات المؤثرات على القوة — بنستثني فلتر الشرط نفسه عشان التقسيمة
        // تفضل ظاهرة كاملة حتى بعد الضغط على مؤثر معيّن.
        const conditionQb = this.buildFilteredQuery({ ...filters, condition: undefined });
        const condRow = await conditionQb
            .select(
                'COALESCE(SUM(CASE WHEN personnel."condWeaponBan" THEN 1 ELSE 0 END), 0)',
                "weaponBan"
            )
            .addSelect(
                'COALESCE(SUM(CASE WHEN personnel."condNeuro" THEN 1 ELSE 0 END), 0)',
                "neuro"
            )
            .addSelect(
                'COALESCE(SUM(CASE WHEN personnel."condStruckDischarged" THEN 1 ELSE 0 END), 0)',
                "struckDischarged"
            )
            .addSelect(
                'COALESCE(SUM(CASE WHEN personnel."condStruckRetained" THEN 1 ELSE 0 END), 0)',
                "struckRetained"
            )
            .addSelect(
                `COALESCE(SUM(CASE WHEN personnel."condWeaponBan"
                    OR personnel."condNeuro"
                    OR personnel."condStruckDischarged"
                    OR personnel."condStruckRetained"
                    THEN 1 ELSE 0 END), 0)`,
                "total"
            )
            .getRawOne<Record<string, string>>();

        const conditions = {
            weaponBan: parseInt(condRow?.weaponBan || "0", 10) || 0,
            neuro: parseInt(condRow?.neuro || "0", 10) || 0,
            struckDischarged: parseInt(condRow?.struckDischarged || "0", 10) || 0,
            struckRetained: parseInt(condRow?.struckRetained || "0", 10) || 0,
            total: parseInt(condRow?.total || "0", 10) || 0
        };

        return { total, byStatus, conditions };
    }

    private buildFilteredQuery(filters: {
        search?: string;
        ranks?: string;
        rank?: string;
        unit?: string;
        status?: string;
        statusNe?: string;
        personnelType?: string;
        sector?: string;
        /** بحث بتاريخ التسريح بالشهر والسنة (YYYY-MM) */
        dischargeMonth?: string;
        /** بحث بالعمل قبل التجنيد */
        workBeforeEnlistment?: string;
        includeRecruits?: boolean;
        /** شرط من شروط المؤثرات (للحفر من الكروت) */
        condition?: string;
    }) {
        const queryBuilder = this.repository.createQueryBuilder("personnel");

        // ===== البحث الذكي متعدد الخانات =====
        // المستخدم يقدر يكتب أكتر من كلمة، وكل كلمة لازم تتحقق (AND) وبتدور في كل الخانات المهمة:
        // الاسم / الرقم العسكري / الرقم القومي / القسم / الفصيلة (التوزيع) / الوحدة التابعة
        // / النوع (حربية - داخلية - تشغيل) / الرتبة / التخصص / التمام / أرقام التليفون
        // / التواريخ (التسريح - الانضمام - التجنيد - التعيين - بدء الخدمة - الميلاد)
        // مثال: «يوسف منشاء» = كل اللي اسمه يوسف وفي قسم منشاء
        // والبحث العربي متسامح: أحمد = احمد، عبد الرحمن = عبدالرحمن، حموشة = حموشه
        if (filters.search) {
            const tokens = (filters.search as string)
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 8);

            if (tokens.length > 0) {
                const params: Record<string, string> = {};

                // التاريخ بنقارنه بصيغتين عشان لو المستخدم كتب يوم/شهر أو سنة بس
                const dateColumn = (col: string, key: string): string =>
                    `to_char(${col}, 'YYYY-MM-DD') LIKE :${key}
                     OR to_char(${col}, 'DD-MM-YYYY') LIKE :${key}
                     OR to_char(${col}, 'FMDD-FMMM-YYYY') LIKE :${key}`;

                const perToken = tokens.map((token, i) => {
                    const likeKey = `s${i}`;
                    const normKey = `n${i}`;
                    const dateKey = `d${i}`;
                    params[likeKey] = `%${token}%`;
                    params[normKey] = normalizedLike(token);
                    params[dateKey] = `%${token.replace(/[\/.]/g, "-")}%`;

                    // النوع (حربية / داخلية / تشغيل): مطابقة دقيقة عشان «حربية» متهيّسش «تشغيل حربيه»
                    let typeCondition: string;
                    const normToken = normalizeArabic(token);
                    if (normToken === "حربيه" || normToken === "داخليه") {
                        const typeKey = `t${i}`;
                        params[typeKey] = normToken === "حربيه" ? "حربية" : "داخلية";
                        typeCondition = `personnel.personnelType = :${typeKey}`;
                    } else {
                        typeCondition = `${normalizedColumnSql("personnel.personnelType")} LIKE :${normKey}`;
                    }

                    return `(
                        personnel.fullName ILIKE :${likeKey}
                        OR personnel.militaryId ILIKE :${likeKey}
                        OR personnel.nationalId ILIKE :${likeKey}
                        OR personnel.unit ILIKE :${likeKey}
                        OR personnel.sectorDistribution ILIKE :${likeKey}
                        OR personnel.affiliatedUnit ILIKE :${likeKey}
                        OR personnel.specialization ILIKE :${likeKey}
                        OR personnel.workBeforeEnlistment ILIKE :${likeKey}
                        OR personnel.rank ILIKE :${likeKey}
                        OR personnel.status ILIKE :${likeKey}
                        OR personnel.phone ILIKE :${likeKey}
                        OR personnel.fatherPhone ILIKE :${likeKey}
                        OR personnel.motherPhone ILIKE :${likeKey}
                        OR personnel.emergencyPhone ILIKE :${likeKey}
                        OR ${normalizedColumnSql("personnel.fullName")} LIKE :${normKey}
                        OR ${normalizedColumnSql("personnel.unit")} LIKE :${normKey}
                        OR ${normalizedColumnSql("personnel.sectorDistribution")} LIKE :${normKey}
                        OR ${normalizedColumnSql("personnel.affiliatedUnit")} LIKE :${normKey}
                        OR ${normalizedColumnSql("personnel.specialization")} LIKE :${normKey}
                        OR ${normalizedColumnSql("personnel.workBeforeEnlistment")} LIKE :${normKey}
                        OR ${normalizedColumnSql("personnel.rank")} LIKE :${normKey}
                        OR ${normalizedColumnSql("personnel.status")} LIKE :${normKey}
                        OR ${dateColumn("personnel.dischargeDate", dateKey)}
                        OR ${dateColumn("personnel.joiningDate", dateKey)}
                        OR ${dateColumn("personnel.enlistmentDate", dateKey)}
                        OR ${dateColumn("personnel.appointmentDate", dateKey)}
                        OR ${dateColumn("personnel.serviceStartDate", dateKey)}
                        OR ${dateColumn("personnel.birthDate", dateKey)}
                        OR (${typeCondition})
                    )`;
                });

                // كل كلمة شرط مستقل، والنتيجة لازم تحققهم كلهم مع بعض
                queryBuilder.andWhere(perToken.map((c) => `(${c})`).join(" AND "), params);
            }
        }

        // Apply filters
        if (filters.ranks) {
            const ranks = (filters.ranks as string)
                .split(",")
                .map((r) => r.trim())
                .filter(Boolean);
            if (ranks.length) {
                queryBuilder.andWhere("personnel.rank IN (:...ranks)", { ranks });
            }
        }
        if (filters.rank) {
            queryBuilder.andWhere("personnel.rank = :rank", { rank: filters.rank });
        }
        if (filters.unit) {
            if (filters.unit === 'بدون قسم') {
                // «بدون قسم» بيشمل اللي اتحدد له بدون قسم + أي سجل قسمه فاضي/غير محدد
                queryBuilder.andWhere(
                    "(personnel.unit IS NULL OR TRIM(personnel.unit) = '' OR personnel.unit = :noUnit)",
                    { noUnit: 'بدون قسم' }
                );
            } else {
                queryBuilder.andWhere("personnel.unit = :unit", { unit: filters.unit });
            }
        }
        if (filters.status) {
            // «خارج القطاع» معناها مش خارج فعليًا — بنستخدم تعبير IS_OUT اللي بيشوف الخط كمان
            if (filters.status === 'داخل القطاع') {
                queryBuilder.andWhere(`NOT ${PersonnelService.IS_OUT_SQL}`);
            } else {
                queryBuilder.andWhere(
                    `${PersonnelService.EFFECTIVE_STATUS_SQL} = :status`,
                    { status: filters.status }
                );
            }
        }
        if (filters.statusNe) {
            if (filters.statusNe === 'داخل القطاع') {
                queryBuilder.andWhere(PersonnelService.IS_OUT_SQL);
            } else {
                queryBuilder.andWhere(
                    `${PersonnelService.EFFECTIVE_STATUS_SQL} != :statusNe`,
                    { statusNe: filters.statusNe }
                );
            }
        }

        if (filters.personnelType) {
            const types = (filters.personnelType as string)
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            if (types.length) {
                if (filters.includeRecruits) {
                    // المستجد ظاهر للكل ما عدا مستجد-الحربية (للحربية فقط عبر فلتر النوع نفسه)
                    queryBuilder.andWhere(
                        "(personnel.personnelType IN (:...types) OR (personnel.personnelType LIKE :rec AND personnel.personnelType != :harb))",
                        { types, rec: "مستجد%", harb: "مستجد حربية" }
                    );
                } else {
                    queryBuilder.andWhere("personnel.personnelType IN (:...types)", { types });
                }
            }
        }

// ===== نطاق المستخدم (fail-closed) =====
// null (أدمن) = بدون تقييد | undefined (استدعاء داخلي) = بدون تقييد | [] = لا شيء مسموح.
const allowed = (filters as { allowedTypes?: string[] | null }).allowedTypes;
if (Array.isArray(allowed)) {
    if (allowed.length === 0) {
        queryBuilder.andWhere("1 = 0");
    } else {
        queryBuilder.andWhere("personnel.personnelType IN (:...scopeTypes)", {
            scopeTypes: allowed
        });
    }
}
        if (filters.sector) {
            queryBuilder.andWhere("personnel.sectorDistribution ILIKE :sector", { sector: `%${filters.sector}%` });
        }

        // فلتر تاريخ التسريح بالشهر والسنة (اليوم مش مهم) — القيمة YYYY-MM
        if (filters.dischargeMonth) {
            queryBuilder.andWhere("to_char(personnel.dischargeDate, 'YYYY-MM') = :dischargeMonth", {
                dischargeMonth: filters.dischargeMonth
            });
        }

        // فلتر العمل قبل التجنيد (بحث جزئي متسامح مع فروق الكتابة)
        if (filters.workBeforeEnlistment) {
            const wbe = filters.workBeforeEnlistment.trim();
            if (wbe) {
                queryBuilder.andWhere(
                    `(personnel.workBeforeEnlistment ILIKE :wbe
                      OR ${normalizedColumnSql("personnel.workBeforeEnlistment")} LIKE :wbeNorm)`,
                    { wbe: `%${wbe}%`, wbeNorm: normalizedLike(wbe) }
                );
            }
        }

        // شرط من شروط المؤثرات (منع سلاح / نفسية / شطب) — للحفر من كروت الداشبورد
        // وللفلترة من شرائح «المؤثرات على القوة» في تاب الأفراد.
        // القيمتين مقبولين: الاسم المختصر (weaponBan) أو اسم العمود (condWeaponBan).
        const CONDITION_FIELD_MAP: Record<string, string> = {
            weaponBan: 'condWeaponBan',
            neuro: 'condNeuro',
            struckDischarged: 'condStruckDischarged',
            struckRetained: 'condStruckRetained',
            condWeaponBan: 'condWeaponBan',
            condNeuro: 'condNeuro',
            condStruckDischarged: 'condStruckDischarged',
            condStruckRetained: 'condStruckRetained'
        };
        const condition = (filters as { condition?: string }).condition;
        if (condition === 'any') {
            // إجمالي المؤثرين: التمام المؤثر (بما فيه حالات الخط) OR أي شرط
            queryBuilder.andWhere(
                `(${PersonnelService.EFFECTIVE_STATUS_SQL} IN (:...affectedStatuses)
                  OR personnel.condWeaponBan = :ct
                  OR personnel.condNeuro = :ct OR personnel.condStruckDischarged = :ct
                  OR personnel.condStruckRetained = :ct)`,
                { affectedStatuses: PersonnelService.AFFECTED_STATUSES, ct: true }
            );
        } else if (condition === 'anyEffect') {
            // أصحاب المؤثرات على القوة فقط (الأربعة) — من غير تمامات الخط
            queryBuilder.andWhere(
                `(personnel.condWeaponBan = :ct
                  OR personnel.condNeuro = :ct
                  OR personnel.condStruckDischarged = :ct
                  OR personnel.condStruckRetained = :ct)`,
                { ct: true }
            );
        } else if (condition && CONDITION_FIELD_MAP[condition]) {
            queryBuilder.andWhere(`personnel.${CONDITION_FIELD_MAP[condition]} = :condTrue`, {
                condTrue: true
            });
        }

        return queryBuilder;
    }

    async findOne(id: string) {
        return await this.repository.findOne({
            where: { id },
            relations: ["documents", "vacations", "forms"]
        });
    }

    private static toBool(v: unknown): boolean {
        return v === true || v === "true" || v === 1 || v === "1";
    }

    private static readonly BOOL_FIELDS = [
        "condWeaponBan",
        "condNeuro",
        "condStruckDischarged",
        "condStruckRetained"
    ] as const;

    private static normalizeBools(data: Partial<Personnel>): void {
        const rec = data as Record<string, unknown>;
        for (const key of PersonnelService.BOOL_FIELDS) {
            if (rec[key] !== undefined) {
                rec[key] = PersonnelService.toBool(rec[key]);
            }
        }
    }

    /** يظبط نوع منع السلاح: فاضي = null، ولو مفيش «منع سلاح» يتشال النوع */
    private static normalizeWeaponBanType(data: Partial<Personnel>): void {
        const rec = data as Record<string, unknown>;
        if (rec.weaponBanType !== undefined) {
            const v = String(rec.weaponBanType ?? "").trim();
            rec.weaponBanType = v === "" ? null : v;
        }
        if (data.condWeaponBan === false) {
            rec.weaponBanType = null;
        }
    }

    /** اسم المستشفى: فاضي = null، ولو التمام مش «مستشفى خارجي» يتشال */
    private static normalizeHospitalName(data: Partial<Personnel>): void {
        const rec = data as Record<string, unknown>;
        if (rec.hospitalName !== undefined) {
            const v = String(rec.hospitalName ?? "").trim();
            rec.hospitalName = v === "" ? null : v;
        }
        if (data.status !== undefined && data.status !== "مستشفى خارجي") {
            rec.hospitalName = null;
        }
    }

    /** هل الطلب الحالي بيحمّل مؤثرًا واحدًا على الأقل من مؤثرات القوة؟ */
    private static hasAnyCondition(data: Partial<Personnel>): boolean {
        return !!(
            data.condWeaponBan ||
            data.condNeuro ||
            data.condStruckDischarged ||
            data.condStruckRetained
        );
    }

    /**
     * توحيد قسم كل فرد عليه مؤثر على القوة إلى «شئون مجندين».
     * idempotent — تُنفّذ عند الإقلاع لتغطية السجلات القديمة كمان.
     */
    async normalizeAffectedUnits(): Promise<number> {
        const result = await this.repository
            .createQueryBuilder()
            .update(Personnel)
            .set({ unit: PersonnelService.AFFECTED_UNIT })
            .where(
                `("condWeaponBan" = true
                 OR "condNeuro" = true
                 OR "condStruckDischarged" = true
                 OR "condStruckRetained" = true)`
            )
            .andWhere(`(unit IS DISTINCT FROM :affectedUnit)`, {
                affectedUnit: PersonnelService.AFFECTED_UNIT
            })
            .execute();
        return result.affected || 0;
    }

    async create(data: Partial<Personnel>) {
        PersonnelService.normalizeBools(data);
        PersonnelService.normalizeWeaponBanType(data);
        PersonnelService.normalizeHospitalName(data);
        // أي فرد عليه مؤثر على القوة قسمه بيتحوّل لـ«شئون مجندين» تلقائيًا
        if (PersonnelService.hasAnyCondition(data)) {
            data.unit = PersonnelService.AFFECTED_UNIT;
        }
        // المستجد ليس له قسم — العمود nullable، فنخزّن NULL صراحةً
        if (data.unit === undefined || String(data.unit).trim() === "") {
            data.unit = null;
        }
        const payload = { ...data, category: this.resolveCategory(data) };
        const newPersonnel = this.repository.create(payload);
        return await this.repository.save(newPersonnel);
    }

    async update(id: string, data: Partial<Personnel>) {
        const personnel = await this.findOne(id);
        if (!personnel) {
            throw new Error("الفرد العسكري غير موجود");
        }

        const previousStatus = personnel.status || "";

        PersonnelService.normalizeBools(data);
        PersonnelService.normalizeWeaponBanType(data);
        PersonnelService.normalizeHospitalName(data);
        // أي فرد عليه مؤثر على القوة قسمه بيتحوّل لـ«شئون مجندين» تلقائيًا
        if (PersonnelService.hasAnyCondition(data)) {
            data.unit = PersonnelService.AFFECTED_UNIT;
        }
        const payload = { ...data, category: this.resolveCategory(data) };

        // If updating photo and old photo exists, optionally remove old photo file
        if (data.photo && personnel.photo && data.photo !== personnel.photo) {
            this.deleteLocalFile(personnel.photo);
        }

        this.repository.merge(personnel, payload);
        const saved = await this.repository.save(personnel);

        // تغيير «التمام» من تاب الأفراد بيتزامن مع تعيين الخط (لو التعيين لسه مرآة للسجل)
        if (data.status !== undefined && (saved.status || "") !== previousStatus) {
            await lineAssignmentService.syncFromPersonnelRecord(
                saved.id,
                previousStatus,
                saved.status || ""
            );
        }

        return saved;
    }

    async delete(id: string) {
        const personnel = await this.findOne(id);
        if (!personnel) {
            throw new Error("الفرد العسكري غير موجود");
        }

        // Delete photo
        if (personnel.photo) {
            this.deleteLocalFile(personnel.photo);
        }

        // Delete documents files
        if (personnel.documents) {
            for (const doc of personnel.documents) {
                this.deleteLocalFile(doc.fileUrl);
            }
        }

        // Delete forms files
        if (personnel.forms) {
            for (const f of personnel.forms) {
                if (f.fileUrl) {
                    this.deleteLocalFile(f.fileUrl);
                }
            }
        }

        await this.repository.remove(personnel);
        return true;
    }

    private deleteLocalFile(fileUrl: string) {
        try {
            // fileUrl format: /uploads/folder/filename
            if (fileUrl.startsWith("/uploads/")) {
                const relativePath = fileUrl.replace("/uploads/", "");
                const filePath = path.join(process.cwd(), "uploads", relativePath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error(`Error deleting local file ${fileUrl}:`, err);
        }
    }

    async getVacationLineup(
        dateStr?: string,
        options?: { userRole?: string; userDepartment?: string; allowedTypes?: string[] | null }
    ) {
        const today = parseYmd(dateStr);
        today.setHours(0, 0, 0, 0);

        // تحديد الـscope من المستخدم المصادق عليه (Backend مصدر الحقيقة — لا query param).
        // admin → الكل | عمليات → unit="الخط" فقط | غير ذلك → unit!="الخط".
        // عدّاد الأنواع (allowedTypes) بيقصّي حربية عن مدير الداخلية.
        // بدون scope معروف → fail-closed (لا بيانات) — لا يُعرض الكل أبدًا.
        const isAdmin = options?.userRole === 'admin';
        const dept = (options?.userDepartment ?? '').trim();
        const isOperations = dept === 'عمليات حربية' || dept === 'عمليات داخلية';
        const typeScope = options?.allowedTypes;

        let personnelList = await this.repository.find();
        if (isAdmin) {
            // Admin scope كامل — بدون فلتر
        } else if (!options || (options.userRole === undefined && options.userDepartment === undefined)) {
            personnelList = [];
        } else if (isOperations) {
            personnelList = personnelList.filter((p) => p.unit === 'الخط');
        } else {
            personnelList = personnelList.filter((p) => p.unit !== 'الخط');
        }
        // مدير الداخلية (وأي نطاق أنواع محدد): قصّ السجلات على الأنواع المسموحة
        if (Array.isArray(typeScope)) {
            if (typeScope.length === 0) {
                personnelList = [];
            } else if (typeScope) {
                personnelList = personnelList.filter((p) => typeScope.includes(p.personnelType));
            }
        }
        const vacationRepo = AppDataSource.getRepository(Vacation);

        // قبل حساب الطابور: ترحيل أي دورة انتهت فعليًا (وتصفير الخصم/المد)
        try {
            await vacationsService.rollOverdueCycles();
        } catch (err) {
            console.error("تعذر ترحيل دورات الإجازات:", err);
        }

        const vacations = await vacationRepo.find();

        // Group vacations by personnel and pick the LATEST APPROVED record ( cycle anchor ):
        // - only معتمدة/نشطة count (pending/rejected are not real leave until admin approves)
        // - latest startDate wins (a new approved leave re-anchors the forecast)
        // - future anchors مسموحة: بعد الترحيل التلقائي بداية الدورة الجديدة بتكون في المستقبل
        const baseByPersonnel: Record<string, (typeof vacations)[number]> = {};
        for (const v of vacations) {
            const cycle = parseInt(v.cycle || '', 10);
            if (!cycle || cycle <= 0) continue;
            if (v.status !== 'معتمدة' && v.status !== 'نشطة') continue;
            const existing = baseByPersonnel[v.personnelId];
            if (!existing || parseYmd(v.startDate).getTime() > parseYmd(existing.startDate).getTime()) {
                baseByPersonnel[v.personnelId] = v;
            }
        }

        const goingDown: Record<string, unknown>[] = [];
        const comingUp: Record<string, unknown>[] = [];
        const onVacation: Record<string, unknown>[] = [];

        for (const p of personnelList) {
            const base = baseByPersonnel[p.id];
            if (!base) continue;

            const cycle = parseInt(base.cycle as string, 10);
            const anchor = parseYmd(base.startDate);
            anchor.setHours(0, 0, 0, 0);
            const baseReturn = parseYmd(base.expectedReturnDate);
            baseReturn.setHours(0, 0, 0, 0);

            const deduction = Math.max(0, base.deductionDays || 0);
            const extension = Math.max(0, base.extensionDays || 0);
            const adjustedReturn = new Date(baseReturn);
            adjustedReturn.setDate(adjustedReturn.getDate() + extension - deduction);
            // مدة الإجازة الأساسية (قبل الخصم/المد) — هي مدة كل دورة جديدة
            const baseLeaveDays = Math.max(
                1,
                Math.round((baseReturn.getTime() - anchor.getTime()) / 86400000)
            );

            let descent: Date;
            let ret: Date;

            if (anchor.getTime() > today.getTime()) {
                // بداية دورة مستقبلية (بعد الترحيل التلقائي أو إجازة مجدولة)
                descent = new Date(anchor);
                ret = new Date(adjustedReturn);
            } else if (today.getTime() <= adjustedReturn.getTime()) {
                // الدورة الحالية (أو يوم العودة الفعلي)
                descent = new Date(anchor);
                ret = new Date(adjustedReturn);
            } else {
                // الدورة الحالية انتهت فعليًا → الدورات الجديدة تُحسب من تاريخ العودة
                // الأساسي (بدون خصم/مد) عشان تفضل «صافية» زي الدورة الأصلية.
                const cleanPeriod = cycle + baseLeaveDays;
                const firstCleanStart = new Date(baseReturn);
                firstCleanStart.setDate(firstCleanStart.getDate() + cycle);

                if (today.getTime() <= firstCleanStart.getTime()) {
                    descent = new Date(firstCleanStart);
                } else {
                    const diffDays = Math.floor(
                        (today.getTime() - firstCleanStart.getTime()) / 86400000
                    );
                    const k = Math.floor(diffDays / cleanPeriod);
                    descent = new Date(firstCleanStart);
                    descent.setDate(descent.getDate() + k * cleanPeriod);
                    // لو إحنا بعد نهاية دورة كاملة، ننتقل للدورة اللي بعدها
                    const cycleEnd = new Date(descent);
                    cycleEnd.setDate(cycleEnd.getDate() + baseLeaveDays);
                    if (today.getTime() > cycleEnd.getTime()) {
                        descent.setDate(descent.getDate() + cleanPeriod);
                    }
                }
                ret = new Date(descent);
                ret.setDate(ret.getDate() + baseLeaveDays);
            }

            const info = {
                id: p.id,
                fullName: p.fullName,
                rank: p.rank,
                grade: p.grade,
                militaryId: p.militaryId,
                unit: p.unit,
                cycle: base.cycle,
                personnelType: p.personnelType,
                nextDescent: fmtYmd(descent),
                nextReturn: fmtYmd(ret)
            };

            if (today.getTime() === descent.getTime()) {
                goingDown.push(info);
            } else if (today.getTime() === ret.getTime()) {
                comingUp.push(info);
            }

            if (today.getTime() > descent.getTime() && today.getTime() < ret.getTime()) {
                onVacation.push(info);
            }
        }

        return {
            date: fmtYmd(today),
            goingDown,
            comingUp,
            onVacation
        };
    }

    /**
     * ربط حالات الخط (تاب العمليات) بكروت «التمامات المؤثرة على القوة».
     * حالة تعيين الخط بتغلب حالة سجل الفرد — من غير أي تغيير في منطق العمليات نفسه
     * (العمليات لسه بتتحسب من التعيينات زي ما هي، هنا بنقرأ بس).
     *  - غياب              → غياب
     *  - سجن               → محكمه
     *  - مرضي              → مستشفى خارجي
     *  - إجازة/مهمة/منقول  → «خارج» (من غير كارت تمام)
     *  - حاضر              → لا تغيير (سجل الفرد هو المصدر)
     *  - عسكري مكتب        → لا يتحسب «خارج» (موجود في الوحدة)
     */
    private static readonly LINE_STATUS_TO_CONDITION: Record<string, string> = {
        "غياب": "absence",
        "سجن": "court",
        "مرضي": "extHospital"
    };

    /** حالات الخط اللي معناها العسكري مش موجود في القطاع */
    private static readonly LINE_STATUS_OUT = new Set([
        "إجازة", "مرضي", "سجن", "مهمة", "غياب", "منقول"
    ]);

    /** تمام سجل الفرد → مفتاح كارت المؤثرات */
    private static readonly RECORD_STATUS_TO_CONDITION: Record<string, string> = {
        "غياب": "absence",
        "محكمه": "court",
        "مستشفى خارجي": "extHospital",
        "عرض مستشفى": "hospRef"
    };

    /**
     * تعبير SQL للحالة الفعّالة للفرد — مطابق 100% لمنطق getStrength
     * (كروت الرئيسية + الحفر من الأفراد يجيبوا نفس الأرقام):
     *  1) حالة خط مؤثرة (غياب/سجن/مرضي) → بتغلب سجل الفرد
     *  2) سجل الفرد لو مش «داخل القطاع»
     *  3) حالة خط معناها مش موجود (إجازة/مهمة/منقول) → اجازه/ماموريه/منقول
     *  4) غير كده «داخل القطاع»
     * «حاضر» لا تغيّر حاجة، و«مكتب» مستبعد (موجود في الوحدة).
     * (يستخدم alias "personnel" بتاع buildFilteredQuery)
     */
    private static readonly EFFECTIVE_STATUS_SQL = `COALESCE(
        (SELECT CASE la.status
            WHEN 'غياب' THEN 'غياب'
            WHEN 'سجن' THEN 'محكمه'
            WHEN 'مرضي' THEN 'مستشفى خارجي'
            ELSE NULL
         END
         FROM line_assignments la
         WHERE la."personnelId" = personnel.id
           AND la."officeDuty" = false
           AND la.status IN ('غياب','سجن','مرضي')
         LIMIT 1),
        NULLIF(personnel.status, 'داخل القطاع'),
        (SELECT CASE la.status
            WHEN 'إجازة' THEN 'اجازه'
            WHEN 'مهمة' THEN 'ماموريه'
            WHEN 'منقول' THEN 'منقول'
            ELSE NULL
         END
         FROM line_assignments la
         WHERE la."personnelId" = personnel.id
           AND la."officeDuty" = false
           AND la.status IN ('إجازة','مهمة','منقول')
         LIMIT 1),
        personnel.status
    )`;

    /** هل الفرد خارج القطاع؟ (سجل خارج القطاع أو حالة خط معناها مش موجود) */
    private static readonly IS_OUT_SQL = `(
        personnel.status != 'داخل القطاع'
        OR EXISTS (
            SELECT 1 FROM line_assignments la
            WHERE la."personnelId" = personnel.id
              AND la."officeDuty" = false
              AND la.status IN ('إجازة','مرضي','سجن','مهمة','غياب','منقول')
        )
    )`;

    /**
     * إجمالي القوة حسب النوع (حربية / تشغيل حربيه / داخلية):
     * groups: total = الكل، out = أي حالة غير 'داخل القطاع'، present = total - out.
     * conditions: عدّادات المؤثرات — للمديرين ومستخدم الشئون (شئون داخلية/شئون مجندين).
     * النطاق من المستخدم المصادق عليه: أدمن → الكل، حربية → حربية+تشغيل، داخلية → داخلية فقط.
     * بدون scope معروف → فارغ (fail-closed). قراءة فقط.
     */
    async getStrength(options?: {
        userRole?: string;
        userType?: string;
        userDepartment?: string;
    }): Promise<{
        groups: Record<string, { total: number; out: number; present: number }>;
        conditions?: Record<string, number>;
    }> {
        const role = options?.userRole;
        const isAdmin = role === 'admin';
        // مدير الداخلية: كل الصلاحيات، بس نطاقه داخلية (زي النطاق العادي)
        const isInternalManager = role === 'internal_manager';
        const department = (options?.userDepartment ?? '').trim();
        // مستخدم الشئون بيشوف المؤثرات زي مدير الداخلية
        const isPersonnelAffairsUser =
            department === 'شئون داخلية' || department === 'شئون مجندين';
        // seeConditions: المديران + مستخدم الشئون
        const seeConditions = isAdmin || isInternalManager || isPersonnelAffairsUser;
        const type = (options?.userType ?? '').trim();
        let allowed: string[] | null = null;
        if (!isAdmin) {
            if (!options || role === undefined) return { groups: {} };
            if (isInternalManager || type === 'داخلية') {
                allowed = ['داخلية', 'تشغيل حربيه', 'مستجد داخلية'];
            } else if (type === 'حربية') {
                allowed = ['حربية', 'تشغيل حربيه', 'مستجد حربية'];
            } else {
                return { groups: {} };
            }
        }

        // الأعمدة المطلوبة بس (أخف من تحميل الكيانات كاملة)
        const qb = this.repository.createQueryBuilder("p").select([
            "p.id",
            "p.personnelType",
            "p.status",
            "p.condWeaponBan",
            "p.condNeuro",
            "p.condStruckDischarged",
            "p.condStruckRetained"
        ]);
        if (allowed) {
            qb.andWhere("p.personnelType IN (:...allowed)", { allowed });
        }
        const people = await qb.getMany();

        // حالات الخط — مصدر الربط مع تاب العمليات (قراءة فقط، لا تعديل)
        const assignmentRepo = AppDataSource.getRepository(LineAssignment);
        const assignments = await assignmentRepo.find({
            select: ["personnelId", "status", "officeDuty"]
        });
        const lineByPersonnel = new Map<string, { status: string; officeDuty: boolean }>();
        for (const a of assignments) {
            lineByPersonnel.set(a.personnelId, {
                status: (a.status || "").trim(),
                officeDuty: !!a.officeDuty
            });
        }

        const result: Record<string, { total: number; out: number; present: number }> = {};
        const keys = allowed ?? ["حربية", "تشغيل حربيه", "داخلية"];
        for (const k of keys) {
            result[k] = { total: 0, out: 0, present: 0 };
        }

        const conditions = {
            weaponBan: 0,
            neuro: 0,
            struckDischarged: 0,
            struckRetained: 0,
            absence: 0,
            extHospital: 0,
            court: 0,
            hospRef: 0,
            affectedTotal: 0
        };

        for (const p of people) {
            const key = (p.personnelType || "").trim() || "غير محدد";
            if (!result[key]) result[key] = { total: 0, out: 0, present: 0 };

            const recordStatus = (p.status || "").trim();
            const line = lineByPersonnel.get(p.id);
            // «مكتب» الحالة «إجازة» عنده للدوران بس — هو موجود في الوحدة
            const lineStatus = line && !line.officeDuty ? line.status : "";

            // «خارج» لو سجل الفرد خارج القطاع أو حالة الخط معناها مش موجود
            const isOut = recordStatus !== "داخل القطاع" ||
                PersonnelService.LINE_STATUS_OUT.has(lineStatus);

            result[key].total++;
            if (isOut) result[key].out++;

            if (!seeConditions) continue;

            // حالة الخط بتغلب سجل الفرد (لو الخط «حاضر» نرجع للسجل)
            const cond =
                PersonnelService.LINE_STATUS_TO_CONDITION[lineStatus] ||
                PersonnelService.RECORD_STATUS_TO_CONDITION[recordStatus] ||
                null;

            if (cond) conditions[cond as keyof typeof conditions]++;

            if (p.condWeaponBan) conditions.weaponBan++;
            if (p.condNeuro) conditions.neuro++;
            if (p.condStruckDischarged) conditions.struckDischarged++;
            if (p.condStruckRetained) conditions.struckRetained++;

            // إجمالي المؤثرين = الفرد مرة واحدة حتى لو عليه أكتر من مؤثر
            if (
                cond ||
                p.condWeaponBan ||
                p.condNeuro ||
                p.condStruckDischarged ||
                p.condStruckRetained
            ) {
                conditions.affectedTotal++;
            }
        }

        for (const k of Object.keys(result)) {
            result[k].present = result[k].total - result[k].out;
        }

        if (!seeConditions) {
            return { groups: result };
        }
        return { groups: result, conditions };
    }
}
export const personnelService = new PersonnelService();
