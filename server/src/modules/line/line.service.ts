import { AppDataSource } from "../../config/data-source";
import { Shift } from "../../entities/Shift";
import { LinePoint } from "../../entities/LinePoint";
import { LineAssignment } from "../../entities/LineAssignment";
import { LineLeaveCycle } from "../../entities/LineLeaveCycle";
import { Personnel } from "../../entities/Personnel";
import { Vacation } from "../../entities/Vacation";

// ==================== ShiftService (قراءة فقط - seed) ====================
export class ShiftService {
  private repository = AppDataSource.getRepository(Shift);

  async getAll() {
    return await this.repository.find({ order: { order: "ASC" } });
  }

  async getById(id: string) {
    return await this.repository.findOne({ where: { id } });
  }

  async seed() {
    const required = [
      { name: "العماله الأولى", order: 1 },
      { name: "العماله الثانية", order: 2 },
      { name: "العماله الثالثة", order: 3 },
    ];

    let created = 0;
    for (const r of required) {
      const existing = await this.repository.findOne({ where: { name: r.name } });
      if (!existing) {
        const record = this.repository.create({ name: r.name, order: r.order, isActive: true });
        await this.repository.save(record);
        created++;
        console.log(`[shift-seed] تم إنشاء: ${r.name}`);
      }
    }

    const total = await this.repository.count();
    console.log(`[shift-seed] إجمالي العمالات: ${total} (تم إنشاء ${created} جديدة)`);

    if (total !== 3) {
      console.warn(`[shift-seed] تحذير: العدد المتوقع 3 لكن يوجد ${total}`);
    }
  }
}

// ==================== LinePointService ====================
export class LinePointService {
  private repository = AppDataSource.getRepository(LinePoint);

  async getAll() {
    return await this.repository.find({ order: { order: "ASC" } });
  }

  async getById(id: string) {
    return await this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<LinePoint>) {
    if (!data.name) throw new Error("يجب إدخال اسم النقطة");
    const record = this.repository.create(data);
    return await this.repository.save(record);
  }

  async update(id: string, data: Partial<LinePoint>) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) throw new Error("النقطة غير موجودة");

    const wasEnabled = record.hasOfficeDuty;
    this.repository.merge(record, data);

    // إلغاء خيار «عسكري مكتب» ⇒ فكّ كلJugular من عساكر المكتب في النقطة
    // (وإلا يختفيوا من شبكة الخط لأن العمود بيتقفل).
    if (wasEnabled && record.hasOfficeDuty === false) {
      const assignmentRepo = AppDataSource.getRepository(LineAssignment);
      const marked = await assignmentRepo.find({ where: { linePointId: id, officeDuty: true } });
      if (marked.length) {
        const leaveShiftId = await this.currentLeaveShiftId();
        for (const a of marked) {
          a.officeDuty = false;
          a.status = a.shiftId === leaveShiftId ? "إجازة" : "حاضر";
        }
        await assignmentRepo.save(marked);
      }
    }

    return await this.repository.save(record);
  }

  /** العمالة اللي في إجازة النهارده (لو فيه دورة مسجلة) — عشان نرجّع الحالة صح */
  private async currentLeaveShiftId(): Promise<string | null> {
    try {
      const cur = await lineLeaveCycleService.getCurrent();
      return cur?.[0]?.shiftId ?? null;
    } catch {
      return null;
    }
  }

  async delete(id: string) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) throw new Error("النقطة غير موجودة");
    await this.repository.remove(record);
    return true;
  }
}

// ==================== LineAssignmentService ====================
export class LineAssignmentService {
  private repository = AppDataSource.getRepository(LineAssignment);
  private personnelRepo = AppDataSource.getRepository(Personnel);

