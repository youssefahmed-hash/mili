import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Scale, ShieldCheck, Star } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Table, Column } from '../ui/Table'
import { getPersonnelById, updatePersonnel } from '../../api/personnel.api'
import {
  getSecurityByPersonnel,
  createSecurityRecord,
  updateSecurityRecord,
  deleteSecurityRecord
} from '../../api/security.api'
import type { Personnel, SecurityRecord } from '../../types/personnel'

interface SecurityProfileProps {
  personnelId: string
  onClose: () => void
}

const SIT_TYPES = [
  { key: 'محاكمة', label: 'سجل المحاكمات', icon: Scale },
  { key: 'جزئات', label: 'سجل الجزئات', icon: ShieldCheck },
  { key: 'تقييم سلوك', label: 'سجل تقييم السلوك', icon: Star }
]

const maritalOptions = [
  { value: 'أعزب', label: 'أعزب' },
  { value: 'متزوج', label: 'متزوج' },
  { value: 'مطلق', label: 'مطلق' },
  { value: 'أرمل', label: 'أرمل' }
]
const healthOptions = [
  { value: 'حي', label: 'حي' },
  { value: 'متوفي', label: 'متوفي' }
]
const parentsLivingOptions = [
  { value: 'معاً', label: 'معاً (في سكن واحد)' },
  { value: 'منفصلين', label: 'منفصلين (سكن مختلف)' }
]

const todayStr = (): string => new Date().toISOString().slice(0, 10)

const SituationLog: React.FC<{
  personnelId: string
  type: string
  entries: SecurityRecord[]
  onChanged: () => void
}> = ({ personnelId, type, entries, onChanged }) => {
  const [date, setDate] = useState<string>(() => todayStr())
  const [details, setDetails] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = (): void => {
    setDate('')
    setDetails('')
    setNotes('')
    setEditingId(null)
  }

  const startEdit = (e: SecurityRecord): void => {
    setEditingId(e.id)
    setDate(e.situationDate || '')
    setDetails(e.details || '')
    setNotes(e.notes || '')
  }

  const handleSave = async (): Promise<void> => {
    if (!details.trim()) {
      setError('التفاصيل مطلوبة')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = { personnelId, type, situationDate: date || null, details, notes }
      if (editingId) {
        await updateSecurityRecord(editingId, payload)
      } else {
        await createSecurityRecord(payload)
      }
      reset()
      onChanged()
    } catch {
      setError('فشل حفظ الموقف الأمني')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذا الموقف؟')) return
    await deleteSecurityRecord(id)
    onChanged()
  }

  const columns: Column<SecurityRecord>[] = [
    {
      key: 'situationDate',
      label: 'التاريخ',
      render: (row) => <span className="text-gray-300">{row.situationDate || '—'}</span>
    },
    {
      key: 'details',
      label: 'التفاصيل',
      render: (row) => <span className="text-gray-200 text-start block">{row.details || '—'}</span>
    },
    {
      key: 'notes',
      label: 'ملاحظات',
      render: (row) => <span className="text-gray-400 text-start block">{row.notes || '—'}</span>
    },
    {
      key: 'actions',
      label: 'إجراءات',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
            تعديل
          </Button>
          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(row.id)}>
            حذف
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">{error}</div>}
      <div className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
        <h5 className="text-sm font-bold text-gray-200">{editingId ? 'تعديل موقف' : 'إضافة موقف جديد'}</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="التاريخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled />
          <div className="md:col-span-2 flex flex-col gap-1 text-start">
            <label className="text-sm font-semibold text-gray-300">التفاصيل</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              className="w-full bg-military-900 border border-white/10 hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg p-2.5 outline-none transition-colors"
              placeholder="تفاصيل الموقف الأمني"
            />
          </div>
          <div className="md:col-span-3 flex flex-col gap-1 text-start">
            <label className="text-sm font-semibold text-gray-300">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-military-900 border border-white/10 hover:border-white/20 focus:border-military-primary focus:ring-2 focus:ring-military-primary/20 text-gray-200 text-sm rounded-lg p-2.5 outline-none transition-colors"
              placeholder="ملاحظات إضافية"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {editingId ? 'حفظ التعديل' : 'إضافة'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={reset}>
              إلغاء
            </Button>
          )}
        </div>
      </div>

      <Table columns={columns} data={entries} loading={false} />
    </div>
  )
}

