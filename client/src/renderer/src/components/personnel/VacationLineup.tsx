import React, { useState, useEffect, useCallback } from 'react'
import { CalendarClock, ArrowDownToLine, ArrowUpFromLine, Sun, Printer } from 'lucide-react'
import { getVacationLineup } from '../../api/personnel.api'
import { useAppStore } from '../../store/appStore'
import type { VacationLineup as Lineup, VacationLineupPerson } from '../../types/personnel'
import { formatDateAr, todayYmd } from '../../utils/vacationDates'
import { displayRank } from '../../utils/rankDisplay'
import { matchesAnySearch } from '../../utils/arabicSearch'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { VacationPermitsModal } from './VacationPermitsModal'
import type { VacationPermitData } from './VacationPermitCard'

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—'
  return formatDateAr(dateStr)
}

const todayStr = (): string => todayYmd()

const personCard = (
  p: VacationLineupPerson,
  onPrint?: (p: VacationLineupPerson) => void
): React.ReactElement => (
  <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1">
    <div className="flex items-center justify-between gap-2">
      <span className="font-bold text-white">{p.fullName}</span>
      <div className="flex items-center gap-1.5">
        {onPrint && (
          <button
            type="button"
            title="طباعة تصريح هذا الفرد"
            onClick={(e) => {
              e.stopPropagation()
              onPrint(p)
            }}
            className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-white/10 rounded transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        )}
        {p.cycle === 'طارئ' ? (
          <Badge variant="secondary">🚨 طوارئ</Badge>
        ) : (
          <Badge variant={p.cycle === '14' ? 'accent' : 'secondary'}>دورة {p.cycle} يوم</Badge>
        )}
      </div>
    </div>
    <span className="text-xs text-gray-400">
      {p.grade || displayRank(p.rank, p.personnelType) || p.rank} / {p.militaryId}
    </span>
    <span className="text-xs text-gray-400">القسم: {p.unit || '—'}</span>
    <span className="text-xs text-gray-500">
      نزول: {formatDate(p.nextDescent)} — عودة: {formatDate(p.nextReturn)}
    </span>
  </div>
)

