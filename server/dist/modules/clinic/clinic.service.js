"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicService = exports.ClinicService = void 0;
const data_source_1 = require("../../config/data-source");
const ClinicRecord_1 = require("../../entities/ClinicRecord");
const Personnel_1 = require("../../entities/Personnel");
const pharmacy_service_1 = require("./pharmacy.service");
class ClinicService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(ClinicRecord_1.ClinicRecord);
        this.personnelRepository = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
    }
    async getAll(filters) {
        const queryBuilder = this.repository.createQueryBuilder("record")
            .leftJoinAndSelect("record.personnel", "personnel")
            // الترتيب حسب تاريخ الكشف الفعلي (مش تاريخ الإدخال) — الكشف بتاريخ قديم
            // يظهر في ترتيبه الصح، ولو مفيش تاريخ كشف نرجع لتاريخ الإنشاء.
            .orderBy("record.examinationDate", "DESC", "NULLS LAST")
            .addOrderBy("record.createdAt", "DESC");
        if (filters?.fromDate) {
            queryBuilder.andWhere("record.examinationDate >= :fromDate", { fromDate: filters.fromDate });
        }
        if (filters?.toDate) {
            queryBuilder.andWhere("record.examinationDate <= :toDate", { toDate: filters.toDate });
        }
        return await queryBuilder.getMany();
    }
    async getByPersonnelId(personnelId) {
        return await this.repository.createQueryBuilder("record")
            .leftJoinAndSelect("record.personnel", "personnel")
            .where("record.personnelId = :personnelId", { personnelId })
            .orderBy("record.examinationDate", "DESC", "NULLS LAST")
            .addOrderBy("record.createdAt", "DESC")
            .getMany();
    }
    async getForPrint(filters) {
        const queryBuilder = this.repository.createQueryBuilder("record")
            .leftJoinAndSelect("record.personnel", "personnel")
            .orderBy("record.examinationDate", "DESC", "NULLS LAST")
            .addOrderBy("record.createdAt", "DESC");
        if (filters.personnelId) {
            queryBuilder.andWhere("record.personnelId = :personnelId", { personnelId: filters.personnelId });
        }
        if (filters.fromDate) {
            queryBuilder.andWhere("record.examinationDate >= :fromDate", { fromDate: filters.fromDate });
        }
        if (filters.toDate) {
            queryBuilder.andWhere("record.examinationDate <= :toDate", { toDate: filters.toDate });
        }
        return await queryBuilder.getMany();
    }
    async create(data) {
        if (!data.personnelId) {
            throw new Error("يجب تحديد الفرد المريض لإنشاء سجل العيادة");
        }
        const personnel = await this.personnelRepository.findOne({
            where: { id: data.personnelId }
        });
        if (!personnel) {
            throw new Error("الفرد المحدد غير مسجل في النظام");
        }
        // مكان الكشف: داخل الوحدة افتراضيًا، وخارج الوحدة يتطلب عنوانًا
        const locationType = (data.locationType || "داخل الوحدة").slice(0, 20);
        if (locationType !== "داخل الوحدة" && locationType !== "خارج الوحدة") {
            throw new Error("مكان الكشف يجب أن يكون: داخل الوحدة أو خارج الوحدة");
        }
        const locationAddress = (data.locationAddress || "").trim() || null;
        if (locationType === "خارج الوحدة" && !locationAddress) {
            throw new Error("يجب تحديد عنوان مكان الكشف خارج الوحدة");
        }
        const { dispense, ...recordData } = data;
        const payload = {
            ...recordData,
            examinationType: data.examinationType || "كشف دوري",
            locationType,
            locationAddress
        };
        // ===== بدون صرف: حفظ عادي =====
        if (!dispense || !dispense.items?.length) {
            const record = this.repository.create(payload);
            return await this.repository.save(record);
        }
        // ===== مع صرف: كشف طبي + صرف + نقصان مخزون في TRANSACTION واحد =====
        // أي فشل في الصرف (رصيد ناقص / صلاحية منتهية / تأكيد FEFO مفقود)
        // بيرجّع خطأ ويراجع الكشف كله — مفيش كشف من غير صرف.
        return await data_source_1.AppDataSource.transaction(async (m) => {
            const record = m.create(ClinicRecord_1.ClinicRecord, payload);
            const savedRecord = await m.save(ClinicRecord_1.ClinicRecord, record);
            const result = await pharmacy_service_1.pharmacyService.dispenseCore(m, {
                ...dispense,
                personnelId: savedRecord.personnelId,
                clinicRecordId: savedRecord.id
            });
            return { ...savedRecord, dispense: result };
        });
    }
    async update(id, data) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) {
            throw new Error("سجل العيادة غير موجود");
        }
        this.repository.merge(record, data);
        // نفس ضوابط الإنشاء على القيم المدمجة (تصليب لمسار PUT المباشر)
        const locationType = (record.locationType || "داخل الوحدة").slice(0, 20);
        if (locationType !== "داخل الوحدة" && locationType !== "خارج الوحدة") {
            throw new Error("مكان الكشف يجب أن يكون: داخل الوحدة أو خارج الوحدة");
        }
        record.locationType = locationType;
        const locationAddress = (record.locationAddress || "").trim() || null;
        if (locationType === "خارج الوحدة" && !locationAddress) {
            throw new Error("يجب تحديد عنوان مكان الكشف خارج الوحدة");
        }
        record.locationAddress = locationAddress;
        return await this.repository.save(record);
    }
    async delete(id) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) {
            throw new Error("سجل العيادة غير موجود");
        }
        await this.repository.remove(record);
        return true;
    }
}
exports.ClinicService = ClinicService;
exports.clinicService = new ClinicService();
