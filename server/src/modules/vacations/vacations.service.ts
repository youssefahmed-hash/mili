import { AppDataSource } from "../../config/data-source";
import { Vacation } from "../../entities/Vacation";
import { Personnel } from "../../entities/Personnel";

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
        const saved = await this.repository.save(vacation);
        if (saved.personnelId) {
            await this.syncPersonnelStatus(saved.personnelId);
        }
        return saved;
    }

    async update(id: string, data: Partial<Vacation>) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }

        this.repository.merge(vacation, data);
        const saved = await this.repository.save(vacation);
        await this.syncPersonnelStatus(saved.personnelId);
        return saved;
    }

    async delete(id: string) {
        const vacation = await this.repository.findOne({ where: { id } });
        if (!vacation) {
            throw new Error("الإجازة غير موجودة");
        }

        const personnelId = vacation.personnelId;
        await this.repository.remove(vacation);
        await this.syncPersonnelStatus(personnelId);
        return true;
    }

    async findAll(status?: string) {
        const where = status ? { status } : {};
        return await this.repository.find({
            where,
            relations: ["personnel"],
            order: { startDate: "DESC" }
        });
    }

    async bulkCreate(personnelIds: string[], data: Partial<Vacation>) {
        const created: Vacation[] = [];
        for (const pid of personnelIds) {
            const vacation = this.repository.create({ ...data, personnelId: pid });
            const saved = await this.repository.save(vacation);
            await this.syncPersonnelStatus(pid);
            created.push(saved);
        }
        return created;
    }

    async syncAllPersonnelStatuses(): Promise<void> {
        const personnelRepo = AppDataSource.getRepository(Personnel);
        const all = await personnelRepo.find();
        for (const p of all) {
            await this.syncPersonnelStatus(p.id);
        }
    }

    private async syncPersonnelStatus(personnelId: string): Promise<void> {
        const personnelRepo = AppDataSource.getRepository(Personnel);
        const personnel = await personnelRepo.findOne({ where: { id: personnelId } });
        if (!personnel) return;

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
        } else if (personnel.status === "اجازه") {
            personnel.status = "داخل القطاع";
        }

        await personnelRepo.save(personnel);
    }
}

export const vacationsService = new VacationsService();
