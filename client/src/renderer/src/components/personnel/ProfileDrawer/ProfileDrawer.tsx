import React, { useEffect, useState } from 'react'
import { usePersonnelStore } from '../../../store/personnelStore'
import { useAuthStore } from '../../../store/authStore'
import { canManage } from '../../../constants/permissions'
import { Drawer } from '../../ui/Drawer'
import { Tabs, TabItem } from '../../ui/Tabs'
import { User, FileText, Calendar, Phone, Briefcase, Award, ShieldAlert } from 'lucide-react'
import { BasicInfoTab } from './BasicInfoTab'
import { JobInfoTab } from './JobInfoTab'
import { ContactInfoTab } from './ContactInfoTab'
import { DocumentsTab } from './DocumentsTab'
import { VacationsTab } from './VacationsTab'
import { ServicesTab } from './ServicesTab'
import { RewardsTab } from './RewardsTab'
import { PenaltiesTab } from './PenaltiesTab'
import { resolveFileUrl, isPdf } from '../../../utils/fileUrl'
import { FileImage } from 'lucide-react'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  personnelId: string
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose, personnelId }) => {
  const { selectedPersonnel, fetchPersonnelDetail, loading } = usePersonnelStore()
  const user = useAuthStore((s) => s.user)
  const manage = canManage(user)
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
    { id: 'vacations', label: 'سجل الإجازات', icon: <Calendar className="h-4 w-4" /> },
    { id: 'services', label: 'سجل الخدمات', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'rewards', label: 'المكافآت', icon: <Award className="h-4 w-4" /> },
    { id: 'penalties', label: 'العقوبات', icon: <ShieldAlert className="h-4 w-4" /> }
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
      case 'vacations':
        return <VacationsTab data={selectedPersonnel} canManage={manage} />
      case 'services':
        return <ServicesTab data={selectedPersonnel} canManage={manage} />
      case 'rewards':
        return <RewardsTab data={selectedPersonnel} canManage={manage} />
      case 'penalties':
        return <PenaltiesTab data={selectedPersonnel} canManage={manage} />
      default:
        return <BasicInfoTab data={selectedPersonnel} />
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedPersonnel ? `ملف الفرد: ${selectedPersonnel.fullName}` : 'تحميل ملف الفرد...'}
      size="full"
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
                src={resolveFileUrl(selectedPersonnel.photo) || ''}
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
                   القسم: <strong className="text-gray-200">{selectedPersonnel.unit}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Attached documents: card / carnet / form (stored as Documents) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'personnelCard', label: 'صورة البطاقة' },
              { type: 'personnelCarnet', label: 'صورة الكارنيه' },
              { type: 'personnelForm', label: 'صورة النموذج' }
            ].map(({ type, label }) => {
              const doc = (selectedPersonnel.documents || []).find((d) => d.type === type)
              if (!doc) {
                return (
                  <div
                    key={type}
                    className="glassmorphism p-3 rounded-xl flex flex-col items-center gap-2"
                  >
                    <span className="text-xs font-semibold text-gray-300 text-center">{label}</span>
                    <div className="h-24 w-24 rounded-lg bg-military-900 border border-white/5 flex items-center justify-center text-gray-600">
                      <FileImage className="h-6 w-6" />
                    </div>
                  </div>
                )
              }
              const url = resolveFileUrl(doc.fileUrl) || ''
              const pdf = isPdf(doc.fileUrl)
              return (
                <div
                  key={type}
                  className="glassmorphism p-3 rounded-xl flex flex-col items-center gap-2"
                >
                  <span className="text-xs font-semibold text-gray-300 text-center">{label}</span>
                  {pdf ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs"
                    >
                      <FileText className="h-5 w-5" />
                      عرض ملف PDF
                    </a>
                  ) : (
                    <a href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={label}
                        className="h-24 w-24 object-cover rounded-lg border border-white/10 hover:border-blue-400/40 transition-colors"
                      />
                    </a>
                  )}
                </div>
              )
            })}
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
