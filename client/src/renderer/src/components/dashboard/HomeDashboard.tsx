import React, { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, RefreshCw, Users, UserMinus, UserCheck, Printer } from 'lucide-react'
import { Button } from '../ui/Button'
import { getStrength } from '../../api/personnel.api'
import { usePersonnelStore, DrilldownMode } from '../../store/personnelStore'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import type { StrengthData, StrengthGroup } from '../../types/personnel'
import { canViewStrengthConditions } from '../../constants/permissions'

const escHtml = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const GROUPS: { key: string; label: string; accent: string }[] = [
  { key: 'حربية', label: 'القوة الحربية', accent: 'text-amber-400' },
  { key: 'تشغيل حربيه', label: 'قوة التشغيل', accent: 'text-emerald-400' },
  { key: 'داخلية', label: 'القوة الداخلية', accent: 'text-sky-400' }
]

const StatCard: React.FC<{
  label: string
  value: number
  icon: React.ReactNode
  valueClass: string
  onClick?: () => void
}> = ({ label, value, icon, valueClass, onClick }) => (
  <div
    onClick={onClick}
    title={onClick ? 'اضغط لعرض الأفراد' : undefined}
    className={`glassmorphism p-5 rounded-xl text-center flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer hover:border-military-accent/50 hover:bg-military-primary/5 transition-all' : ''}`}
  >
    <div className="flex items-center gap-2 text-gray-400">
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </div>
    <div className={`text-3xl font-black ${valueClass}`}>{value}</div>
  </div>
)

