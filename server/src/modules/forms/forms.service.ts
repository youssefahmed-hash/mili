import { AppDataSource } from "../../config/data-source";
import { Form } from "../../entities/Form";
import fs from "fs";
import path from "path";

export class FormsService {
    private repository = AppDataSource.getRepository(Form);

    async getByPersonnelId(personnelId: string) {
        return await this.repository.find({
            where: { personnelId },
            order: { createdAt: "DESC" }
        });
    }

    async create(data: Partial<Form>) {
        const form = this.repository.create(data);
        return await this.repository.save(form);
    }

    async update(id: string, data: Partial<Form>) {
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

    async delete(id: string) {
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

    private deleteLocalFile(fileUrl: string) {
        try {
            if (fileUrl.startsWith("/uploads/")) {
                const relativePath = fileUrl.replace("/uploads/", "");
                const filePath = path.join(__dirname, "../../../uploads", relativePath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error(`Error deleting form file ${fileUrl}:`, err);
        }
    }
}

export const formsService = new FormsService();
