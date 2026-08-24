import API from './axios'
import type { ApiResponse, ClinicRecord } from '../types/personnel'

export const getClinicRecords = async (): Promise<ApiResponse<ClinicRecord[]>> => {
  const response = await API.get('/clinic')
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
