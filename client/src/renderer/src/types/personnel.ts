export type PersonnelCategory = 'soldier' | 'non_commissioned_officer' | 'officer'
export type PersonnelType = 'حربية' | 'داخلية' | 'تشغيل حربيه' | 'مستجد حربية' | 'مستجد داخلية' | 'مستجد تشغيل'

export interface Personnel {
  id: string
  fullName: string
  photo: string | null
  category: PersonnelCategory
  rank: string
  militaryId: string
  nationalId: string
  birthDate: string
  birthPlace: string | null
  residencePlace: string | null
  maritalStatus: string | null
  familyMembersCount: string | null
  parentsLivingSeparately: string | null
  fatherHealthStatus: string | null
  fatherWork: string | null
  fatherPhone: string | null
  motherHealthStatus: string | null
  motherWork: string | null
  motherPhone: string | null
  unit: string | null
  personnelType: PersonnelType
  specialization: string | null
  appointmentDate: string | null
  serviceStartDate: string | null
  status: string
  /** اسم المستشفى — عند التمام «مستشفى خارجي» */
  hospitalName?: string | null
  enlistmentDate: string | null
  dischargeDate: string | null
  joiningDate: string | null
  weapon: string | null
  lastLeaveReturnDate: string | null
  guardCount?: number | string | null
  seniorityNumber?: string | null
  grade?: string | null
  promotionCurrentRankDate?: string | null
  promotionCurrentGradeDate?: string | null
  promotionHigherRankDate?: string | null
  promotionHigherGradeDate?: string | null
  policeNumber: string | null
  reserveDate?: string | null
  administrativeUnits?: number | string | null
  militaryTrials?: string | null
  affiliatedUnit?: string | null
  display?: string | null
  strikeOff?: string | null
  injured?: string | null
  clinics?: string | null
  medicalCommissionLeaves?: string | null
  weaponBan?: string | null
  serviceDuration: string | null
  bloodType: string | null
  education: string | null
  phone: string | null
  email: string | null
  address: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  performanceRating: string | null
  lastPromotionDate: string | null
  nextPromotionDate: string | null
  notes: string | null
  qualification?: string | null
  workBeforeEnlistment: string | null
  behaviorInUnit: string | null
  subordinates: string | null
  supervisor: string | null
  batchDate: string | null
  isRecruit: boolean
  sectorDistribution: string | null
  condWeaponBan: boolean
  /** نوع منع السلاح (منع سلاح نفسي / سياسي / طبي ...) */
  weaponBanType?: string | null
  condNeuro: boolean
  condStruckDischarged: boolean
  condStruckRetained: boolean
  createdAt: string
  updatedAt: string
  documents?: Document[]
  vacations?: Vacation[]
  forms?: Form[]
}

export interface Document {
  id: string
  type: string
  fileUrl: string
  fileName: string
  uploadedAt: string
  personnelId: string
}

export interface Vacation {
  id: string
  vacationType: string
  cycle: string | null
  startDate: string
  expectedReturnDate: string
  deductionDays?: number
  extensionDays?: number
  actualReturnDate: string | null
  status: string
  notes: string | null
  personnelId: string
  personnel?: Personnel
}

export interface Form {
  id: string
  formType: string
  formName: string
  fileUrl: string | null
  status: string
  createdAt: string
  personnelId: string
}

export interface ClinicRecord {
  id: string
  examinationType: string
  medicalStatus: string
  notes: string | null
  examinationDate: string | null
  clinicType: string
  locationType: string
  locationAddress: string | null
  carnetNumber: string | null
  specialty: string | null
  diagnosis: string | null
  treatment: string | null
  createdAt: string
  personnelId: string
  personnel?: Pick<Personnel, 'id' | 'fullName' | 'militaryId' | 'rank' | 'category' | 'personnelType'>
}

export interface OperationRecord {
  id: string
  missionName: string
  location: string
  status: string
  missionDate: string | null
  createdAt: string
  personnelId: string
  personnel?: Pick<Personnel, 'id' | 'fullName' | 'militaryId' | 'rank' | 'category'>
}

  export interface SecurityRecord {
    id: string
    type: string
    situationDate: string | null
    details: string | null
    notes: string | null
    createdAt: string
    personnelId: string
    personnel?: Pick<Personnel, 'id' | 'fullName' | 'militaryId' | 'rank' | 'category'>
  }

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface VacationLineupPerson {
  id: string
  fullName: string
  rank: string
  grade?: string | null
  militaryId: string
  unit: string
  cycle: string
  personnelType?: PersonnelType | string
  nextDescent: string
  nextReturn: string
}

export interface VacationLineup {
  date: string
  goingDown: VacationLineupPerson[]
  comingUp: VacationLineupPerson[]
  onVacation: VacationLineupPerson[]
}

