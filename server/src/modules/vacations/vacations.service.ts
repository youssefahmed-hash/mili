import { AppDataSource } from "../../config/data-source";
import { Vacation } from "../../entities/Vacation";
import { Personnel } from "../../entities/Personnel";
import { LineAssignment } from "../../entities/LineAssignment";

/** أقصى أيام خصم مسموح بها من الإجازة */
export const MAX_VACATION_DEDUCTION_DAYS = 14;
/** أقصى أيام مد مسموح بها للإجازة */
export const MAX_VACATION_EXTENSION_DAYS = 30;

/** تحويل أي تاريخ (Date أو نص) إلى YYYY-MM-DD بدون إزاحة توقيت */
const toYmd = (value: string | Date): string =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

/** عدد الأيام بين تاريخين (YYYY-MM-DD) */
const daysBetween = (fromYmd: string, toYmdStr: string): number =>
    Math.round((Date.parse(toYmdStr) - Date.parse(fromYmd)) / 86400000);

/** قص عدد صحيح داخل نطاق */
const clampInt = (value: unknown, min: number, max: number): number => {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.trunc(n)));
};

/** إضافة أيام على تاريخ YYYY-MM-DD بحساب UTC (لا يتأثر بالتوقيت المحلي) */
const addDaysYmd = (ymd: string, days: number): string => {
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
};

