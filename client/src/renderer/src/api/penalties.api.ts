import API from './axios'
import type { ApiResponse, PenaltyRecord } from '../types/personnel'

export const getPenaltyRecords = async (): Promise<ApiResponse<PenaltyRecord[]>> => {
  const response = await API.get('/penalties')
  return response.data
}

export const getPenaltiesByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<PenaltyRecord[]>> => {
  const response = await API.get(`/penalties/personnel/${personnelId}`)
  return response.data
}

export const createPenaltyRecord = async (
  data: Omit<PenaltyRecord, 'id' | 'createdAt' | 'personnel'>
): Promise<ApiResponse<PenaltyRecord>> => {
  const response = await API.post('/penalties', data)
  return response.data
}

export const updatePenaltyRecord = async (
  id: string,
  data: Partial<PenaltyRecord>
): Promise<ApiResponse<PenaltyRecord>> => {
  const response = await API.put(`/penalties/${id}`, data)
  return response.data
}

export const deletePenaltyRecord = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/penalties/${id}`)
  return response.data
}
