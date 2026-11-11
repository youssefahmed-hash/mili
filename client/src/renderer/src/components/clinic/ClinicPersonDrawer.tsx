import React, { useState, useEffect, useCallback } from 'react'
import { Drawer } from '../ui/Drawer'
import { Table, Column } from '../ui/Table'
import { Badge } from '../ui/Badge'
import { getClinicByPersonnel } from '../../api/clinic.api'
import { getPharmacyDispenses } from '../../api/pharmacy.api'
import type { PharmacyDispenseItem } from '../../types/personnel'
import { formatDateAr } from '../../utils/vacationDates'
import { displayRank } from '../../utils/rankDisplay'
import type { ClinicRecord } from '../../types/personnel'

interface ClinicPersonDrawerProps {
  isOpen: boolean
  onClose: () => void
  personnelId: string | null
}

/** سجل عيادة Military — ملخص + كل الكشوفات */
export const ClinicPersonDrawer: React.FC<ClinicPersonDrawerProps> = ({
  isOpen,
  onClose,
  personnelId
}) => {
  const [records, setRecords] = useState<ClinicRecord[]>([])
  const [loading, setLoading] = useState(false)
  // الأدوية المصروفة لكل كشف
  const [dispensedByRecord, setDispensedByRecord] = useState<
    Record<string, PharmacyDispenseItem[]>
  >({})

  const load = useCallback(async () => {
    if (!personnelId) {
      setRecords([])
      setDispensedByRecord({})
      return
    }
    setLoading(true)
    try {
      const [res, disp] = await Promise.all([
        getClinicByPersonnel(personnelId),
        getPharmacyDispenses({ personnelId })
      ])
      const list = (res.success ? res.data || [] : []).sort((a, b) =>
        String(b.examinationDate || b.createdAt).localeCompare(
          String(a.examinationDate || a.createdAt)
        )
      )
      setRecords(list)

      // الأدوية المصروفة لكل كشف
      const map: Record<string, PharmacyDispenseItem[]> = {}
      if (disp.success) {
        for (const d of disp.data) {
          if (!d.clinicRecordId) continue
          map[d.clinicRecordId] = [...(map[d.clinicRecordId] || []), ...d.items]
        }
      }
      setDispensedByRecord(map)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [personnelId])

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load()
    }
  }, [isOpen, load])

  const person = records[0]?.personnel
  const total = records.length
  const outsideCount = records.filter((r) => r.locationType === 'خارج الوحدة').length
  const lastDate = records[0]?.examinationDate
  const unfitCount = records.filter((r) => r.medicalStatus && r.medicalStatus !== 'لائق').length

  const stat = (label: string, value: React.ReactNode, tone: string) => (
    <div className="glassmorphism p-4 rounded-xl text-center flex flex-col items-center gap-1">
      <div className={`text-2xl font-black ${tone}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )

  const columns: Column<ClinicRecord>[] = [
    {
      key: 'examinationDate',
      label: 'تاريخ الكشف',
      render: (r) => <span className="text-gray-200">{formatDateAr(r.examinationDate)}</span>
    },
    {
      key: 'locationType',
      label: 'النوع',
      render: (r) => {
        const isOut = r.locationType === 'خارج الوحدة'
        return <Badge variant={isOut ? 'warning' : 'success'}>{r.locationType || 'داخل الوحدة'}</Badge>
      }
    },
    {
      key: 'specialty',
      label: 'التخصص',
      render: (r) => r.specialty || '—'
    },
    {
      key: 'diagnosis',
      label: 'التشخيص',
      render: (r) => r.diagnosis || '—'
    },
    {
      key: 'treatment',
      label: 'الأدوية المصروفة / التوصيات',
      render: (r) => {
        const items = dispensedByRecord[r.id]
        if (items?.length) {
          return (
            <div className="flex flex-col gap-0.5">
              {items.map((d, i) => (
                <span key={i} className="text-emerald-300 font-semibold text-xs">
                  {d.drug?.name || '—'} {d.qty} {d.unit}
                </span>
              ))}
            </div>
          )
        }
        return r.treatment ? (
          <span className="text-gray-300">{r.treatment}</span>
        ) : (
          '—'
        )
      }
    },
    {
      key: 'medicalStatus',
      label: 'الحالة الطبية',
      render: (r) => (
        <Badge variant={r.medicalStatus === 'لائق' ? 'success' : 'danger'}>
          {r.medicalStatus || 'لائق'}
        </Badge>
      )
    },
    {
      key: 'locationAddress',
      label: 'المكان',
      render: (r) => r.locationAddress || '—'
    },
    { key: 'notes', label: 'ملاحظات', render: (r) => r.notes || '—' }
  ]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={person ? `سجل عيادة: ${person.fullName}` : 'سجل العيادة'}
      size="full"
    >
      <div className="flex flex-col gap-6 text-start">
        {/* هوية الفرد */}
        {person && (
          <div className="glassmorphism p-4 rounded-xl flex flex-col gap-1">
            <span className="text-lg font-black text-white">{person.fullName}</span>
            <span className="text-xs text-gray-400">
              {displayRank(person.rank, person.personnelType) || person.rank} / {person.militaryId}
              {person.category ? ` / ${person.category === 'officer' ? 'ضابط' : person.category === 'non_commissioned_officer' ? 'صف ضابط' : 'جندي'}` : ''}
            </span>
          </div>
        )}

        {/* ملخص */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stat('عدد الكشوفات', total, 'text-white')}
          {stat('خارج الوحدة', outsideCount, 'text-amber-400')}
          {stat('آخر كشف', lastDate ? formatDateAr(lastDate) : '—', 'text-sky-400')}
          {stat('حالات غير لائقة', unfitCount, 'text-red-400')}
        </div>

        {/* كل الكشوفات */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold text-white">كل الكشوفات ({total})</h4>
          <Table columns={columns} data={records} loading={loading} />
        </div>
      </div>
    </Drawer>
  )
}