import React from 'react'

interface ContactInfoTabProps {
  data: {
    phone?: string | null
    email?: string | null
    address?: string | null
    education?: string | null
    emergencyContact?: string | null
    emergencyPhone?: string | null
  }
}

export const ContactInfoTab: React.FC<ContactInfoTabProps> = ({ data }) => {
  const contactItems = [
    { label: 'رقم الهاتف الشخصي', value: data.phone || 'غير مسجل' },
    { label: 'البريد الإلكتروني المعتمد', value: data.email || 'غير مسجل' },
    { label: 'العنوان بالتفصيل', value: data.address || 'غير مسجل', fullWidth: true },
    { label: 'المستوى التعليمي / الشهادات', value: data.education || 'غير مسجل', fullWidth: true },
    { label: 'جهة اتصال الطوارئ (الاسم والعلاقة)', value: data.emergencyContact || 'غير مسجل' },
    { label: 'رقم هاتف الطوارئ للتواصل', value: data.emergencyPhone || 'غير مسجل' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
      {contactItems.map((item, idx) => (
        <div
          key={idx}
          className={`bg-military-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-1 ${
            item.fullWidth ? 'md:col-span-2' : ''
          }`}
        >
          <span className="text-xs text-gray-500 font-bold">{item.label}</span>
          <span className="text-sm font-semibold text-gray-200">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
