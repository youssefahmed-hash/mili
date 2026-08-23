import { AppDataSource } from "../../config/data-source";
import { Vacation } from "../../entities/Vacation";

export class VacationsService {
    private repository = AppDataSource.getRepository(Vacation);

    async getByPersonnelId(personnelId: string) {
        return await this.repository.find({
            where: { personnelId },
            order: { startDate: "DESC" }
        });
    }

    async create(data: Partial<Vacation>) {
        const vacation = this.repository.create(data);
        return await this.repository.save(vacation);
    }

    async update(id: string, data: Partial<Vacation>) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }

        this.repository.merge(vacation, data);
        return await this.repository.save(vacation);
    }

    async delete(id: string) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }

        await this.repository.remove(vacation);
        return true;
    }
}

export const vacationsService = new VacationsService();
