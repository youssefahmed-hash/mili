import API from './axios'
import type { ApiResponse, SecurityRecord } from '../types/personnel'

export const getSecurityRecords = async (): Promise<ApiResponse<SecurityRecord[]>> => {
  const response = await API.get('/security')
  return response.data
}

export const getSecurityByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<SecurityRecord[]>> => {
  const response = await API.get(`/security/personnel/${personnelId}`)
  return response.data
}

export const createSecurityRecord = async (
  data: Omit<SecurityRecord, 'id' | 'createdAt' | 'personnel'>
): Promise<ApiResponse<SecurityRecord>> => {
  const response = await API.post('/security', data)
  return response.data
}

export const updateSecurityRecord = async (
  id: string,
  data: Partial<SecurityRecord>
): Promise<ApiResponse<SecurityRecord>> => {
  const response = await API.put(`/security/${id}`, data)
  return response.data
}

export const deleteSecurityRecord = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/security/${id}`)
  return response.data
}
