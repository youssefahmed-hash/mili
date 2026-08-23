"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentsService = exports.DocumentsService = void 0;
const data_source_1 = require("../../config/data-source");
const Document_1 = require("../../entities/Document");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class DocumentsService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(Document_1.Document);
    }
    async getByPersonnelId(personnelId) {
        return await this.repository.find({
            where: { personnelId },
            order: { uploadedAt: "DESC" }
        });
    }
    async create(data) {
        const doc = this.repository.create(data);
        return await this.repository.save(doc);
    }
    async delete(id) {
        const doc = await this.repository.findOne({ where: { id } });
        if (!doc) {
            throw new Error("المستند غير موجود");
        }
        // Delete local file
        this.deleteLocalFile(doc.fileUrl);
        await this.repository.remove(doc);
        return true;
    }
    deleteLocalFile(fileUrl) {
        try {
            if (fileUrl.startsWith("/uploads/")) {
                const relativePath = fileUrl.replace("/uploads/", "");
                const filePath = path_1.default.join(__dirname, "../../../uploads", relativePath);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        }
        catch (err) {
            console.error(`Error deleting document file ${fileUrl}:`, err);
        }
    }
}
exports.DocumentsService = DocumentsService;
exports.documentsService = new DocumentsService();
