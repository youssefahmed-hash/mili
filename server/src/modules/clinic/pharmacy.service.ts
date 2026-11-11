import { AppDataSource } from "../../config/data-source";
import { PharmacyDrug, PharmacyUnit, normalizeUnit } from "../../entities/PharmacyDrug";
import { PharmacyBatch } from "../../entities/PharmacyBatch";
import { PharmacyDispense } from "../../entities/PharmacyDispense";
import { PharmacyDispenseItem } from "../../entities/PharmacyDispenseItem";
import { Personnel } from "../../entities/Personnel";
import { ClinicRecord } from "../../entities/ClinicRecord";
import { MoreThan, MoreThanOrEqual, IsNull, Not, In, EntityManager } from "typeorm";

export interface PharmacyDispenseInput {
    personnelId: string;
    clinicRecordId?: string | null;
    notes?: string | null;
    createdBy?: string | null;
    items: {
        drugId: string;
        qty: number;
        unit: PharmacyUnit;
        /** اختيار يدوي لشحنة محددة (اختياري) — لو مش موجود نستخدم FEFO */
        batchId?: string | null;
    }[];
    /** تجاوز نافذة تأكيد FEFO */
    confirmSplit?: boolean;
}

// ===================== تطبيع البحث العربي =====================
/**
 * يوحّد الحروف المتشابهة عشان البحث ما يفشلش بسبب اختلاف الكتابة.
 * مثال: «ى»→«ي» و«ة»→«ه» و«أ/إ/آ»→«ا»
 * (مهم: لا نطبّع الألف、無 hamza/topological في النص المخزّن — فقط للبحث.)
 */
export const normalizeAr = (s: string): string =>
    String(s ?? "")
        .trim()
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ي")
        .replace(/[ـً-ٟ]/g, ""); // تطويل + تشكيل

const ymd = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const todayYmd = (): string => ymd(new Date());

// ===================== معادلة الوحدات =====================
// الوحدة الأساسية = الحبة. كل التخزين بالحبة.
export const toPills = (
    unit: PharmacyUnit,
    qty: number,
    breakdown: { pillsPerStrip: number; stripsPerBox: number; boxesPerCarton: number }
): number => {
    const { pillsPerStrip, stripsPerBox, boxesPerCarton } = breakdown;
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n <= 0) return 0;
    switch (unit) {
        case "كرتونة":
            return n * pillsPerStrip * stripsPerBox * boxesPerCarton;
        case "علبة":
            return n * pillsPerStrip * stripsPerBox;
        case "شريط":
            return n * pillsPerStrip;
        case "حبة":
        default:
            return n;
    }
};

/** تحويل العكس — للعرض فقط (تقريب لأعلى) */
export const fromPills = (
    pills: number,
    breakdown: { pillsPerStrip: number; stripsPerBox: number; boxesPerCarton: number }
): Record<string, number> => {
    const { pillsPerStrip, stripsPerBox, boxesPerCarton } = breakdown;
    const p = Math.max(0, Math.floor(pills));
    const perStrip = Math.max(1, pillsPerStrip);
    const perBox = Math.max(1, perStrip * stripsPerBox);
    const perCarton = Math.max(1, perBox * boxesPerCarton);
    return {
        حبة: p,
        شريط: Math.ceil(p / perStrip),
        علبة: Math.ceil(p / perBox),
        كرتونة: Math.ceil(p / perCarton)
    };
};

export const unitListFor = (drug: PharmacyDrug): PharmacyUnit[] => {
    const out: PharmacyUnit[] = [];
    if (drug.allowCarton) out.push("كرتونة");
    if (drug.allowBox) out.push("علبة");
    if (drug.allowStrip) out.push("شريط");
    if (drug.allowPill) out.push("حبة");
    return out.length ? out : ["حبة"];
};

const breakdownOf = (d: PharmacyDrug) => ({
    pillsPerStrip: Math.max(1, d.pillsPerStrip || 1),
    stripsPerBox: Math.max(1, d.stripsPerBox || 1),
    boxesPerCarton: Math.max(1, d.boxesPerCarton || 1)
});

