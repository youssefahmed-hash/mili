import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { getDailyReportPDFUrl } from '../../api/line.api'
import { useLineStore } from '../../store/lineStore'
import { displayRank } from '../../utils/rankDisplay'

export const LineReportModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { currentReport, reportUpdatedAt, fetchReport, loading, error, clearError } = useLineStore()
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      clearError()
      setPrintError(null)
      fetchReport()
    }
  }, [isOpen, fetchReport, clearError])

  const handleFetch = () => {
    fetchReport()
  }

  const handlePrint = async () => {
    setPrintError(null)
    try {
      // خارج Electron (متصفح/تابلت): افتح صفحة الطباعة كما كان
      if (typeof window === 'undefined' || !window.api?.printToPDF) {
        window.open(getDailyReportPDFUrl(), '_blank')
        return
      }
      setPrinting(true)
      const res = await fetch(getDailyReportPDFUrl())
      if (!res.ok) throw new Error(`فشل تحميل التقرير (${res.status})`)
      const html = await res.text()
      const today = new Date().toISOString().slice(0, 10)
      const result = await window.api.printToPDF({
        html,
        fileName: `تقرير_الخط_${today}.pdf`
      })
      if (result?.error && !result?.canceled) {
        setPrintError(result.error)
      }
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء PDF')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تقرير الخط الحالي"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-4">
          <Button variant="accent" onClick={handleFetch} loading={loading} title="إعادة تحميل بيانات التقرير من السيرفر">
            عرض التقرير
          </Button>
          <Button variant="secondary" onClick={handlePrint} loading={printing}>
            طباعة PDF
          </Button>
          {reportUpdatedAt && (
            <span className="text-[11px] text-gray-500 mr-auto">
              آخر تحديث للبيانات: {reportUpdatedAt}
            </span>
          )}
        </div>

        {printError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold">
            فشل إنشاء PDF: {printError}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-bold flex items-center justify-between gap-2">
            <span>فشل تحميل التقرير: {error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              ✕
            </Button>
          </div>
        )}

        {loading && !currentReport && (
          <div className="text-center text-gray-400 text-sm py-6">جاري تحميل التقرير...</div>
        )}

        {!loading && !currentReport && !error && (
          <div className="text-center text-gray-500 text-sm py-6">
            اضغط "عرض التقرير" لتحميل التقرير الحالي
          </div>
        )}

        {currentReport && (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="glassmorphism p-4 rounded-xl">
              <h4 className="text-sm font-bold text-military-accent mb-2">الملخص</h4>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-white">{currentReport.summary.total}</span>
                <span className="text-sm text-gray-400">إجمالي الأفراد</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(currentReport.summary.byStatus).map(([status, count]) => (
                  <span key={status} className="text-xs bg-military-900/50 px-2 py-1 rounded">
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>

            {/* Points */}
            {currentReport.points.map((pointData) => (
              <div key={pointData.point.id} className="glassmorphism p-4 rounded-xl">
                <h4 className="text-sm font-bold text-white mb-2">{pointData.point.name}</h4>
                {pointData.shifts.map((shiftData) => (
                  <div key={shiftData.shift.id} className="ml-4 mb-2">
                    <span className="text-xs font-bold text-military-accent">
                      {shiftData.shift.name}
                    </span>
                    <div className="mr-4 mt-1">
                      {shiftData.assignments.length === 0 ? (
                        <span className="text-xs text-gray-600">لا يوجد أفراد</span>
                      ) : (
                        shiftData.assignments.map((a) => (
                          <div key={a.id} className="text-xs text-gray-300">
                            • {a.personnel?.fullName} ({displayRank(a.personnel?.rank, a.personnel?.personnelType) || '—'}) - {a.status}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
