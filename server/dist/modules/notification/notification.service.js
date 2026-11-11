"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const data_source_1 = require("../../config/data-source");
const NotificationSettings_1 = require("../../entities/NotificationSettings");
const Vacation_1 = require("../../entities/Vacation");
const LineAssignment_1 = require("../../entities/LineAssignment");
const LineLeaveCycle_1 = require("../../entities/LineLeaveCycle");
const line_service_1 = require("../line/line.service");
const LINE_UNIT = "الخط";
const PERSONNEL_VACATION_STATUSES = ["معتمدة", "نشطة"];
class NotificationService {
    constructor() {
        this.settingsRepo = data_source_1.AppDataSource.getRepository(NotificationSettings_1.NotificationSettings);
        this.vacationsRepo = data_source_1.AppDataSource.getRepository(Vacation_1.Vacation);
        this.assignmentsRepo = data_source_1.AppDataSource.getRepository(LineAssignment_1.LineAssignment);
        this.cyclesRepo = data_source_1.AppDataSource.getRepository(LineLeaveCycle_1.LineLeaveCycle);
    }
    async getSettings() {
        return await this.settingsRepo.findOne({ where: {} });
    }
    async updateSettings(data) {
        let settings = await this.getSettings();
        if (!settings) {
            settings = this.settingsRepo.create({});
        }
        if (data.weeklyRotationStartDate !== undefined) {
            if (data.weeklyRotationStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.weeklyRotationStartDate)) {
                throw new Error("تاريخ بداية التناوب غير صالح، يجب أن يكون بصيغة YYYY-MM-DD");
            }
            settings.weeklyRotationStartDate = data.weeklyRotationStartDate;
        }
        if (data.firstTurn !== undefined) {
            if (data.firstTurn && !["personnel", "line"].includes(data.firstTurn)) {
                throw new Error("أول دور يجب أن يكون: personnel أو line");
            }
            settings.firstTurn = data.firstTurn;
        }
        return await this.settingsRepo.save(settings);
    }
    /**
     * تحديد الدور الحالي بناءً على rotationStartDate المحدد من الأدمن.
     * الدورات 7 أيام متتالية تبدأ من rotationStartDate مباشرة (قد يكون أي يوم).
     */
    getCurrentTurn(rotationStart, firstTurn, todayStr) {
        if (!rotationStart || !firstTurn) {
            return { turn: "personnel", weekStart: "", weekEnd: "", configured: false };
        }
        const today = todayStr || new Date().toISOString().split("T")[0];
        const startDays = this.daysSinceEpoch(rotationStart);
        const todayDays = this.daysSinceEpoch(today);
        const diffDays = todayDays - startDays;
        if (diffDays < 0) {
            return {
                turn: firstTurn,
                weekStart: rotationStart,
                weekEnd: this.addDays(rotationStart, 6),
                configured: true
            };
        }
        const turnIndex = Math.floor(diffDays / 7);
        const isFirstTurn = (turnIndex % 2 === 0);
        const turn = isFirstTurn ? firstTurn : (firstTurn === "personnel" ? "line" : "personnel");
        const periodStart = this.addDays(rotationStart, turnIndex * 7);
        const periodEnd = this.addDays(periodStart, 6);
        return { turn, weekStart: periodStart, weekEnd: periodEnd, configured: true };
    }
    /**
     * بناء الـNotification الحالية — طبقة قراءة وتجميع فقط، لا تغير أي نظام موجود
     * @param asOf تاريخ اختياري بصيغة YYYY-MM-DD للاختبار/العرض فقط (لا يغير تاريخ النظام)
     * @param userContext بيانات المستخدم المصادق عليه (Backend مصدر الحقيقة للـscope)
     */
    async getCurrentNotification(asOf, userContext) {
        let today;
        if (asOf !== undefined) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
                throw new Error("صيغة التاريخ غير صالحة، يجب أن تكون YYYY-MM-DD");
            }
            today = asOf;
        }
        const settings = await this.getSettings();
        const rotationStart = settings?.weeklyRotationStartDate || null;
        const firstTurn = settings?.firstTurn || null;
        const { turn, weekStart, weekEnd, configured } = this.getCurrentTurn(rotationStart, firstTurn, today);
        if (!configured) {
            return {
                turn: "personnel",
                weekStart: "",
                weekEnd: "",
                source: "غير مهيأ",
                count: 0,
                lineShiftName: null,
                personnel: [],
                configured: false
            };
        }
        if (turn === "personnel") {
            // Fail-closed: بدون مستخدم مصادق عليه لا تُعرض أي بيانات (المسار محمي بـrequireAuthScope).
            if (!userContext || userContext.role === undefined) {
                return {
                    turn: "personnel",
                    weekStart,
                    weekEnd,
                    source: "الأفراد",
                    count: 0,
                    lineShiftName: null,
                    personnel: [],
                    configured: true,
                };
            }
            // مستخدم العمليات: لا يرى بيانات الأفراد أبدًا — حتى في أسبوع الأفراد.
            // مدير الداخلية sees بيانات الأفراد (زي المدير) — نطاقه محصور في buildPersonnelNotification.
            const isAdmin = userContext.role === 'admin' || userContext.role === 'internal_manager';
            const dept = (userContext.department ?? '').trim();
            const isOperations = dept === 'عمليات حربية' || dept === 'عمليات داخلية';
            if (!isAdmin && isOperations) {
                return {
                    turn: "personnel",
                    weekStart,
                    weekEnd,
                    source: "الأفراد",
                    count: 0,
                    lineShiftName: null,
                    personnel: [],
                    configured: true,
                };
            }
            return await this.buildPersonnelNotification(weekStart, weekEnd);
        }
        // Fail-closed لدور الخط أيضًا عند غياب الـscope.
        if (!userContext || userContext.role === undefined) {
            return {
                turn: "line",
                weekStart,
                weekEnd,
                source: "الخط",
                count: 0,
                lineShiftName: null,
                personnel: [],
                configured: true,
            };
        }
        return await this.buildLineNotification(weekStart, weekEnd);
    }
    // ==================== دور الأفراد ====================
    async buildPersonnelNotification(weekStart, weekEnd) {
        // نقرأ فقط الإجازات التي يبدأ نزول أصحابها داخل هذا الدور
        // مع استبعاد عساكر الخط (unit === "الخط")
        const vacations = await this.vacationsRepo
            .createQueryBuilder("v")
            .leftJoinAndSelect("v.personnel", "p")
            .where("v.status IN (:...statuses)", { statuses: PERSONNEL_VACATION_STATUSES })
            .andWhere("v.startDate >= :weekStart", { weekStart })
            .andWhere("v.startDate <= :weekEnd", { weekEnd })
            .andWhere("p.unit != :lineUnit", { lineUnit: LINE_UNIT })
            .orderBy("v.startDate", "ASC")
            .getMany();
        const personnel = this.dedupeById(vacations
            .filter((v) => v.personnel)
            .map((v) => ({
            id: v.personnel.id,
            fullName: v.personnel.fullName,
            rank: v.personnel.rank,
            personnelType: v.personnel.personnelType || null,
            vacationType: v.vacationType,
            startDate: this.toDateStr(v.startDate),
            expectedReturnDate: this.effectiveReturnDate(v),
            linePoint: null,
        })));
        return {
            turn: "personnel",
            weekStart,
            weekEnd,
            source: "الأفراد",
            count: personnel.length,
            lineShiftName: null,
            personnel,
            configured: true,
        };
    }
    // ==================== دور الخط ====================
    async buildLineNotification(weekStart, weekEnd) {
        const empty = {
            turn: "line",
            weekStart,
            weekEnd,
            source: "الخط",
            count: 0,
            lineShiftName: null,
            personnel: [],
            configured: true,
        };
        // مصدر الحقيقة للعمالة الموجودة في الإجازة هو Rotation الـ14 يوم
        const rotationStart = await this.getLineRotationStart();
        if (!rotationStart)
            return empty;
        // تاريخ الحل داخل الـrotation (يثبت على بدايته إذا سبقته بداية الدور)
        const anchor = weekStart < rotationStart ? rotationStart : weekStart;
        const leaveShift = await line_service_1.lineLeaveCycleService.getCurrentLeaveShift(anchor);
        if (!leaveShift)
            return empty;
        // تعيينات عمالة الإجازة (دوران) + الإجازات الفردية (حالة إجازة على أي عمالة).
        // صف واحد لكل عسكري (UNIQUE) فلا تكرار.
        const assignments = await this.assignmentsRepo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.personnel", "p")
            .leftJoinAndSelect("a.linePoint", "lp")
            .where("(a.shiftId = :shiftId OR a.status = :leaveStatus)", { shiftId: leaveShift.shiftId, leaveStatus: "إجازة" })
            .andWhere("p.unit = :lineUnit", { lineUnit: LINE_UNIT })
            .getMany();
        const personnel = this.dedupeById(assignments
            .filter((a) => a.personnel)
            .map((a) => ({
            id: a.personnel.id,
            fullName: a.personnel.fullName,
            rank: a.personnel.rank,
            personnelType: a.personnel.personnelType || null,
            vacationType: null,
            startDate: this.toDateStr(a.updatedAt),
            expectedReturnDate: null,
            linePoint: a.linePoint ? a.linePoint.name : null,
        })));
        return {
            turn: "line",
            weekStart,
            weekEnd,
            source: "الخط",
            count: personnel.length,
            lineShiftName: leaveShift.shiftName,
            personnel,
            configured: true,
        };
    }
    // ==================== Helpers ====================
    async getLineRotationStart() {
        const first = await this.cyclesRepo.findOne({ where: {}, order: { cycleNumber: "ASC" } });
        if (!first)
            return null;
        return String(first.leaveStartDate).slice(0, 10);
    }
    daysSinceEpoch(dateStr) {
        const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
        return Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24);
    }
    addDays(dateStr, days) {
        const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().split("T")[0];
    }
    toDateStr(value) {
        if (!value)
            return null;
        if (typeof value === "string")
            return value.slice(0, 10);
        if (value instanceof Date)
            return value.toISOString().split("T")[0];
        return String(value).slice(0, 10);
    }
    /** تاريخ العودة الفعلي = المتوقع + أيام المد − أيام الخصم */
    effectiveReturnDate(vacation) {
        const base = this.toDateStr(vacation.expectedReturnDate);
        if (!base)
            return null;
        const delta = Math.max(0, vacation.extensionDays || 0) - Math.max(0, vacation.deductionDays || 0);
        return delta === 0 ? base : this.addDays(base, delta);
    }
    dedupeById(items) {
        const seen = new Set();
        const result = [];
        for (const item of items) {
            if (seen.has(item.id))
                continue;
            seen.add(item.id);
            result.push(item);
        }
        return result;
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
