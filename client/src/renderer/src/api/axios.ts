import axios from 'axios'

// عنوان سيرفر الـAPI حسب الجهاز المفتوح منه (الأولوية للإعداد الصريح):
// 1. ملف server.config.json بجانب الـ exe (أجهزة الشبكة) — عبر window.serverConfig
// 2. نفس IP الجهاز المضيف تلقائياً (موبايل/تابلت على الشبكة)
// 3. localhost (نفس الجهاز)
const configuredBaseUrl =
  typeof window !== 'undefined' ? window.serverConfig?.apiBaseUrl || null : null

const apiHost =
  typeof window !== 'undefined' && window.location.hostname
    ? window.location.hostname
    : 'localhost'

const API = axios.create({
  baseURL: configuredBaseUrl || `http://${apiHost}:5000/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mili_auth_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API
