"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.personnelService = exports.PersonnelService = void 0;
const data_source_1 = require("../../config/data-source");
const Personnel_1 = require("../../entities/Personnel");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class PersonnelService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
    }
    async findAll(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const queryBuilder = this.repository.createQueryBuilder("personnel");
        // Search by name or militaryId
        if (filters.search) {
            queryBuilder.andWhere("(personnel.fullName ILIKE :search OR personnel.militaryId LIKE :searchExact)", { search: `%${filters.search}%`, searchExact: filters.search });
        }
        // Apply filters
        if (filters.category) {
            queryBuilder.andWhere("personnel.category = :category", { category: filters.category });
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
    async findOne(id) {
        return await this.repository.findOne({
            where: { id },
            relations: ["documents", "vacations", "forms"]
        });
    }
    async create(data) {
        const newPersonnel = this.repository.create(data);
        return await this.repository.save(newPersonnel);
    }
    async update(id, data) {
        const personnel = await this.findOne(id);
        if (!personnel) {
            throw new Error("الفرد العسكري غير موجود");
        }
        // If updating photo and old photo exists, optionally remove old photo file
        if (data.photo && personnel.photo && data.photo !== personnel.photo) {
            this.deleteLocalFile(personnel.photo);
        }
        this.repository.merge(personnel, data);
        return await this.repository.save(personnel);
    }
    async delete(id) {
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
    deleteLocalFile(fileUrl) {
        try {
            // fileUrl format: /uploads/folder/filename
            if (fileUrl.startsWith("/uploads/")) {
                const relativePath = fileUrl.replace("/uploads/", "");
                const filePath = path_1.default.join(__dirname, "../../../uploads", relativePath);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        }
        catch (err) {
            console.error(`Error deleting local file ${fileUrl}:`, err);
        }
    }
}
exports.PersonnelService = PersonnelService;
exports.personnelService = new PersonnelService();
