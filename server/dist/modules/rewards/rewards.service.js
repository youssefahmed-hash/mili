"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardsService = exports.RewardsService = void 0;
const data_source_1 = require("../../config/data-source");
const Reward_1 = require("../../entities/Reward");
const Personnel_1 = require("../../entities/Personnel");
class RewardsService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(Reward_1.Reward);
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
            order: { rewardDate: "DESC" }
        });
    }
    async create(data) {
        if (!data.personnelId) {
            throw new Error("يجب تحديد الفرد لإنشاء سجل المكافأة");
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
            throw new Error("سجل المكافأة غير موجود");
        }
        this.repository.merge(record, data);
        return await this.repository.save(record);
    }
    async delete(id) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record) {
            throw new Error("سجل المكافأة غير موجود");
        }
        await this.repository.remove(record);
        return true;
    }
}
exports.RewardsService = RewardsService;
exports.rewardsService = new RewardsService();
