import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import personnelRouter from "./modules/personnel/personnel.routes";
import documentsRouter from "./modules/documents/documents.routes";
import vacationsRouter from "./modules/vacations/vacations.routes";
import formsRouter from "./modules/forms/forms.routes";
import clinicRouter from "./modules/clinic/clinic.routes";
import operationsRouter from "./modules/operations/operations.routes";
import securityRouter from "./modules/security/security.routes";
import servicesRouter from "./modules/services/services.routes";
import rewardsRouter from "./modules/rewards/rewards.routes";
import penaltiesRouter from "./modules/penalties/penalties.routes";
import authRouter from "./modules/auth/auth.routes";
import lineRouter from "./modules/line/line.routes";
import absenceRouter from "./modules/absence/absence.routes";
import notificationRouter from "./modules/notification/notification.routes";
import activityRouter from "./modules/activity/activity.routes";
import { activityLogger } from "./middlewares/activityLogger";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// Config CORS
app.use(cors({
    origin: "*", // Adjust in production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// سجل تحديثات النظام — يسجّل كل عمليات الإضافة/التعديل/الحذف الناجحة
app.use(activityLogger);

// Serve local upload files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
});

// API Routes registration
app.use("/api/personnel", personnelRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/vacations", vacationsRouter);
app.use("/api/forms", formsRouter);
app.use("/api/clinic", clinicRouter);
app.use("/api/operations", operationsRouter);
app.use("/api/security", securityRouter);
app.use("/api/services", servicesRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/penalties", penaltiesRouter);
app.use("/api/line", lineRouter);
app.use("/api/absence", absenceRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/activity", activityRouter);
app.use("/api/auth", authRouter);

// Serve built frontend (client/out/renderer) so phones/tablets open http://server:5000 directly.
// Resolves in production (dist/) and dev (src/) layouts; skipped silently if no build exists.
const frontendCandidates = [
    path.join(__dirname, "../../client/out/renderer"),
    path.join(process.cwd(), "client/out/renderer"),
    path.join(process.cwd(), "out/renderer")
];
const frontendDist = frontendCandidates.find((dir) => {
    try {
        return fs.existsSync(path.join(dir, "index.html"));
    } catch {
        return false;
    }
});
if (frontendDist) {
    app.use(express.static(frontendDist, {
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
        res.sendFile(path.join(frontendDist as string, "index.html"));
    });
    console.log(`Serving frontend from: ${frontendDist}`);
} else {
    console.log("Frontend build not found — API only mode. Build client to enable browser access.");
}

// Global Error Handler
app.use(errorHandler);

export default app;
