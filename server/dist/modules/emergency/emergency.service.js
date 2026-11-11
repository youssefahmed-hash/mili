"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyService = exports.EmergencyService = void 0;
const data_source_1 = require("../../config/data-source");
const EmergencyAssignment_1 = require("../../entities/EmergencyAssignment");
const Personnel_1 = require("../../entities/Personnel");
const LinePoint_1 = require("../../entities/LinePoint");
const Shift_1 = require("../../entities/Shift");
const LINE_UNIT = "الخط";
class EmergencyService {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(EmergencyAssignment_1.EmergencyAssignment);
        this.personnelRepo = data_source_1.AppDataSource.getRepository(Personnel_1.Personnel);
        this.pointRepo = data_source_1.AppDataSource.getRepository(LinePoint_1.LinePoint);
        this.shiftRepo = data_source_1.AppDataSource.getRepository(Shift_1.Shift);
    }
    isAdmin(scope) {
        return scope?.role === 'admin';
    }
    isOperations(scope) {
        const dept = (scope?.department ?? '').trim();
        return dept === 'عمليات حربية' || dept === 'عمليات داخلية';
    }
    /**
     * قائمة الطوارئ مع فلتر الـscope (نفس قاعدة الطابور):
     * admin → الكل | عمليات → (unit خط OR weekType خط) | غيره → (unit غير خط OR weekType أفراد)
     * status اختياري للفلترة (الإشعار والطابور يستخدمان المعتمدة فقط عبر overlapping/activeOn).
     */
    async list(filters, scope) {
        const qb = this.repository
            .createQueryBuilder("e")
            .leftJoinAndSelect("e.personnel", "p")
            .leftJoinAndSelect("e.linePoint", "lp")
            .leftJoinAndSelect("e.shift", "s");
        if (filters.weekType)
            qb.andWhere("e.weekType = :weekType", { weekType: filters.weekType });
        if (filters.personnelId)
            qb.andWhere("e.personnelId = :personnelId", { personnelId: filters.personnelId });
        if (filters.activeOn) {
            qb.andWhere("e.startDate <= :d", { d: filters.activeOn.slice(0, 10) });
            qb.andWhere("e.endDate >= :d", { d: filters.activeOn.slice(0, 10) });
        }
        if (filters.status) {
            qb.andWhere("e.status = :st", { st: filters.status });
        }
        if (!this.isAdmin(scope)) {
            if (!scope || scope.role === undefined)
                return [];
            if (this.isOperations(scope)) {
                qb.andWhere("(p.unit = :lineUnit OR e.weekType = :lineType)", { lineUnit: LINE_UNIT, lineType: 'line' });
            }
            else {
                qb.andWhere("(p.unit != :lineUnit OR e.weekType = :perType)", { lineUnit: LINE_UNIT, perType: 'personnel' });
            }
        }
        return await qb.orderBy("e.startDate", "ASC").getMany();
    }
    /**
     * إنشاء طوارئ (أدمن فقط — يُفرض في الـroute عبر requireAdmin).
     * قواعد:
     * - weekType='personnel' (خط → أفراد): العسكري يجب أن يكون unit === 'الخط'. لا نقطة/عمالة.
     * - weekType='line' (أفراد → خط): العسكري يجب أن يكون unit !== 'الخط' + نقطة + عمالة موجودتين.
     * - يمنع تداخل طوارئ لنفس العسكري في نفس weekType.
     */
    async create(data) {
        const { personnelId, weekType, startDate, endDate } = data;
        if (!personnelId)
            throw new Error("يجب تحديد العسكري");
        if (weekType !== 'personnel' && weekType !== 'line')
            throw new Error("نوع الأسبوع يجب أن يكون: personnel أو line");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) {
            throw new Error("صيغة التاريخ غير صالحة، يجب أن تكون YYYY-MM-DD");
        }
        if (startDate.slice(0, 10) > endDate.slice(0, 10))
            throw new Error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
        const personnel = await this.personnelRepo.findOne({ where: { id: personnelId } });
        if (!personnel)
            throw new Error("الفرد غير موجود");
        let linePointId = null;
        let shiftId = null;
        if (weekType === 'personnel') {
            if (personnel.unit !== LINE_UNIT)
                throw new Error("طوارئ الأفراد مخصصة لعساكر الخط فقط");
        }
        else {
            if (personnel.unit === LINE_UNIT)
                throw new Error("طوارئ الخط مخصصة لعساكر الأفراد (غير الخط) فقط");
            if (!data.linePointId)
                throw new Error("يجب تحديد النقطة لطوارئ الخط");
            if (!data.shiftId)
                throw new Error("يجب تحديد العمالة لطوارئ الخط");
            const point = await this.pointRepo.findOne({ where: { id: data.linePointId } });
            if (!point)
                throw new Error("النقطة غير موجودة");
            const shift = await this.shiftRepo.findOne({ where: { id: data.shiftId } });
            if (!shift)
                throw new Error("العمالة غير موجودة");
            linePointId = point.id;
            shiftId = shift.id;
        }
        const overlap = await this.repository
            .createQueryBuilder("e")
            .where("e.personnelId = :personnelId", { personnelId })
            .andWhere("e.weekType = :weekType", { weekType })
            .andWhere("e.startDate <= :end", { end: endDate.slice(0, 10) })
            .andWhere("e.endDate >= :start", { start: startDate.slice(0, 10) })
            .andWhere("e.status IN (:...st)", { st: ["معلقة", "معتمدة"] })
            .getCount();
        if (overlap > 0)
            throw new Error("يوجد طوارئ متداخلة لنفس العسكري في نفس النوع");
        const record = this.repository.create({
            personnelId,
            weekType,
            startDate: startDate.slice(0, 10),
            endDate: endDate.slice(0, 10),
            linePointId,
            shiftId,
            createdBy: data.createdBy || null,
            status: "معلقة"
        });
        return await this.repository.save(record);
    }
    /** اعتماد طوارئ (أدمن فقط — يُفرض في الـroute عبر requireAdmin) */
    async approve(id) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record)
            throw new Error("الطوارئ غير موجودة");
        record.status = "معتمدة";
        return await this.repository.save(record);
    }
    /** رفض طوارئ (أدمن فقط — يُفرض في الـroute عبر requireAdmin) */
    async reject(id) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record)
            throw new Error("الطوارئ غير موجودة");
        record.status = "مرفوضة";
        return await this.repository.save(record);
    }
    async remove(id) {
        const record = await this.repository.findOne({ where: { id } });
        if (!record)
            throw new Error("الطوارئ غير موجودة");
        await this.repository.remove(record);
        return true;
    }
    /** طوارئ نشطة ومعتمدة في تاريخ محدد (تستخدمها الـNotification والطابور) */
    async activeOn(dateStr) {
        const d = dateStr.slice(0, 10);
        return await this.repository
            .createQueryBuilder("e")
            .leftJoinAndSelect("e.personnel", "p")
            .leftJoinAndSelect("e.linePoint", "lp")
            .leftJoinAndSelect("e.shift", "s")
            .where("e.startDate <= :d", { d })
            .andWhere("e.endDate >= :d", { d })
            .andWhere("e.status = :st", { st: "معتمدة" })
            .orderBy("e.startDate", "ASC")
            .getMany();
    }
    /** طوارئ معتمدة متداخلة مع أسبوع [weekStart, weekEnd] لنوع محدد */
    async overlapping(weekType, weekStart, weekEnd) {
        return await this.repository
            .createQueryBuilder("e")
            .leftJoinAndSelect("e.personnel", "p")
            .leftJoinAndSelect("e.linePoint", "lp")
            .leftJoinAndSelect("e.shift", "s")
            .where("e.weekType = :weekType", { weekType })
            .andWhere("e.startDate <= :weekEnd", { weekEnd: weekEnd.slice(0, 10) })
            .andWhere("e.endDate >= :weekStart", { weekStart: weekStart.slice(0, 10) })
            .andWhere("e.status = :st", { st: "معتمدة" })
            .orderBy("e.startDate", "ASC")
            .getMany();
    }
}
exports.EmergencyService = EmergencyService;
exports.emergencyService = new EmergencyService();
