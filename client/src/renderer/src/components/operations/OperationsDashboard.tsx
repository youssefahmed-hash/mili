import React, { useState, useEffect } from 'react'
import {
  Map,
  Calendar,
  FileText,
  Users
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Tabs } from '../ui/Tabs'
import { useLineStore } from '../../store/lineStore'
import { useAuthStore } from '../../store/authStore'
import { isLineOnlyUser, isManager } from '../../constants/permissions'
import { LineDailyDashboard } from './LineDailyDashboard'
import { LinePersonnelTab } from './LinePersonnelTab'
import { LinePointModal } from './LinePointModal'
import { LeaveCycleModal } from './LeaveCycleModal'
import { LineReportModal } from './LineReportModal'
import type { LinePoint } from '../../types/personnel'

// ==================== Operations Tabs (مبسط) ====================
const OPERATIONS_TABS = [
  { id: 'daily', label: 'الخط اليومي', icon: <Users className="h-4 w-4" /> },
  { id: 'line-personnel', label: 'أفراد الخط', icon: <Users className="h-4 w-4" /> },
  { id: 'points', label: 'إدارة النقاط', icon: <Map className="h-4 w-4" /> },
  { id: 'leave-cycle', label: 'دورة الإجازات', icon: <Calendar className="h-4 w-4" /> },
  { id: 'reports', label: 'التقارير', icon: <FileText className="h-4 w-4" /> }
]

// ==================== Points Management Tab ====================
const PointsManagementTab: React.FC = () => {
  const { points, fetchPoints, addPoint, editPoint, removePoint } = useLineStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<LinePoint | null>(null)

  useEffect(() => {
    fetchPoints()
  }, [fetchPoints])

  const handleEdit = (point: LinePoint) => {
    setEditingPoint(point)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingPoint(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: Partial<LinePoint>) => {
    if (editingPoint) {
      return await editPoint(editingPoint.id, data)
    }
    return await addPoint(data)
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه النقطة؟')) {
      await removePoint(id)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">إدارة نقاط الخط</h2>
          <p className="text-sm text-gray-400">إضافة وتعديل وحذف نقاط الخط</p>
        </div>
        <Button variant="accent" startIcon={<Map className="h-4 w-4" />} onClick={handleCreate}>
          إضافة نقطة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {points.map((point) => (
          <div key={point.id} className="glassmorphism p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-military-accent/20 flex items-center justify-center">
                  <span className="text-military-accent font-bold text-sm">{point.order}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{point.name}</h4>
              </div>
              <Badge variant={point.isActive ? 'success' : 'secondary'}>
                {point.isActive ? 'نشطة' : 'معطلة'}
              </Badge>
            </div>
            {point.description && (
              <p className="text-xs text-gray-400">{point.description}</p>
            )}
            <div className="flex gap-2 mt-auto">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(point)}>
                تعديل
              </Button>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(point.id)}>
                حذف
              </Button>
            </div>
          </div>
        ))}
      </div>

      <LinePointModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        point={editingPoint}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

// ==================== Main OperationsDashboard ====================
export const OperationsDashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  // قسم الشئون (شئون داخلية / شئون مجندين): شاشة واحدة فقط (أفراد الخط) للقراءة — مكان العسكري وتمامه
  const lineOnlyView = isLineOnlyUser(user) && !isManager(user)
  const [activeTab, setActiveTab] = useState('daily')
  const [isLeaveCycleModalOpen, setIsLeaveCycleModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    if (activeTab === 'leave-cycle') {
      setIsLeaveCycleModalOpen(true)
    }
    if (activeTab === 'reports') {
      setIsReportModalOpen(true)
    }
  }, [activeTab])

  const handleTabChange = (tabId: string) => {
    if (tabId === 'leave-cycle') {
      setIsLeaveCycleModalOpen(true)
      return
    }
    if (tabId === 'reports') {
      setIsReportModalOpen(true)
      return
    }
    setActiveTab(tabId)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'daily':
        return <LineDailyDashboard />
      case 'line-personnel':
        return <LinePersonnelTab />
      case 'points':
        return <PointsManagementTab />
      default:
        return <LineDailyDashboard />
    }
  }

  // شئون مجندين: مفيش تابات ولا تعديل — جدول أفراد الخط بس
  if (lineOnlyView) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <LinePersonnelTab readOnly />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <Tabs tabs={OPERATIONS_TABS} activeTab={activeTab} onChange={handleTabChange} />
      {renderContent()}

      <LeaveCycleModal
        isOpen={isLeaveCycleModalOpen}
        onClose={() => {
          setIsLeaveCycleModalOpen(false)
          setActiveTab('daily')
        }}
      />

      <LineReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false)
          setActiveTab('daily')
        }}
      />
    </div>
  )
}
