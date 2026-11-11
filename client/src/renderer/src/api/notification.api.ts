import API from './axios'
import type {
  ApiResponse,
  NotificationData,
  NotificationSettings
} from '../types/personnel'

export const getCurrentNotification = async (): Promise<
  ApiResponse<NotificationData>
> => {
  const response = await API.get('/notification/current')
  return response.data
}

export const getNotificationSettings = async (): Promise<
  ApiResponse<NotificationSettings>
> => {
  const response = await API.get('/notification/settings')
  return response.data
}

export const updateNotificationSettings = async (
  data: Partial<NotificationSettings>
): Promise<ApiResponse<NotificationSettings>> => {
  const response = await API.put('/notification/settings', data)
  return response.data
}
