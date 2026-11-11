import { AppDataSource } from "../../config/data-source";
import { GuardAbsence } from "../../entities/GuardAbsence";
import { Personnel } from "../../entities/Personnel";
import { IsNull } from "typeorm";

const ymd = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export class AbsenceService {
    private repository = AppDataSource.getRepository(GuardAbsence);
    private personnelRepository = AppDataSource.getRepository(Personnel);

    /** سجل غياب فرد — الأحدث أولاً */
    async getByPersonnelId(personnelId: string) {
        return await this.repository.find({
            where: { personnelId },
            relations: ["personnel"],
            order: { startDate: "DESC", createdAt: "DESC" }
        });
    }

    /** كل الغيابات المفتوحة (لسه مرجعتش) عبر النظام */
    async getOpen() {
        return await this.repository.find({
            where: { returnDate: IsNull() },
            relations: ["personnel"],
            order: { startDate: "DESC" }
        });
    }

    private async requirePersonnel(personnelId: string): Promise<Personnel> {
        if (!personnelId) throw new Error("يجب تحديد الفرد لتسجيل الغياب");
        const personnel = await this.personnelRepository.findOne({ where: { id: personnelId } });
        if (!personnel) throw new Error("الفرد المحدد غير مسجل في النظام");
        return personnel;
    }

    /** تسجيل غياب جديد — يغيّر التمام إلى «غياب» */
    async create(data: Partial<GuardAbsence>) {
        const personnel = await this.requirePersonnel(data.personnelId as string);

        // يمنع تسجيل غياب مزدوج بدون رجوع
        const alreadyOpen = await this.repository.findOne({
            where: { personnelId: personnel.id, returnDate: IsNull() }
        });
        if (alreadyOpen) {
            throw new Error("يوجد غياب مسجل بدون تاريخ عودة — سجّل عودته أولاً");
        }

        const start = data.startDate ? new Date(data.startDate) : new Date();
        const record = this.repository.create({
            personnelId: personnel.id,
            startDate: start,
            returnDate: null,
            notes: data.notes ?? null
        });
        const saved = await this.repository.save(record);

        if (personnel.status !== "غياب") {
            await this.personnelRepository.update({ id: personnel.id }, { status: "غياب" });
        }
        return saved;
    }

    /** تسجيل العودة — يضبط تاريخ العودة ويرجّع التمام إلى «داخل القطاع» */
    async recordReturn(id: string, returnDate?: string, notes?: string) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) throw new Error("سجل الغياب غير موجود");
        if (record.returnDate) throw new Error("تم تسجيل العودة لهذا الغياب بالفعل");

        const date = returnDate ? new Date(returnDate) : new Date();
        record.returnDate = date;
        if (notes !== undefined) record.notes = notes;
        const saved = await this.repository.save(record);

        // أي غياب مفتوح تاني لنفس الفرد؟ لو مفيش → يرجع داخل القطاع
        const stillOpen = await this.repository.findOne({
            where: { personnelId: record.personnelId, returnDate: IsNull() }
        });
        if (!stillOpen) {
            await this.personnelRepository.update(
                { id: record.personnelId },
                { status: "داخل القطاع" }
            );
        }
        return saved;
    }

    async update(id: string, data: Partial<GuardAbsence>) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) throw new Error("سجل الغياب غير موجود");
        this.repository.merge(record, {
            startDate: data.startDate ? new Date(data.startDate) : record.startDate,
            returnDate: data.returnDate ? new Date(data.returnDate) : record.returnDate,
            notes: data.notes !== undefined ? data.notes : record.notes
        });
        return await this.repository.save(record);
    }

    async delete(id: string) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) throw new Error("سجل الغياب غير موجود");
        await this.repository.remove(record);
        return true;
    }
}

export const absenceService = new AbsenceService();

/** تاريخ الغياب التالي المتوقع للفرد (آخر غياب مفتوح) — يُستخدم في الواجهة */
export const openAbsenceOf = async (personnelId: string): Promise<GuardAbsence | null> =>
    AppDataSource.getRepository(GuardAbsence).findOne({
        where: { personnelId, returnDate: IsNull() },
        order: { startDate: "DESC" }
    });

export { ymd as absenceYmd };