// ==================== Home Dashboard (الصفحة الرئيسية — الأدمن فقط) ====================
export const HomeDashboard: React.FC = () => {
  const [data, setData] = useState<StrengthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [printingKey, setPrintingKey] = useState<string | null>(null)
  const setDrilldown = usePersonnelStore((s) => s.setDrilldown)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const user = useAuthStore((s) => s.user)
  const canSeeConditions = canViewStrengthConditions(user)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getStrength()
      if (res.success) {
        setData(res.data)
      } else {
        setError(res.message || 'فشل تحميل بيانات القوة')
      }
    } catch {
      setError('فشل تحميل بيانات القوة')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const groupOf = (key: string): StrengthGroup | null =>
    data && data.groups && key in data.groups ? data.groups[key] : null

  // المجموعات الراجعة فقط من الـ API (الـ Backend يحدد الرؤية حسب اليوزر)
  const visibleGroups = data && data.groups ? GROUPS.filter((g) => g.key in data.groups) : []

  // الدوس على خانة → انتقال لتبويب الأفراد بفلتر مسبق (النوع + الحالة)
  const drill = (personnelType: string, mode: DrilldownMode): void => {
    setDrilldown({ personnelType, mode })
    setActiveTab('الأفراد')
  }

  // الدوس على حالة التمام المؤثرة → الأفراد مفلترين على الحالة دي (الكل)
  const drillStatus = (status: string): void => {
    setDrilldown({ personnelType: '', mode: 'total', status })
    setActiveTab('الأفراد')
  }

  // الدوس على شرط من شروط المؤثرات → الأفراد مفلترين على الشرط ده
  const drillCondition = (condition: string): void => {
    setDrilldown({ personnelType: '', mode: 'total', condition })
    setActiveTab('الأفراد')
  }

  // طباعة ورقة القوة لمجموعة (أرقام فقط): PDF أصلي في الـ exe، وتبويب طباعة في المتصفح
  const printGroup = async (groupKey: string, groupLabel: string, g: StrengthGroup): Promise<void> => {
    const today = new Date().toISOString().slice(0, 10)
    const html =
      '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">' +
      `<title>تمام القوة - ${escHtml(groupLabel)}</title>` +
      '<style>body{font-family:Arial,sans-serif;padding:24px;direction:rtl;color:#111;}' +
      'h1{text-align:center;}table{width:100%;border-collapse:collapse;margin:12px 0;}th,td{border:1px solid #999;padding:8px;text-align:right;}th{background:#eee;width:40%;}.footer{margin-top:16px;font-size:11px;color:#555;}</style></head><body>' +
      `<h1>تمام القوة - ${escHtml(groupLabel)}</h1>` +
      `<p>التاريخ: ${today}</p>` +
      '<table>' +
      `<tr><th>القوة الكاملة</th><td>${g.total}</td></tr>` +
      `<tr><th>خارج</th><td>${g.out}</td></tr>` +
      `<tr><th>موجود</th><td>${g.present}</td></tr>` +
      '</table>' +
      `<div class="footer">طُبع بواسطة: ${escHtml(user?.fullName || user?.username || '')}</div>` +
      '</body></html>'
    if (typeof window !== 'undefined' && window.api?.printToPDF) {
      setPrintingKey(groupKey)
      try {
        const safeName = groupLabel.replace(/[\\/:*?"<>|]/g, '_')
        await window.api.printToPDF({ html, fileName: `القوة-${safeName}-${today}.pdf` })
      } finally {
        setPrintingKey(null)
      }
    } else if (typeof window !== 'undefined') {
      const w = window.open('', '_blank', 'noopener')
      if (!w) {
        alert('المتصفح منع فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة ثم حاول مجددًا')
        return
      }
      const bar =
        '<div style="position:sticky;top:0;background:#1a1a2e;padding:10px;text-align:center;">' +
        '<button onclick="window.print()" style="background:#fff;color:#1a1a2e;border:none;border-radius:8px;padding:10px 28px;font-size:15px;font-weight:bold;cursor:pointer;">🖨️ اطبع / احفظ PDF</button></div>'
      w.document.write(html.replace('<body>', `<body>${bar}`))
      w.document.close()
      w.focus()
    }
  }

  const grand: StrengthGroup = visibleGroups.reduce<StrengthGroup>(
    (acc, g) => {
      const v = groupOf(g.key) ?? { total: 0, out: 0, present: 0 }
      return { total: acc.total + v.total, out: acc.out + v.out, present: acc.present + v.present }
    },
    { total: 0, out: 0, present: 0 }
  )

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-military-accent" />
            الصفحة الرئيسية
          </h2>
          <p className="text-sm text-gray-400">
            إجمالي القوة والخارج والموجود حسب النوع — الخارج = أي حالة غير داخل القطاع
            <span className="text-military-accent"> + حالات الخط من تاب العمليات</span>
          </p>
        </div>
        <Button
          variant="accent"
          startIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchData}
          disabled={loading}
        >
          تحديث
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-center text-gray-500 text-sm py-6">جاري التحميل...</div>
      )}

      {data && (
        <>
          {/* Grand total */}
          <div className="glassmorphism p-5 rounded-xl">
            <h3 className="text-sm font-black text-white mb-3">إجمالي القوة الكاملة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                label="القوة الكاملة"
                value={grand.total}
                icon={<Users className="h-4 w-4" />}
                valueClass="text-white"
                onClick={() => drill('', 'total')}
              />
              <StatCard
                label="خارج"
                value={grand.out}
                icon={<UserMinus className="h-4 w-4" />}
                valueClass="text-red-400"
                onClick={() => drill('', 'out')}
              />
              <StatCard
                label="موجود"
                value={grand.present}
                icon={<UserCheck className="h-4 w-4" />}
                valueClass="text-emerald-400"
                onClick={() => drill('', 'present')}
              />
            </div>
          </div>

          {/* Per-type groups (visible per user scope) */}
          {visibleGroups.map((g) => {
            const v = groupOf(g.key) ?? { total: 0, out: 0, present: 0 }
            return (
              <div key={g.key} className="glassmorphism p-5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-black ${g.accent}`}>{g.label}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => printGroup(g.key, g.label, v)}
                    loading={printingKey === g.key}
                    startIcon={<Printer className="h-4 w-4" />}
                    title="طباعة ورقة القوة (أرقام)"
                  >
                    طباعة
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCard
                    label="القوة الكاملة"
                    value={v.total}
                    icon={<Users className="h-4 w-4" />}
                    valueClass="text-white"
                    onClick={() => drill(g.key, 'total')}
                  />
                  <StatCard
                    label="خارج"
                    value={v.out}
                    icon={<UserMinus className="h-4 w-4" />}
                    valueClass="text-red-400"
                    onClick={() => drill(g.key, 'out')}
                  />
                  <StatCard
                    label="موجود"
                    value={v.present}
                    icon={<UserCheck className="h-4 w-4" />}
                    valueClass="text-emerald-400"
                    onClick={() => drill(g.key, 'present')}
                  />
                </div>
              </div>
            )
          })}

          {/* التمامات المؤثرة على القوة — للمديرين ومستخدم الشئون */}
          {canSeeConditions && data.conditions && (
            <div className="glassmorphism p-5 rounded-xl">
              <h3 className="text-sm font-black text-white mb-1">المؤثرات على القوة</h3>
              <p className="text-[11px] text-gray-500 mb-3">
                اضغط على أي خانة لعرض الأفراد في الحالة دي بالتفصيل — الأرقام دي بتتأثر
                تلقائيًا بحالات العساكر في تاب العمليات (غياب / سجن / مرضي / إجازة)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="إجمالي المؤثرين"
                  value={data.conditions.affectedTotal}
                  icon={<Users className="h-4 w-4" />}
                  valueClass="text-red-400"
                  onClick={() => drillCondition('any')}
                />
                <StatCard
                  label="غياب"
                  value={data.conditions.absence}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-red-400"
                  onClick={() => drillStatus('غياب')}
                />
                <StatCard
                  label="محكمه"
                  value={data.conditions.court}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-orange-400"
                  onClick={() => drillStatus('محكمه')}
                />
                <StatCard
                  label="مستشفى خارجي"
                  value={data.conditions.extHospital}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-purple-400"
                  onClick={() => drillStatus('مستشفى خارجي')}
                />
                <StatCard
                  label="عرض مستشفى"
                  value={data.conditions.hospRef}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-sky-400"
                  onClick={() => drillStatus('عرض مستشفى')}
                />
                <StatCard
                  label="منع سلاح"
                  value={data.conditions.weaponBan}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-red-400"
                  onClick={() => drillCondition('condWeaponBan')}
                />
                <StatCard
                  label="نفسية وعصبية"
                  value={data.conditions.neuro}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-amber-400"
                  onClick={() => drillCondition('condNeuro')}
                />
                <StatCard
                  label="شطب مسرح"
                  value={data.conditions.struckDischarged}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-orange-400"
                  onClick={() => drillCondition('condStruckDischarged')}
                />
                <StatCard
                  label="شطب غير مسرح"
                  value={data.conditions.struckRetained}
                  icon={<UserMinus className="h-4 w-4" />}
                  valueClass="text-yellow-400"
                  onClick={() => drillCondition('condStruckRetained')}
                />
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !data && !error && (
        <div className="text-center text-gray-500 text-sm py-6">
          لا توجد بيانات قوة
        </div>
      )}
    </div>
  )
}