export class PharmacyService {
    private drugRepo = AppDataSource.getRepository(PharmacyDrug);
    private batchRepo = AppDataSource.getRepository(PharmacyBatch);
    private dispenseRepo = AppDataSource.getRepository(PharmacyDispense);
    private itemRepo = AppDataSource.getRepository(PharmacyDispenseItem);
    private personnelRepo = AppDataSource.getRepository(Personnel);
    private clinicRepo = AppDataSource.getRepository(ClinicRecord);

    // ===================== الأصناف =====================

    /** بحث جزئي بالاسم (عربي/إنجليزي) أو الكود */
    async getDrugs(search?: string) {
        const qb = this.drugRepo
            .createQueryBuilder("d")
            .orderBy("d.name", "ASC");

        const term = String(search ?? "").trim();
        if (term) {
            // البحث على الأعمدة المطبّعة (nameNorm / nameEnNorm / codeNorm)
            // + على الأصل أيضاً — لو الكود لاتيني والتطبيع غيّره
            const like = `%${term}%`;
            const norm = `%${normalizeAr(term)}%`;
            qb.andWhere(
                "(d.nameNorm ILIKE :norm OR d.nameEnNorm ILIKE :norm OR d.codeNorm ILIKE :norm OR d.name ILIKE :like OR d.nameEn ILIKE :like OR d.code ILIKE :like)",
                { like, norm }
            );
        }

        const drugs = await qb.getMany();
        return this.withStock(drugs);
    }

    async getDrug(id: string) {
        const drug = await this.drugRepo.findOne({ where: { id } });
        if (!drug) return null;
        const [withStock] = await this.withStock([drug]);
        return withStock;
    }

    /** يضيف رصيد المخزون والوحدات المتاحة لكل صنف */
    private async withStock(drugs: PharmacyDrug[]) {
        if (!drugs.length) return [];
        const ids = drugs.map((d) => d.id);
        const rows = await this.batchRepo
            .createQueryBuilder("b")
            .select("b.drugId", "drugId")
            .addSelect("COUNT(*)", "batches")
            .addSelect(
                "COALESCE(SUM(b.qtyRemainingPills), 0)",
                "remainingPills"
            )
            .addSelect(
                "MIN(b.expiryDate) FILTER (WHERE b.qtyRemainingPills > 0 AND b.expiryDate >= CURRENT_DATE)",
                "closestExpiry"
            )
            .where("b.drugId IN (:...ids)", { ids })
            .groupBy("b.drugId")
            .getRawMany<{ drugId: string; batches: string; remainingPills: string; closestExpiry: string | null }>();

        const map = new Map(rows.map((r) => [r.drugId, r]));
        const today = todayYmd();
        return drugs.map((d) => {
            const r = map.get(d.id);
            const remainingPills = parseInt(r?.remainingPills || "0", 10) || 0;
            const bd = breakdownOf(d);
            return {
                ...d,
                unitsAvailable: unitListFor(d),
                breakdown: bd,
                stockPills: remainingPills,
                stockDisplay: fromPills(remainingPills, bd),
                batchCount: parseInt(r?.batches || "0", 10) || 0,
                closestExpiry: r?.closestExpiry ? ymd(new Date(r.closestExpiry)) : null,
                inStock: remainingPills > 0,
                outOfStock: remainingPills === 0,
                isExpired: r?.closestExpiry ? r.closestExpiry <= today : false
            };
        });
    }

    private async requireDrug(id: string): Promise<PharmacyDrug> {
        const drug = await this.drugRepo.findOne({ where: { id } });
        if (!drug) throw new Error("الصنف غير موجود في الصيدلية");
        return drug;
    }

