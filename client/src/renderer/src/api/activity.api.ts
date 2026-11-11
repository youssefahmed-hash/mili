import API from './axios'
import type { ActivityLogItem, ActivityLogQuery } from '../types/activity'
import type { ApiResponse } from '../types/personnel'

export const getActivityLogs = async (
  params: ActivityLogQuery
): Promise<ApiResponse<ActivityLogItem[]>> => {
  const response = await API.get('/activity', { params })
  return response.data
}

export const getActivityCount = async (
  since?: string
): Promise<ApiResponse<{ count: number; serverTime: string }>> => {
  const response = await API.get('/activity/count', {
    params: since ? { since } : undefined
  })
  return response.data
}