  /**
   * تمام سجل الفرد → حالة الخط المعروضة.
   * لما الخط يكون «حاضر» بنعرض تمام الفرد الفعلي (غياب/محكمة/مستشفى...) عشان
   * أي تعديل من تاب الأفراد يبان فورًا في العمليات وكروت الرئيسية — قراءة فقط.
   */
  private static readonly RECORD_STATUS_TO_LINE_STATUS: Record<string, string> = {
    "غياب": "غياب",
    "محكمه": "سجن",
    "مستشفى خارجي": "مرضي",
    "عرض مستشفى": "مرضي",
    "اجازه": "إجازة",
    "ماموريه": "مهمة",
    "منقول": "منقول"
  };

  /** حالة الخط → تمام سجل الفرد (للمزامنة عند التغيير من العمليات) */
  private static readonly LINE_STATUS_TO_RECORD_STATUS: Record<string, string> = {
    "حاضر": "داخل القطاع",
    "إجازة": "اجازه",
    "مرضي": "مستشفى خارجي",
    "سجن": "محكمه",
    "مهمة": "ماموريه",
    "غياب": "غياب",
    "منقول": "منقول"
  };

  /** الحالة الفعّالة المعروضة: حالة الخط لو مش «حاضر»، وإلا تمام سجل الفرد */
  private effectiveStatus(a: LineAssignment): string {
    const lineStatus = (a.status || "").trim();
    // عسكري المكتب مش على الخط — حالته «إجازة» للدوران فقط
    if (a.officeDuty) return lineStatus || "إجازة";
    // أي حالة خط صريحة (غياب/سجن/مرضي/إجازة/مهمة/منقول) بتغلب السجل
    if (lineStatus && lineStatus !== "حاضر") return lineStatus;
    const record = (a.personnel?.status || "").trim();
    if (record && record !== "داخل القطاع") {
      return LineAssignmentService.RECORD_STATUS_TO_LINE_STATUS[record] || "منقول";
    }
    return lineStatus || "حاضر";
  }

  /** نسخة للقراءة فقط من التعيين بحالة فعّالة موحّدة (لا تُحفظ في القاعدة) */
  decorate(a: LineAssignment): LineAssignment {
    return { ...a, status: this.effectiveStatus(a) };
  }

  /**
   * مزامنة حالة تعيين الخط لما «تمام» الفرد يتغيّر من تاب الأفراد.
   * بنلمس التعيين فقط لو حالته الحالية كانت مرآة للسجل القديم (حاضر أو نفس الحالة المشتقة)،
   * عشان ما نطمسش حالة خط صريحة (زي إجازة الدوران أو غياب مسجّل من العمليات).
   */
  async syncFromPersonnelRecord(
    personnelId: string,
    prevRecordStatus: string,
    nextRecordStatus: string
  ): Promise<void> {
    const assignment = await this.repository.findOne({ where: { personnelId } });
    if (!assignment || assignment.officeDuty) return;

    const mirror = (record: string): string => {
      const s = (record || "").trim();
      if (!s || s === "داخل القطاع") return "حاضر";
      return LineAssignmentService.RECORD_STATUS_TO_LINE_STATUS[s] || "منقول";
    };

    if (assignment.status !== mirror(prevRecordStatus)) return;
    const next = mirror(nextRecordStatus);
    if (assignment.status !== next) {
      assignment.status = next;
      await this.repository.save(assignment);
    }
  }

  async getAll(query: { pointId?: string; shiftId?: string; personnelId?: string }) {
    const where: any = {};
    if (query.pointId) where.linePointId = query.pointId;
    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.personnelId) where.personnelId = query.personnelId;

