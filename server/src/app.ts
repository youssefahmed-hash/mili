import express from "express";
import cors from "cors";
import path from "path";
import personnelRouter from "./modules/personnel/personnel.routes";
import documentsRouter from "./modules/documents/documents.routes";
import vacationsRouter from "./modules/vacations/vacations.routes";
import formsRouter from "./modules/forms/forms.routes";
import clinicRouter from "./modules/clinic/clinic.routes";
import operationsRouter from "./modules/operations/operations.routes";
import securityRouter from "./modules/security/security.routes";
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

// Global Error Handler
app.use(errorHandler);

export default app;
