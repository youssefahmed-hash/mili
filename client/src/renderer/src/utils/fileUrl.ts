import API from '../api/axios'

const API_BASE = API.defaults.baseURL || 'http://localhost:5000/api'
const ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export const resolveFileUrl = (filePath?: string | null): string | null => {
  if (!filePath) return null
  if (/^https?:\/\//.test(filePath)) return filePath
  return `${ORIGIN}${filePath}`
}

export const isPdf = (filePath?: string | null): boolean => {
  if (!filePath) return false
  return filePath.toLowerCase().endsWith('.pdf')
}
