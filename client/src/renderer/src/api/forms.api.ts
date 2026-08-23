import API from './axios'
import type { ApiResponse, Form } from '../types/personnel'

export const getFormsByPersonnel = async (personnelId: string): Promise<ApiResponse<Form[]>> => {
  const response = await API.get(`/forms/personnel/${personnelId}`)
  return response.data
}

export const createForm = async (formData: FormData): Promise<ApiResponse<Form>> => {
  const response = await API.post('/forms', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const updateForm = async (id: string, formData: FormData): Promise<ApiResponse<Form>> => {
  const response = await API.put(`/forms/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const deleteForm = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/forms/${id}`)
  return response.data
}
