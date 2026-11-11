import React, { useState, useEffect, useCallback } from 'react'
import { Table, Column } from '../ui/Table'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { listUsers, createUser, updateUser, deleteUser } from '../../api/auth.api'
import { getUserSectionOptions, getUserDegreeOptions, USER_SECTIONS_BY_TYPE } from '../../constants/departments'
import { displayDegree } from '../../utils/rankDisplay'
import { matchesAnySearch } from '../../utils/arabicSearch'
import type { User, RegisterPayload, UserRole } from '../../types/user'
import { ROLE_LABELS } from '../../types/user'

export const UsersDashboard: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user)
  const { searchQuery } = useAppStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<RegisterPayload>({
    username: '',
    password: '',
    fullName: '',
    userType: 'حربية',
    department: 'أفراد',
    degree: 'جندي',
    role: 'user'
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listUsers()
      if (res.success) setUsers(res.data)
    } catch {
      setError('فشل تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const openCreate = (): void => {
    setEditing(null)
    setForm({
      username: '',
      password: '',
      fullName: '',
      userType: 'حربية',
      department: 'أفراد',
      degree: 'جندي',
      role: 'user'
    })
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (u: User): void => {
    setEditing(u)
    setForm({
      username: u.username,
      password: '',
      fullName: u.fullName,
      userType: u.userType,
      department: u.department,
      degree: u.degree,
      role: u.role
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.username?.trim()) {
      setFormError('اسم المستخدم مطلوب')
      return
    }
    if (!editing && !form.password) {
      setFormError('كلمة المرور مطلوبة عند إنشاء مستخدم')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const payload: RegisterPayload = {
        username: form.username,
        fullName: form.fullName,
        userType: form.userType,
        department: form.department,
        degree: form.degree,
        role: form.role
      }
      if (form.password) payload.password = form.password

      const res = editing ? await updateUser(editing.id, payload) : await createUser(payload)

      if (res.success) {
        setModalOpen(false)
        load()
      } else {
        setFormError(res.message || 'فشل حفظ المستخدم')
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      setFormError(e.response?.data?.message || 'فشل حفظ المستخدم')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (u: User): Promise<void> => {
    if (u.id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الحالي')
      return
    }
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${u.username}"؟`)) return
    try {
      await deleteUser(u.id)
      load()
    } catch {
      setError('فشل حذف المستخدم')
    }
  }

  const baseDeptOptions = getUserSectionOptions(form.userType)
  const deptOptions =
    form.department && !baseDeptOptions.some((o) => o.value === form.department)
      ? [{ value: form.department, label: form.department }, ...baseDeptOptions]
      : baseDeptOptions

  const q = (searchQuery || '').trim()
  const visibleUsers = q
    ? users.filter((u) => matchesAnySearch([u.username, u.fullName], q))
    : users
  const typeOptions = [
    { value: 'حربية', label: 'حربية' },
    { value: 'داخلية', label: 'داخلية' }
  ]
  const roleOptions = [
    { value: 'user', label: 'مستخدم' },
    { value: 'internal_manager', label: 'مدير داخلية' },
    { value: 'admin', label: 'مدير النظام' }
  ]

  const columns: Column<User>[] = [
    { key: 'username', label: 'اسم المستخدم' },
    { key: 'fullName', label: 'الاسم الكامل' },
    {
      key: 'userType',
      label: 'النوع',
      render: (row) => (
        <span className={row.userType === 'حربية' ? 'text-blue-400' : 'text-emerald-400'}>
          {row.userType}
        </span>
      )
    },
    { key: 'department', label: 'القسم' },
    {
      key: 'degree',
      label: 'الدرجة',
      render: (row) => <span className="text-gray-300">{displayDegree(row.degree, row.userType)}</span>
    },
    {
      key: 'role',
      label: 'الصلاحية',
      render: (row) => <span>{ROLE_LABELS[row.role] || row.role}</span>
    },
    {
      key: 'createdAt',
      label: 'تاريخ الإنشاء',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ar-EG')
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded"
            onClick={() => openEdit(row)}
            title="تعديل"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
            onClick={() => handleDelete(row)}
            title="حذف"
            disabled={row.id === currentUser?.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const modalFooter = (
    <>
      <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
        إلغاء
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={submitting}>
        {editing ? 'حفظ التغييرات' : 'إنشاء المستخدم'}
      </Button>
    </>
  )

  return (
    <div className="flex flex-col gap-6 text-start">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide">المستخدمين</h2>
          <p className="text-sm text-gray-400 mt-1">إدارة حسابات النظام والصلاحيات والأقسام</p>
        </div>
        <Button variant="primary" startIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          إضافة مستخدم
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <Table columns={columns} data={visibleUsers} loading={loading} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
        footer={modalFooter}
        size="lg"
      >
        <form className="flex flex-col gap-4 text-start" onSubmit={handleSubmit}>
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="اسم المستخدم *"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="اسم المستخدم"
              disabled={!!editing}
            />
            <Input
              label={editing ? 'كلمة المرور (اتركها فارغة للإبقاء)' : 'كلمة المرور *'}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="كلمة المرور"
            />
            <Input
              label="الاسم الكامل"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="الاسم بالكامل"
            />
            <Select
              label="النوع"
              options={typeOptions}
              value={form.userType}
              onChange={(e) => {
                const t = e.target.value as 'داخلية' | 'حربية'
                setForm({
                  ...form,
                  userType: t,
                  department: USER_SECTIONS_BY_TYPE[t][0]
                })
              }}
            />
            <Select
              label="القسم"
              options={deptOptions}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <Select
              label="الدرجة"
              options={getUserDegreeOptions().map((o) => ({
                value: o.value,
                label: displayDegree(o.value, form.userType) || o.label
              }))}
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value as 'جندي' | 'صف ضابط' | 'ضابط' })}
            />
            <Select
              label="الصلاحية"
              options={roleOptions}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            />
            {form.role === 'internal_manager' && (
              <div className="md:col-span-2 -mt-2 text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2">
                مدير داخلية: يشوف كل التبويبات زي المدير، بس نطاقه عساكر الداخلية
                (داخلية + تشغيل + مستجدين داخلية) — ومش بيدير المستخدمين ولا إعدادات التناوب.
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  )
}