    const records = await this.repository.find({
      where,
      relations: ["personnel", "linePoint", "shift"],
      order: { createdAt: "DESC" }
    });
    return records.map((a) => this.decorate(a));
  }

  async getById(id: string) {
    const record = await this.repository.findOne({
      where: { id },
      relations: ["personnel", "linePoint", "shift"]
    });
    return record ? this.decorate(record) : null;
  }

  async getCurrentAssignment(personnelId: string) {
    const record = await this.repository.findOne({
      where: { personnelId },
      relations: ["personnel", "linePoint", "shift"]
    });
    return record ? this.decorate(record) : null;
  }

  async create(data: Partial<LineAssignment>) {
    if (!data.personnelId || !data.linePointId || !data.shiftId) {
      throw new Error("يجب إدخال جميع البيانات المطلوبة (الفرد، النقطة، العماله)");
    }

    const personnel = await this.personnelRepo.findOne({ where: { id: data.personnelId } });
    if (!personnel) throw new Error("الفرد غير موجود");
    if (personnel.unit !== "الخط") {
      throw new Error("يمكن تعيين عساكر الخط فقط (القسم: الخط)");
    }

    const existing = await this.repository.findOne({
      where: { personnelId: data.personnelId }
    });
    if (existing) {
      throw new Error("العسكري لديه تعيين بالفعل. استخدم النقل لتغيير النقطة أو العمالة.");
    }

    if (data.officeDuty) {
      // عساكر المكتب مش على الخط — الحالة الافتراضية إجازة
      if (!data.status) data.status = "إجازة";
      await this.assertOfficeDutyEnabled(data.linePointId);
    } else if (!data.status) {
      data.status = "حاضر";
    }

    const record = this.repository.create(data);
    return await this.repository.save(record);
  }

  /** fail-closed: قسم المكتب لازم يكون مفعّل في النقطة */
  private async assertOfficeDutyEnabled(linePointId: string) {
    const point = await AppDataSource.getRepository(LinePoint).findOne({
      where: { id: linePointId }
    });
    if (point && !point.hasOfficeDuty) {
      const e: any = new Error(
        `قسم «مكتب» مقفول في: ${point.name} — فعّله من إدارة النقاط`
      );
      e.status = 400;
      throw e;
    }
  }

  async bulkCreate(assignments: Partial<LineAssignment>[]) {
    if (!assignments || assignments.length === 0) {
      throw new Error("يجب إدخال تعيينات واحدة على الأقل");
    }

    const records = [];
    // نقاط اللي يسمح فيها بقسم المكتب (fail-closed: مكتب في نقطة مقفولة = تخطي)
    const pointRepo = AppDataSource.getRepository(LinePoint);
    const pointIds = [...new Set(assignments.map((a) => a.linePointId).filter(Boolean))];
    const points = pointIds.length
      ? await pointRepo.find({ where: pointIds.map((id) => ({ id })) })
      : [];
    const officeEnabled = new Set(points.filter((p) => p.hasOfficeDuty).map((p) => p.id));

    for (const data of assignments) {
      if (!data.personnelId || !data.linePointId || !data.shiftId) {
        continue;
      }
      if (data.officeDuty && !officeEnabled.has(data.linePointId)) continue;
      const personnel = await this.personnelRepo.findOne({ where: { id: data.personnelId } });
      if (!personnel || personnel.unit !== "الخط") continue;
      const existing = await this.repository.findOne({
        where: { personnelId: data.personnelId }
      });
      if (existing) continue;
      if (!data.status) data.status = data.officeDuty ? "إجازة" : "حاضر";
      const record = this.repository.create(data);
      records.push(record);
    }

    return await this.repository.save(records);
  }

  // النقل = تحديث الصف الوحيد للعسكري (لا صفوف جديدة، لا تاريخ)
  async transferPoint(personnelId: string, newPointId: string) {
    const current = await this.repository.findOne({ where: { personnelId } });
    if (!current) throw new Error("لا يوجد تعيين لهذا العسكري");
    current.linePointId = newPointId;
    return await this.repository.save(current);
  }

  async transferShift(personnelId: string, newShiftId: string) {
    const current = await this.repository.findOne({ where: { personnelId } });
    if (!current) throw new Error("لا يوجد تعيين لهذا العسكري");
    current.shiftId = newShiftId;
    return await this.repository.save(current);
  }

  async transferBoth(personnelId: string, newPointId: string, newShiftId: string) {
    const current = await this.repository.findOne({ where: { personnelId } });
    if (!current) throw new Error("لا يوجد تعيين لهذا العسكري");
    current.linePointId = newPointId;
    current.shiftId = newShiftId;
    return await this.repository.save(current);
  }

  async update(id: string, data: Partial<LineAssignment>) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) throw new Error("التعيين غير موجود");
    this.repository.merge(record, data);
    return await this.repository.save(record);
  }

  async delete(id: string) {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) throw new Error("التعيين غير موجود");
    await this.repository.remove(record);
    return true;
  }

  // ============ حالة الخط + عساكر المكتب ============

  /**
   * تعليم/فكّ عساكر المكتب + تغيير حالة الخط (إجازة/حاضر) لأي عدد من العساكر.
   * - تعليم (officeDuty=true)  ⇒ الحالة «إجازة» (مش على خط المناوبة)
   * - فكّ    (officeDuty=false) ⇒ الحالة ترجع «حاضر»، أو «إجازة» لو العمالة نفسها في إجازة
   * `status` الصريح (من زرار حاضر/إجازة) بيفوق الحساب التلقائي.
   *
   * تغيير الحالة بس (من غير تعليم مكتب) مسموح في **كل** النقاط.
   * قسم «مكتب» نفسه محمي بخيار النقطة — fail-closed.
   */
  async setOfficeDuty(
    items: { id: string; officeDuty: boolean; status?: string }[]
  ) {
    if (!items || items.length === 0) {
      const e: any = new Error("لا توجد بيانات للتحديث");
      e.status = 400;
      throw e;
    }

    const ids = items.map((i) => i.id);
    const records = await this.repository.find({
      where: ids.map((id) => ({ id }))
    });
    if (records.length !== ids.length) {
      const e: any = new Error("في تعيّنات مش موجودة");
      e.status = 400;
      throw e;
    }

    // عمالة إجازة النهارده — عشان تفك التعليم يرجّع الحالة الصح
    let leaveShiftId: string | null = null;
    try {
      const cur = await lineLeaveCycleService.getCurrent();
      leaveShiftId = cur?.[0]?.shiftId ?? null;
    } catch {
      leaveShiftId = null;
    }

    // نقاط مفعّل فيها قسم المكتب — الفحص بس لو فيه تعليم مكتب في الطلب
    const wantsOffice = items.some((i) => i.officeDuty);
    if (wantsOffice) {
      const pointIds = [...new Set(records.map((r) => r.linePointId))];
      const points = await AppDataSource.getRepository(LinePoint).find({
        where: pointIds.map((id) => ({ id }))
      });
      const blocked = points.filter((p) => !p.hasOfficeDuty);
      if (blocked.length) {
        const e: any = new Error(
          `قسم «مكتب» مقفول في: ${blocked.map((p) => p.name).join("، ")} — فعّله من إدارة النقاط`
        );
        e.status = 400;
        throw e;
      }
    }

    const byId = new Map(records.map((r) => [r.id, r]));
    // تغيير الحالة من العمليات بيتزامن مع «تمام» سجل الفرد (مصدر واحد للحقيقة)
    const personnelStatusUpdates = new Map<string, string>();
    for (const item of items) {
      const record = byId.get(item.id);
      if (!record) continue;

      record.officeDuty = !!item.officeDuty;

      if (item.status) {
        record.status = item.status;
        // «مكتب» مش تغيير تمام — العسكري موجود في الوحدة
        if (!record.officeDuty) {
          const recordStatus = LineAssignmentService.LINE_STATUS_TO_RECORD_STATUS[item.status];
          if (recordStatus) personnelStatusUpdates.set(record.personnelId, recordStatus);
        }
      } else if (record.officeDuty) {
        record.status = "إجازة";
      } else {
        record.status = record.shiftId === leaveShiftId ? "إجازة" : "حاضر";
      }
    }

    await this.repository.save(records);

    for (const [personnelId, status] of personnelStatusUpdates) {
      const person = await this.personnelRepo.findOne({ where: { id: personnelId } });
      if (person && person.status !== status) {
        person.status = status;
        await this.personnelRepo.save(person);
      }
    }

    const updated = await this.repository.find({
      where: ids.map((id) => ({ id })),
      relations: ["personnel", "linePoint", "shift"]
    });
    return updated.map((a) => this.decorate(a));
  }
}

