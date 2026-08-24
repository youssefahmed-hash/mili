"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const personnel_routes_1 = __importDefault(require("./modules/personnel/personnel.routes"));
const documents_routes_1 = __importDefault(require("./modules/documents/documents.routes"));
const vacations_routes_1 = __importDefault(require("./modules/vacations/vacations.routes"));
const forms_routes_1 = __importDefault(require("./modules/forms/forms.routes"));
const clinic_routes_1 = __importDefault(require("./modules/clinic/clinic.routes"));
const operations_routes_1 = __importDefault(require("./modules/operations/operations.routes"));
const security_routes_1 = __importDefault(require("./modules/security/security.routes"));
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
// Global Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
