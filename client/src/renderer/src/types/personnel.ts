export type PersonnelCategory = 'soldier' | 'non_commissioned_officer' | 'officer'
export type PersonnelStatus = 'على رأس العمل' | 'إجازة' | 'موقوف' | 'منتهية خدمته'

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
  unit: string
  specialization: string | null
  appointmentDate: string | null
  serviceStartDate: string | null
  status: PersonnelStatus
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
  workBeforeEnlistment: string | null
  behaviorInUnit: string | null
  subordinates: string | null
  supervisor: string | null
  batchDate: string | null
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
  startDate: string
  expectedReturnDate: string
  actualReturnDate: string | null
  status: string
  notes: string | null
  personnelId: string
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
  createdAt: string
  personnelId: string
  personnel?: Pick<Personnel, 'id' | 'fullName' | 'militaryId' | 'rank' | 'category'>
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
  event: string
  location: string
  status: string
  eventTime: string | null
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