// ==================== LineLeaveCycleService ====================
export class LineLeaveCycleService {
  private repository = AppDataSource.getRepository(LineLeaveCycle);
  private shiftRepo = AppDataSource.getRepository(Shift);

  async getAll() {
    return await this.repository.find({
      relations: ["shift"],
      order: { cycleNumber: "ASC" }
    });
  }

  async getCurrent() {
    const today = new Date().toISOString().split("T")[0];
    return await this.repository
      .createQueryBuilder("cycle")
      .leftJoinAndSelect("cycle.shift", "shift")
      .where("cycle.leaveStartDate <= :today", { today })
      .andWhere("cycle.leaveEndDate >= :today", { today })
      .andWhere("cycle.isActive = :active", { active: true })
      .getMany();
  }

  /**
   * حساب أي عمالة في إجازة بتاريخ محدد
   * 1) أولاً: دورة مسجلة تغطي التاريخ تفوز (اختيار المستخدم اليدوي يُحترم).
   * 2) ثانيًا: معادلة التسلسل من بداية الدوران (السلوك القديم للتواريخ غير المغطاة).
   * المنطق: الدورة 1→الثالثة إجازة، الدورة 2→الأولى إجازة، الدورة 3→الثانية إجازة، ثم يتكرر
   */
  async getCurrentLeaveShift(date: string): Promise<{ shiftId: string; shiftName: string; cycleNumber: number } | null> {
    const shifts = await this.shiftRepo.find({ order: { order: "ASC" } });
    if (shifts.length !== 3) return null;

    const target = date.slice(0, 10);

    // 1) دورة مسجلة تغطي التاريخ (يدوية أو تلقائية) — مصدر الحقيقة الأول
    const covering = await this.repository
      .createQueryBuilder("cycle")
      .leftJoinAndSelect("cycle.shift", "shift")
      .where("cycle.leaveStartDate <= :d", { d: target })
      .andWhere("cycle.leaveEndDate >= :d", { d: target })
      .orderBy("cycle.cycleNumber", "DESC")
      .getOne();
    if (covering && covering.shift) {
      return {
        shiftId: covering.shift.id,
        shiftName: covering.shift.name,
        cycleNumber: covering.cycleNumber
      };
    }

    // 2) لا تغطية: تسلسل الحلقة من أول دورة مسجلة (للتواريخ خارج الصفوف).
    // الحلقة: الثالثة → الأولى → الثانية → الثالثة ... وأي بداية يدوية تُكمل من موضعها.
    const firstCycle = await this.repository.findOne({ where: {}, order: { cycleNumber: "ASC" } });
    if (!firstCycle) return null;

    const rotationStart = new Date(firstCycle.leaveStartDate);
    const targetDate = new Date(target);

    // حساب عدد الأيام منذ بداية الـrotation
    const diffTime = targetDate.getTime() - rotationStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;

    // حساب رقم الدورة (كل 14 يوم) ثم إزاحته من موضع العمالة الأولى فعليًا
    const orderSeq = [3, 1, 2];
    const firstShift = shifts.find((s) => s.id === firstCycle.shiftId);
    const firstPos = Math.max(0, orderSeq.indexOf(firstShift?.order ?? 3));
    const cycleNumber = Math.floor(diffDays / 14) + 1;
    const leaveOrder = orderSeq[(firstPos + cycleNumber - 1) % 3];
    const leaveShift = shifts.find((s) => s.order === leaveOrder);
    if (!leaveShift) return null;

    return {
      shiftId: leaveShift.id,
      shiftName: leaveShift.name,
      cycleNumber
    };
  }