export interface ServicesLineupItem {
  id: string
  personnelId: string
  fullName: string
  rank: string
  militaryId: string
  unit: string
  personnelType: string
  startTime: string
  endTime: string
  location: string
  department: string
  notes?: string | null
}

export interface ServicesLineup {
  date: string
  internal: ServicesLineupItem[]
  military: ServicesLineupItem[]
}

export interface ServiceRecord {
  id: string
  personnelId: string
  personnel?: Personnel
  serviceDay: string
  startTime: string
  endTime: string
  location: string
  department: string
  notes?: string | null
  createdAt: string
}

// ==================== الصيدلية (داخل العيادة) ====================

export type PharmacyUnit = 'كرتونة' | 'علبة' | 'شريط' | 'حبة'

export const PHARMACY_UNITS: PharmacyUnit[] = ['كرتونة', 'علبة', 'شريط', 'حبة']

/** تحويل الكمية للحبة ولعرضها بكل الوحدات — نفس منطق السيرفر */
export const pillsPerUnit = (b: PharmacyBreakdown, unit: PharmacyUnit): number => {
  switch (unit) {
    case 'كرتونة':
      return b.pillsPerStrip * b.stripsPerBox * b.boxesPerCarton
    case 'علبة':
      return b.pillsPerStrip * b.stripsPerBox
    case 'شريط':
      return b.pillsPerStrip
    default:
      return 1
  }
}

export const toPills = (unit: PharmacyUnit, qty: number, b: PharmacyBreakdown): number =>
  Math.max(0, Math.floor(qty || 0)) * pillsPerUnit(b, unit)

export interface PharmacyBreakdown {
  pillsPerStrip: number
  stripsPerBox: number
  boxesPerCarton: number
}

export interface PharmacyDrug {
  id: string
  name: string
  nameEn: string | null
  code: string | null
  barcode: string | null
  allowCarton: boolean
  allowBox: boolean
  allowStrip: boolean
  allowPill: boolean
  pillsPerStrip: number
  stripsPerBox: number
  boxesPerCarton: number
  notes: string | null
  createdAt: string
  updatedAt: string
  /** حقول محسوبة من السيرفر */
  unitsAvailable: PharmacyUnit[]
  breakdown: PharmacyBreakdown
  stockPills: number
  stockDisplay: Record<string, number>
  batchCount: number
  closestExpiry: string | null
  inStock: boolean
  outOfStock: boolean
  isExpired: boolean
}

export interface PharmacyBatch {
  id: string
  drugId: string
  batchNumber: string | null
  expiryDate: string
  unit: PharmacyUnit
  qtyReceived: number
  qtyReceivedPills: number
  qtyRemainingPills: number
  supplier: string | null
  invoiceNo: string | null
  purchaseDate: string | null
  purchasePrice: string | null
  notes: string | null
  createdAt: string
  drug: {
    id: string
    name: string
    code: string | null
    nameEn: string | null
    breakdown: PharmacyBreakdown
    unitsAvailable: PharmacyUnit[]
  } | null
  remainingDisplay: Record<string, number>
  isExpired: boolean
  daysToExpiry: number
  /** رايات FEFO */
  isClosest?: boolean
}

export interface PharmacyFEFO {
  drug: {
    id: string
    name: string
    code: string | null
    nameEn: string | null
    unitsAvailable: PharmacyUnit[]
    breakdown: PharmacyBreakdown
    unitsDisplay: Record<string, number>
  }
  totalAvailablePills: number
  /** مرتبة بالأقرب انتهاءً — isClosest على أول وحدة قابلة للصرف */
  batches: PharmacyBatch[]
  expiredBatches: PharmacyBatch[]
  hasMultipleBatches: boolean
}

export interface PharmacyExpiringBucket {
  expired: PharmacyBatch[]
  within3: PharmacyBatch[]
  within6: PharmacyBatch[]
}

export interface PharmacyExpiringReport {
  thresholdMonths: number
  buckets: PharmacyExpiringBucket
  counts: { expired: number; within3: number; within6: number; total: number }
}

/** صنف راكد — في المخزون بس مش بيتحرك */
export interface DeadStockItem {
  drugId: string
  name: string
  code: string | null
  nameEn: string | null
  breakdown: PharmacyBreakdown
  remainingPills: number
  remainingDisplay: Record<string, number>
  batchCount: number
  /** null = ماتصرفش خالص */
  lastDispensed: string | null
  daysSinceLastDispense: number | null
  status: 'never' | 'stale' | 'moving'
}

export interface DeadStockReport {
  thresholdDays: number
  cutoff: string
  items: DeadStockItem[]
  /** أصناف بتتحرك — مش راكدة */
  moving: number
  counts: { neverDispensed: number; stale: number; total: number }
  deadPills: number
}

