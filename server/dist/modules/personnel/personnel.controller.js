"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personnelController = exports.PersonnelController = void 0;
const personnel_service_1 = require("./personnel.service");
const documents_service_1 = require("../documents/documents.service");
const apiResponse_1 = require("../../utils/apiResponse");
const ATTACHMENT_DOC_TYPES = [
    { field: "cardImage", type: "personnelCard" },
    { field: "carnetImage", type: "personnelCarnet" },
    { field: "formImage", type: "personnelForm" }
];
async function createAttachmentDocuments(personnelId, files) {
    for (const { field, type } of ATTACHMENT_DOC_TYPES) {
        const file = files?.[field]?.[0];
        if (file) {
            await documents_service_1.documentsService.create({
                personnelId,
                type,
                fileUrl: `/uploads/documents/${file.filename}`
            });
        }
    }
}
class PersonnelController {
    async getAll(req, res, next) {
        try {
            const { search, ranks, rank, unit, status, personnelType, page, limit } = req.query;
            const filters = {
                search: search,
                ranks: ranks,
                rank: rank,
                unit: unit,
                status: status,
                personnelType: personnelType,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            };
            const result = await personnel_service_1.personnelService.findAll(filters);
            return (0, apiResponse_1.successResponse)(res, result.items, "تم جلب الأفراد بنجاح", 200, {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getOne(req, res, next) {
        try {
            const { id } = req.params;
            const personnel = await personnel_service_1.personnelService.findOne(id);
            if (!personnel) {
                return (0, apiResponse_1.errorResponse)(res, "الفرد العسكري غير موجود", 404);
            }
            return (0, apiResponse_1.successResponse)(res, personnel, "تم جلب بيانات الفرد العسكري بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body;
            const files = req.files;
            if (files?.photo?.[0]) {
                data.photo = `/uploads/photos/${files.photo[0].filename}`;
            }
            const personnel = await personnel_service_1.personnelService.create(data);
            await createAttachmentDocuments(personnel.id, files);
            return (0, apiResponse_1.successResponse)(res, personnel, "تم إضافة الفرد العسكري بنجاح", 201);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const files = req.files;
            if (files?.photo?.[0]) {
                data.photo = `/uploads/photos/${files.photo[0].filename}`;
            }
            const personnel = await personnel_service_1.personnelService.update(id, data);
            await createAttachmentDocuments(personnel.id, files);
            return (0, apiResponse_1.successResponse)(res, personnel, "تم تحديث بيانات الفرد العسكري بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await personnel_service_1.personnelService.delete(id);
            return (0, apiResponse_1.successResponse)(res, null, "تم حذف الفرد العسكري وجميع بياناته المرتبطة بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
    async getVacationLineup(req, res, next) {
        try {
            const { date } = req.query;
            const result = await personnel_service_1.personnelService.getVacationLineup(date);
            return (0, apiResponse_1.successResponse)(res, result, "تم جلب طابور الإجازات بنجاح");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PersonnelController = PersonnelController;
exports.personnelController = new PersonnelController();