    /** يضمن فريدية الكود (فاضي مسموح لأكثر من صنف) */
    private async assertCodeFree(code: string | null, excludeId?: string) {
        const clean = String(code ?? "").trim();
        if (!clean) return null;
        const existing = await this.drugRepo
            .createQueryBuilder("d")
            .where("d.code = :code", { code: clean })
            .getOne();
        if (existing && existing.id !== excludeId) {
            throw new Error(`الكود «${clean}» مستخدم بالفعل في صنف: ${existing.name}`);
        }
        return clean;
    }

    async createDrug(data: Partial<PharmacyDrug>) {
        const name = String(data.name ?? "").trim();
        if (!name) throw new Error("اسم الدواء مطلوب");
        const code = await this.assertCodeFree(data.code ?? null);
        const nameEn = (data.nameEn ?? "").trim() || null;
        const drug = this.drugRepo.create({
            name,
            nameEn,
            code,
            nameNorm: normalizeAr(name),
            nameEnNorm: nameEn ? normalizeAr(nameEn) : null,
            codeNorm: code ? normalizeAr(code) : null,
            barcode: (data.barcode ?? "").trim() || null,
            allowCarton: !!data.allowCarton,
            allowBox: !!data.allowBox,
            allowStrip: !!data.allowStrip,
            allowPill: data.allowPill === undefined ? true : !!data.allowPill,
            pillsPerStrip: Math.max(1, parseInt(String(data.pillsPerStrip ?? 1), 10) || 1),
            stripsPerBox: Math.max(1, parseInt(String(data.stripsPerBox ?? 1), 10) || 1),
            boxesPerCarton: Math.max(1, parseInt(String(data.boxesPerCarton ?? 1), 10) || 1),
            notes: (data.notes ?? "").trim() || null
        });
        const saved = await this.drugRepo.save(drug);
        return this.getDrug(saved.id);
    }

    async updateDrug(id: string, data: Partial<PharmacyDrug>) {
        const drug = await this.requireDrug(id);
        if (data.name !== undefined) {
            const n = String(data.name).trim();
            if (!n) throw new Error("اسم الدواء مطلوب");
            drug.name = n;
            drug.nameNorm = normalizeAr(n);
        }
        if (data.code !== undefined) {
            drug.code = await this.assertCodeFree(data.code, id);
            drug.codeNorm = drug.code ? normalizeAr(drug.code) : null;
        }
        if (data.nameEn !== undefined) {
            drug.nameEn = String(data.nameEn).trim() || null;
            drug.nameEnNorm = drug.nameEn ? normalizeAr(drug.nameEn) : null;
        }
        if (data.barcode !== undefined) drug.barcode = String(data.barcode).trim() || null;
        for (const f of ["allowCarton", "allowBox", "allowStrip", "allowPill"] as const) {
            if (data[f] !== undefined) drug[f] = !!data[f];
        }
        for (const [field, min] of [
            ["pillsPerStrip", 1],
            ["stripsPerBox", 1],
            ["boxesPerCarton", 1]
        ] as const) {
            if (data[field] !== undefined) {
                drug[field] = Math.max(min, parseInt(String(data[field] ?? min), 10) || min);
            }
        }
        if (data.notes !== undefined) drug.notes = String(data.notes).trim() || null;
        await this.drugRepo.save(drug);
        return this.getDrug(id);
    }

    async deleteDrug(id: string) {
        const drug = await this.requireDrug(id);
        const used = await this.itemRepo.countBy({ drugId: id });
        if (used > 0) throw new Error("لا يمكن حذف صنف تم صرف منه — يمكن تعطيله بدلاً من ذلك");
        await this.drugRepo.remove(drug);
        return true;
    }

    // ===================== المشتريات / الدفعات =====================

