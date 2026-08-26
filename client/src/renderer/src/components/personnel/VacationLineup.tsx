import React, { useState, useEffect, useCallback } from 'react'
import { CalendarClock, ArrowDownToLine, ArrowUpFromLine, Sun } from 'lucide-react'
import { getVacationLineup } from '../../api/personnel.api'
import type { VacationLineup as Lineup, VacationLineupPerson } from '../../types/personnel'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ar-EG')
}

const todayStr = (): string => new Date().toISOString().slice(0, 10)

const personCard = (p: VacationLineupPerson): React.ReactElement => (
  <div className="bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1">
    <div className="flex items-center justify-between gap-2">
      <span className="font-bold text-white">{p.fullName}</span>
      <Badge variant={p.cycle === '14' ? 'accent' : 'secondary'}>دورة {p.cycle} يوم</Badge>
    </div>
    <span className="text-xs text-gray-400">
      {p.rank} / {p.militaryId}
    </span>
    <span className="text-xs text-gray-400">الوحدة: {p.unit || '—'}</span>
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
        <div className="flex items-end gap-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-400 border-b border-white/5 pb-2">
              <ArrowDownToLine className="h-5 w-5" /> النازل {isToday ? 'اليوم' : ''} (
              {lineup.goingDown.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {lineup.goingDown.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد أفراد نازلين في هذا التاريخ.</p>
              ) : (
                lineup.goingDown.map((p) => <div key={p.id}>{personCard(p)}</div>)
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-amber-400 border-b border-white/5 pb-2">
              <ArrowUpFromLine className="h-5 w-5" /> الطالع {isToday ? 'اليوم' : ''} (
              {lineup.comingUp.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {lineup.comingUp.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد أفراد طالعين في هذا التاريخ.</p>
              ) : (
                lineup.comingUp.map((p) => <div key={p.id}>{personCard(p)}</div>)
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-sky-400 border-b border-white/5 pb-2">
              <Sun className="h-5 w-5" /> في إجازة حالياً ({lineup.onVacation.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {lineup.onVacation.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد أفراد في إجازة في هذا التاريخ.</p>
              ) : (
                lineup.onVacation.map((p) => <div key={p.id}>{personCard(p)}</div>)
              )}
            </div>
          </section>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">جاري التحميل...</p>}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <CalendarClock className="h-4 w-4" />
        تاريخ المعاينة: {formatDate(lineup?.date)}
      </div>
    </div>
  )
}
