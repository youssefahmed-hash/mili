import API from './axios'
import type { ApiResponse, ClinicRecord } from '../types/personnel'

export interface ClinicRecordFilters {
  fromDate?: string
  toDate?: string
}

export const getClinicRecords = async (
  filters?: ClinicRecordFilters
): Promise<ApiResponse<ClinicRecord[]>> => {
  const params = new URLSearchParams()
  if (filters?.fromDate) params.append('fromDate', filters.fromDate)
  if (filters?.toDate) params.append('toDate', filters.toDate)
  const query = params.toString()
  const response = await API.get(`/clinic${query ? `?${query}` : ''}`)
  return response.data
}

export const getClinicByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<ClinicRecord[]>> => {
  const response = await API.get(`/clinic/personnel/${personnelId}`)
  return response.data
}

export const createClinicRecord = async (
  data: Omit<ClinicRecord, 'id' | 'createdAt' | 'personnel'>
): Promise<ApiResponse<ClinicRecord>> => {
  const response = await API.post('/clinic', data)
  return response.data
}

export const updateClinicRecord = async (
  id: string,
  data: Partial<ClinicRecord>
): Promise<ApiResponse<ClinicRecord>> => {
  const response = await API.put(`/clinic/${id}`, data)
  return response.data
}

export const deleteClinicRecord = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/clinic/${id}`)
  return response.data
}

export interface ClinicPrintFilters {
  personnelId?: string
  fromDate?: string
  toDate?: string
}

export const getClinicRecordsForPrint = async (
  filters: ClinicPrintFilters
): Promise<ApiResponse<ClinicRecord[]>> => {
  const params = new URLSearchParams()
  if (filters.personnelId) params.append('personnelId', filters.personnelId)
  if (filters.fromDate) params.append('fromDate', filters.fromDate)
  if (filters.toDate) params.append('toDate', filters.toDate)

  const response = await API.get(`/clinic/print?${params.toString()}`)
  return response.data
}
