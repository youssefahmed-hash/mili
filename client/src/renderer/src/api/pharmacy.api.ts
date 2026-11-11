import API from './axios'
import type {
  ApiResponse,
  PharmacyDrug,
  PharmacyBatch,
  PharmacyFEFO,
  PharmacyExpiringReport,
  DeadStockReport,
  PharmacyDispense,
  PharmacyDispenseResult,
  PharmacyUnit
} from '../types/personnel'

// ===================== الأصناف =====================

/** بحث جزئي بالاسم (عربي/إنجليزي) أو الكود */
export const getPharmacyDrugs = async (search?: string): Promise<ApiResponse<PharmacyDrug[]>> => {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  const response = await API.get(`/clinic/pharmacy/drugs${qs}`)
  return response.data
}

export const getPharmacyDrug = async (id: string): Promise<ApiResponse<PharmacyDrug>> => {
  const response = await API.get(`/clinic/pharmacy/drugs/${id}`)
  return response.data
}

export type PharmacyDrugPayload = {
  name: string
  nameEn?: string | null
  code?: string | null
  barcode?: string | null
  allowCarton: boolean
  allowBox: boolean
  allowStrip: boolean
  allowPill: boolean
  pillsPerStrip: number
  stripsPerBox: number
  boxesPerCarton: number
  notes?: string | null
}

export const createPharmacyDrug = async (
  data: PharmacyDrugPayload
): Promise<ApiResponse<PharmacyDrug>> => {
  const response = await API.post('/clinic/pharmacy/drugs', data)
  return response.data
}

export const updatePharmacyDrug = async (
  id: string,
  data: Partial<PharmacyDrugPayload>
): Promise<ApiResponse<PharmacyDrug>> => {
  const response = await API.put(`/clinic/pharmacy/drugs/${id}`, data)
  return response.data
}

export const deletePharmacyDrug = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/clinic/pharmacy/drugs/${id}`)
  return response.data
}

// ===================== الشحنات / المشتريات =====================

export const getPharmacyBatches = async (filters?: {
  drugId?: string
  available?: boolean
  expiringMonths?: number
}): Promise<ApiResponse<PharmacyBatch[]>> => {
  const p = new URLSearchParams()
  if (filters?.drugId) p.append('drugId', filters.drugId)
  if (filters?.available) p.append('available', '1')
  if (filters?.expiringMonths != null) p.append('expiringMonths', String(filters.expiringMonths))
  const qs = p.toString()
  const response = await API.get(`/clinic/pharmacy/batches${qs ? '?' + qs : ''}`)
  return response.data
}

export type PharmacyBatchPayload = {
  drugId: string
  unit: PharmacyUnit
  qtyReceived: number
  expiryDate: string
  batchNumber?: string | null
  supplier?: string | null
  invoiceNo?: string | null
  purchaseDate?: string | null
  purchasePrice?: string | null
  notes?: string | null
}

export const createPharmacyBatch = async (
  data: PharmacyBatchPayload
): Promise<ApiResponse<PharmacyBatch>> => {
  const response = await API.post('/clinic/pharmacy/batches', data)
  return response.data
}

export const deletePharmacyBatch = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/clinic/pharmacy/batches/${id}`)
  return response.data
}

/** دفعات صنف مرتبة FEFO — للصرف ونافذة التنبيه */
export const getPharmacyFEFO = async (drugId: string): Promise<ApiResponse<PharmacyFEFO>> => {
  const response = await API.get(`/clinic/pharmacy/drugs/${drugId}/batches`)
  return response.data
}

// ===================== الصلاحية =====================

export const getPharmacyExpiring = async (
  months = 3
): Promise<ApiResponse<PharmacyExpiringReport>> => {
  const response = await API.get(`/clinic/pharmacy/expiring?months=${months}`)
  return response.data
}

// ===================== الرواكد =====================

/** تقرير الرواكد: أصناف في المخزون مش بتتحرك (آخر صرف قبل days يوم) */
export const getPharmacyDeadStock = async (
  days = 90
): Promise<ApiResponse<DeadStockReport>> => {
  const response = await API.get(`/clinic/pharmacy/deadstock?days=${days}`)
  return response.data
}

// ===================== الصرف =====================

export type PharmacyDispensePayload = {
  personnelId: string
  clinicRecordId?: string | null
  notes?: string | null
  confirmSplit?: boolean
  items: { drugId: string; qty: number; unit: PharmacyUnit; batchId?: string | null }[]
}

export type PharmacyDispenseError = {
  needsConfirm?: boolean
  splitWarnings?: string[]
}

/** صرف دواء — لو محتاج تأكيد التقسيم بيرجع 409 مع splitWarnings */
export const dispensePharmacy = async (
  data: PharmacyDispensePayload
): Promise<ApiResponse<PharmacyDispenseResult>> => {
  const response = await API.post('/clinic/pharmacy/dispense', data)
  return response.data
}

export const getPharmacyDispenses = async (filters?: {
  personnelId?: string
  clinicRecordId?: string
}): Promise<ApiResponse<PharmacyDispense[]>> => {
  const p = new URLSearchParams()
  if (filters?.personnelId) p.append('personnelId', filters.personnelId)
  if (filters?.clinicRecordId) p.append('clinicRecordId', filters.clinicRecordId)
  const qs = p.toString()
  const response = await API.get(`/clinic/pharmacy/dispenses${qs ? '?' + qs : ''}`)
  return response.data
}