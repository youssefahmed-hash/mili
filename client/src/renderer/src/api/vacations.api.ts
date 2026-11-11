import API from './axios'
import type { ApiResponse, Vacation } from '../types/personnel'

export const getVacationsByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<Vacation[]>> => {
  const response = await API.get(`/vacations/personnel/${personnelId}`)
  return response.data
}

export const createVacation = async (
  data: Omit<Vacation, 'id' | 'actualReturnDate'>
): Promise<ApiResponse<Vacation>> => {
  const response = await API.post('/vacations', data)
  return response.data
}

export const updateVacation = async (
  id: string,
  data: Partial<Vacation>
): Promise<ApiResponse<Vacation>> => {
  const response = await API.put(`/vacations/${id}`, data)
  return response.data
}

export const deleteVacation = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/vacations/${id}`)
  return response.data
}

export const getVacations = async (status?: string): Promise<ApiResponse<Vacation[]>> => {
  const response = await API.get('/vacations', { params: status ? { status } : undefined })
  return response.data
}

export const bulkCreateVacations = async (
  personnelIds: string[],
  data: Omit<Vacation, 'id' | 'actualReturnDate' | 'personnelId' | 'status'>
): Promise<ApiResponse<Vacation[]>> => {
  const response = await API.post('/vacations/bulk', { personnelIds, ...data })
  return response.data
}