export interface PharmacyDispenseItem {
  id: string
  dispenseId: string
  batchId: string
  drugId: string
  qtyPills: number
  unit: PharmacyUnit
  qty: number
  expirySnapshot: string
  batchNumberSnapshot: string | null
  drug?: { id: string; name: string; code: string | null } | null
}

export interface PharmacyDispense {
  id: string
  clinicRecordId: string | null
  personnelId: string
  dispensedAt: string
  createdBy: string | null
  notes: string | null
  createdAt: string
  items: PharmacyDispenseItem[]
  personnel?: { id: string; fullName: string; militaryId: string; rank: string } | null
}

export interface PharmacyDispenseResult {
  dispense: PharmacyDispense
  warnings: string[]
  itemsCount: number
}

/** سطر صرف في编辑器 الواجهة (قبل الحفظ) */
export interface DispenseLine {
  drugId: string
  drugName: string
  drugCode: string | null
  qty: number
  unit: PharmacyUnit
  batchId?: string | null
  expiryDate?: string | null
}

export interface GuardAbsenceRecord {
  id: string
  personnelId: string
  personnel?: Personnel
  startDate: string
  /** null يعني لسه مش راجع */
  returnDate: string | null
  notes?: string | null
  createdAt: string
  updatedAt?: string
}

export interface RewardRecord {
  id: string
  personnelId: string
  personnel?: Personnel
  rewardType: string
  rewardDate: string
  notes?: string | null
  createdAt: string
}

export interface PenaltyRecord {
  id: string
  personnelId: string
  personnel?: Personnel
  penaltyType: string
  penaltyDate: string
  notes?: string | null
  createdAt: string
}

// ==================== Line Tracking Types ====================

export const LINE_STATUSES = ['حاضر', 'إجازة', 'مرضي', 'سجن', 'مهمة', 'غياب', 'منقول'] as const
export type LineStatusValue = typeof LINE_STATUSES[number]

export interface Shift {
  id: string
  name: string
  order: number
  isActive: boolean
  createdAt: string
}

export interface LinePoint {
  id: string
  name: string
  description: string | null
  order: number
  isActive: boolean
  /** عمود «عسكري مكتب» مفعّل في النقطة دي */
  hasOfficeDuty: boolean
  createdAt: string
}

export interface LineAssignment {
  id: string
  personnelId: string
  linePointId: string
  shiftId: string
  status: string
  /** مُعلَّم كـ«عسكري مكتب» — بيظهر في عمود المكتب ومش في دوران العمالات */
  officeDuty: boolean
  notes: string | null
  personnel?: Pick<Personnel, 'id' | 'fullName' | 'militaryId' | 'rank' | 'category' | 'unit' | 'personnelType' | 'status'>
  linePoint?: LinePoint
  shift?: Shift
  createdAt: string
  updatedAt: string
}

export interface LineLeaveCycle {
  id: string
  shiftId: string
  leaveStartDate: string
  leaveEndDate: string
  cycleDays: number
  cycleNumber: number
  isActive: boolean
  shift?: Shift
  createdAt: string
}

export interface LineDailyReport {
  points: {
    point: LinePoint
    shifts: {
      shift: Shift
      assignments: LineAssignment[]
    }[]
  }[]
  summary: {
    total: number
    byStatus: Record<string, number>
  }
}

// ==================== Vacation Notifications Types ====================

export type NotificationTurn = 'personnel' | 'line'

export interface NotificationPersonnelItem {
  id: string
  fullName: string
  rank: string
  personnelType?: string | null
  vacationType?: string | null
  startDate?: string | null
  expectedReturnDate?: string | null
  linePoint?: string | null
}

export interface NotificationData {
  turn: NotificationTurn
  weekStart: string
  weekEnd: string
  source: string
  count: number
  lineShiftName: string | null
  personnel: NotificationPersonnelItem[]
  configured: boolean
}

export interface NotificationSettings {
  id: string
  weeklyRotationStartDate: string | null
  firstTurn: NotificationTurn | null
  createdAt?: string
  updatedAt?: string
}

// ==================== Strength Dashboard (القوة) ====================

export interface StrengthGroup {
  total: number
  out: number
  present: number
}

export interface StrengthConditions {
  weaponBan: number
  neuro: number
  struckDischarged: number
  struckRetained: number
  /** التمامات المؤثرة على القوة */
  absence: number
  extHospital: number
  court: number
  hospRef: number
  /** إجمالي الأفراد المتأثرين (التمامات المؤثرة + الشروط) */
  affectedTotal: number
}

export interface StrengthData {
  groups: Record<string, StrengthGroup>
  conditions?: StrengthConditions
}
