import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  History,
  RefreshCw,
  Search,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRightLeft,
  PackageCheck,
  Upload,
  Settings2,
  RotateCcw,
  UserCheck,
  CalendarDays,
  Layers
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { getActivityLogs } from '../../api/activity.api'
import { useActivityStore } from '../../store/activityStore'
import { useAuthStore } from '../../store/authStore'
import { isSuperAdmin } from '../../constants/permissions'
import type { ActivityLogItem } from '../../types/activity'
import { ROLE_LABELS } from '../../types/user'
import type { UserRole } from '../../types/user'

// ==================== سجل تحديثات النظام ====================

interface ActionMeta {
  label: string
  badge: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'accent'
  icon: React.ComponentType<{ className?: string }>
  dot: string
}

const ACTION_META: Record<string, ActionMeta> = {
  create: { label: 'إضافة', badge: 'success', icon: PlusCircle, dot: 'bg-emerald-500/15 text-emerald-400' },
  update: { label: 'تعديل', badge: 'primary', icon: Pencil, dot: 'bg-blue-500/15 text-blue-400' },
  delete: { label: 'حذف', badge: 'danger', icon: Trash2, dot: 'bg-red-500/15 text-red-400' },
  transfer: { label: 'نقل', badge: 'warning', icon: ArrowRightLeft, dot: 'bg-amber-500/15 text-amber-400' },
  bulk: { label: 'إضافة جماعية', badge: 'accent', icon: Layers, dot: 'bg-amber-500/15 text-amber-400' },
  dispense: { label: 'صرف دواء', badge: 'accent', icon: PackageCheck, dot: 'bg-amber-500/15 text-amber-400' },
  return: { label: 'تسجيل عودة', badge: 'success', icon: RotateCcw, dot: 'bg-emerald-500/15 text-emerald-400' },
  initialize: { label: 'تهيئة دورة', badge: 'secondary', icon: Settings2, dot: 'bg-gray-500/15 text-gray-300' },
  generate: { label: 'توليد دورة', badge: 'secondary', icon: Settings2, dot: 'bg-gray-500/15 text-gray-300' },
  upload: { label: 'رفع مستند', badge: 'primary', icon: Upload, dot: 'bg-blue-500/15 text-blue-400' },
  settings: { label: 'تعديل إعدادات', badge: 'warning', icon: Settings2, dot: 'bg-amber-500/15 text-amber-400' },
  office: { label: 'تعيين مكتب', badge: 'primary', icon: UserCheck, dot: 'bg-blue-500/15 text-blue-400' }
}

const actionMeta = (action: string): ActionMeta =>
  ACTION_META[action] || {
    label: action,
    badge: 'secondary',
    icon: History,
    dot: 'bg-gray-500/15 text-gray-300'
  }

const MODULE_OPTIONS = [
  { value: '', label: 'كل الوحدات' },
  { value: 'personnel', label: 'الأفراد' },
  { value: 'vacations', label: 'الإجازات' },
  { value: 'services', label: 'الخدمات' },
  { value: 'operations', label: 'العمليات' },
  { value: 'security', label: 'الأمن' },
  { value: 'clinic', label: 'العيادة' },
  { value: 'pharmacy', label: 'الصيدلية' },
  { value: 'line', label: 'الخط' },
  { value: 'absence', label: 'الغياب' },
  { value: 'rewards', label: 'المكافآت' },
  { value: 'penalties', label: 'الجزاءات' },
  { value: 'forms', label: 'النماذج' },
  { value: 'documents', label: 'المستندات' },
  { value: 'notification', label: 'إعدادات التناوب' },
  { value: 'users', label: 'المستخدمين' },
  { value: 'profile', label: 'الملف الشخصي' }
]

const ACTION_OPTIONS = [
  { value: '', label: 'كل العمليات' },
  { value: 'create', label: 'إضافة' },
  { value: 'update', label: 'تعديل' },
  { value: 'delete', label: 'حذف' },
  { value: 'transfer', label: 'نقل' },
  { value: 'bulk', label: 'إضافة جماعية' },
  { value: 'dispense', label: 'صرف دواء' },
  { value: 'return', label: 'تسجيل عودة' },
  { value: 'initialize', label: 'تهيئة دورة' },
  { value: 'generate', label: 'توليد دورة' },
  { value: 'upload', label: 'رفع مستند' },
  { value: 'settings', label: 'تعديل إعدادات' },
  { value: 'office', label: 'تعيين مكتب' }
]

const PAGE_SIZE = 30

const dayKey = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const dayLabel = (key: string): string => {
  const today = dayKey(new Date().toISOString())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = dayKey(yesterdayDate.toISOString())
  if (key === today) return 'اليوم'
  if (key === yesterday) return 'أمس'
  return new Date(`${key}T00:00:00`).toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const timeLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })

export const ActivityLogDashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const isAdmin = isSuperAdmin(user)
  const markSeen = useActivityStore((s) => s.markSeen)

  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // أي دخول لصفحة السجل = «شفت كل الجديد»
  useEffect(() => {
    markSeen()
  }, [markSeen])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      setLoading(true)
      setError(null)
      try {
        const res = await getActivityLogs({
          page: targetPage,
          limit: PAGE_SIZE,
          module: module || undefined,
          action: action || undefined,
          search: debouncedSearch || undefined,
          from: from || undefined,
          to: to || undefined
        })
        if (res.success) {
          setLogs((prev) => (append ? [...prev, ...res.data] : res.data))
          setPage(res.pagination?.page ?? targetPage)
          setTotal(res.pagination?.total ?? res.data.length)
          setTotalPages(res.pagination?.totalPages ?? 1)
        } else {
          setError(res.message || 'تعذر تحميل سجل التحديثات')
        }
      } catch {
        setError('تعذر الاتصال بالسيرفر — جرّب تحديث الصفحة')
      } finally {
        setLoading(false)
      }
    },
    [module, action, debouncedSearch, from, to]
  )

  useEffect(() => {
    void load(1, false)
  }, [load])

  const groups = useMemo(() => {
    const map = new Map<string, ActivityLogItem[]>()
    for (const item of logs) {
      const key = dayKey(item.createdAt)
      const list = map.get(key)
      if (list) list.push(item)
      else map.set(key, [item])
    }
    return Array.from(map.entries())
  }, [logs])

  const resetFilters = () => {
    setSearch('')
    setModule('')
    setAction('')
    setFrom('')
    setTo('')
  }

  const hasFilters = !!(search || module || action || from || to)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="h-6 w-6 text-military-accent" />
            سجل تحديثات النظام
          </h2>
          <p className="text-sm text-gray-400">
            كل الإضافات والتعديلات والحذف في الوحدات — مين عملها وإيه اللي اتغيّر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            إجمالي التحديثات: <span className="font-black text-gray-200">{total}</span>
          </span>
          <Button
            variant="accent"
            startIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => void load(1, false)}
            disabled={loading}
          >
            تحديث
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <div className="xl:col-span-2">
            <Input
              label="بحث"
              placeholder="اسم الفرد / المستخدم / تفاصيل التغيير..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            label="الوحدة"
            options={MODULE_OPTIONS.filter((opt) => isAdmin || !['users', 'profile'].includes(opt.value))}
            value={module}
            onChange={(e) => setModule(e.target.value)}
          />
          <Select
            label="نوع العملية"
            options={ACTION_OPTIONS}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="من تاريخ"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              label="إلى تاريخ"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        {hasFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              startIcon={<RotateCcw className="h-4 w-4" />}
              onClick={resetFilters}
            >
              مسح الفلاتر
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Timeline */}
      {loading && logs.length === 0 && (
        <div className="glassmorphism p-10 rounded-xl text-center text-gray-400 text-sm">
          جاري تحميل سجل التحديثات...
        </div>
      )}

      {!loading && logs.length === 0 && !error && (
        <div className="glassmorphism p-10 rounded-xl text-center">
          <History className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-300">لا توجد تحديثات مطابقة</p>
          <p className="text-xs text-gray-500 mt-1">
            {hasFilters ? 'جرّب تغيير الفلاتر أو مسحها' : 'لسه مفيش أي إضافة أو تعديل أو حذف مسجّل'}
          </p>
        </div>
      )}

      {groups.map(([key, items]) => (
        <div key={key} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-gray-400">
            <CalendarDays className="h-4 w-4 text-military-accent" />
            <span>{dayLabel(key)}</span>
            <span className="text-gray-600">({items.length})</span>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const meta = actionMeta(item.action)
              const Icon = meta.icon
              const fields = item.details?.fields || []
              const roleLabel = item.userRole
                ? ROLE_LABELS[item.userRole as UserRole] || item.userRole
                : ''
              return (
                <div
                  key={item.id}
                  className="glassmorphism p-3.5 rounded-xl flex items-start gap-3"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${meta.dot}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">
                        {item.title || item.moduleLabel}
                      </span>
                      <Badge variant="secondary">{item.moduleLabel}</Badge>
                      <Badge variant={meta.badge}>{meta.label}</Badge>
                    </div>

                    <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-300">
                        {item.userName || 'مستخدم غير معروف'}
                      </span>
                      {roleLabel && roleLabel !== item.userName && (
                        <span className="text-gray-500">({roleLabel})</span>
                      )}
                      {item.userDepartment && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span>{item.userDepartment}</span>
                        </>
                      )}
                    </div>

                    {fields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {fields.map((field, index) => (
                          <span
                            key={`${item.id}-${field.key}-${index}`}
                            className="text-[11px] bg-military-900/70 border border-white/5 rounded-md px-2 py-0.5 text-gray-300"
                          >
                            <span className="text-gray-500">{field.label}: </span>
                            <span className="font-semibold">{field.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-500 shrink-0 whitespace-nowrap">
                    {timeLabel(item.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Load more */}
      {logs.length > 0 && page < totalPages && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            loading={loading}
            onClick={() => void load(page + 1, true)}
          >
            عرض المزيد ({logs.length} من {total})
          </Button>
        </div>
      )}
    </div>
  )
}