    /** تسجيل فاتورة مشتريات (دفعة/شحنة واحدة) */
    async createBatch(data: Partial<PharmacyBatch>) {
        const drug = await this.requireDrug(String(data.drugId ?? ""));
        const unit = normalizeUnit(data.unit);

        const qtyReceived = Math.floor(Number(data.qtyReceived));
        if (!Number.isFinite(qtyReceived) || qtyReceived <= 0) {
            throw new Error("الكمية الواردة مطلوبة ويجب أن تكون أكبر من صفر");
        }
        if (!data.expiryDate) throw new Error("تاريخ انتهاء الصلاحية مطلوب");

        const expiry = new Date(String(data.expiryDate));
        if (Number.isNaN(expiry.getTime())) throw new Error("تاريخ الصلاحية غير صالح");

        const qtyReceivedPills = toPills(unit, qtyReceived, breakdownOf(drug));
        if (qtyReceivedPills <= 0) throw new Error("الكمية المحسوبة غير صالحة — راجع التقسيم");

        const batch = this.batchRepo.create({
            drugId: drug.id,
            batchNumber: (data.batchNumber ?? "").trim() || null,
            expiryDate: expiry,
            unit,
            qtyReceived,
            qtyReceivedPills,
            qtyRemainingPills: qtyReceivedPills,
            supplier: (data.supplier ?? "").trim() || null,
            invoiceNo: (data.invoiceNo ?? "").trim() || null,
            purchaseDate: data.purchaseDate ? new Date(String(data.purchaseDate)) : null,
            purchasePrice:
                data.purchasePrice === undefined || data.purchasePrice === null || data.purchasePrice === ""
                    ? null
                    : String(data.purchasePrice),
            notes: (data.notes ?? "").trim() || null
        });
        const saved = await this.batchRepo.save(batch);
        return this.decorateBatch(saved);
    }

    private async decorateBatch(b: PharmacyBatch) {
        const drug = await this.drugRepo.findOne({ where: { id: b.drugId } });
        const bd = drug ? breakdownOf(drug) : { pillsPerStrip: 1, stripsPerBox: 1, boxesPerCarton: 1 };
        const today = todayYmd();
        const expiry = ymd(new Date(b.expiryDate));
        return {
            ...b,
            expiryDate: expiry,
            purchaseDate: b.purchaseDate ? ymd(new Date(b.purchaseDate)) : null,
            drug: drug
                ? {
                      id: drug.id,
                      name: drug.name,
                      code: drug.code,
                      nameEn: drug.nameEn,
                      breakdown: bd,
                      unitsAvailable: unitListFor(drug)
                  }
                : null,
            remainingDisplay: fromPills(b.qtyRemainingPills, bd),
            isExpired: expiry < today,
            daysToExpiry: Math.round(
                (new Date(expiry).getTime() - new Date(today).getTime()) / 86400000
            )
        };
    }

    async getBatches(filter?: {
        drugId?: string;
        availableOnly?: boolean;
        expiringMonths?: number;
    }) {
        const qb = this.batchRepo
            .createQueryBuilder("b")
            .leftJoinAndSelect("b.drug", "drug")
            .orderBy("b.expiryDate", "ASC");

        if (filter?.drugId) qb.andWhere("b.drugId = :drugId", { drugId: filter.drugId });

        if (filter?.availableOnly) {
            qb.andWhere("b.qtyRemainingPills > 0")
                .andWhere("b.expiryDate >= CURRENT_DATE");
        }

        if (filter?.expiringMonths != null && filter.expiringMonths > 0) {
            const days = Math.round(filter.expiringMonths * 30.44);
            const d = new Date();
            d.setDate(d.getDate() + days);
            qb.andWhere("b.qtyRemainingPills > 0")
                .andWhere("b.expiryDate <= :limit", { limit: ymd(d) });
        }

        const rows = await qb.getMany();
        return Promise.all(rows.map((b) => this.decorateBatch(b)));
    }

