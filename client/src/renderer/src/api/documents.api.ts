import API from './axios'
import type { ApiResponse, Document } from '../types/personnel'

export const getDocumentsByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<Document[]>> => {
  const response = await API.get(`/documents/personnel/${personnelId}`)
  return response.data
}

export const uploadDocument = async (formData: FormData): Promise<ApiResponse<Document>> => {
  const response = await API.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const deleteDocument = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/documents/${id}`)
  return response.data
}