export const VacationLineup: React.FC = () => {
  const [date, setDate] = useState(todayStr())
  const [lineup, setLineup] = useState<Lineup | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPermitsModalOpen, setIsPermitsModalOpen] = useState(false)
  const [permitsToPrint, setPermitsToPrint] = useState<VacationPermitData[]>([])
  // null = كل القوائم | 'down' | 'up' | 'now' — بيتشغل من كروت الملخص
  const [lineupView, setLineupView] = useState<'down' | 'up' | 'now' | null>(null)

  const fetchLineup = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getVacationLineup(date)
      if (res.success) {
        setLineup(res.data)
      } else {
        setError(res.message || 'فشل تحميل طابور الإجازات')
      }
    } catch {
      setError('فشل تحميل طابور الإجازات')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLineup()
  }, [fetchLineup])

  const isToday = date === todayStr()

  const { searchQuery } = useAppStore()
  const matchP = (p: VacationLineupPerson): boolean =>
    matchesAnySearch([p.fullName, p.militaryId], searchQuery)

  const goingDown = lineup ? lineup.goingDown.filter(matchP) : []
  const comingUp = lineup ? lineup.comingUp.filter(matchP) : []
  const onVacation = lineup ? lineup.onVacation.filter(matchP) : []

  const handleOpenPermits = (people: VacationLineupPerson[]): void => {
    const mapped: VacationPermitData[] = people.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      rank: p.rank,
      grade: p.grade,
      militaryId: p.militaryId,
      startDate: p.nextDescent,
      returnDate: p.nextReturn,
      personnelType: p.personnelType
    }))
    setPermitsToPrint(mapped)
    setIsPermitsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">طابور الإجازات</h2>
          <p className="text-sm text-gray-400">
            حساب تلقائي لدور النزول والعودة بناءً على دورة كل فرد (14 أو 28 يوم) وإجازة كل دورة 14
            يوم.
          </p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <Button
            variant="primary"
            startIcon={<Printer className="h-4 w-4" />}
            onClick={() => handleOpenPermits(goingDown)}
            title="طباعة تصاريح الإجازة للنازلين في هذا التاريخ (15 تصريح في الورقة A4)"
          >
            طباعة تصاريح النازلين ({goingDown.length})
          </Button>
          <Input
            label={isToday ? 'تاريخ اليوم' : 'تاريخ المشاهدة'}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {!isToday && (
            <Button variant="secondary" onClick={() => setDate(todayStr())}>
              اليوم
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      {lineup && (
        <div className="flex flex-col gap-4">
          {/* كروت الملخص — كل كارت يعرض قائمته بس */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                {
                  key: 'down',
                  label: `النازل ${isToday ? 'اليوم' : ''}`,
                  count: goingDown.length,
                  tone: 'text-emerald-400',
                  icon: <ArrowDownToLine className="h-5 w-5" />
                },
                {
                  key: 'up',
                  label: `الطالع ${isToday ? 'اليوم' : ''}`,
                  count: comingUp.length,
                  tone: 'text-amber-400',
                  icon: <ArrowUpFromLine className="h-5 w-5" />
                },
                {
                  key: 'now',
                  label: 'في إجازة حالياً',
                  count: onVacation.length,
                  tone: 'text-sky-400',
                  icon: <Sun className="h-5 w-5" />
                }
              ] as const
            ).map((c) => {
              const active = lineupView === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setLineupView(active ? null : c.key)}
                  title={active ? 'عرض القوائم كلها' : `عرض ${c.label}`}
                  className={`glassmorphism p-4 rounded-xl flex items-center justify-between gap-3 text-start w-full transition-all cursor-pointer ${
                    active
                      ? 'border-military-accent bg-military-primary/10'
                      : 'hover:border-military-accent/50 hover:bg-military-primary/5'
                  }`}
                >
                  <span className={`text-sm font-bold ${c.tone}`}>{c.label}</span>
                  <span className={`text-2xl font-black ${c.tone}`}>{c.count}</span>
                </button>
              )
            })}
          </div>

          {lineupView && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setLineupView(null)}>
                ✕ عرض كل القوائم
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(lineupView === null || lineupView === 'down') && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-400">
                <ArrowDownToLine className="h-5 w-5" /> النازل {isToday ? 'اليوم' : ''} (
                {goingDown.length})
              </h3>
              {goingDown.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs px-2 py-1 h-auto"
                  startIcon={<Printer className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenPermits(goingDown)}
                >
                  طباعة التصاريح
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {goingDown.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد أفراد نازلين في هذا التاريخ.</p>
              ) : (
                goingDown.map((p) => (
                  <div key={p.id}>{personCard(p, () => handleOpenPermits([p]))}</div>
                ))
              )}
            </div>
          </section>
            )}

            {(lineupView === null || lineupView === 'up') && (
          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-amber-400 border-b border-white/5 pb-2">
              <ArrowUpFromLine className="h-5 w-5" /> الطالع {isToday ? 'اليوم' : ''} (
              {comingUp.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {comingUp.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد أفراد طالعين في هذا التاريخ.</p>
              ) : (
                comingUp.map((p) => <div key={p.id}>{personCard(p)}</div>)
              )}
            </div>
          </section>
            )}

            {(lineupView === null || lineupView === 'now') && (
          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-sky-400 border-b border-white/5 pb-2">
              <Sun className="h-5 w-5" /> في إجازة حالياً ({onVacation.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {onVacation.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد أفراد في إجازة في هذا التاريخ.</p>
              ) : (
                onVacation.map((p) => <div key={p.id}>{personCard(p)}</div>)
              )}
            </div>
          </section>
            )}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">جاري التحميل...</p>}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <CalendarClock className="h-4 w-4" />
        تاريخ المعاينة: {formatDate(lineup?.date)}
      </div>

      {isPermitsModalOpen && (
        <VacationPermitsModal
          isOpen={isPermitsModalOpen}
          onClose={() => setIsPermitsModalOpen(false)}
          initialPersonnel={permitsToPrint}
          defaultDepartureDate={date}
        />
      )}
    </div>
  )
}
