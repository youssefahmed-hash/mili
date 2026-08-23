"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure upload directories exist
const uploadDirs = [
    path_1.default.join(__dirname, "../../uploads"),
    path_1.default.join(__dirname, "../../uploads/photos"),
    path_1.default.join(__dirname, "../../uploads/documents"),
    path_1.default.join(__dirname, "../../uploads/forms")
];
uploadDirs.forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let folder = "documents";
        // Determine subfolder based on request path or fieldname
        if (file.fieldname === "photo") {
            folder = "photos";
        }
        else if (req.originalUrl.includes("/forms")) {
            folder = "forms";
        }
        else if (req.originalUrl.includes("/documents")) {
            folder = "documents";
        }
        cb(null, path_1.default.join(__dirname, `../../uploads/${folder}`));
    },
    filename: (req, file, cb) => {
        // Safe filename: timestamp + sanitized original name
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        const name = path_1.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    // For photos, only allow images
    if (file.fieldname === "photo") {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("يسمح فقط برفع ملفات الصور للوجه الشخصي"));
        }
    }
    else {
        // For docs and forms, allow images, pdfs, etc.
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("نوع الملف غير مدعوم. الأنواع المسموحة: PDF, DOC, DOCX, JPEG, PNG"));
        }
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});