  /**
   * تهيئة دورة جديدة (14 يوم) لعمالة يختارها المستخدم — تُعيد تثبيت بداية الدوران.
   * + ينشئ سجلات إجازة معلقة للعساكر المختارين (unit خط) لتظهر في اعتماد الإجازات للأدمن.
   * + يمكن تمرير بيانات الإجازة (النوع/الدورة/العودة/ملاحظات) من نموذج العمليات الموحد.
   * + صف الدوران نفسه ثابت 14 يوم (leaveStart..leaveEnd) — البيانات المخصصة للسجلات والاعتماد والطابور.
   * بعد الحفظ تُزامَن الحالات تلقائيًا: عمالة الإجازة (حاضر→إجازة)، وعمالة الإجازة السابقة فقط (إجازة→حاضر).
   * بدون shiftId → السلوك القديم: العمالة الثالثة (order=3).
   * بدون personnelIds → دورة فقط بدون سجلات اعتماد.
   */
  async initializeCycle(
    startDate: string,
    shiftId?: string,
    personnelIds?: string[],
    vacationOptions?: { vacationType?: string; cycle?: string; expectedReturnDate?: string; notes?: string | null }
  ) {
    const shifts = await this.shiftRepo.find({ order: { order: "ASC" } });
    if (shifts.length === 0) {
      throw new Error("يجب إنشاء العمالات أولاً");
    }

    let leaveShift = shifts.find(s => s.order === 3) || shifts[2];
    if (shiftId) {
      const chosen = shifts.find(s => s.id === shiftId);
      if (!chosen) {
        throw new Error("العمالة غير موجودة");
      }
      leaveShift = chosen;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || isNaN(new Date(startDate).getTime())) {
      throw new Error("صيغة التاريخ غير صالحة، يجب أن تكون YYYY-MM-DD");
    }

    // تحقق مسبق من العساكر المختارين قبل أي تغيير مدمر (المسح والحفظ والمزامنة)
    const validatedIds = await this.validateLineVacationSoldiers(personnelIds, leaveShift.id);

    // عمالة الإجازة السابقة (قبل المسح) — لقلب حالاتها فقط، مع حفظ الإجازات الفردية
    const prevShift = await this.getCurrentLeaveShift(startDate.slice(0, 10));

    // حذف أي دورات سابقة
    await this.repository.clear();

    const start = new Date(startDate);
    const cycleDays = 14;
    const leaveEnd = new Date(start);
    leaveEnd.setDate(leaveEnd.getDate() + cycleDays - 1);
    const cycleStart = start.toISOString().split("T")[0];
    const cycleEnd = leaveEnd.toISOString().split("T")[0];

    const cycle = this.repository.create({
      shiftId: leaveShift.id,
      leaveStartDate: cycleStart,
      leaveEndDate: cycleEnd,
      cycleDays,
      cycleNumber: 1,
      isActive: true
    });

    const saved = await this.repository.save(cycle);
    await this.syncLeaveStatuses(leaveShift.id, prevShift && prevShift.shiftId !== leaveShift.id ? prevShift.shiftId : null);
    if (validatedIds.length > 0) {
      await this.createLineVacationRecords(validatedIds, cycleStart, cycleEnd, saved.cycleNumber, vacationOptions);
    }
    return saved;
  }

