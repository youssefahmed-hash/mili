"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vacationsService = exports.VacationsService = void 0;
const data_source_1 = require("../../config/data-source");
const Vacation_1 = require("../../entities/Vacation");
const Personnel_1 = require("../../entities/Personnel");
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
        const saved = await this.repository.save(vacation);
        if (saved.personnelId) {
            await this.syncPersonnelStatus(saved.personnelId);
        }
        return saved;
    }
    async update(id, data) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }
        this.repository.merge(vacation, data);
        const saved = await this.repository.save(vacation);
        await this.syncPersonnelStatus(saved.personnelId);
        return saved;
    }
    async delete(id) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }
        const personnelId = vacation.personnelId;
        await this.repository.remove(vacation);
        await this.syncPersonnelStatus(personnelId);
        return true;
    }
    async syncAllPersonnelStatuses() {
        const personnelRepo = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
        const all = await personnelRepo.find();
        for (const p of all) {
            await this.syncPersonnelStatus(p.id);
        }
    }
    async syncPersonnelStatus(personnelId) {
        const personnelRepo = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
        const personnel = await personnelRepo.findOne({ where: { id: personnelId } });
        if (!personnel)
            return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = await this.repository
            .createQueryBuilder("v")
            .where("v.personnelId = :pid", { pid: personnelId })
            .andWhere("v.status IN (:...statuses)", { statuses: ["معتمدة", "نشطة"] })
            .andWhere("v.startDate <= :today", { today })
            .andWhere("v.expectedReturnDate >= :today", { today })
            .getOne();
        if (active) {
            personnel.status = "اجازه";
        }
        else if (personnel.status === "اجازه") {
            personnel.status = "داخل القطاع";
        }
        await personnelRepo.save(personnel);
    }
}
exports.VacationsService = VacationsService;
exports.vacationsService = new VacationsService();
