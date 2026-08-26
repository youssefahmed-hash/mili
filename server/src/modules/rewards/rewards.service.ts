import { AppDataSource } from "../../config/data-source";
import { Reward } from "../../entities/Reward";
import { Personnel } from "../../entities/Personnel";

export class RewardsService {
  private repository = AppDataSource.getRepository(Reward);
  private personnelRepository = AppDataSource.getRepository(Personnel);

  async getAll() {
    return await this.repository.find({
      relations: ["personnel"],
      order: { createdAt: "DESC" }
    });
  }

  async getByPersonnelId(personnelId: string) {
    return await this.repository.find({
      where: { personnelId },
      relations: ["personnel"],
      order: { rewardDate: "DESC" }
    });
  }

  async create(data: Partial<Reward>) {
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

  async update(id: string, data: Partial<Reward>) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error("سجل المكافأة غير موجود");
    }

    this.repository.merge(record, data);
    return await this.repository.save(record);
  }

  async delete(id: string) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error("سجل المكافأة غير موجود");
    }

    await this.repository.remove(record);
    return true;
  }
}

export const rewardsService = new RewardsService();
