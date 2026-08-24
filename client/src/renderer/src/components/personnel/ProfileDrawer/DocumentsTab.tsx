import React, { useState, useEffect, useCallback } from 'react'
import { getDocumentsByPersonnel, uploadDocument, deleteDocument } from '../../../api/documents.api'
import { Table, Column } from '../../ui/Table'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { FileUp, Eye, Trash2, FileText } from 'lucide-react'
import type { Personnel, Document } from '../../../types/personnel'
import { resolveFileUrl } from '../../../utils/fileUrl'

interface DocumentsTabProps {
  data: Personnel
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ data }) => {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('nationalIdCard')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const docTypeLabels: Record<string, string> = {
    nationalIdCard: 'بطاقة الرقم القومي',
    militaryIdCard: 'الهوية العسكرية',
    appointmentDocuments: 'وثائق التعيين',
    promotionDocuments: 'قرارات الترقيات',
    certificates: 'شهادات ودورات',
    personnelCard: 'صورة البطاقة',
    personnelCarnet: 'صورة الكارنيه',
    personnelForm: 'صورة النموذج'
  }

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDocumentsByPersonnel(data.id)
      if (res.success) {
        setDocs(res.data)
      }
    } catch {
      setError('فشل تحميل قائمة المستندات')
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocs()
  }, [fetchDocs])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedFile) {
      setError('الرجاء تحديد ملف لرفعه')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('personnelId', data.id)
    formData.append('type', docType)
    formData.append('file', selectedFile)

    try {
      const res = await uploadDocument(formData)
      if (res.success) {
        setSelectedFile(null)
        const fileInput = document.getElementById('doc-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchDocs()
      } else {
        setError(res.message || 'فشل رفع المستند')
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'حدث خطأ أثناء رفع المستند')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('هل أنت متأكد من حذف هذا المستند نهائياً؟')) return
    try {
      const res = await deleteDocument(id)
      if (res.success) {
        fetchDocs()
      }
    } catch {
      setError('فشل حذف المستند')
    }
  }

  const docTypeOptions = Object.entries(docTypeLabels).map(([val, lbl]) => ({
    value: val,
    label: lbl
  }))

  const columns: Column<Document>[] = [
    {
      key: 'type',
      label: 'نوع المستند',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-military-accent" />
          <span className="font-bold">{docTypeLabels[row.type] || row.type}</span>
        </div>
      )
    },
    {
      key: 'uploadedAt',
      label: 'تاريخ الرفع',
      render: (row) => <span>{new Date(row.uploadedAt).toLocaleString('ar-EG')}</span>
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <a
            href={resolveFileUrl(row.fileUrl) || '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
            title="معاينة الملف"
          >
            <Eye className="h-4 w-4" />
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            onClick={() => handleDelete(row.id)}
            title="حذف المستند"
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
        onSubmit={handleUpload}
        className="glassmorphism p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="w-full md:w-[240px]">
          <Select
            label="نوع المستند المرفوع"
            options={docTypeOptions}
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          />
        </div>
        <div className="w-full md:flex-1 flex flex-col gap-1 text-start">
          <label className="text-sm font-semibold text-gray-300">اختر الملف (صورة أو PDF)</label>
          <input
            id="doc-file-input"
            type="file"
            onChange={handleFileChange}
            className="w-full bg-military-900 border border-white/10 hover:border-white/20 text-gray-200 text-sm rounded-lg p-2 transition-colors outline-none cursor-pointer"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={uploading}
          startIcon={<FileUp className="h-4.5 w-4.5" />}
        >
          رفع وحفظ المستند
        </Button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-white">المستندات والأوراق الرسمية الحالية</h4>
        <Table columns={columns} data={docs} loading={loading} />
      </div>
    </div>
  )
}
