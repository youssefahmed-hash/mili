import React, { useState } from 'react'
import { Shield, LogIn, UserPlus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { getDepartmentOptions } from '../../constants/departments'

type Mode = 'login' | 'register'

export const AuthPage: React.FC = () => {
  const { login, register, error } = useAuthStore()
  const [mode, setMode] = useState<Mode>('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userType, setUserType] = useState<'داخلية' | 'حربية'>('حربية')
  const [department, setDepartment] = useState('عمليات')
  const [loading, setLoading] = useState(false)

  const typeOptions = [
    { value: 'حربية', label: 'حربية' },
    { value: 'داخلية', label: 'داخلية' }
  ]

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    let ok = false
    if (mode === 'login') {
      ok = await login(username, password)
    } else {
      ok = await register({
        username,
        password,
        fullName,
        userType,
        department
      })
    }
    setLoading(false)
    if (!ok && mode === 'register') {
      // stay on register to show error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-military-900 p-4">
      <div className="w-full max-w-md glassmorphism rounded-2xl shadow-2xl p-8 border border-white/10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-military-primary/10 p-3 rounded-xl border border-military-primary/30">
            <Shield className="h-8 w-8 text-military-primary" />
          </div>
          <h1 className="text-xl font-black tracking-wide text-white">منظومة إدارة شؤون الأفراد</h1>
          <p className="text-sm text-gray-400">
            {mode === 'login' ? 'تسجيل الدخول إلى النظام' : 'إنشاء حساب جديد'}
          </p>
        </div>

        <div className="flex gap-2 mb-6 bg-military-800/50 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-colors ${
              mode === 'login'
                ? 'bg-military-primary text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn className="h-4 w-4" />
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-colors ${
              mode === 'register'
                ? 'bg-military-primary text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            حساب جديد
          </button>
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

          {mode === 'register' && (
            <>
              <Input
                label="الاسم الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم بالكامل"
              />
              <Select
                label="النوع"
                options={typeOptions}
                value={userType}
                onChange={(e) => setUserType(e.target.value as 'داخلية' | 'حربية')}
              />
              <Select
                label="القسم"
                options={getDepartmentOptions(userType)}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </>
          )}

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
            startIcon={
              mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />
            }
          >
            {mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </Button>
        </form>
      </div>
    </div>
  )
}
