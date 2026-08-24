"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Canonical uploads root based on the server's working directory
const uploadsRoot = path_1.default.join(process.cwd(), "uploads");
// Ensure upload directories exist
const uploadDirs = [
    uploadsRoot,
    path_1.default.join(uploadsRoot, "photos"),
    path_1.default.join(uploadsRoot, "documents"),
    path_1.default.join(uploadsRoot, "forms")
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
        cb(null, path_1.default.join(uploadsRoot, folder));
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
    const ext = path_1.default.extname(file.originalname || "").toLowerCase();
    const allowedImageExt = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const allowedDocExt = [".pdf", ".doc", ".docx"];
    const isImageMime = file.mimetype.startsWith("image/");
    const isAllowedImage = isImageMime || allowedImageExt.includes(ext);
    const isAllowedDoc = file.mimetype === "application/pdf" ||
        file.mimetype === "application/msword" ||
        file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        allowedDocExt.includes(ext);
    // For photos, only allow images
    if (file.fieldname === "photo") {
        if (isAllowedImage) {
            cb(null, true);
        }
        else {
            cb(new Error("يسمح فقط برفع ملفات الصور للوجه الشخصي"));
        }
    }
    else {
        // For docs and forms, allow images, pdfs, etc.
        if (isAllowedImage || isAllowedDoc) {
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
