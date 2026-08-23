"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentsController = exports.DocumentsController = void 0;
const documents_service_1 = require("./documents.service");
const apiResponse_1 = require("../../utils/apiResponse");
class DocumentsController {
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const docs = await documents_service_1.documentsService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, docs, "تم جلب المستندات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async uploadDoc(req, res, next) {
        try {
            const { personnelId, type } = req.body;
            if (!req.file) {
                return (0, apiResponse_1.errorResponse)(res, "الرجاء رفع ملف المستند", 400);
            }
            if (!personnelId || !type) {
                return (0, apiResponse_1.errorResponse)(res, "الرجاء توفير معرف الفرد ونوع المستند", 400);
            }
            const fileUrl = `/uploads/documents/${req.file.filename}`;
            const doc = await documents_service_1.documentsService.create({
                personnelId,
                type,
                fileUrl
            });
            return (0, apiResponse_1.successResponse)(res, doc, "تم رفع وحفظ المستند بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async deleteDoc(req, res, next) {
        try {
            const { id } = req.params;
            await documents_service_1.documentsService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف المستند بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DocumentsController = DocumentsController;
exports.documentsController = new DocumentsController();
