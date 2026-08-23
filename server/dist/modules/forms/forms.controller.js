"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formsController = exports.FormsController = void 0;
const forms_service_1 = require("./forms.service");
const apiResponse_1 = require("../../utils/apiResponse");
class FormsController {
    async getByPersonnel(req, res, next) {
        try {
            const { personnelId } = req.params;
            const forms = await forms_service_1.formsService.getByPersonnelId(personnelId);
            return (0, apiResponse_1.successResponse)(res, forms, "تم جلب النماذج بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body;
            // If form image file is uploaded
            if (req.file) {
                data.fileUrl = `/uploads/forms/${req.file.filename}`;
            }
            const form = await forms_service_1.formsService.create(data);
            return (0, apiResponse_1.successResponse)(res, form, "تم إنشاء النموذج بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            // If replacing form image file
            if (req.file) {
                data.fileUrl = `/uploads/forms/${req.file.filename}`;
            }
            const form = await forms_service_1.formsService.update(id, data);
            return (0, apiResponse_1.successResponse)(res, form, "تم تحديث بيانات النموذج بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await forms_service_1.formsService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف النموذج بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FormsController = FormsController;
exports.formsController = new FormsController();