    /** دفعات صنف معيّن مرتبة بالأقرب انتهاءً (FEFO) — مع رايات */
    async getDrugBatchesForFEFO(drugId: string) {
        const drug = await this.requireDrug(drugId);
        const today = todayYmd();

        const all = await this.batchRepo
            .createQueryBuilder("b")
            .where("b.drugId = :drugId", { drugId })
            .orderBy("b.expiryDate", "ASC")
            .getMany();

        const decorated = await Promise.all(all.map((b) => this.decorateBatch(b)));

        const available = decorated.filter((b) => b.qtyRemainingPills > 0 && b.expiryDate >= today);
        const expired = decorated.filter((b) => b.qtyRemainingPills > 0 && b.expiryDate < today);
        const empty = decorated.filter((b) => b.qtyRemainingPills <= 0);

        const totalAvailable = available.reduce((s, b) => s + b.qtyRemainingPills, 0);
        const bd = breakdownOf(drug);

        return {
            drug: {
                id: drug.id,
                name: drug.name,
                code: drug.code,
                nameEn: drug.nameEn,
                unitsAvailable: unitListFor(drug),
                breakdown: bd,
                unitsDisplay: fromPills(totalAvailable, bd)
            },
            totalAvailablePills: totalAvailable,
            // batches مرتبة الأقرب انتهاءً — isClosest على أول وحدة قابلة للصرف
            batches: available.map((b, i) => ({ ...b, isClosest: i === 0 })),
            expiredBatches: expired.map((b) => ({ ...b, isExpired: true })),
            hasMultipleBatches: available.length > 1
        };
    }

    async deleteBatch(id: string) {
        const batch = await this.batchRepo.findOne({ where: { id } });
        if (!batch) throw new Error("الشحنة غير موجودة");
        const used = await this.itemRepo.countBy({ batchId: id });
        if (used > 0) throw new Error("لا يمكن حذف شحنة تم الصرف منها");
        if (batch.qtyRemainingPills !== batch.qtyReceivedPills) {
            throw new Error("لا يمكن حذف شحنة اتصرف جزء منها");
        }
        await this.batchRepo.remove(batch);
        return true;
    }

    // ===================== تنبيه الصلاحية =====================

    // ===================== تقرير الرواكد =====================

    /**
     * الأصناف الراكدة: لسه في المخزون بس مش بتتحرك.
     * - neverDispensed: متخزّن وماتباعش خالص
     * - stale: آخر صرف قبل `days` يوم أو أكتر
     * الشحنات المنتهية أو الفاضية مش محسوبة (دي بتاعة تقرير الصلاحية).
     */
    async getDeadStock(days = 90) {
        const today = new Date();
        const threshold = Math.max(1, days);
        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() - threshold);

        // صنف واحد، إجمالي المتبقي، وآخر صرف
        const rows = await this.drugRepo
            .createQueryBuilder("d")
            .innerJoin(
                PharmacyBatch,
                "b",
                "b.drugId = d.id AND b.qtyRemainingPills > 0 AND b.expiryDate >= CURRENT_DATE"
            )
            .leftJoin(
                PharmacyDispenseItem,
                "di",
                "di.drugId = d.id",
            )
            .select("d.id", "id")
            .addSelect("d.name", "name")
            .addSelect("d.code", "code")
            .addSelect("d.nameEn", "nameEn")
            .addSelect("d.pillsPerStrip", "pillsPerStrip")
            .addSelect("d.stripsPerBox", "stripsPerBox")
            .addSelect("d.boxesPerCarton", "boxesPerCarton")
            .addSelect("COUNT(DISTINCT b.id)", "batchCount")
            .addSelect("COALESCE(SUM(DISTINCT b.qtyRemainingPills), 0)", "remainingPills")
            .addSelect("MAX(di.createdAt)", "lastDispensed")
            .groupBy("d.id")
            .addOrderBy("MAX(di.createdAt)", "ASC", "NULLS FIRST")
            .addOrderBy("COALESCE(SUM(DISTINCT b.qtyRemainingPills), 0)", "DESC")
            .getRawMany<{
                id: string;
                name: string;
                code: string | null;
                nameEn: string | null;
                pillsPerStrip: string;
                stripsPerBox: string;
                boxesPerCarton: string;
                batchCount: string;
                remainingPills: string;
                lastDispensed: string | null;
            }>();

