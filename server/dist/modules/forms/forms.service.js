"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formsService = exports.FormsService = void 0;
const data_source_1 = require("../../config/data-source");
const Form_1 = require("../../entities/Form");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FormsService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(Form_1.Form);
    }
    async getByPersonnelId(personnelId) {
        return await this.repository.find({
            where: { personnelId },
            order: { createdAt: "DESC" }
        });
    }
    async create(data) {
        const form = this.repository.create(data);
        return await this.repository.save(form);
    }
    async update(id, data) {
        const form = await this.repository.findOne({ where: { id } });
        if (!form) {
            throw new Error("النموذج غير موجود");
        }
        // If replacing file
        if (data.fileUrl && form.fileUrl && data.fileUrl !== form.fileUrl) {
            this.deleteLocalFile(form.fileUrl);
        }
        this.repository.merge(form, data);
        return await this.repository.save(form);
    }
    async delete(id) {
        const form = await this.repository.findOne({ where: { id } });
        if (!form) {
            throw new Error("النموذج غير موجود");
        }
        // Delete file
        if (form.fileUrl) {
            this.deleteLocalFile(form.fileUrl);
        }
        await this.repository.remove(form);
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
            console.error(`Error deleting form file ${fileUrl}:`, err);
        }
    }
}
exports.FormsService = FormsService;
exports.formsService = new FormsService();
