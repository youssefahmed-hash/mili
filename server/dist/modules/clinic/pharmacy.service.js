"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pharmacyService = exports.PharmacyService = exports.unitListFor = exports.fromPills = exports.toPills = exports.normalizeAr = void 0;
const data_source_1 = require("../../config/data-source");
const PharmacyDrug_1 = require("../../entities/PharmacyDrug");
const PharmacyBatch_1 = require("../../entities/PharmacyBatch");
const PharmacyDispense_1 = require("../../entities/PharmacyDispense");
const PharmacyDispenseItem_1 = require("../../entities/PharmacyDispenseItem");
const Personnel_1 = require("../../entities/Personnel");
const ClinicRecord_1 = require("../../entities/ClinicRecord");
// ===================== تطبيع البحث العربي =====================
/**
 * يوحّد الحروف المتشابهة عشان البحث ما يفشلش بسبب اختلاف الكتابة.
 * مثال: «ى»→«ي» و«ة»→«ه» و«أ/إ/آ»→«ا»
 * (مهم: لا نطبّع الألف、無 hamza/topological في النص المخزّن — فقط للبحث.)
 */
const normalizeAr = (s) => String(s ?? "")
    .trim()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ـً-ٟ]/g, ""); // تطويل + تشكيل
exports.normalizeAr = normalizeAr;
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayYmd = () => ymd(new Date());
// ===================== معادلة الوحدات =====================
// الوحدة الأساسية = الحبة. كل التخزين بالحبة.
const toPills = (unit, qty, breakdown) => {
    const { pillsPerStrip, stripsPerBox, boxesPerCarton } = breakdown;
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n <= 0)
        return 0;
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
exports.toPills = toPills;
/** تحويل العكس — للعرض فقط (تقريب لأعلى) */
const fromPills = (pills, breakdown) => {
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
exports.fromPills = fromPills;
const unitListFor = (drug) => {
    const out = [];
    if (drug.allowCarton)
        out.push("كرتونة");
    if (drug.allowBox)
        out.push("علبة");
    if (drug.allowStrip)
        out.push("شريط");
    if (drug.allowPill)
        out.push("حبة");
    return out.length ? out : ["حبة"];
};
exports.unitListFor = unitListFor;
const breakdownOf = (d) => ({
    pillsPerStrip: Math.max(1, d.pillsPerStrip || 1),
    stripsPerBox: Math.max(1, d.stripsPerBox || 1),
    boxesPerCarton: Math.max(1, d.boxesPerCarton || 1)
});
class PharmacyService {
    constructor() {
        this.drugRepo = data_source_1.AppDataSource.getRepository(PharmacyDrug_1.PharmacyDrug);
        this.batchRepo = data_source_1.AppDataSource.getRepository(PharmacyBatch_1.PharmacyBatch);
        this.dispenseRepo = data_source_1.AppDataSource.getRepository(PharmacyDispense_1.PharmacyDispense);
        this.itemRepo = data_source_1.AppDataSource.getRepository(PharmacyDispenseItem_1.PharmacyDispenseItem);
        this.personnelRepo = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
        this.clinicRepo = data_source_1.AppDataSource.getRepository(ClinicRecord_1.ClinicRecord);
    }
    // ===================== الأصناف =====================
    /** بحث جزئي بالاسم (عربي/إنجليزي) أو الكود */
    async getDrugs(search) {
        const qb = this.drugRepo
            .createQueryBuilder("d")
            .orderBy("d.name", "ASC");
        const term = String(search ?? "").trim();
        if (term) {
            // البحث على الأعمدة المطبّعة (nameNorm / nameEnNorm / codeNorm)
            // + على الأصل أيضاً — لو الكود لاتيني والتطبيع غيّره
            const like = `%${term}%`;
            const norm = `%${(0, exports.normalizeAr)(term)}%`;
            qb.andWhere("(d.nameNorm ILIKE :norm OR d.nameEnNorm ILIKE :norm OR d.codeNorm ILIKE :norm OR d.name ILIKE :like OR d.nameEn ILIKE :like OR d.code ILIKE :like)", { like, norm });
        }
        const drugs = await qb.getMany();
        return this.withStock(drugs);
    }
    async getDrug(id) {
        const drug = await this.drugRepo.findOne({ where: { id } });
        if (!drug)
            return null;
        const [withStock] = await this.withStock([drug]);
        return withStock;
    }
    /** يضيف رصيد المخزون والوحدات المتاحة لكل صنف */
    async withStock(drugs) {
        if (!drugs.length)
            return [];
        const ids = drugs.map((d) => d.id);
        const rows = await this.batchRepo
            .createQueryBuilder("b")
            .select("b.drugId", "drugId")
            .addSelect("COUNT(*)", "batches")
            .addSelect("COALESCE(SUM(b.qtyRemainingPills), 0)", "remainingPills")
            .addSelect("MIN(b.expiryDate) FILTER (WHERE b.qtyRemainingPills > 0 AND b.expiryDate >= CURRENT_DATE)", "closestExpiry")
            .where("b.drugId IN (:...ids)", { ids })
            .groupBy("b.drugId")
            .getRawMany();
        const map = new Map(rows.map((r) => [r.drugId, r]));
        const today = todayYmd();
        return drugs.map((d) => {
            const r = map.get(d.id);
            const remainingPills = parseInt(r?.remainingPills || "0", 10) || 0;
            const bd = breakdownOf(d);
            return {
                ...d,
                unitsAvailable: (0, exports.unitListFor)(d),
                breakdown: bd,
                stockPills: remainingPills,
                stockDisplay: (0, exports.fromPills)(remainingPills, bd),
                batchCount: parseInt(r?.batches || "0", 10) || 0,
                closestExpiry: r?.closestExpiry ? ymd(new Date(r.closestExpiry)) : null,
                inStock: remainingPills > 0,
                outOfStock: remainingPills === 0,
                isExpired: r?.closestExpiry ? r.closestExpiry <= today : false
            };
        });
    }
    async requireDrug(id) {
        const drug = await this.drugRepo.findOne({ where: { id } });
        if (!drug)
            throw new Error("الصنف غير موجود في الصيدلية");
        return drug;
    }
    /** يضمن فريدية الكود (فاضي مسموح لأكثر من صنف) */
    async assertCodeFree(code, excludeId) {
        const clean = String(code ?? "").trim();
        if (!clean)
            return null;
        const existing = await this.drugRepo
            .createQueryBuilder("d")
            .where("d.code = :code", { code: clean })
            .getOne();
        if (existing && existing.id !== excludeId) {
            throw new Error(`الكود «${clean}» مستخدم بالفعل في صنف: ${existing.name}`);
        }
        return clean;
    }
    async createDrug(data) {
        const name = String(data.name ?? "").trim();
        if (!name)
            throw new Error("اسم الدواء مطلوب");
        const code = await this.assertCodeFree(data.code ?? null);
        const nameEn = (data.nameEn ?? "").trim() || null;
        const drug = this.drugRepo.create({
            name,
            nameEn,
            code,
            nameNorm: (0, exports.normalizeAr)(name),
            nameEnNorm: nameEn ? (0, exports.normalizeAr)(nameEn) : null,
            codeNorm: code ? (0, exports.normalizeAr)(code) : null,
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
    async updateDrug(id, data) {
        const drug = await this.requireDrug(id);
        if (data.name !== undefined) {
            const n = String(data.name).trim();
            if (!n)
                throw new Error("اسم الدواء مطلوب");
            drug.name = n;
            drug.nameNorm = (0, exports.normalizeAr)(n);
        }
        if (data.code !== undefined) {
            drug.code = await this.assertCodeFree(data.code, id);
            drug.codeNorm = drug.code ? (0, exports.normalizeAr)(drug.code) : null;
        }
        if (data.nameEn !== undefined) {
            drug.nameEn = String(data.nameEn).trim() || null;
            drug.nameEnNorm = drug.nameEn ? (0, exports.normalizeAr)(drug.nameEn) : null;
        }
        if (data.barcode !== undefined)
            drug.barcode = String(data.barcode).trim() || null;
        for (const f of ["allowCarton", "allowBox", "allowStrip", "allowPill"]) {
            if (data[f] !== undefined)
                drug[f] = !!data[f];
        }
        for (const [field, min] of [
            ["pillsPerStrip", 1],
            ["stripsPerBox", 1],
            ["boxesPerCarton", 1]
        ]) {
            if (data[field] !== undefined) {
                drug[field] = Math.max(min, parseInt(String(data[field] ?? min), 10) || min);
            }
        }
        if (data.notes !== undefined)
            drug.notes = String(data.notes).trim() || null;
        await this.drugRepo.save(drug);
        return this.getDrug(id);
    }
    async deleteDrug(id) {
        const drug = await this.requireDrug(id);
        const used = await this.itemRepo.countBy({ drugId: id });
        if (used > 0)
            throw new Error("لا يمكن حذف صنف تم صرف منه — يمكن تعطيله بدلاً من ذلك");
        await this.drugRepo.remove(drug);
        return true;
    }
    // ===================== المشتريات / الدفعات =====================
    /** تسجيل فاتورة مشتريات (دفعة/شحنة واحدة) */
    async createBatch(data) {
        const drug = await this.requireDrug(String(data.drugId ?? ""));
        const unit = (0, PharmacyDrug_1.normalizeUnit)(data.unit);
        const qtyReceived = Math.floor(Number(data.qtyReceived));
        if (!Number.isFinite(qtyReceived) || qtyReceived <= 0) {
            throw new Error("الكمية الواردة مطلوبة ويجب أن تكون أكبر من صفر");
        }
        if (!data.expiryDate)
            throw new Error("تاريخ انتهاء الصلاحية مطلوب");
        const expiry = new Date(String(data.expiryDate));
        if (Number.isNaN(expiry.getTime()))
            throw new Error("تاريخ الصلاحية غير صالح");
        const qtyReceivedPills = (0, exports.toPills)(unit, qtyReceived, breakdownOf(drug));
        if (qtyReceivedPills <= 0)
            throw new Error("الكمية المحسوبة غير صالحة — راجع التقسيم");
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
            purchasePrice: data.purchasePrice === undefined || data.purchasePrice === null || data.purchasePrice === ""
                ? null
                : String(data.purchasePrice),
            notes: (data.notes ?? "").trim() || null
        });
        const saved = await this.batchRepo.save(batch);
        return this.decorateBatch(saved);
    }
    async decorateBatch(b) {
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
                    unitsAvailable: (0, exports.unitListFor)(drug)
                }
                : null,
            remainingDisplay: (0, exports.fromPills)(b.qtyRemainingPills, bd),
            isExpired: expiry < today,
            daysToExpiry: Math.round((new Date(expiry).getTime() - new Date(today).getTime()) / 86400000)
        };
    }
    async getBatches(filter) {
        const qb = this.batchRepo
            .createQueryBuilder("b")
            .leftJoinAndSelect("b.drug", "drug")
            .orderBy("b.expiryDate", "ASC");
        if (filter?.drugId)
            qb.andWhere("b.drugId = :drugId", { drugId: filter.drugId });
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
    async getDrugBatchesForFEFO(drugId) {
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
                unitsAvailable: (0, exports.unitListFor)(drug),
                breakdown: bd,
                unitsDisplay: (0, exports.fromPills)(totalAvailable, bd)
            },
            totalAvailablePills: totalAvailable,
            // batches مرتبة الأقرب انتهاءً — isClosest على أول وحدة قابلة للصرف
            batches: available.map((b, i) => ({ ...b, isClosest: i === 0 })),
            expiredBatches: expired.map((b) => ({ ...b, isExpired: true })),
            hasMultipleBatches: available.length > 1
        };
    }
    async deleteBatch(id) {
        const batch = await this.batchRepo.findOne({ where: { id } });
        if (!batch)
            throw new Error("الشحنة غير موجودة");
        const used = await this.itemRepo.countBy({ batchId: id });
        if (used > 0)
            throw new Error("لا يمكن حذف شحنة تم الصرف منها");
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
            .innerJoin(PharmacyBatch_1.PharmacyBatch, "b", "b.drugId = d.id AND b.qtyRemainingPills > 0 AND b.expiryDate >= CURRENT_DATE")
            .leftJoin(PharmacyDispenseItem_1.PharmacyDispenseItem, "di", "di.drugId = d.id")
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
            .getRawMany();
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
                remainingDisplay: (0, exports.fromPills)(pills, bd),
                batchCount: parseInt(r.batchCount, 10) || 0,
                lastDispensed: last ? last.toISOString() : null,
                daysSinceLastDispense: last
                    ? Math.floor((today.getTime() - last.getTime()) / 86400000)
                    : null,
                status: !last ? 'never' : last.getTime() < cutoff.getTime() ? 'stale' : 'moving'
            };
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
    async dispense(payload) {
        return await data_source_1.AppDataSource.transaction(async (m) => this.dispenseCore(m, payload));
    }
    async dispenseCore(m, payload) {
        const personnel = await m.findOne(Personnel_1.Personnel, { where: { id: payload.personnelId } });
        if (!personnel)
            throw new Error("العسكري المحدد غير مسجل في النظام");
        if (payload.clinicRecordId) {
            const rec = await m.findOne(ClinicRecord_1.ClinicRecord, { where: { id: payload.clinicRecordId } });
            if (!rec)
                throw new Error("الكشف الطبي المحدد غير موجود");
        }
        if (!payload.items?.length)
            throw new Error("لا توجد أصناف للصرف");
        const today = ymd(new Date());
        // ① نتحقق أولاً إن فيه دفعة واحدة على الأقل من كل صنف (قبل أي تعديل)
        const plans = [];
        for (const it of payload.items) {
            const drug = await m.findOne(PharmacyDrug_1.PharmacyDrug, { where: { id: it.drugId } });
            if (!drug)
                throw new Error("صنف غير موجود في الصيدلية");
            const unit = (0, PharmacyDrug_1.normalizeUnit)(it.unit);
            const allowed = (0, exports.unitListFor)(drug);
            if (!allowed.includes(unit)) {
                throw new Error(`الوحدة «${unit}» غير متاحة للصرف في صنف: ${drug.name}`);
            }
            const qty = Math.floor(Number(it.qty));
            if (!Number.isFinite(qty) || qty <= 0) {
                throw new Error(`الكمية غير صالحة للصنف: ${drug.name}`);
            }
            const needPills = (0, exports.toPills)(unit, qty, breakdownOf(drug));
            if (needPills <= 0) {
                throw new Error(`الكمية المحسوبة غير صالحة للصنف: ${drug.name}`);
            }
            plans.push({ drug, needPills, unit, qty, batchId: it.batchId ?? null });
        }
        // ② قفل + تحميل الدفعات مرتبة FEFO
        const drugIds = [...new Set(plans.map((p) => p.drug.id))];
        const lockedBatches = await m
            .createQueryBuilder(PharmacyBatch_1.PharmacyBatch, "b")
            .setLock("pessimistic_write")
            .where("b.drugId IN (:...drugIds)", { drugIds })
            .orderBy("b.expiryDate", "ASC")
            .getMany();
        const expiresBefore = new Date(`${today}T00:00:00Z`).getTime();
        const isSellable = (b) => b.qtyRemainingPills > 0 && new Date(b.expiryDate).getTime() >= expiresBefore;
        // ③ خطة الصرف لكل صنف + كشف لو محتاج تأكيد
        const splitNeeded = [];
        const allocations = [];
        for (const plan of plans) {
            const pool = lockedBatches.filter((b) => b.drugId === plan.drug.id);
            if (plan.batchId) {
                // اختيار يدوي لشحنة محددة
                const chosen = pool.find((b) => b.id === plan.batchId);
                if (!chosen)
                    throw new Error("الشحنة المحددة غير موجودة لهذا الصنف");
                if (!isSellable(chosen)) {
                    throw new Error(`الشحنة ${chosen.batchNumber || chosen.id.slice(0, 6)} غير صالحة للصرف (منتهية أو خلصت)`);
                }
                if (chosen.qtyRemainingPills < plan.needPills) {
                    throw new Error(`الرصيد في الشحنة المحددة غير كافٍ للصنف: ${plan.drug.name}`);
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
                throw new Error(`المتاح من «${plan.drug.name}» هو ${(0, exports.fromPills)(total, bd).حبة} حبة فقط، والمطلوب أكثر`);
            }
            // لو محتاج قسمة على أكتر من دفعة → نطلب تأكيد
            let remaining = plan.needPills;
            const picked = [];
            for (const b of sellable) {
                if (remaining <= 0)
                    break;
                picked.push(b);
                remaining -= b.qtyRemainingPills;
            }
            if (picked.length > 1) {
                splitNeeded.push(`${plan.drug.name}: هيتم الصرف من ${picked.length} شحنات (الأقرب انتهاءً أولاً)`);
            }
            if (splitNeeded.length > 0 && !payload.confirmSplit) {
                const err = new Error("الصرف هيتم تقسيمه على أكثر من شحنة — محتاج تأكيد");
                err.status = 409;
                err.needsConfirm = true;
                err.splitWarnings = splitNeeded;
                throw err;
            }
            let left = plan.needPills;
            for (const b of sellable) {
                if (left <= 0)
                    break;
                const take = Math.min(left, b.qtyRemainingPills);
                allocations.push({ batch: b, pills: take, plan });
                left -= take;
            }
        }
        // ④ تنفيذ: نقصان المخزون + إنشاء الصرف
        const dispense = m.create(PharmacyDispense_1.PharmacyDispense, {
            clinicRecordId: payload.clinicRecordId ?? null,
            personnelId: personnel.id,
            dispensedAt: new Date(),
            createdBy: payload.createdBy ?? null,
            notes: (payload.notes ?? "").trim() || null
        });
        const savedDispense = await m.save(PharmacyDispense_1.PharmacyDispense, dispense);
        for (const alloc of allocations) {
            alloc.batch.qtyRemainingPills -= alloc.pills;
            await m.save(PharmacyBatch_1.PharmacyBatch, alloc.batch);
        }
        // نجمّع الأسطر حسب الدفعة
        const byBatch = new Map();
        for (const a of allocations) {
            const arr = byBatch.get(a.batch.id) || [];
            arr.push(a);
            byBatch.set(a.batch.id, arr);
        }
        const items = [];
        for (const [batchId, group] of byBatch) {
            const totalPills = group.reduce((s, a) => s + a.pills, 0);
            const first = group[0];
            items.push(m.create(PharmacyDispenseItem_1.PharmacyDispenseItem, {
                dispenseId: savedDispense.id,
                batchId,
                drugId: first.plan.drug.id,
                qtyPills: totalPills,
                qty: first.plan.qty,
                unit: first.plan.unit,
                expirySnapshot: new Date(first.batch.expiryDate),
                batchNumberSnapshot: first.batch.batchNumber ?? null
            }));
        }
        await m.save(PharmacyDispenseItem_1.PharmacyDispenseItem, items);
        const full = await m.findOne(PharmacyDispense_1.PharmacyDispense, {
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
    async getDispenses(filter) {
        const qb = this.dispenseRepo
            .createQueryBuilder("d")
            .leftJoinAndSelect("d.personnel", "personnel")
            .leftJoinAndSelect("d.items", "items")
            .leftJoinAndSelect("items.drug", "itemDrug")
            .leftJoinAndSelect("items.batch", "itemBatch")
            .orderBy("d.dispensedAt", "DESC");
        if (filter?.personnelId)
            qb.andWhere("d.personnelId = :pid", { pid: filter.personnelId });
        if (filter?.clinicRecordId)
            qb.andWhere("d.clinicRecordId = :cid", { cid: filter.clinicRecordId });
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
exports.PharmacyService = PharmacyService;
exports.pharmacyService = new PharmacyService();
