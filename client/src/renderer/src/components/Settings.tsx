import React, { useState } from 'react'
import { Settings as SettingsIcon, UserCog, ShieldCheck, CheckCircle, KeyRound } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { updateProfile, changePassword } from '../api/auth.api'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { isManager } from '../constants/permissions'
import { ROLE_LABELS } from '../types/user'

const Section: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}> = ({ title, icon, children }) => (
  <section className='glassmorphism p-6 rounded-2xl flex flex-col gap-4'>
    <h3 className='flex items-center gap-2 text-lg font-bold text-white border-b border-white/5 pb-3'>
      <span className='text-military-primary'>{icon}</span>
      {title}
    </h3>
    {children}
  </section>
)

export const Settings: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const updateUserStore = useAuthStore((s) => s.updateUser)

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [department] = useState(user?.department || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (!user) {
    return (
      <div className='flex flex-col gap-6 w-full'>
        <h2 className='flex items-center gap-2 text-2xl font-black text-white'>
          <SettingsIcon className='h-6 w-6' /> الإعدادات
        </h2>
        <p className='text-gray-400'>يجب تسجيل الدخول لعرض الإعدادات.</p>
      </div>
    )
  }

  const handleSaveProfile = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await updateProfile({ fullName })
      if (res.success) {
        updateUserStore(res.data)
        setProfileMsg({ ok: true, text: 'تم حفظ الملف الشخصي بنجاح' })
      } else {
        setProfileMsg({ ok: false, text: res.message || 'فشل حفظ البيانات' })
      }
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setProfileMsg({ ok: false, text: ex.response?.data?.message || 'فشل حفظ البيانات' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setPwMsg(null)
    if (newPassword.length < 4) {
      setPwMsg({ ok: false, text: 'كلمة المرور الجديدة قصيرة جداً (4 أحرف على الأقل)' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: false, text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' })
      return
    }
    setPwSaving(true)
    try {
      const res = await changePassword({ currentPassword, newPassword })
      if (res.success) {
        setPwMsg({ ok: true, text: 'تم تغيير كلمة المرور بنجاح' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPwMsg({ ok: false, text: res.message || 'فشل تغيير كلمة المرور' })
      }
    } catch (err) {
      const ex = err as { response?: { data?: { message?: string } } }
      setPwMsg({ ok: false, text: ex.response?.data?.message || 'فشل تغيير كلمة المرور' })
    } finally {
      setPwSaving(false)
    }
  }

  const msgBox = (msg: { ok: boolean; text: string } | null): React.ReactNode =>
    msg ? (
      <div
        className={`flex items-center gap-2 p-3 rounded-lg text-sm font-bold ${
          msg.ok
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}
      >
        <CheckCircle className='h-4 w-4' />
        {msg.text}
      </div>
    ) : null

  return (
    <div className='flex flex-col gap-6 w-full'>
      <div>
        <h2 className='flex items-center gap-2 text-2xl font-black text-white'>
          <SettingsIcon className='h-6 w-6' /> الإعدادات
        </h2>
        <p className='text-sm text-gray-400'>إدارة بيانات حسابك وكلمة المرور.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Section title='الملف الشخصي' icon={<UserCog className='h-5 w-5' />}>
          <form onSubmit={handleSaveProfile} className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <span className='text-xs text-gray-400'>اسم المستخدم</span>
              <Input value={user.username} disabled readOnly />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-2'>
                <span className='text-xs text-gray-400'>النوع</span>
                <Badge variant={user.userType === 'حربية' ? 'accent' : 'secondary'}>
                  {user.userType}
                </Badge>
              </div>
              <div className='flex flex-col gap-2'>
                <span className='text-xs text-gray-400'>الدور</span>
                <Badge
                  variant={isManager(user) ? 'warning' : 'primary'}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-xs text-gray-400'>الاسم الكامل</span>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='الاسم الكامل'
              />
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-xs text-gray-400'>القسم (يحدده مدير النظام فقط)</span>
              <div className='w-full bg-military-900/60 border border-white/10 text-gray-200 text-sm rounded-lg px-3 py-2.5'>
                {department || '—'}
              </div>
            </div>

            {msgBox(profileMsg)}
            <Button type='submit' variant='primary' loading={profileSaving}>
              حفظ البيانات
            </Button>
          </form>
        </Section>

        <Section title='الأمان' icon={<ShieldCheck className='h-5 w-5' />}>
          <form onSubmit={handleChangePassword} className='flex flex-col gap-4'>
            <div className='flex items-center gap-2 text-xs text-gray-500'>
              <KeyRound className='h-3.5 w-3.5' />
              تغيير كلمة المرور يتطلب إدخال كلمة المرور الحالية.
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-xs text-gray-400'>كلمة المرور الحالية</span>
              <Input
                type='password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-xs text-gray-400'>كلمة المرور الجديدة</span>
              <Input
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-xs text-gray-400'>تأكيد كلمة المرور الجديدة</span>
              <Input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {msgBox(pwMsg)}
            <Button type='submit' variant='primary' loading={pwSaving}>
              تغيير كلمة المرور
            </Button>
          </form>
        </Section>
      </div>
    </div>
  )
}
