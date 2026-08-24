"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicService = exports.ClinicService = void 0;
const data_source_1 = require("../../config/data-source");
const ClinicRecord_1 = require("../../entities/ClinicRecord");
const Personnel_1 = require("../../entities/Personnel");
class ClinicService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(ClinicRecord_1.ClinicRecord);
        this.personnelRepository = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
    }
    async getAll() {
        return await this.repository.find({
            relations: ["personnel"],
            order: { createdAt: "DESC" }
        });
    }
    async getByPersonnelId(personnelId) {
        return await this.repository.find({
            where: { personnelId },
            relations: ["personnel"],
            order: { createdAt: "DESC" }
        });
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
        const record = this.repository.create(data);
        return await this.repository.save(record);
    }
    async update(id, data) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) {
            throw new Error("سجل العيادة غير موجود");
        }
        this.repository.merge(record, data);
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