export const SecurityProfile: React.FC<SecurityProfileProps> = ({ personnelId, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('social')
  const [personnel, setPersonnel] = useState<Personnel | null>(null)
  const [situations, setSituations] = useState<SecurityRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // social fields state
  const [maritalStatus, setMaritalStatus] = useState('أعزب')
  const [familyMembersCount, setFamilyMembersCount] = useState('')
  const [parentsLivingSeparately, setParentsLivingSeparately] = useState('معاً')
  const [fatherHealthStatus, setFatherHealthStatus] = useState('حي')
  const [fatherWork, setFatherWork] = useState('')
  const [fatherPhone, setFatherPhone] = useState('')
  const [motherHealthStatus, setMotherHealthStatus] = useState('حي')
  const [motherWork, setMotherWork] = useState('')
  const [motherPhone, setMotherPhone] = useState('')
  const [workBeforeEnlistment, setWorkBeforeEnlistment] = useState('')

  const loadSituations = useCallback(async () => {
    try {
      const res = await getSecurityByPersonnel(personnelId)
      if (res.success) setSituations(res.data)
    } catch {
      /* ignore */
    }
  }, [personnelId])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true)
    getPersonnelById(personnelId)
      .then((res) => {
        if (res.success) {
          const p = res.data
          setPersonnel(p)
          setMaritalStatus(p.maritalStatus || 'أعزب')
          setFamilyMembersCount(p.familyMembersCount || '')
          setParentsLivingSeparately(p.parentsLivingSeparately || 'معاً')
          setFatherHealthStatus(p.fatherHealthStatus || 'حي')
          setFatherWork(p.fatherWork || '')
          setFatherPhone(p.fatherPhone || '')
          setMotherHealthStatus(p.motherHealthStatus || 'حي')
          setMotherWork(p.motherWork || '')
          setMotherPhone(p.motherPhone || '')
          setWorkBeforeEnlistment(p.workBeforeEnlistment || '')
        }
      })
      .finally(() => setLoading(false))
    loadSituations()
  }, [personnelId, loadSituations])

  const handleSaveSocial = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('maritalStatus', maritalStatus)
      if (familyMembersCount) fd.append('familyMembersCount', familyMembersCount)
      fd.append('parentsLivingSeparately', parentsLivingSeparately)
      fd.append('fatherHealthStatus', fatherHealthStatus)
      fd.append('fatherWork', fatherWork)
      fd.append('fatherPhone', fatherPhone)
      fd.append('motherHealthStatus', motherHealthStatus)
      fd.append('motherWork', motherWork)
      fd.append('motherPhone', motherPhone)
      fd.append('workBeforeEnlistment', workBeforeEnlistment)
      const res = await updatePersonnel(personnelId, fd)
      if (!res.success) setError(res.message || 'فشل حفظ البيانات الاجتماعية')
    } catch {
      setError('فشل حفظ البيانات الاجتماعية')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { key: 'social', label: 'الحالة الاجتماعية', icon: FileText },
    ...SIT_TYPES
  ]

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`الملف الأمني — ${personnel?.fullName || ''}`}
      size="2xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">{error}</div>}

        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === t.key
                    ? 'bg-military-primary/20 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {loading && <div className="text-gray-400 text-sm">جارٍ التحميل...</div>}

        {!loading && activeTab === 'social' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="الحالة الاجتماعية" options={maritalOptions} value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} />
              <Input label="عدد أفراد الأسرة" type="number" min={0} value={familyMembersCount} onChange={(e) => setFamilyMembersCount(e.target.value)} />
              <Select label="سكن الوالد والوالدة" options={parentsLivingOptions} value={parentsLivingSeparately} onChange={(e) => setParentsLivingSeparately(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="الحالة الصحية للوالد" options={healthOptions} value={fatherHealthStatus} onChange={(e) => setFatherHealthStatus(e.target.value)} />
              <Input label="عمل الوالد" value={fatherWork} onChange={(e) => setFatherWork(e.target.value)} disabled={fatherHealthStatus === 'متوفي'} />
              <Input label="هاتف الوالد" value={fatherPhone} onChange={(e) => setFatherPhone(e.target.value)} disabled={fatherHealthStatus === 'متوفي'} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="الحالة الصحية للوالدة" options={healthOptions} value={motherHealthStatus} onChange={(e) => setMotherHealthStatus(e.target.value)} />
              <Input label="عمل الوالدة" value={motherWork} onChange={(e) => setMotherWork(e.target.value)} disabled={motherHealthStatus === 'متوفي'} />
              <Input label="هاتف الوالدة" value={motherPhone} onChange={(e) => setMotherPhone(e.target.value)} disabled={motherHealthStatus === 'متوفي'} />
            </div>
            <Input label="العمل قبل التجنيد" value={workBeforeEnlistment} onChange={(e) => setWorkBeforeEnlistment(e.target.value)} />
            <div className="flex justify-end">
              <Button variant="accent" onClick={handleSaveSocial} loading={saving}>
                حفظ البيانات الاجتماعية
              </Button>
            </div>
          </div>
        )}

        {!loading &&
          SIT_TYPES.map((t) => (
            <div key={t.key} style={{ display: activeTab === t.key ? 'block' : 'none' }}>
              <SituationLog
                personnelId={personnelId}
                type={t.key}
                entries={situations.filter((s) => s.type === t.key)}
                onChanged={loadSituations}
              />
            </div>
          ))}
      </div>
    </Modal>
  )
}
