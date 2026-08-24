import { AppDataSource } from "../../config/data-source";
import { Document, DocumentType } from "../../entities/Document";
import fs from "fs";
import path from "path";

export class DocumentsService {
    private repository = AppDataSource.getRepository(Document);

    async getByPersonnelId(personnelId: string) {
        return await this.repository.find({
            where: { personnelId },
            order: { uploadedAt: "DESC" }
        });
    }

    async create(data: { personnelId: string; type: DocumentType; fileUrl: string }) {
        const doc = this.repository.create(data);
        return await this.repository.save(doc);
    }

    async delete(id: string) {
        const doc = await this.repository.findOne({ where: { id } });
        if (!doc) {
            throw new Error("المستند غير موجود");
        }

        // Delete local file
        this.deleteLocalFile(doc.fileUrl);

        await this.repository.remove(doc);
        return true;
    }

    private deleteLocalFile(fileUrl: string) {
        try {
            if (fileUrl.startsWith("/uploads/")) {
                const relativePath = fileUrl.replace("/uploads/", "");
                const filePath = path.join(process.cwd(), "uploads", relativePath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (err) {
            console.error(`Error deleting document file ${fileUrl}:`, err);
        }
    }
}

export const documentsService = new DocumentsService();