/** تاريخ اليوم بصيغة YYYY-MM-DD حسب التوقيت المحلي للجهاز */
const todayYmdLocal = (): string => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${m}-${d}`;
};

export class VacationsService {
    private repository = AppDataSource.getRepository(Vacation);

    async getByPersonnelId(personnelId: string) {
        // قبل العرض: ترحيل الدورة لو العودة الفعلية عدّت (تصفير الخصم/المد)
        try {
            await this.rollOverdueCycles(personnelId);
        } catch (err) {
            console.error("تعذر ترحيل دورة الإجازة:", err);
        }
        return await this.repository.find({
            where: { personnelId },
            order: { startDate: "DESC" }
        });
    }

    /**
     * ترحيل تلقائي لدورات الإجازات المنتهية.
     * لما تاريخ العودة الفعلي (المتوقع + المد − الخصم) يعدّي النهارده، الدورة الجديدة تبدأ:
     *   بداية جديدة = العودة الفعلية + مدة التواجد (cycle)
     *   عودة جديدة  = البداية الجديدة + نفس مدة الإجازة الأساسية
     * ويتم تصفير الخصم والمد على نفس السجل (بدون إنشاء سجل جديد).
     * إجازات الخط مستثناة (بتُدار من دورة الخط نفسها).
     */
    async rollOverdueCycles(personnelId?: string): Promise<number> {
        const today = todayYmdLocal();

        const qb = this.repository
            .createQueryBuilder("v")
            .leftJoinAndSelect("v.personnel", "p")
            .where("v.status IN (:...statuses)", { statuses: ["معتمدة", "نشطة"] });
        if (personnelId) {
            qb.andWhere("v.personnelId = :personnelId", { personnelId });
        }
        const vacations = await qb.getMany();

        // أحدث سجل لكل فرد (مع استثناء إجازات الخط)
        const latestByPersonnel = new Map<string, Vacation>();
        for (const v of vacations) {
            if (!v.personnelId) continue;
            if (v.vacationType === "إجازة خط") continue;
            if (v.personnel && v.personnel.unit === "الخط") continue;
            const cycle = parseInt(v.cycle || "", 10);
            if (!cycle || cycle <= 0) continue;
            const current = latestByPersonnel.get(v.personnelId);
            if (!current || toYmd(v.startDate) > toYmd(current.startDate)) {
                latestByPersonnel.set(v.personnelId, v);
            }
        }

        let rolled = 0;
        for (const v of latestByPersonnel.values()) {
            const cycle = parseInt(v.cycle as string, 10);
            let start = toYmd(v.startDate);
            let baseReturn = toYmd(v.expectedReturnDate);
            let deduction = Math.max(0, v.deductionDays || 0);
            let extension = Math.max(0, v.extensionDays || 0);
            // مدة الإجازة الأساسية (قبل الخصم/المد) — بتفضل ثابتة في كل دورة
            const baseLeaveDays = Math.max(0, daysBetween(start, baseReturn));

            let changed = false;
            let guard = 0;
            while (guard++ < 1000) {
                const effectiveReturn = addDaysYmd(baseReturn, extension - deduction);
                if (effectiveReturn >= today) break;
                // الدورة الجديدة تُحسب من تاريخ العودة الأساسي (بدون خصم/مد)
                // عشان الجدول الجديد يفضل «صافي» زي الدورة الأصلية وميتأثرش بالخصم أو المد.
                const nextStart = addDaysYmd(baseReturn, cycle);
                const nextReturn = addDaysYmd(nextStart, baseLeaveDays);
                start = nextStart;
                baseReturn = nextReturn;
                // الدورة الجديدة تبدأ بدون خصم أو مد
                deduction = 0;
                extension = 0;
                changed = true;
            }
            if (!changed) continue;

            v.startDate = start as unknown as Date;
            v.expectedReturnDate = baseReturn as unknown as Date;
            v.deductionDays = 0;
            v.extensionDays = 0;
            await this.repository.save(v);
            await this.syncPersonnelStatus(v.personnelId);
            rolled++;
        }
        return rolled;
    }

    async create(data: Partial<Vacation>) {
        // التسجيل فوري الفعالية — لا يوجد اعتماد (يُنشأ معتمدة مباشرة)
        const vacation = this.repository.create({
            ...data,
            deductionDays: clampInt(data.deductionDays ?? 0, 0, MAX_VACATION_DEDUCTION_DAYS),
            extensionDays: clampInt(data.extensionDays ?? 0, 0, MAX_VACATION_EXTENSION_DAYS),
            status: "معتمدة"
        });
        this.clampAdjustments(vacation);
        const saved = await this.repository.save(vacation);
        if (saved.personnelId) {
            await this.syncPersonnelStatus(saved.personnelId);
        }
        return saved;
    }

    async update(id: string, data: Partial<Vacation>) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }

        // ملاحظة: لا يوجد منع لعساكر الخط هنا — إجازات الخط المعتمدة تُنشأ من دورة الإجازات
        // وتُعتمد من شاشة الاعتماد (الحالة محمية للأدمن في الـroute).

        if (data.deductionDays !== undefined) {
            data.deductionDays = clampInt(data.deductionDays, 0, MAX_VACATION_DEDUCTION_DAYS);
        }
        if (data.extensionDays !== undefined) {
            data.extensionDays = clampInt(data.extensionDays, 0, MAX_VACATION_EXTENSION_DAYS);
        }

        this.repository.merge(vacation, data);
        this.clampAdjustments(vacation);
        const saved = await this.repository.save(vacation);
        await this.syncPersonnelStatus(saved.personnelId);
        // اعتماد إجازة خط = تفعيل النزول: اقلب حالة تعيين الخط إلى إجازة (إن وجد)
        if (data.status === "معتمدة") {
            await this.syncLineAssignmentOnApproval(saved.personnelId, saved.vacationType);
        }
        return saved;
    }

    /** ضبط الخصم/المد داخل الحدود ومنع الخصم من إنهاء الإجازة قبل بدايتها */
    private clampAdjustments(vacation: Vacation): void {
        vacation.deductionDays = clampInt(vacation.deductionDays ?? 0, 0, MAX_VACATION_DEDUCTION_DAYS);
        vacation.extensionDays = clampInt(vacation.extensionDays ?? 0, 0, MAX_VACATION_EXTENSION_DAYS);

        if (!vacation.startDate || !vacation.expectedReturnDate) return;
        const totalDays = daysBetween(toYmd(vacation.startDate), toYmd(vacation.expectedReturnDate)) + 1;
        const maxDeduction = Math.max(0, Math.min(MAX_VACATION_DEDUCTION_DAYS, totalDays - 1));
        if (vacation.deductionDays > maxDeduction) {
            vacation.deductionDays = maxDeduction;
        }
    }

    /**
     * عند اعتماد إجازة عسكري خط (نوع إجازة خط أو وحدته الخط):
     * اقلب حالة تعيين الخط إلى إجازة (تظهر في التنبيهات والتقارير والخط اليومي).
     * العودة (لحاضر) تتم تلقائيًا عبر مزامنة الدوران عند بدء دورة جديدة.
     */
    private async syncLineAssignmentOnApproval(personnelId: string, vacationType?: string): Promise<void> {
        const personnelRepo = AppDataSource.getRepository(Personnel);
        const personnel = await personnelRepo.findOne({ where: { id: personnelId } });
        if (!personnel) return;
        if (vacationType !== "إجازة خط" && personnel.unit !== "الخط") return;
        const assignmentRepo = AppDataSource.getRepository(LineAssignment);
        const assignment = await assignmentRepo.findOne({ where: { personnelId } });
        if (assignment && assignment.status !== "إجازة") {
            assignment.status = "إجازة";
            await assignmentRepo.save(assignment);
        }
    }

    async delete(id: string) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }

        const personnelId = vacation.personnelId;
        await this.repository.remove(vacation);
        await this.syncPersonnelStatus(personnelId);
        return true;
    }

    async findAll(status?: string) {
        const where = status ? { status } : {};
        return await this.repository.find({
            where,
            relations: ["personnel"],
            order: { startDate: "DESC" }
        });
    }

    async bulkCreate(personnelIds: string[], data: Partial<Vacation>) {
        const created: Vacation[] = [];
        for (const pid of personnelIds) {
            const vacation = this.repository.create({
                ...data,
                deductionDays: clampInt(data.deductionDays ?? 0, 0, MAX_VACATION_DEDUCTION_DAYS),
                extensionDays: clampInt(data.extensionDays ?? 0, 0, MAX_VACATION_EXTENSION_DAYS),
                personnelId: pid,
                status: "معتمدة"
            });
            this.clampAdjustments(vacation);
            const saved = await this.repository.save(vacation);
            await this.syncPersonnelStatus(pid);
            created.push(saved);
        }
        return created;
    }

    async syncAllPersonnelStatuses(): Promise<void> {
        const personnelRepo = AppDataSource.getRepository(Personnel);
        const all = await personnelRepo.find();
        for (const p of all) {
            await this.syncPersonnelStatus(p.id);
        }
    }

    private async syncPersonnelStatus(personnelId: string): Promise<void> {        const personnelRepo = AppDataSource.getRepository(Personnel);
        const personnel = await personnelRepo.findOne({ where: { id: personnelId } });
        if (!personnel) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const active = await this.repository
            .createQueryBuilder("v")
            .where("v.personnelId = :pid", { pid: personnelId })
            .andWhere("v.status IN (:...statuses)", { statuses: ["معتمدة", "نشطة"] })
            .andWhere("v.startDate <= :today", { today })
            // تاريخ العودة الفعلي = العودة المتوقعة + أيام المد − أيام الخصم
            .andWhere("(v.expectedReturnDate + v.extensionDays - v.deductionDays) >= :today", { today })
            .getOne();

        if (active) {
            personnel.status = "اجازه";
        } else if (personnel.status === "اجازه") {
            personnel.status = "داخل القطاع";
        }

        await personnelRepo.save(personnel);
    }
}

export const vacationsService = new VacationsService();
