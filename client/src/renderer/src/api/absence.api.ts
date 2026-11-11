import API from './axios'
import type { ApiResponse, GuardAbsenceRecord } from '../types/personnel'

/** سجل غياب فرد — الأحدث أولاً */
export const getAbsenceByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<GuardAbsenceRecord[]>> => {
  const response = await API.get(`/absence/personnel/${personnelId}`)
  return response.data
}

/** كل الغيابات المفتوحة (لسه مرجعتش) */
export const getOpenAbsences = async (): Promise<ApiResponse<GuardAbsenceRecord[]>> => {
  const response = await API.get('/absence/open')
  return response.data
}

/** تسجيل غياب جديد — يغيّر التمام إلى «غياب» */
export const createAbsence = async (data: {
  personnelId: string
  startDate?: string
  notes?: string
}): Promise<ApiResponse<GuardAbsenceRecord>> => {
  const response = await API.post('/absence', data)
  return response.data
}

/** تسجيل العودة — يضبط تاريخ العودة ويرجّع التمام إلى «داخل القطاع» */
export const recordAbsenceReturn = async (
  id: string,
  data?: { returnDate?: string; notes?: string }
): Promise<ApiResponse<GuardAbsenceRecord>> => {
  const response = await API.post(`/absence/${id}/return`, data || {})
  return response.data
}

export const updateAbsence = async (
  id: string,
  data: Partial<GuardAbsenceRecord>
): Promise<ApiResponse<GuardAbsenceRecord>> => {
  const response = await API.put(`/absence/${id}`, data)
  return response.data
}

export const deleteAbsence = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/absence/${id}`)
  return response.data
}