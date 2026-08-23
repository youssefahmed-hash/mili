import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const uploadDirs = [
    path.join(__dirname, "../../uploads"),
    path.join(__dirname, "../../uploads/photos"),
    path.join(__dirname, "../../uploads/documents"),
    path.join(__dirname, "../../uploads/forms")
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = "documents";
        
        // Determine subfolder based on request path or fieldname
        if (file.fieldname === "photo") {
            folder = "photos";
        } else if (req.originalUrl.includes("/forms")) {
            folder = "forms";
        } else if (req.originalUrl.includes("/documents")) {
            folder = "documents";
        }

        cb(null, path.join(__dirname, `../../uploads/${folder}`));
    },
    filename: (req, file, cb) => {
        // Safe filename: timestamp + sanitized original name
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // For photos, only allow images
    if (file.fieldname === "photo") {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("يسمح فقط برفع ملفات الصور للوجه الشخصي"));
        }
    } else {
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
        } else {
            cb(new Error("نوع الملف غير مدعوم. الأنواع المسموحة: PDF, DOC, DOCX, JPEG, PNG"));
        }
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});
