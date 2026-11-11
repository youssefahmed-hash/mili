import React, { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import API from '../../../api/axios'
import type { LineAssignment } from '../../../types/personnel'

const STATUS_COLORS: Record<string, string> = {
  'حاضر': '#22c55e',
  'إجازة': '#3b82f6',
  'مرضي': '#ef4444',
  'سجن': '#78716c',
  'مهمة': '#f59e0b',
  'غياب': '#dc2626',
  'منقول': '#6b7280'
}

interface LineAssignmentsTabProps {
  personnelId: string
}

export const LineAssignmentsTab: React.FC<LineAssignmentsTabProps> = ({ personnelId }) => {
  const [assignments, setAssignments] = useState<LineAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await API.get('/line/assignments', {
          params: { personnelId }
        })
        if (res.data.success) {
          setAssignments(res.data.data)
        }
      } catch {
        setError('فشل تحميل تعيينات الخط')
      } finally {
        setLoading(false)
      }
    }

    if (personnelId) {
      fetchAssignments()
    }
  }, [personnelId])

  const shiftBg = (order: number) =>
    order === 1
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : order === 2
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        : 'bg-red-500/20 text-red-400 border border-red-500/30'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-gray-400">جاري التحميل...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
        {error}
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">لا توجد تعيينات خط لهذا الفرد</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="glassmorphism p-3 rounded-xl flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-military-900 border border-white/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-military-accent" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {assignment.linePoint?.name || 'نقطة غير محددة'}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {assignment.shift && (
                  <span>{assignment.shift.name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {assignment.shift && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${shiftBg(assignment.shift.order)}`}>
                {assignment.shift.name}
              </span>
            )}
            {assignment.status && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                style={{
                  backgroundColor: `${STATUS_COLORS[assignment.status] || '#6b7280'}20`,
                  color: STATUS_COLORS[assignment.status] || '#6b7280',
                  border: `1px solid ${STATUS_COLORS[assignment.status] || '#6b7280'}40`
                }}
              >
                {assignment.status}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
