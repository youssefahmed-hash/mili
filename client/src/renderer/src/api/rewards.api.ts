import API from './axios'
import type { ApiResponse, RewardRecord } from '../types/personnel'

export const getRewardRecords = async (): Promise<ApiResponse<RewardRecord[]>> => {
  const response = await API.get('/rewards')
  return response.data
}

export const getRewardsByPersonnel = async (
  personnelId: string
): Promise<ApiResponse<RewardRecord[]>> => {
  const response = await API.get(`/rewards/personnel/${personnelId}`)
  return response.data
}

export const createRewardRecord = async (
  data: Omit<RewardRecord, 'id' | 'createdAt' | 'personnel'>
): Promise<ApiResponse<RewardRecord>> => {
  const response = await API.post('/rewards', data)
  return response.data
}

export const updateRewardRecord = async (
  id: string,
  data: Partial<RewardRecord>
): Promise<ApiResponse<RewardRecord>> => {
  const response = await API.put(`/rewards/${id}`, data)
  return response.data
}

export const deleteRewardRecord = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/rewards/${id}`)
  return response.data
}
