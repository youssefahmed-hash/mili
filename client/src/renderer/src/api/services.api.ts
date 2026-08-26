import API from './axios'
import type { ApiResponse, ServiceRecord } from '../types/personnel'

export const getServiceRecords = async (): Promise<ApiResponse<ServiceRecord[]>> => {
  const response = await API.get('/services')
  return response.data
}

export const getServicesByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<ServiceRecord[]>> => {
  const response = await API.get(`/services/personnel/${personnelId}`)
  return response.data
}

export const createServiceRecord = async (
  data: Omit<ServiceRecord, 'id' | 'createdAt' | 'personnel'>
): Promise<ApiResponse<ServiceRecord>> => {
  const response = await API.post('/services', data)
  return response.data
}

export const updateServiceRecord = async (
  id: string,
  data: Partial<ServiceRecord>
): Promise<ApiResponse<ServiceRecord>> => {
  const response = await API.put(`/services/${id}`, data)
  return response.data
}

export const deleteServiceRecord = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/services/${id}`)
  return response.data
}
