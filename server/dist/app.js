"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const personnel_routes_1 = __importDefault(require("./modules/personnel/personnel.routes"));
const documents_routes_1 = __importDefault(require("./modules/documents/documents.routes"));
const vacations_routes_1 = __importDefault(require("./modules/vacations/vacations.routes"));
const forms_routes_1 = __importDefault(require("./modules/forms/forms.routes"));
const clinic_routes_1 = __importDefault(require("./modules/clinic/clinic.routes"));
const operations_routes_1 = __importDefault(require("./modules/operations/operations.routes"));
const security_routes_1 = __importDefault(require("./modules/security/security.routes"));
const services_routes_1 = __importDefault(require("./modules/services/services.routes"));
const rewards_routes_1 = __importDefault(require("./modules/rewards/rewards.routes"));
const penalties_routes_1 = __importDefault(require("./modules/penalties/penalties.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const line_routes_1 = __importDefault(require("./modules/line/line.routes"));
const absence_routes_1 = __importDefault(require("./modules/absence/absence.routes"));
const notification_routes_1 = __importDefault(require("./modules/notification/notification.routes"));
const activity_routes_1 = __importDefault(require("./modules/activity/activity.routes"));
const activityLogger_1 = require("./middlewares/activityLogger");
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
// Config CORS
app.use((0, cors_1.default)({
    origin: "*", // Adjust in production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// Body Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// سجل تحديثات النظام — يسجّل كل عمليات الإضافة/التعديل/الحذف الناجحة
app.use(activityLogger_1.activityLogger);
// Serve local upload files statically
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
});
// API Routes registration
app.use("/api/personnel", personnel_routes_1.default);
app.use("/api/documents", documents_routes_1.default);
app.use("/api/vacations", vacations_routes_1.default);
app.use("/api/forms", forms_routes_1.default);
app.use("/api/clinic", clinic_routes_1.default);
app.use("/api/operations", operations_routes_1.default);
app.use("/api/security", security_routes_1.default);
app.use("/api/services", services_routes_1.default);
app.use("/api/rewards", rewards_routes_1.default);
app.use("/api/penalties", penalties_routes_1.default);
app.use("/api/line", line_routes_1.default);
app.use("/api/absence", absence_routes_1.default);
app.use("/api/notification", notification_routes_1.default);
app.use("/api/activity", activity_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
// Serve built frontend (client/out/renderer) so phones/tablets open http://server:5000 directly.
// Resolves in production (dist/) and dev (src/) layouts; skipped silently if no build exists.
const frontendCandidates = [
    path_1.default.join(__dirname, "../../client/out/renderer"),
    path_1.default.join(process.cwd(), "client/out/renderer"),
    path_1.default.join(process.cwd(), "out/renderer")
];
const frontendDist = frontendCandidates.find((dir) => {
    try {
        return fs_1.default.existsSync(path_1.default.join(dir, "index.html"));
    }
    catch {
        return false;
    }
});
if (frontendDist) {
    app.use(express_1.default.static(frontendDist, {
        setHeaders: (res, filePath) => {
            // index.html لازم يتجاب دايمًا من السيرفر (بدون كاش) عشان أي بناء جديد يظهر فورًا
            if (filePath.endsWith("index.html")) {
                res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", "0");
            }
        }
    }));
    // SPA fallback: any non-API, non-uploads GET serves index.html
    app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.sendFile(path_1.default.join(frontendDist, "index.html"));
    });
    console.log(`Serving frontend from: ${frontendDist}`);
}
else {
    console.log("Frontend build not found — API only mode. Build client to enable browser access.");
}
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
