"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsService = exports.OperationsService = void 0;
const data_source_1 = require("../../config/data-source");
const OperationRecord_1 = require("../../entities/OperationRecord");
const Personnel_1 = require("../../entities/Personnel");
class OperationsService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(OperationRecord_1.OperationRecord);
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
            throw new Error("يجب تحديد الفرد المكلف لإنشاء سجل العملية");
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
            throw new Error("سجل العملية غير موجود");
        }
        this.repository.merge(record, data);
        return await this.repository.save(record);
    }
    async delete(id) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) {
            throw new Error("سجل العملية غير موجود");
        }
        await this.repository.remove(record);
        return true;
    }
}
exports.OperationsService = OperationsService;
exports.operationsService = new OperationsService();
