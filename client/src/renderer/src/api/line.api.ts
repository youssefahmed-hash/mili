import API from './axios'
import type {
  ApiResponse,
  Shift,
  LinePoint,
  LineAssignment,
  LineLeaveCycle,
  LineDailyReport
} from '../types/personnel'

// ==================== Shifts (قراءة فقط) ====================
export const getShifts = async (): Promise<ApiResponse<Shift[]>> => {
  const response = await API.get('/line/shifts')
  return response.data
}

// ==================== Line Points ====================
export const getLinePoints = async (): Promise<ApiResponse<LinePoint[]>> => {
  const response = await API.get('/line/points')
  return response.data
}

export const createLinePoint = async (data: Partial<LinePoint>): Promise<ApiResponse<LinePoint>> => {
  const response = await API.post('/line/points', data)
  return response.data
}

export const updateLinePoint = async (id: string, data: Partial<LinePoint>): Promise<ApiResponse<LinePoint>> => {
  const response = await API.put(`/line/points/${id}`, data)
  return response.data
}

export const deleteLinePoint = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/line/points/${id}`)
  return response.data
}

// ==================== Line Assignments ====================
export const getLineAssignments = async (params?: {
  pointId?: string
  shiftId?: string
  personnelId?: string
}): Promise<ApiResponse<LineAssignment[]>> => {
  const response = await API.get('/line/assignments', { params })
  return response.data
}

export const createLineAssignment = async (data: Partial<LineAssignment>): Promise<ApiResponse<LineAssignment>> => {
  const response = await API.post('/line/assignments', data)
  return response.data
}

export const bulkCreateLineAssignments = async (
  assignments: Partial<LineAssignment>[]
): Promise<ApiResponse<LineAssignment[]>> => {
  const response = await API.post('/line/assignments/bulk', assignments)
  return response.data
}

export const updateLineAssignment = async (
  id: string,
  data: Partial<LineAssignment>
): Promise<ApiResponse<LineAssignment>> => {
  const response = await API.put(`/line/assignments/${id}`, data)
  return response.data
}

export const deleteLineAssignment = async (id: string): Promise<ApiResponse<void>> => {
  const response = await API.delete(`/line/assignments/${id}`)
  return response.data
}

/** تعليم/فكّ «عسكري مكتب» + إجبار الحالة (إجازة/حاضر) — دفعة واحدة */
export const setLineOfficeDuty = async (
  items: { id: string; officeDuty: boolean; status?: string }[]
): Promise<ApiResponse<LineAssignment[]>> => {
  const response = await API.post('/line/assignments/office-duty', { items })
  return response.data
}

export const getCurrentLineAssignment = async (
  personnelId: string
): Promise<ApiResponse<LineAssignment | null>> => {
  const response = await API.get('/line/assignments/current', { params: { personnelId } })
  return response.data
}

export const transferLinePoint = async (
  personnelId: string,
  newPointId: string
): Promise<ApiResponse<LineAssignment>> => {
  const response = await API.post('/line/assignments/transfer/point', { personnelId, newPointId })
  return response.data
}

export const transferLineShift = async (
  personnelId: string,
  newShiftId: string
): Promise<ApiResponse<LineAssignment>> => {
  const response = await API.post('/line/assignments/transfer/shift', { personnelId, newShiftId })
  return response.data
}

export const transferLineBoth = async (
  personnelId: string,
  newPointId: string,
  newShiftId: string
): Promise<ApiResponse<LineAssignment>> => {
  const response = await API.post('/line/assignments/transfer/both', { personnelId, newPointId, newShiftId })
  return response.data
}

// ==================== Leave Cycles ====================
export const getLeaveCycles = async (): Promise<ApiResponse<LineLeaveCycle[]>> => {
  const response = await API.get('/line/leave-cycles')
  return response.data
}

export const getCurrentLeaveCycles = async (): Promise<ApiResponse<LineLeaveCycle[]>> => {
  const response = await API.get('/line/leave-cycles/current')
  return response.data
}

export const initializeLeaveCycle = async (
  startDate: string,
  shiftId?: string,
  personnelIds?: string[],
  vacationOptions?: {
    vacationType?: string
    cycle?: string
    expectedReturnDate?: string
    notes?: string | null
  }
): Promise<ApiResponse<LineLeaveCycle>> => {
  const response = await API.post('/line/leave-cycles/initialize', {
    startDate,
    shiftId,
    personnelIds,
    ...vacationOptions
  })
  return response.data
}

export const generateNextLeaveCycle = async (): Promise<ApiResponse<LineLeaveCycle>> => {
  const response = await API.post('/line/leave-cycles/generate-next')
  return response.data
}

export const getCurrentLeaveShift = async (date: string): Promise<ApiResponse<{ shiftId: string; shiftName: string; cycleNumber: number } | null>> => {
  const response = await API.get('/line/leave-cycles/current-leave-shift', { params: { date } })
  return response.data
}

// ==================== Reports ====================
export const getDailyReport = async (): Promise<ApiResponse<LineDailyReport>> => {
  const response = await API.get('/line/report/daily')
  return response.data
}

export const getDailyReportPDFUrl = (): string => {
  const token = localStorage.getItem('mili_auth_token')
  const configuredBaseUrl =
    typeof window !== 'undefined' ? window.serverConfig?.apiBaseUrl || null : null
  const origin = configuredBaseUrl
    ? configuredBaseUrl.replace(/\/api\/?$/, '')
    : `http://${
        typeof window !== 'undefined' && window.location.hostname
          ? window.location.hostname
          : 'localhost'
      }:5000`
  return `${origin}/api/line/report/daily/pdf?token=${token}`
}
