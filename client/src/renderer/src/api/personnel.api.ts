import API from './axios'
import type { ApiResponse, Personnel } from '../types/personnel'

export const getPersonnel = async (
  params: Record<string, string | number>
): Promise<ApiResponse<Personnel[]>> => {
  const response = await API.get('/personnel', { params })
  return response.data
}

export const getAllPersonnel = async (ranks?: string): Promise<ApiResponse<Personnel[]>> => {
  const params: Record<string, string | number> = { page: 1, limit: 1000 }
  if (ranks) {
    params.ranks = ranks
  }
  const response = await API.get('/personnel', { params })
  return response.data
}

export const getPersonnelById = async (id: string): Promise<ApiResponse<Personnel>> => {
  const response = await API.get(`/personnel/${id}`)
  return response.data
}

export const createPersonnel = async (formData: FormData): Promise<ApiResponse<Personnel>> => {
  const response = await API.post('/personnel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const updatePersonnel = async (
  id: string,
  formData: FormData
): Promise<ApiResponse<Personnel>> => {
  const response = await API.put(`/personnel/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const deletePersonnel = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/personnel/${id}`)
  return response.data
}
