import { AppDataSource } from "../../config/data-source";
import { Personnel, PersonnelCategory } from "../../entities/Personnel";
import { Vacation } from "../../entities/Vacation";
import { Like, Equal } from "typeorm";
import fs from "fs";
import path from "path";

// Timezone-safe YYYY-MM-DD parsing/formatting (local midnight, no UTC shift)
const parseYmd = (s?: string | Date): Date => {
    if (!s) return new Date();
    if (s instanceof Date) {
        return new Date(s.getFullYear(), s.getMonth(), s.getDate());
    }
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};
const fmtYmd = (dt: Date): string => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export class PersonnelService {
    private repository = AppDataSource.getRepository(Personnel);

    private static RANK_TO_CATEGORY: Record<string, PersonnelCategory> = {
        'جندي': 'soldier',
        'عريف': 'non_commissioned_officer',
        'رقيب': 'non_commissioned_officer',
        'رقيب أول': 'non_commissioned_officer',
        'مساعد': 'non_commissioned_officer',
        'مساعد أول': 'non_commissioned_officer',
        'ملازم': 'officer',
        'ملازم أول': 'officer',
        'نقيب': 'officer',
        'رائد': 'officer',
        'مقدم': 'officer',
        'عقيد': 'officer',
        'عميد': 'officer',
        'لواء': 'officer'
    };

    private resolveCategory(data: Partial<Personnel>): PersonnelCategory {
        if (data.category) return data.category as PersonnelCategory;
        if (data.rank && PersonnelService.RANK_TO_CATEGORY[data.rank]) {
            return PersonnelService.RANK_TO_CATEGORY[data.rank];
        }
        return 'soldier';
    }

    async findAll(filters: {
        search?: string;
        ranks?: string;
        rank?: string;
        unit?: string;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const queryBuilder = this.repository.createQueryBuilder("personnel");

        // Search by name or militaryId
        if (filters.search) {
            queryBuilder.andWhere(
                "(personnel.fullName ILIKE :search OR personnel.militaryId LIKE :searchExact)",
                { search: `%${filters.search}%`, searchExact: filters.search }
            );
        }

        // Apply filters
        if (filters.ranks) {
            const ranks = (filters.ranks as string)
                .split(",")
                .map((r) => r.trim())
                .filter(Boolean);
            if (ranks.length) {
                queryBuilder.andWhere("personnel.rank IN (:...ranks)", { ranks });
            }
        }
        if (filters.rank) {
            queryBuilder.andWhere("personnel.rank = :rank", { rank: filters.rank });
        }
        if (filters.unit) {
            queryBuilder.andWhere("personnel.unit = :unit", { unit: filters.unit });
        }
        if (filters.status) {
            queryBuilder.andWhere("personnel.status = :status", { status: filters.status });
        }

        queryBuilder.skip(skip).take(limit).orderBy("personnel.createdAt", "DESC");

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findOne(id: string) {
        return await this.repository.findOne({
            where: { id },
            relations: ["documents", "vacations", "forms"]
        });
    }

    async create(data: Partial<Personnel>) {
        const payload = { ...data, category: this.resolveCategory(data) };
        const newPersonnel = this.repository.create(payload);
        return await this.repository.save(newPersonnel);
    }

    async update(id: string, data: Partial<Personnel>) {
        const personnel = await this.findOne(id);
        if (!personnel) {
            throw new Error("الفرد العسكري غير موجود");
        }

        const payload = { ...data, category: this.resolveCategory(data) };

        // If updating photo and old photo exists, optionally remove old photo file
        if (data.photo && personnel.photo && data.photo !== personnel.photo) {
            this.deleteLocalFile(personnel.photo);
        }

        this.repository.merge(personnel, payload);
        return await this.repository.save(personnel);
    }

    async delete(id: string) {
        const personnel = await this.findOne(id);
        if (!personnel) {
            throw new Error("الفرد العسكري غير موجود");
        }

        // Delete photo
        if (personnel.photo) {
            this.deleteLocalFile(personnel.photo);
        }

        // Delete documents files
        if (personnel.documents) {
            for (const doc of personnel.documents) {
                this.deleteLocalFile(doc.fileUrl);
            }
        }

        // Delete forms files
        if (personnel.forms) {
            for (const f of personnel.forms) {
                if (f.fileUrl) {
                    this.deleteLocalFile(f.fileUrl);
                }
            }
        }

        await this.repository.remove(personnel);
        return true;
    }

    private deleteLocalFile(fileUrl: string) {
        try {
            // fileUrl format: /uploads/folder/filename
            if (fileUrl.startsWith("/uploads/")) {
                const relativePath = fileUrl.replace("/uploads/", "");
                const filePath = path.join(process.cwd(), "uploads", relativePath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error(`Error deleting local file ${fileUrl}:`, err);
        }
    }

    async getVacationLineup(dateStr?: string) {
        const today = parseYmd(dateStr);
        today.setHours(0, 0, 0, 0);

        const personnelList = await this.repository.find();
        const vacationRepo = AppDataSource.getRepository(Vacation);
        const vacations = await vacationRepo.find();

        // Group vacations by personnel and pick the earliest record that defines a cycle
        const baseByPersonnel: Record<string, (typeof vacations)[number]> = {};
        for (const v of vacations) {
            const cycle = parseInt(v.cycle || '', 10);
            if (!cycle || cycle <= 0) continue;
            const existing = baseByPersonnel[v.personnelId];
            if (!existing || parseYmd(v.startDate).getTime() < parseYmd(existing.startDate).getTime()) {
                baseByPersonnel[v.personnelId] = v;
            }
        }

        const goingDown: Record<string, unknown>[] = [];
        const comingUp: Record<string, unknown>[] = [];
        const onVacation: Record<string, unknown>[] = [];

        for (const p of personnelList) {
            const base = baseByPersonnel[p.id];
            if (!base) continue;

            const cycle = parseInt(base.cycle as string, 10);
            const anchor = parseYmd(base.startDate);
            anchor.setHours(0, 0, 0, 0);
            if (anchor.getTime() > today.getTime()) continue;

            const leaveDays = Math.max(
                1,
                Math.round(
                    (parseYmd(base.expectedReturnDate).getTime() - anchor.getTime()) / 86400000
                )
            );

            // Rotation period = service (cycle) + leave (leaveDays). After returning,
            // the next descent happens cycle days later, so the full period is cycle + leaveDays.
            const period = cycle + leaveDays;

            const diffDays = Math.floor((today.getTime() - anchor.getTime()) / 86400000);
            const k = Math.floor(diffDays / period);
            const descent = new Date(anchor);
            descent.setDate(descent.getDate() + k * period);
            const ret = new Date(descent);
            ret.setDate(ret.getDate() + leaveDays);

            const info = {
                id: p.id,
                fullName: p.fullName,
                rank: p.rank,
                militaryId: p.militaryId,
                unit: p.unit,
                cycle: base.cycle,
                nextDescent: fmtYmd(descent),
                nextReturn: fmtYmd(ret)
            };

            if (today.getTime() === descent.getTime()) {
                goingDown.push(info);
            } else if (today.getTime() === ret.getTime()) {
                comingUp.push(info);
            }

            if (today.getTime() > descent.getTime() && today.getTime() < ret.getTime()) {
                onVacation.push(info);
            }
        }

        return {
            date: fmtYmd(today),
            goingDown,
            comingUp,
            onVacation
        };
    }
}
export const personnelService = new PersonnelService();