  /**
   * تحقق مسبق (قبل المسح): كل id موجود ومعين على نفس عمالة الإجازة.
   * يرجع المعرفات الفريدة الصالحة — يرمي خطأ واضح عند أول مخالف.
   */
  private async validateLineVacationSoldiers(personnelIds: string[] | undefined, shiftId: string): Promise<string[]> {
    const uniqueIds = [...new Set((personnelIds || []).filter((id) => typeof id === 'string' && id))];
    if (uniqueIds.length === 0) return [];
    const assignmentRepo = AppDataSource.getRepository(LineAssignment);
    const personnelRepo = AppDataSource.getRepository(Personnel);
    for (const pid of uniqueIds) {
      const personnel = await personnelRepo.findOne({ where: { id: pid } });
      if (!personnel) {
        throw new Error("الفرد غير موجود");
      }
      const assignment = await assignmentRepo.findOne({ where: { personnelId: pid, shiftId } });
      if (!assignment) {
        throw new Error(`العسكري ${personnel.fullName} ليس على العمالة المختارة`);
      }
    }
    return uniqueIds;
  }

  /**
   * إنشاء سجلات إجازة معلقة (نوع إجازة خط) للعساكر المتحقق منهم مسبقًا — تظهر في اعتماد الإجازات للأدمن.
   * - يتخطى من لديه سجل معلق بنفس تاريخ البداية (منع التكرار عند الضغط المزدوج).
   * - إدخال مباشر عبر الـrepository (لا يمر بمنع VacationsService لعساكر الخط — هذا هو المسار الشرعي).
   */
  private async createLineVacationRecords(
    validatedIds: string[],
    cycleStart: string,
    cycleEnd: string,
    cycleNumber: number,
    vacationOptions?: { vacationType?: string; cycle?: string; expectedReturnDate?: string; notes?: string | null }
  ) {
    const vacationRepo = AppDataSource.getRepository(Vacation);

    const vType = (vacationOptions?.vacationType || "إجازة خط").slice(0, 255);
    const vCycle = /^\d+$/.test(vacationOptions?.cycle || '') ? vacationOptions!.cycle! : "14";
    const vEnd = /^\d{4}-\d{2}-\d{2}$/.test(vacationOptions?.expectedReturnDate || '') && vacationOptions!.expectedReturnDate! >= cycleStart
      ? vacationOptions!.expectedReturnDate!.slice(0, 10)
      : cycleEnd;

    for (const pid of validatedIds) {
      const existing = await vacationRepo
        .createQueryBuilder("v")
        .where("v.personnelId = :pid", { pid })
        .andWhere("v.startDate = :s", { s: cycleStart })
        .getOne();
      if (existing) continue;
      const record = vacationRepo.create({
        personnelId: pid,
        vacationType: vType,
        cycle: vCycle,
        startDate: cycleStart,
        expectedReturnDate: vEnd,
        status: "معتمدة",
        notes: vacationOptions?.notes ?? `دورة إجازات الخط رقم ${cycleNumber}`
      });
      await vacationRepo.save(record);
    }
  }

