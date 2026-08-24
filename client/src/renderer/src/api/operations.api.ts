import API from './axios'
import type { ApiResponse, OperationRecord } from '../types/personnel'

export const getOperationsRecords = async (): Promise<ApiResponse<OperationRecord[]>> => {
  const response = await API.get('/operations')
  return response.data
}

export const getOperationsByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<OperationRecord[]>> => {
  const response = await API.get(`/operations/personnel/${personnelId}`)
  return response.data
}

export const createOperationRecord = async (
  data: Omit<OperationRecord, 'id' | 'createdAt' | 'personnel'>
): Promise<ApiResponse<OperationRecord>> => {
  const response = await API.post('/operations', data)
  return response.data
}

export const updateOperationRecord = async (
  id: string,
  data: Partial<OperationRecord>
): Promise<ApiResponse<OperationRecord>> => {
  const response = await API.put(`/operations/${id}`, data)
  return response.data
}

export const deleteOperationRecord = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/operations/${id}`)
  return response.data
}
