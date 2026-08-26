import API from './axios'
import type { ApiResponse } from '../types/personnel'
import type { User, RegisterPayload } from '../types/user'

export const login = async (
  username: string,
  password: string
): Promise<ApiResponse<{ token: string; user: User }>> => {
  const response = await API.post('/auth/login', { username, password })
  return response.data
}

export const register = async (data: RegisterPayload): Promise<ApiResponse<User>> => {
  const response = await API.post('/auth/register', data)
  return response.data
}

export const getProfile = async (): Promise<ApiResponse<User>> => {
  const response = await API.get('/auth/me')
  return response.data
}

export const listUsers = async (): Promise<ApiResponse<User[]>> => {
  const response = await API.get('/auth/users')
  return response.data
}

export const createUser = async (data: RegisterPayload): Promise<ApiResponse<User>> => {
  const response = await API.post('/auth/users', data)
  return response.data
}

export const updateUser = async (
  id: string,
  data: Partial<RegisterPayload>
): Promise<ApiResponse<User>> => {
  const response = await API.put(`/auth/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/auth/users/${id}`)
  return response.data
}
