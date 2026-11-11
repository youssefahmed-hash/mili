"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.absenceYmd = exports.openAbsenceOf = exports.absenceService = exports.AbsenceService = void 0;
const data_source_1 = require("../../config/data-source");
const GuardAbsence_1 = require("../../entities/GuardAbsence");
const Personnel_1 = require("../../entities/Personnel");
const typeorm_1 = require("typeorm");
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
exports.absenceYmd = ymd;
class AbsenceService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(GuardAbsence_1.GuardAbsence);
        this.personnelRepository = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
    }
    /** سجل غياب فرد — الأحدث أولاً */
    async getByPersonnelId(personnelId) {
        return await this.repository.find({
            where: { personnelId },
            relations: ["personnel"],
            order: { startDate: "DESC", createdAt: "DESC" }
        });
    }
    /** كل الغيابات المفتوحة (لسه مرجعتش) عبر النظام */
    async getOpen() {
        return await this.repository.find({
            where: { returnDate: (0, typeorm_1.IsNull)() },
            relations: ["personnel"],
            order: { startDate: "DESC" }
        });
    }
    async requirePersonnel(personnelId) {
        if (!personnelId)
            throw new Error("يجب تحديد الفرد لتسجيل الغياب");
        const personnel = await this.personnelRepository.findOne({ where: { id: personnelId } });
        if (!personnel)
            throw new Error("الفرد المحدد غير مسجل في النظام");
        return personnel;
    }
    /** تسجيل غياب جديد — يغيّر التمام إلى «غياب» */
    async create(data) {
        const personnel = await this.requirePersonnel(data.personnelId);
        // يمنع تسجيل غياب مزدوج بدون رجوع
        const alreadyOpen = await this.repository.findOne({
            where: { personnelId: personnel.id, returnDate: (0, typeorm_1.IsNull)() }
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
    async recordReturn(id, returnDate, notes) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record)
            throw new Error("سجل الغياب غير موجود");
        if (record.returnDate)
            throw new Error("تم تسجيل العودة لهذا الغياب بالفعل");
        const date = returnDate ? new Date(returnDate) : new Date();
        record.returnDate = date;
        if (notes !== undefined)
            record.notes = notes;
        const saved = await this.repository.save(record);
        // أي غياب مفتوح تاني لنفس الفرد؟ لو مفيش → يرجع داخل القطاع
        const stillOpen = await this.repository.findOne({
            where: { personnelId: record.personnelId, returnDate: (0, typeorm_1.IsNull)() }
        });
        if (!stillOpen) {
            await this.personnelRepository.update({ id: record.personnelId }, { status: "داخل القطاع" });
        }
        return saved;
    }
    async update(id, data) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record)
            throw new Error("سجل الغياب غير موجود");
        this.repository.merge(record, {
            startDate: data.startDate ? new Date(data.startDate) : record.startDate,
            returnDate: data.returnDate ? new Date(data.returnDate) : record.returnDate,
            notes: data.notes !== undefined ? data.notes : record.notes
        });
        return await this.repository.save(record);
    }
    async delete(id) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record)
            throw new Error("سجل الغياب غير موجود");
        await this.repository.remove(record);
        return true;
    }
}
exports.AbsenceService = AbsenceService;
exports.absenceService = new AbsenceService();
/** تاريخ الغياب التالي المتوقع للفرد (آخر غياب مفتوح) — يُستخدم في الواجهة */
const openAbsenceOf = async (personnelId) => data_source_1.AppDataSource.getRepository(GuardAbsence_1.GuardAbsence).findOne({
    where: { personnelId, returnDate: (0, typeorm_1.IsNull)() },
    order: { startDate: "DESC" }
});
exports.openAbsenceOf = openAbsenceOf;
