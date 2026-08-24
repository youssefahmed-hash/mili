import { AppDataSource } from "../../config/data-source";
import { OperationRecord } from "../../entities/OperationRecord";
import { Personnel } from "../../entities/Personnel";

export class OperationsService {
  private repository = AppDataSource.getRepository(OperationRecord);
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
      order: { createdAt: "DESC" }
    });
  }

  async create(data: Partial<OperationRecord>) {
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

  async update(id: string, data: Partial<OperationRecord>) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error("سجل العملية غير موجود");
    }

    this.repository.merge(record, data);
    return await this.repository.save(record);
  }

  async delete(id: string) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error("سجل العملية غير موجود");
    }

    await this.repository.remove(record);
    return true;
  }
}

export const operationsService = new OperationsService();