        const items = rows.map((r) => {
            const bd = {
                pillsPerStrip: Math.max(1, parseInt(r.pillsPerStrip, 10) || 1),
                stripsPerBox: Math.max(1, parseInt(r.stripsPerBox, 10) || 1),
                boxesPerCarton: Math.max(1, parseInt(r.boxesPerCarton, 10) || 1)
            };
            const pills = parseInt(r.remainingPills, 10) || 0;
            const last = r.lastDispensed ? new Date(r.lastDispensed) : null;
            return {
                drugId: r.id,
                name: r.name,
                code: r.code,
                nameEn: r.nameEn,
                breakdown: bd,
                remainingPills: pills,
                remainingDisplay: fromPills(pills, bd),
                batchCount: parseInt(r.batchCount, 10) || 0,
                lastDispensed: last ? last.toISOString() : null,
                daysSinceLastDispense: last
                    ? Math.floor((today.getTime() - last.getTime()) / 86400000)
                    : null,
                status: !last ? 'never' : last.getTime() < cutoff.getTime() ? 'stale' : 'moving'
            } as const;
        });

        const dead = items.filter((i) => i.status !== 'moving');
        return {
            thresholdDays: threshold,
            cutoff: ymd(cutoff),
            items: dead,
            moving: items.filter((i) => i.status === 'moving').length,
            counts: {
                neverDispensed: dead.filter((i) => i.status === 'never').length,
                stale: dead.filter((i) => i.status === 'stale').length,
                total: dead.length
            },
            /** إجمالي pills راكدة — أسرع رقم للقرار */
            deadPills: dead.reduce((s, i) => s + i.remainingPills, 0)
        };
    }

    async getExpiring(months = 3) {
        const today = new Date();
        const limit = new Date(today);
        limit.setMonth(limit.getMonth() + Math.max(1, months));

        const rows = await this.batchRepo
            .createQueryBuilder("b")
            .leftJoinAndSelect("b.drug", "drug")
            .where("b.qtyRemainingPills > 0")
            .andWhere("b.expiryDate <= :limit", { limit: ymd(limit) })
            .orderBy("b.expiryDate", "ASC")
            .getMany();

        const decorated = await Promise.all(rows.map((b) => this.decorateBatch(b)));
        const y = ymd(today);

        const buckets = {
            expired: decorated.filter((b) => b.expiryDate < y),
            within3: decorated.filter((b) => b.expiryDate >= y && b.daysToExpiry <= 92),
            within6: decorated.filter((b) => b.daysToExpiry > 92 && b.daysToExpiry <= 183)
        };

        return {
            thresholdMonths: months,
            buckets,
            counts: {
                expired: buckets.expired.length,
                within3: buckets.within3.length,
                within6: buckets.within6.length,
                total: decorated.length
            }
        };
    }

    // ===================== الصرف =====================

    /**
     * صرف دواء — داخل transaction واحد:
     *   1) قفل الدفعات (pessimistic_write) لمنع الخصم المزدوج المتزامن
     *   2) اختيار FEFO (الأقرب انتهاءً أولاً)
     *   3) تقسيم الكمية على أكثر من شحنة لو لزم
     *   4) نقصان المخزون + إنشاء الصرف والأسطر
     * أي خطأ → rollback كامل
     *
     * dispenseCore هو المنطق نفسه بس بياخد EntityManager — عشان نقدر نستخدمه
     * جوه transaction كبير (تسجيل كشف طبي + صرف في عملية واحدة).
     */
    async dispense(payload: PharmacyDispenseInput) {
        return await AppDataSource.transaction(async (m) => this.dispenseCore(m, payload));
    }

    async dispenseCore(m: EntityManager, payload: PharmacyDispenseInput) {
        const personnel = await m.findOne(Personnel, { where: { id: payload.personnelId } });
        if (!personnel) throw new Error("العسكري المحدد غير مسجل في النظام");

        if (payload.clinicRecordId) {
            const rec = await m.findOne(ClinicRecord, { where: { id: payload.clinicRecordId } });
            if (!rec) throw new Error("الكشف الطبي المحدد غير موجود");
        }

        if (!payload.items?.length) throw new Error("لا توجد أصناف للصرف");

        const today = ymd(new Date());

        // ① نتحقق أولاً إن فيه دفعة واحدة على الأقل من كل صنف (قبل أي تعديل)
        const plans: {
            drug: PharmacyDrug;
            needPills: number;
                unit: PharmacyUnit;
                qty: number;
                batchId?: string | null;
            }[] = [];

            for (const it of payload.items) {
                const drug = await m.findOne(PharmacyDrug, { where: { id: it.drugId } });
                if (!drug) throw new Error("صنف غير موجود في الصيدلية");

                const unit = normalizeUnit(it.unit);
                const allowed = unitListFor(drug);
                if (!allowed.includes(unit)) {
                    throw new Error(`الوحدة «${unit}» غير متاحة للصرف في صنف: ${drug.name}`);
                }

                const qty = Math.floor(Number(it.qty));
                if (!Number.isFinite(qty) || qty <= 0) {
                    throw new Error(`الكمية غير صالحة للصنف: ${drug.name}`);
                }

                const needPills = toPills(unit, qty, breakdownOf(drug));
                if (needPills <= 0) {
                    throw new Error(`الكمية المحسوبة غير صالحة للصنف: ${drug.name}`);
                }
                plans.push({ drug, needPills, unit, qty, batchId: it.batchId ?? null });
            }

            // ② قفل + تحميل الدفعات مرتبة FEFO
            const drugIds = [...new Set(plans.map((p) => p.drug.id))];
            const lockedBatches = await m
                .createQueryBuilder(PharmacyBatch, "b")
                .setLock("pessimistic_write")
                .where("b.drugId IN (:...drugIds)", { drugIds })
                .orderBy("b.expiryDate", "ASC")
                .getMany();

            const expiresBefore = new Date(`${today}T00:00:00Z`).getTime();
            const isSellable = (b: PharmacyBatch) =>
                b.qtyRemainingPills > 0 && new Date(b.expiryDate).getTime() >= expiresBefore;

            // ③ خطة الصرف لكل صنف + كشف لو محتاج تأكيد
            const splitNeeded: string[] = [];
            const allocations: {
                batch: PharmacyBatch;
                pills: number;
                plan: (typeof plans)[number];
            }[] = [];

            for (const plan of plans) {
                const pool = lockedBatches.filter((b) => b.drugId === plan.drug.id);

                if (plan.batchId) {
                    // اختيار يدوي لشحنة محددة
                    const chosen = pool.find((b) => b.id === plan.batchId);
                    if (!chosen) throw new Error("الشحنة المحددة غير موجودة لهذا الصنف");
                    if (!isSellable(chosen)) {
                        throw new Error(
                            `الشحنة ${chosen.batchNumber || chosen.id.slice(0, 6)} غير صالحة للصرف (منتهية أو خلصت)`
                        );
                    }
                    if (chosen.qtyRemainingPills < plan.needPills) {
                        throw new Error(
                            `الرصيد في الشحنة المحددة غير كافٍ للصنف: ${plan.drug.name}`
                        );
                    }
                    allocations.push({ batch: chosen, pills: plan.needPills, plan });
                    continue;
                }

                const sellable = pool.filter(isSellable); // مرتبة FEFO
                const total = sellable.reduce((s, b) => s + b.qtyRemainingPills, 0);

                if (total <= 0) {
                    throw new Error(`الصنف «${plan.drug.name}» غير متاح — كل شحناته منتهية أو الخلصت`);
                }
                if (total < plan.needPills) {
                    const bd = breakdownOf(plan.drug);
                    throw new Error(
                        `المتاح من «${plan.drug.name}» هو ${fromPills(total, bd).حبة} حبة فقط، والمطلوب أكثر`
                    );
                }

                // لو محتاج قسمة على أكتر من دفعة → نطلب تأكيد
                let remaining = plan.needPills;
                const picked: PharmacyBatch[] = [];
                for (const b of sellable) {
                    if (remaining <= 0) break;
                    picked.push(b);
                    remaining -= b.qtyRemainingPills;
                }
                if (picked.length > 1) {
                    splitNeeded.push(
                        `${plan.drug.name}: هيتم الصرف من ${picked.length} شحنات (الأقرب انتهاءً أولاً)`
                    );
                }
                if (splitNeeded.length > 0 && !payload.confirmSplit) {
                    const err: any = new Error("الصرف هيتم تقسيمه على أكثر من شحنة — محتاج تأكيد");
                    err.status = 409;
                    err.needsConfirm = true;
                    err.splitWarnings = splitNeeded;
                    throw err;
                }

                let left = plan.needPills;
                for (const b of sellable) {
                    if (left <= 0) break;
                    const take = Math.min(left, b.qtyRemainingPills);
                    allocations.push({ batch: b, pills: take, plan });
                    left -= take;
                }
            }

            // ④ تنفيذ: نقصان المخزون + إنشاء الصرف
            const dispense = m.create(PharmacyDispense, {
                clinicRecordId: payload.clinicRecordId ?? null,
                personnelId: personnel.id,
                dispensedAt: new Date(),
                createdBy: payload.createdBy ?? null,
                notes: (payload.notes ?? "").trim() || null
            });
            const savedDispense = await m.save(PharmacyDispense, dispense);

            for (const alloc of allocations) {
                alloc.batch.qtyRemainingPills -= alloc.pills;
                await m.save(PharmacyBatch, alloc.batch);
            }

            // نجمّع الأسطر حسب الدفعة
            const byBatch = new Map<string, typeof allocations>();
            for (const a of allocations) {
                const arr = byBatch.get(a.batch.id) || [];
                arr.push(a);
                byBatch.set(a.batch.id, arr);
            }

            const items = [];
            for (const [batchId, group] of byBatch) {
                const totalPills = group.reduce((s, a) => s + a.pills, 0);
                const first = group[0];
                items.push(
                    m.create(PharmacyDispenseItem, {
                        dispenseId: savedDispense.id,
                        batchId,
                        drugId: first.plan.drug.id,
                        qtyPills: totalPills,
                        qty: first.plan.qty,
                        unit: first.plan.unit,
                        expirySnapshot: new Date(first.batch.expiryDate),
                        batchNumberSnapshot: first.batch.batchNumber ?? null
                    })
                );
            }
            await m.save(PharmacyDispenseItem, items);

            const full = await m.findOne(PharmacyDispense, {
                where: { id: savedDispense.id },
                relations: ["items", "items.drug", "items.batch", "personnel"]
            });

        return {
            dispense: full,
            warnings: splitNeeded,
            itemsCount: allocations.length
        };
    }

    /** سجل صرفmilitary — الأحدث أولاً، مع أصنافها */
    async getDispenses(filter?: { personnelId?: string; clinicRecordId?: string }) {
        const qb = this.dispenseRepo
            .createQueryBuilder("d")
            .leftJoinAndSelect("d.personnel", "personnel")
            .leftJoinAndSelect("d.items", "items")
            .leftJoinAndSelect("items.drug", "itemDrug")
            .leftJoinAndSelect("items.batch", "itemBatch")
            .orderBy("d.dispensedAt", "DESC");

        if (filter?.personnelId) qb.andWhere("d.personnelId = :pid", { pid: filter.personnelId });
        if (filter?.clinicRecordId) qb.andWhere("d.clinicRecordId = :cid", { cid: filter.clinicRecordId });

        const rows = await qb.getMany();
        return rows.map((d) => ({
            ...d,
            dispensedAt: d.dispensedAt ? d.dispensedAt.toISOString() : null,
            items: (d.items || []).map((i) => ({
                ...i,
                expirySnapshot: i.expirySnapshot ? ymd(new Date(i.expirySnapshot)) : null,
                drug: i.drug
                    ? { id: i.drug.id, name: i.drug.name, code: i.drug.code }
                    : null
            }))
        }));
    }
}

export const pharmacyService = new PharmacyService();
