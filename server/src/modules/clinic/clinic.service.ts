import { AppDataSource } from "../../config/data-source";
import { ClinicRecord } from "../../entities/ClinicRecord";
import { Personnel } from "../../entities/Personnel";
import { pharmacyService, type PharmacyDispenseInput } from "./pharmacy.service";

export class ClinicService {
  private repository = AppDataSource.getRepository(ClinicRecord);
  private personnelRepository = AppDataSource.getRepository(Personnel);

  async getAll(filters?: { fromDate?: string; toDate?: string }) {
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

  async getByPersonnelId(personnelId: string) {
    return await this.repository.createQueryBuilder("record")
      .leftJoinAndSelect("record.personnel", "personnel")
      .where("record.personnelId = :personnelId", { personnelId })
      .orderBy("record.examinationDate", "DESC", "NULLS LAST")
      .addOrderBy("record.createdAt", "DESC")
      .getMany();
  }

  async getForPrint(filters: { personnelId?: string; fromDate?: string; toDate?: string }) {
    const queryBuilder = this.repository.createQueryBuilder("record")
      .leftJoinAndSelect("record.personnel", "personnel")
      .orderBy("record.examinationDate", "DESC", "NULLS LAST")
      .addOrderBy("record.createdAt", "DESC");

    if (filters.personnelId) {
      queryBuilder.andWhere("record.personnelId = :personnelId", { personnelId: filters.personnelId })
    }

    if (filters.fromDate) {
      queryBuilder.andWhere("record.examinationDate >= :fromDate", { fromDate: filters.fromDate })
    }

    if (filters.toDate) {
      queryBuilder.andWhere("record.examinationDate <= :toDate", { toDate: filters.toDate })
    }

    return await queryBuilder.getMany()
  }

  async create(data: Partial<ClinicRecord> & { dispense?: PharmacyDispenseInput }) {
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
    return await AppDataSource.transaction(async (m) => {
      const record = m.create(ClinicRecord, payload);
      const savedRecord = await m.save(ClinicRecord, record);

      const result = await pharmacyService.dispenseCore(m, {
        ...dispense,
        personnelId: savedRecord.personnelId,
        clinicRecordId: savedRecord.id
      });

      return { ...savedRecord, dispense: result };
    });
  }

  async update(id: string, data: Partial<ClinicRecord>) {
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

  async delete(id: string) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error("سجل العيادة غير موجود");
    }

    await this.repository.remove(record);
    return true;
  }
}

export const clinicService = new ClinicService();
