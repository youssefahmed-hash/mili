import React, { useState, useEffect, useCallback } from 'react'
import { getPharmacyExpiring, getPharmacyDeadStock } from '../../../api/pharmacy.api'
import { Table, Column } from '../../ui/Table'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { ClickableStatCard } from '../../ui/ClickableStatCard'
import { AlertOctagon, AlertTriangle, Clock, Package, RefreshCw, Moon, Sparkles } from 'lucide-react'
import type {
  PharmacyBatch,
  PharmacyExpiringReport,
  DeadStockItem,
  DeadStockReport
} from '../../../types/personnel'

type BucketId = 'expired' | 'within3' | 'within6'
type Mode = 'expiry' | 'dead'

export const PharmacyExpiringTab: React.FC = () => {
  const [mode, setMode] = useState<Mode>('expiry')
  const [report, setReport] = useState<PharmacyExpiringReport | null>(null)
  const [dead, setDead] = useState<DeadStockReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bucket, setBucket] = useState<BucketId | null>(null)
  const [deadFilter, setDeadFilter] = useState<'all' | 'never' | 'stale' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [exp, ds] = await Promise.all([getPharmacyExpiring(6), getPharmacyDeadStock(90)])
      if (exp.success) setReport(exp.data)
      if (ds.success) setDead(ds.data)
    } catch {
      setError('فشل تحميل التقارير')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    load()
  }, [load])

  const rows: PharmacyBatch[] = bucket && report ? report.buckets[bucket] : []
  const toggle = (b: BucketId) => setBucket((p) => (p === b ? null : b))

  const deadRows: DeadStockItem[] = dead
    ? deadFilter
      ? dead.items.filter((i) => i.status === deadFilter)
      : dead.items
    : []
  const toggleDead = (f: 'never' | 'stale') => setDeadFilter((p) => (p === f ? null : f))

  const deadColumns: Column<DeadStockItem>[] = [
    {
      key: 'name',
      label: 'الصنف',
      render: (d) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{d.name}</span>
          {d.code && <span className="text-xs font-mono text-military-accent">{d.code}</span>}
        </div>
      )
    },
    {
      key: 'remaining',
      label: 'المتبقي',
      render: (d) => (
        <div className="flex flex-col">
          <span className="text-amber-300 font-bold">{d.remainingDisplay?.علبة || 0} علبة</span>
          <span className="text-xs text-gray-400">{d.remainingPills} حبة</span>
        </div>
      )
    },
    { key: 'batches', label: 'الشحنات', render: (d) => <span className="text-gray-300">{d.batchCount}</span> },
    {
      key: 'last',
      label: 'آخر صرف',
      render: (d) =>
        d.lastDispensed ? (
          <div className="flex flex-col">
            <span className="text-gray-300 text-xs">
              {new Date(d.lastDispensed).toLocaleDateString('ar-EG')}
            </span>
            <span className="text-[11px] text-amber-400">منذ {d.daysSinceLastDispense} يوم</span>
          </div>
        ) : (
          <Badge variant="danger">ما اتصرفش خالص</Badge>
        )
    },
    {
      key: 'status',
      label: 'الحالة',
      align: 'center' as const,
      render: (d) =>
        d.status === 'never' ? (
          <Badge variant="danger">خامل تماماً</Badge>
        ) : (
          <Badge variant="warning">راكد</Badge>
        )
    }
  ]

  const columns: Column<PharmacyBatch>[] = [
    {
      key: 'drug',
      label: 'الصنف',
      render: (b) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{b.drug?.name || '—'}</span>
          {b.drug?.code && <span className="text-xs font-mono text-military-accent">{b.drug.code}</span>}
        </div>
      )
    },
    {
      key: 'batchNumber',
      label: 'رقم التشغيلة',
      render: (b) => <span className="text-xs text-gray-300">{b.batchNumber || '—'}</span>
    },
    {
      key: 'expiry',
      label: 'تاريخ الانتهاء',
      render: (b) => <span className="text-gray-200">{b.expiryDate}</span>
    },
    {
      key: 'days',
      label: 'المتبقي',
      render: (b) =>
        b.daysToExpiry < 0 ? (
          <Badge variant="danger">منتهي منذ {Math.abs(b.daysToExpiry)} يوم</Badge>
        ) : b.daysToExpiry <= 92 ? (
          <Badge variant="warning">{b.daysToExpiry} يوم</Badge>
        ) : (
          <span className="text-gray-300">{b.daysToExpiry} يوم</span>
        )
    },
    {
      key: 'remaining',
      label: 'الرصيد المتبقي',
      render: (b) => (
        <div className="flex flex-col">
          <span className="text-emerald-300 font-bold">{b.remainingDisplay?.علبة || 0} علبة</span>
          <span className="text-xs text-gray-400">{b.qtyRemainingPills} حبة</span>
        </div>
      )
    },
    {
      key: 'supplier',
      label: 'المورد',
      render: (b) => <span className="text-xs text-gray-300">{b.supplier || '—'}</span>
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* مبدّل: الصلاحية / الرواكد */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'expiry', label: 'تنبيه الصلاحية', icon: Clock },
              { id: 'dead', label: 'تقرير الرواكد', icon: Moon }
            ] as const
          ).map((m) => {
            const Icon = m.icon
            const active = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id)
                  setBucket(null)
                  setDeadFilter(null)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  active
                    ? 'bg-military-primary/15 text-white border border-military-accent/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-military-700/30 border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            )
          })}
        </div>
        <Button
          variant="secondary"
          size="sm"
          startIcon={<RefreshCw className="h-4 w-4" />}
          onClick={load}
          loading={loading}
        >
          تحديث
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {mode === 'expiry' ? (
        <>
          <p className="text-xs text-gray-500">
            الأصناف اللي قاربت تنتهي — سيسترجعها قبل ما تبوظ (FEFO بيصرف الأقرب أولاً تلقائياً)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <ClickableStatCard
              label="منتهية الصلاحية"
              value={report?.counts.expired ?? 0}
              tone="text-red-400"
              icon={<AlertOctagon className="h-5 w-5" />}
              hint="اضغط للعرض"
              onClick={() => toggle('expired')}
            />
            <ClickableStatCard
              label="خلال ٣ شهور"
              value={report?.counts.within3 ?? 0}
              tone="text-amber-400"
              icon={<AlertTriangle className="h-5 w-5" />}
              hint="اضغط للعرض"
              onClick={() => toggle('within3')}
            />
            <ClickableStatCard
              label="خلال ٦ شهور"
              value={report?.counts.within6 ?? 0}
              tone="text-yellow-400"
              icon={<Clock className="h-5 w-5" />}
              hint="اضغط للعرض"
              onClick={() => toggle('within6')}
            />
            <ClickableStatCard
              label="إجمالي المنتبه له"
              value={report?.counts.total ?? 0}
              tone="text-white"
              icon={<Package className="h-5 w-5" />}
              hint="كل الشحنات المنبه لها"
            />
          </div>

          {bucket && (
            <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
              <span className="text-sm font-bold text-white">
                عرض {bucket === 'expired' ? 'المنتهية' : bucket === 'within3' ? 'خلال ٣ شهور' : 'خلال ٦ شهور'} (
                {rows.length})
              </span>
              <Button variant="ghost" size="sm" onClick={() => setBucket(null)}>
                ✕ إلغاء الفلتر
              </Button>
            </div>
          )}

          {bucket ? (
            <Table columns={columns} data={rows} loading={loading} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(
                [
                  ['expired', 'منتهية الصلاحية', 'text-red-400', report?.buckets.expired ?? []],
                  ['within3', 'خلال ٣ شهور', 'text-amber-400', report?.buckets.within3 ?? []],
                  ['within6', 'خلال ٦ شهور', 'text-yellow-400', report?.buckets.within6 ?? []]
                ] as const
              ).map(([id, title, tone, list]) => (
                <div key={id} className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-black ${tone}`}>{title}</span>
                    <Badge variant={list.length > 0 ? 'warning' : 'secondary'}>{list.length}</Badge>
                  </div>
                  {list.length === 0 ? (
                    <p className="text-xs text-gray-500">لا يوجد</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {list.map((b) => (
                        <div
                          key={b.id}
                          className="bg-military-900/50 border border-white/5 rounded-lg px-3 py-2 flex flex-col gap-1"
                        >
                          <span className="text-sm font-bold text-gray-200">{b.drug?.name || '—'}</span>
                          <span className="text-xs text-gray-400">
                            {b.expiryDate} · {b.remainingDisplay?.علبة || 0} علبة
                            {b.daysToExpiry < 0 && ' · منتهي'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            أصناف في المخزون مش بتتحرك — رجّعها للمورد أوخلصها في الكشوفات قبل ما تتبخّر
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <ClickableStatCard
              label="ما اتصرفش خالص"
              value={dead?.counts.neverDispensed ?? 0}
              tone="text-red-400"
              icon={<AlertOctagon className="h-5 w-5" />}
              hint="اضغط للعرض"
              onClick={() => toggleDead('never')}
            />
            <ClickableStatCard
              label="راكد (آخر صرف + ٩٠ يوم)"
              value={dead?.counts.stale ?? 0}
              tone="text-amber-400"
              icon={<Moon className="h-5 w-5" />}
              hint="اضغط للعرض"
              onClick={() => toggleDead('stale')}
            />
            <ClickableStatCard
              label="إجمالي الرواكد"
              value={dead?.counts.total ?? 0}
              tone="text-white"
              icon={<Package className="h-5 w-5" />}
              hint="كل الأصناف الخاملة"
            />
            <ClickableStatCard
              label="كمية راكدة"
              value={`${dead?.deadPills ?? 0} حبة`}
              tone="text-sky-400"
              icon={<Package className="h-5 w-5" />}
              hint="مجموع ما لم يُصرف منها"
            />
          </div>

          {dead && dead.moving > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{dead.moving} صنف بيتحرك عادي — مش في الرواكد</span>
            </div>
          )}

          {deadFilter && (
            <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
              <span className="text-sm font-bold text-white">
                عرض {deadFilter === 'never' ? 'ما اتصرفش خالص' : 'الراكد'} ({deadRows.length})
              </span>
              <Button variant="ghost" size="sm" onClick={() => setDeadFilter(null)}>
                ✕ إلغاء الفلتر
              </Button>
            </div>
          )}

          {dead && dead.items.length === 0 ? (
            <div className="glassmorphism p-8 rounded-xl text-center text-gray-400 text-sm">
              🎉 مفيش أصناف راكدة — كل المخزون بيتحرك
            </div>
          ) : (
            <Table
              columns={deadColumns}
              data={deadFilter ? deadRows : (dead?.items ?? [])}
              loading={loading}
              emptyText="مفيش أصناف راكدة — كل المخزون بيتحرك"
            />
          )}
        </>
      )}
    </div>
  )
}