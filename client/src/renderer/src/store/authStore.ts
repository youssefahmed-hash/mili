import { create } from 'zustand'
import { login as loginApi, register as registerApi } from '../api/auth.api'
import type { User, RegisterPayload } from '../types/user'

const TOKEN_KEY = 'mili_auth_token'
const USER_KEY = 'mili_auth_user'

interface AuthState {
  token: string | null
  user: User | null
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  register: (data: RegisterPayload) => Promise<boolean>
  logout: () => void
}

const loadUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: loadUser(),
  error: null,

  login: async (username, password) => {
    set({ error: null })
    try {
      const res = await loginApi(username, password)
      if (res.success) {
        localStorage.setItem(TOKEN_KEY, res.data.token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user))
        set({ token: res.data.token, user: res.data.user })
        return true
      }
      set({ error: res.message || 'فشل تسجيل الدخول' })
      return false
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      set({ error: err.response?.data?.message || 'فشل تسجيل الدخول' })
      return false
    }
  },

  register: async (data) => {
    set({ error: null })
    try {
      const res = await registerApi(data)
      if (res.success) return true
      set({ error: res.message || 'فشل التسجيل' })
      return false
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      set({ error: err.response?.data?.message || 'فشل التسجيل' })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null, error: null })
  }
}))
