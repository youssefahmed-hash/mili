import React, { useState, useEffect, useCallback } from 'react'
import { getFormsByPersonnel, createForm, deleteForm } from '../../../api/forms.api'
import { Table, Column } from '../../ui/Table'
import { Select } from '../../ui/Select'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { CheckSquare, Eye, Trash2 } from 'lucide-react'
import type { Personnel, Form as FormType } from '../../../types/personnel'

interface FormsTabProps {
  data: Personnel
}

export const FormsTab: React.FC<FormsTabProps> = ({ data }) => {
  const [forms, setForms] = useState<FormType[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formType, setFormType] = useState('نموذج 1 أفراد')
  const [formName, setFormName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchForms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getFormsByPersonnel(data.id)
      if (res.success) {
        setForms(res.data)
      }
    } catch {
      setError('فشل تحميل قائمة النماذج')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchForms()
  }, [fetchForms])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formName.trim()) {
      setError('الرجاء إدخال اسم النموذج')
      return
    }

    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('personnelId', data.id)
    formData.append('formType', formType)
    formData.append('formName', formName)
    if (selectedFile) {
      formData.append('file', selectedFile)
    }

    try {
      const res = await createForm(formData)
      if (res.success) {
        setFormName('')
        setSelectedFile(null)
        const fileInput = document.getElementById('form-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchForms()
      } else {
        setError(res.message || 'فشل تسجيل النموذج')
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'حدث خطأ أثناء تسجيل النموذج')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذا النموذج نهائياً؟')) return
    try {
      const res = await deleteForm(id)
      if (res.success) {
        fetchForms()
      }
    } catch {
      setError('فشل حذف النموذج')
    }
  }

  const formTypeOptions = [
    { value: 'نموذج 1 أفراد', label: 'نموذج 1 أفراد' },
    { value: 'نموذج 2 أفراد', label: 'نموذج 2 أفراد' }
  ]

  const columns: Column<FormType>[] = [
    {
      key: 'formType',
      label: 'نوع النموذج',
      render: (row) => (
        <Badge variant={row.formType === 'نموذج 1 أفراد' ? 'primary' : 'accent'}>
          {row.formType}
        </Badge>
      )
    },
    { key: 'formName', label: 'اسم النموذج ووصفه' },
    {
      key: 'createdAt',
      label: 'تاريخ الإنشاء',
      render: (row) => <span>{new Date(row.createdAt).toLocaleDateString('ar-EG')}</span>
    },
    { key: 'status', label: 'الحالة' },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          {row.fileUrl && (
            <a
              href={`http://localhost:5000${row.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
              title="عرض صورة النموذج"
            >
              <Eye className="h-4 w-4" />
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            onClick={() => handleDelete(row.id)}
            title="حذف النموذج"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 text-start">
      <form
        onSubmit={handleCreate}
        className="glassmorphism p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <Select
            label="نوع النموذج العسكري"
            options={formTypeOptions}
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
          />
        </div>
        <div>
          <Input
            label="اسم النموذج / البيان"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="مثال: نموذج ترشيح فرقة"
          />
        </div>
        <div className="flex flex-col gap-1 text-start">
          <label className="text-sm font-semibold text-gray-300">أرفق صورة النموذج</label>
          <input
            id="form-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-military-900 border border-white/10 hover:border-white/20 text-gray-200 text-sm rounded-lg p-2 transition-colors outline-none cursor-pointer"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          startIcon={<CheckSquare className="h-4.5 w-4.5" />}
        >
          إنشاء وتسجيل النموذج
        </Button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">النماذج العسكرية المسجلة للفرد</h4>
        <Table columns={columns} data={forms} loading={loading} />
      </div>
    </div>
  )
}
