import React, { useEffect, useState, useRef } from 'react'
import { usePersonnelStore, Drilldown } from '../../store/personnelStore'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { PersonnelToolbar } from './PersonnelToolbar'
import { PersonnelTable } from './PersonnelTable'
import { PersonnelFormModal } from './PersonnelFormModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { ProfileDrawer } from './ProfileDrawer/ProfileDrawer'
import { VacationLineup } from './VacationLineup'
import { ServicesLineup } from './ServicesLineup'
import { RecruitDistributionTab } from './RecruitDistributionTab'
import { BulkVacationModal } from './BulkVacationModal'
import { getPersonnelStats } from '../../api/personnel.api'
import { Tabs } from '../ui/Tabs'
import { Button } from '../ui/Button'
import { CATEGORY_TABS, TAB_RANK_MAP, RankCategory } from '../../constants/categories'
import { CONDITION_OPTIONS } from '../../constants/personnelFields'
import {
  visibleCategories,
  canManage,
  visiblePersonnelTypes,
  isSuperAdmin
} from '../../constants/permissions'
import type { Personnel } from '../../types/personnel'

export const PersonnelModule: React.FC = () => {
  const { searchQuery } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const {
    personnelList,
    fetchPersonnelList,
    pagination,
    loading,
    filters,
    setFilters,
    setSelectedPersonnel,
    drilldown,
    clearDrilldown
  } = usePersonnelStore()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('soldier')
  const [section, setSection] = useState<'list' | 'vacations' | 'services' | 'recruits'>(
    'list'
  )

  const [formMode, setFormMode] = useState<'create' | 'edit' | 'complete'>('create')
  const [editTarget, setEditTarget] = useState<Personnel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Personnel | null>(null)
  const [viewTargetId, setViewTargetId] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    total: number
    byStatus: Record<string, number>
    conditions?: {
      weaponBan: number
      neuro: number
      struckDischarged: number
      struckRetained: number
      total: number
    }
  } | null>(null)

  useEffect(() => {
    setFilters({ ranks: TAB_RANK_MAP[activeTab].join(',') })
  }, [activeTab, setFilters])

  // تقييد قائمة الأفراد حسب نوع التبعية: الأفراد (حربية + تشغيل)، الشئون (داخلية فقط)؛ الأدمن يشوف الكل
  const allowedTypes = visiblePersonnelTypes(user)
  useEffect(() => {
    if (!drilldown) setFilters({ personnelType: allowedTypes.join(',') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userType, setFilters, drilldown])

  // فلتر مسبق من الداشبورد (drilldown): يُطبق مرة واحدة عند الوصول من خانة
  const appliedRef = useRef<Drilldown | null>(null)
  useEffect(() => {
    if (drilldown && appliedRef.current !== drilldown) {
      appliedRef.current = drilldown
      setSection('list')
      setFilters({
        personnelType: drilldown.personnelType,
        ranks: '',
        status: drilldown.status ?? (drilldown.mode === 'present' ? 'داخل القطاع' : ''),
        statusNe: !drilldown.status && drilldown.mode === 'out' ? 'داخل القطاع' : '',
        condition: drilldown.condition ?? ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldown])

  // تنظيف كامل عند مغادرة التبويب — فلتر قديم لا يلتصق بزيارة يدوية لاحقة
  useEffect(() => {
    return () => {
      const st = usePersonnelStore.getState()
      st.clearDrilldown()
      st.setFilters({ ranks: '', status: '', statusNe: '', personnelType: '', condition: '' })
    }
  }, [])

  useEffect(() => {
    fetchPersonnelList(searchQuery, 1)
  }, [searchQuery, filters, fetchPersonnelList])

  // إحصاءات القائمة بنفس الفلاتر (للكروت): الإجمالي + العدد لكل حالة
  useEffect(() => {
    getPersonnelStats({ search: searchQuery, page: 1, limit: 1, includeRecruits: 'true', ...filters })
      .then((res) => {
        if (res.success) setStats(res.data)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters])

  const handlePageChange = (page: number): void => {
    fetchPersonnelList(searchQuery, page)
  }

  const handleAddClick = (): void => {
    setFormMode('create')
    setEditTarget(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (personnel: Personnel): void => {
    setFormMode('edit')
    setEditTarget(personnel)
    setIsFormOpen(true)
  }

  const handleCompleteClick = (personnel: Personnel): void => {
    setFormMode('complete')
    setEditTarget(personnel)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (personnel: Personnel): void => {
    setDeleteTarget(personnel)
    setIsDeleteOpen(true)
  }

  const handleViewClick = (personnel: Personnel): void => {
    setViewTargetId(personnel.id)
    setSelectedPersonnel(personnel)
    setIsDrawerOpen(true)
  }

  // تصفية تبويبات الفئات حسب صلاحية رؤية الرتب للمستخدم (جندي←جنود فقط، صف ضابط←+صف ضباط، ضابط←الكل)
  // للمشاهد الداخلية: تبويب صف الضابط يظهر باسم أمين شرطة (عرض فقط)
  const allowedCats = visibleCategories(user) as RankCategory[]
  const visibleTabs = CATEGORY_TABS.filter((t) => allowedCats.includes(t.id as RankCategory)).map(
    (t) =>
      t.id === 'non_commissioned_officer' && user?.userType === 'داخلية'
        ? { ...t, label: 'أمين شرطة' }
        : t
  )
  const manage = canManage(user)
  const superAdmin = isSuperAdmin(user)

  // تابات القسم — «توزيع مستجدين» لمدير النظام فقط
  const sectionTabs = [
    { id: 'list', label: 'القائمة' },
    { id: 'vacations', label: 'طابور الإجازات' },
    { id: 'services', label: 'طابور الخدمات' },
    ...(superAdmin ? [{ id: 'recruits', label: 'توزيع مستجدين' }] : [])
  ]

  const drilldownModeLabel: Record<string, string> = {
    total: 'القوة الكاملة',
    out: 'خارج',
    present: 'موجود'
  }

  const handleClearDrilldown = (): void => {
    clearDrilldown()
    appliedRef.current = null
    setFilters({
      ranks: TAB_RANK_MAP[activeTab].join(','),
      personnelType: allowedTypes.join(','),
      status: '',
      statusNe: ''
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header Area */}
      <div className="flex flex-col text-start">
        <h2 className="text-2xl font-black text-white">
          {user?.userType === 'داخلية'
            ? 'إدارة شؤون المجندين'
            : 'إدارة شؤون ضباط وأفراد القوات المسلحة'}
        </h2>
        <p className="text-sm text-gray-400">
          إضافة وتعديل بيانات الأفراد العسكريين، ومتابعة سجلات إجازاتهم، مستنداتهم ونماذج شؤون
          الأفراد الخاصة بهم.
        </p>
      </div>

      {/* Section Tabs: القائمة | طابور الإجازات | طابور الخدمات | توزيع مستجدين (أدمن) */}
      <Tabs
        tabs={sectionTabs}
        activeTab={section}
        onChange={(id) => setSection(id as 'list' | 'vacations' | 'services' | 'recruits')}
      />

      {section === 'vacations' ? (
        <VacationLineup />
      ) : section === 'services' ? (
        <ServicesLineup />
      ) : section === 'recruits' ? (
        <RecruitDistributionTab
          onDistributed={() => fetchPersonnelList(searchQuery, 1)}
        />
      ) : (
        <>
      {/* Category Tabs (تُخفى أثناء العرض المفلتر من الداشبورد) */}
      {drilldown ? (
        <div className="flex items-center justify-between glassmorphism px-4 py-3 rounded-xl">
          <span className="text-sm font-bold text-white">
            عرض مفلتر: {drilldownModeLabel[drilldown.mode] || drilldown.mode}
            {' — '}
            {drilldown.personnelType || 'كل الأنواع'}
          </span>
          <Button variant="ghost" size="sm" onClick={handleClearDrilldown}>
            ✕ إلغاء الفلتر
          </Button>
        </div>
      ) : (
        <Tabs tabs={visibleTabs} activeTab={activeTab} onChange={setActiveTab} />
      )}

      {/* Toolbar Filters + Add button */}
      <PersonnelToolbar onAddClick={handleAddClick} onBulkClick={() => setIsBulkOpen(true)} />

      {/* كروت حالات القائمة (من نفس الفلاتر) — كل كارت يعمل فلتر */}
      {stats && (() => {
        const present = stats.byStatus['داخل القطاع'] || 0
        const out = stats.total - present
        const outEntries = Object.entries(stats.byStatus).filter(([s]) => s !== 'داخل القطاع')
        const curStatus = filters.status || ''
        const curStatusNe = filters.statusNe || ''
        const curCondition = filters.condition || ''
        const conds = stats.conditions
        const card = (
          label: string,
          value: number,
          tone: string,
          onClick: (() => void) | undefined,
          hint: string,
          activeOverride?: boolean
        ) => {
          const active = activeOverride ?? onClick === undefined
          return (
            <button
              key={label}
              type="button"
              onClick={onClick}
              title={hint}
              className={`glassmorphism p-3 rounded-xl text-center transition-all cursor-pointer ${
                active ? 'border-military-accent bg-military-primary/10' : 'hover:bg-military-primary/5 hover:border-military-accent/50'
              }`}
            >
              <div className={`text-2xl font-black ${tone}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </button>
          )
        }
        return (
          <div className="glassmorphism p-4 rounded-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
              {/* إجمالي */}
              <div className="flex flex-col gap-2">
                {card(
                  'إجمالي',
                  stats.total,
                  'text-white',
                  (curStatus || curStatusNe || curCondition)
                    ? () => setFilters({ status: '', statusNe: '', condition: '' })
                    : undefined,
                  'عرض الكل'
                )}
              </div>

              {/* خارج + حالات الخروج تحته مباشرة */}
              <div className="flex flex-col gap-2">
                {card(
                  'خارج',
                  out,
                  'text-red-400',
                  curStatusNe === 'داخل القطاع'
                    ? undefined
                    : () => setFilters({ status: '', statusNe: 'داخل القطاع', condition: '' }),
                  'عرض الخارج من القطاع'
                )}
                {outEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {outEntries.map(([s, c]) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setFilters({
                            status: filters.status === s ? '' : s,
                            statusNe: '',
                            condition: ''
                          })
                        }
                        title={`عرض ${s}`}
                        className={`text-[11px] px-1.5 py-1 rounded transition-all cursor-pointer ${
                          filters.status === s
                            ? 'bg-military-accent text-white'
                            : 'bg-military-900/50 hover:bg-military-900 text-gray-300'
                        }`}
                      >
                        {s}: {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* موجود */}
              <div className="flex flex-col gap-2">
                {card(
                  'موجود',
                  present,
                  'text-emerald-400',
                  curStatus === 'داخل القطاع'
                    ? undefined
                    : () => setFilters({ status: 'داخل القطاع', statusNe: '', condition: '' }),
                  'عرض الموجودين'
                )}
              </div>

              {/* المؤثرات على القوة + تقسيمة المؤثرات تحته مباشرة */}
              <div className="flex flex-col gap-2">
                {card(
                  'المؤثرات على القوة',
                  conds?.total || 0,
                  'text-orange-400',
                  () => setFilters({ condition: curCondition === 'anyEffect' ? '' : 'anyEffect' }),
                  'عرض أصحاب المؤثرات فقط',
                  curCondition === 'anyEffect'
                )}
                {conds && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {CONDITION_OPTIONS.map((opt) => {
                      const count = conds[opt.value as keyof typeof conds] ?? 0
                      const active = curCondition === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFilters({ condition: active ? '' : opt.value })}
                          title={`عرض ${opt.label}`}
                          className={`text-[11px] px-1.5 py-1 rounded transition-all cursor-pointer ${
                            active
                              ? 'bg-orange-500 text-white'
                              : 'bg-military-900/50 hover:bg-military-900 text-orange-300'
                          }`}
                        >
                          {opt.label}: {count}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Personnel Listing Table */}
      <PersonnelTable
        loading={loading}
        data={personnelList}
        pagination={pagination}
        onPageChange={handlePageChange}
        onViewClick={handleViewClick}
        onEditClick={handleEditClick}
        onCompleteClick={handleCompleteClick}
        onDeleteClick={handleDeleteClick}
        canManage={manage}
      />
        </>
      )}

      {/* Form Modal (Create / Edit / Complete) */}
      {isFormOpen && (
        <PersonnelFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          target={editTarget}
          mode={formMode}
        />
      )}

      {/* Bulk Vacation Registration Modal */}
      {isBulkOpen && (
        <BulkVacationModal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          categories={visibleCategories(user)}
          onCreated={() => {
            setIsBulkOpen(false)
            fetchPersonnelList(searchQuery, 1)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          target={deleteTarget}
        />
      )}

      {/* Side Drawer for Personnel Profile Detail view */}
      {isDrawerOpen && viewTargetId && (
        <ProfileDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setViewTargetId(null)
          }}
          personnelId={viewTargetId}
        />
      )}
    </div>
  )
}
