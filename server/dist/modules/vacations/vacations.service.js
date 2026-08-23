"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vacationsService = exports.VacationsService = void 0;
const data_source_1 = require("../../config/data-source");
const Vacation_1 = require("../../entities/Vacation");
class VacationsService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(Vacation_1.Vacation);
    }
    async getByPersonnelId(personnelId) {
        return await this.repository.find({
            where: { personnelId },
            order: { startDate: "DESC" }
        });
    }
    async create(data) {
        const vacation = this.repository.create(data);
        return await this.repository.save(vacation);
    }
    async update(id, data) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }
        this.repository.merge(vacation, data);
        return await this.repository.save(vacation);
    }
    async delete(id) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }
        await this.repository.remove(vacation);
        return true;
    }
}
exports.VacationsService = VacationsService;
exports.vacationsService = new VacationsService();