  /**
   * مزامنة حالات التعيينات مع عمالة الإجازة:
   * - من على عمالة الإجازة وحالته حاضر → إجازة (دوران أو فردي جديد)
   * - من على عمالة الإجازة السابقة فقط وحالته إجازة → حاضر (انتهت إجازته الدورانية)
   * - إجازة فردية على عمالة أخرى (خارج الدوران السابق) تُحفظ ولا تُمس
   * - باقي الحالات (مرضي/سجن/مهمة/غياب/منقول) لا تُمس أبدًا.
   */
  private async syncLeaveStatuses(leaveShiftId: string, prevShiftId?: string | null) {
    const assignmentRepo = AppDataSource.getRepository(LineAssignment);
    const assignments = await assignmentRepo.find();
    for (const a of assignments) {
      if (a.shiftId === leaveShiftId && a.status === "حاضر") {
        a.status = "إجازة";
        await assignmentRepo.save(a);
      } else if (prevShiftId && a.shiftId === prevShiftId && a.shiftId !== leaveShiftId && a.status === "إجازة") {
        a.status = "حاضر";
        await assignmentRepo.save(a);
      }
    }
  }

  /**
   * إنشاء الدورة التالية فقط (دورة واحدة)
   */
  async generateNextCycle() {
    const lastCycle = await this.repository.findOne({
      where: {},
      order: { cycleNumber: "DESC" }
    });

    if (!lastCycle) {
      throw new Error("يجب تهيئة الدورة أولاً");
    }

    const lastEnd = new Date(lastCycle.leaveEndDate);
    const nextStart = new Date(lastEnd);
    nextStart.setDate(nextStart.getDate() + 1);

    const nextCycleNumber = lastCycle.cycleNumber + 1;
    const cycleDays = 14;
    const leaveEnd = new Date(nextStart);
    leaveEnd.setDate(leaveEnd.getDate() + cycleDays - 1);

    // تحديد العمالة التالية في الحلقة انطلاقًا من عمالة آخر دورة مسجلة فعليًا:
    // الحلقة: الثالثة → الأولى → الثانية → الثالثة ...
    const shifts = await this.shiftRepo.find({ order: { order: "ASC" } });
    const orderSeq = [3, 1, 2];
    const lastShift = shifts.find((s) => s.id === lastCycle.shiftId);
    const lastPos = Math.max(0, orderSeq.indexOf(lastShift?.order ?? 3));
    const nextOrder = orderSeq[(lastPos + 1) % 3];
    const leaveShift = shifts.find((s) => s.order === nextOrder);
    if (!leaveShift) {
      throw new Error("العمالة غير موجودة");
    }

    const cycle = this.repository.create({
      shiftId: leaveShift.id,
      leaveStartDate: nextStart.toISOString().split("T")[0],
      leaveEndDate: leaveEnd.toISOString().split("T")[0],
      cycleDays,
      cycleNumber: nextCycleNumber,
      isActive: true
    });

    const saved = await this.repository.save(cycle);
    await this.syncLeaveStatuses(leaveShift.id, lastCycle.shiftId !== leaveShift.id ? lastCycle.shiftId : null);
    return saved;
  }
}

