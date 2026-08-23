import React, { useEffect, useState } from 'react'
import { usePersonnelStore } from '../../../store/personnelStore'
import { Drawer } from '../../ui/Drawer'
import { Tabs, TabItem } from '../../ui/Tabs'
import { User, FileText, Calendar, CheckSquare, Phone, Briefcase } from 'lucide-react'
import { BasicInfoTab } from './BasicInfoTab'
import { JobInfoTab } from './JobInfoTab'
import { ContactInfoTab } from './ContactInfoTab'
import { DocumentsTab } from './DocumentsTab'
import { FormsTab } from './FormsTab'
import { VacationsTab } from './VacationsTab'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  personnelId: string
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose, personnelId }) => {
  const { selectedPersonnel, fetchPersonnelDetail, loading } = usePersonnelStore()
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    if (isOpen && personnelId) {
      fetchPersonnelDetail(personnelId)
    }
  }, [isOpen, personnelId, fetchPersonnelDetail])

  const profileTabs: TabItem[] = [
    { id: 'basic', label: 'البيانات الأساسية', icon: <User className="h-4 w-4" /> },
    { id: 'job', label: 'البيانات الوظيفية', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'contact', label: 'بيانات التواصل', icon: <Phone className="h-4 w-4" /> },
    { id: 'documents', label: 'المستندات', icon: <FileText className="h-4 w-4" /> },
    { id: 'forms', label: 'النماذج', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'vacations', label: 'سجل الإجازات', icon: <Calendar className="h-4 w-4" /> }
  ]

  const renderTabContent = (): React.ReactNode => {
    if (!selectedPersonnel) return null
    switch (activeTab) {
      case 'basic':
        return <BasicInfoTab data={selectedPersonnel} />
      case 'job':
        return <JobInfoTab data={selectedPersonnel} />
      case 'contact':
        return <ContactInfoTab data={selectedPersonnel} />
      case 'documents':
        return <DocumentsTab data={selectedPersonnel} />
      case 'forms':
        return <FormsTab data={selectedPersonnel} />
      case 'vacations':
        return <VacationsTab data={selectedPersonnel} />
      default:
        return <BasicInfoTab data={selectedPersonnel} />
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedPersonnel ? `ملف الفرد: ${selectedPersonnel.fullName}` : 'تحميل ملف الفرد...'}
      size="xl"
    >
      {loading && !selectedPersonnel ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <svg
            className="animate-spin h-8 w-8 text-military-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-gray-400">جاري تحميل الملف العسكري...</span>
        </div>
      ) : selectedPersonnel ? (
        <div className="flex flex-col gap-6 h-full">
          {/* Brief Profile Card at the top */}
          <div className="glassmorphism p-4 rounded-xl flex items-center gap-4">
            {selectedPersonnel.photo ? (
              <img
                src={`http://localhost:5000${selectedPersonnel.photo}`}
                alt={selectedPersonnel.fullName}
                className="h-16 w-16 rounded-xl object-cover border border-white/10 shadow"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-military-900 border border-white/5 flex items-center justify-center text-gray-400 text-xl font-bold">
                {selectedPersonnel.fullName.charAt(0)}
              </div>
            )}
            <div className="flex flex-col text-start gap-1">
              <h4 className="text-lg font-black text-white">{selectedPersonnel.fullName}</h4>
              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span>
                  الرتبة: <strong className="text-military-accent">{selectedPersonnel.rank}</strong>
                </span>
                <span>•</span>
                <span>
                  الرقم العسكري:{' '}
                  <strong className="text-gray-200">{selectedPersonnel.militaryId}</strong>
                </span>
                <span>•</span>
                <span>
                  الوحدة: <strong className="text-gray-200">{selectedPersonnel.unit}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Sub tabs switcher */}
          <Tabs tabs={profileTabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* Render Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto mt-2">{renderTabContent()}</div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">فشل تحميل تفاصيل الفرد العسكري.</div>
      )}
    </Drawer>
  )
}
