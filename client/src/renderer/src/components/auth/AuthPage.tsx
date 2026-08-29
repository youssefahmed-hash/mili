import React, { useState } from 'react'
import { Shield, LogIn } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export const AuthPage: React.FC = () => {
  const { login, error } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    await login(username, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-military-900 p-4">
      <div className="w-full max-w-md glassmorphism rounded-2xl shadow-2xl p-8 border border-white/10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-military-primary/10 p-3 rounded-xl border border-military-primary/30">
            <Shield className="h-8 w-8 text-military-primary" />
          </div>
          <h1 className="text-xl font-black tracking-wide text-white">منظومة إدارة شؤون الأفراد</h1>
          <p className="text-sm text-gray-400">تسجيل الدخول إلى النظام</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-start">
          <Input
            label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="أدخل اسم المستخدم"
            required
          />
          <Input
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="أدخل كلمة المرور"
            required
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="mt-2"
            startIcon={<LogIn className="h-4 w-4" />}
          >
            دخول
          </Button>
        </form>
      </div>
    </div>
  )
}