// ==================== LineReportService ====================
export class LineReportService {
  private assignmentRepo = AppDataSource.getRepository(LineAssignment);
  private pointRepo = AppDataSource.getRepository(LinePoint);
  private shiftRepo = AppDataSource.getRepository(Shift);

  async getDailyReport() {
    const points = await this.pointRepo.find({ where: { isActive: true }, order: { order: "ASC" } });
    const shifts = await this.shiftRepo.find({ where: { isActive: true }, order: { order: "ASC" } });

    const assignments = (
      await this.assignmentRepo.find({
        relations: ["personnel", "linePoint", "shift"]
      })
    ).map((a) => lineAssignmentService.decorate(a));

    const reportPoints = points.map((point) => {
      const pointAssignments = assignments.filter((a) => a.linePointId === point.id);
      return {
        point,
        shifts: shifts.map((shift) => ({
          shift,
          assignments: pointAssignments.filter((a) => a.shiftId === shift.id)
        }))
      };
    });

    const byStatus: Record<string, number> = {};
    assignments.forEach((a) => {
      const statusName = a.status || "غير محدد";
      byStatus[statusName] = (byStatus[statusName] || 0) + 1;
    });

    return {
      points: reportPoints,
      summary: {
        total: assignments.length,
        byStatus
      }
    };
  }

  async generateDailyReportPDF(): Promise<string> {
    const report = await this.getDailyReport();

    let html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الخط الحالي</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
    h1 { text-align: center; color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
    th { background-color: #1a1a2e; color: white; }
    .summary { background: #f5f5f5; padding: 10px; border-radius: 8px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>تقرير الخط الحالي</h1>
  <div class="summary">
    <p>إجمالي الأفراد: ${report.summary.total}</p>
  </div>
`;

    for (const pointData of report.points) {
      html += `<h3>${pointData.point.name}</h3>`;
      html += `<table><tr><th>العماله</th><th>الفرد</th><th>الرتبة</th><th>الحالة</th><th>ملاحظات</th></tr>`;
      for (const shiftData of pointData.shifts) {
        for (const assignment of shiftData.assignments) {
          // عرض فقط: رتب صف الضابط للداخلية تظهر أمين شرطة
          const p = assignment.personnel;
          const rankDisplay =
            p?.personnelType === "داخلية" &&
            ["عريف", "رقيب", "رقيب أول", "مساعد", "مساعد أول"].includes(p?.rank || "")
              ? "أمين شرطة"
              : p?.rank || "";
          html += `<tr>
            <td>${shiftData.shift.name}</td>
            <td>${assignment.personnel?.fullName || ""}</td>
            <td>${rankDisplay}</td>
            <td>${assignment.status || ""}</td>
            <td>${assignment.notes || ""}</td>
          </tr>`;
        }
      }
      html += `</table>`;
    }

    html += `</body></html>`;
    return html;
  }
}

// Singleton instances
export const shiftService = new ShiftService();
export const linePointService = new LinePointService();
export const lineAssignmentService = new LineAssignmentService();
export const lineLeaveCycleService = new LineLeaveCycleService();
export const lineReportService = new LineReportService();
