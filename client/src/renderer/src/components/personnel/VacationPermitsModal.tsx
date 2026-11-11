import React, { useState, useRef, useMemo } from 'react'
import {
  Printer,
  Download,
  CheckSquare,
  Square,
  Settings2,
  Users,
  Eye,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  VacationPermitCard,
  VacationPermitData,
  getPermitTemplateForPersonnel
} from './VacationPermitCard'
import { displayRank } from '../../utils/rankDisplay'
import { matchesAnySearch } from '../../utils/arabicSearch'

interface VacationPermitsModalProps {
  isOpen: boolean
  onClose: () => void
  initialPersonnel: VacationPermitData[]
  defaultDepartureDate?: string
  defaultReturnDate?: string
}

const CARDS_PER_PAGE = 15 // 3 columns x 5 rows

export const VacationPermitsModal: React.FC<VacationPermitsModalProps> = ({
  isOpen,
  onClose,
  initialPersonnel,
  defaultDepartureDate,
  defaultReturnDate
}) => {
  // Config state: 'auto' (detect per person), 'military' (all military), or 'internal' (all internal)
  const [templateMode, setTemplateMode] = useState<'auto' | 'military' | 'internal'>('auto')
  // Internal permit titles
  const [sectorTitle, setSectorTitle] = useState('قطاع جنوب سيناء')
  const [departmentTitle, setDepartmentTitle] = useState('قسم الشئون الادارية')
  // Military permit titles (تصريح إجازة حربية)
  const [authorityTitle, setAuthorityTitle] = useState('هيئة الاستخبارات العسكرية')
  const [commandTitle, setCommandTitle] = useState('قيادة المنطقه (ج)')
  const [militarySectorTitle, setMilitarySectorTitle] = useState('قطاع جنوب سيناء')
  const [timePrefix, setTimePrefix] = useState('')
  const [useArabicDigits, setUseArabicDigits] = useState(true)
  const [fillPageBlanks, setFillPageBlanks] = useState(true)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(initialPersonnel.map((p, idx) => p.id || `idx-${idx}`))
  })
  const [personnelList, setPersonnelList] = useState<VacationPermitData[]>(() =>
    initialPersonnel.map((p) => ({
      ...p,
      startDate: p.startDate || defaultDepartureDate || '',
      returnDate: p.returnDate || defaultReturnDate || ''
    }))
  )
  const [searchQuery, setSearchQuery] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState<'preview' | 'selection' | 'settings'>('preview')
  const [previewScale, setPreviewScale] = useState(0.8)
  const [downloading, setDownloading] = useState(false)

  const printAreaRef = useRef<HTMLDivElement>(null)

  // Filter selected personnel
  const activePersonnel = useMemo(() => {
    return personnelList.filter((p, idx) => {
      const id = p.id || `idx-${idx}`
      return selectedIds.has(id)
    })
  }, [personnelList, selectedIds])

  // Partition into pages of 15 permits
  const pages = useMemo(() => {
    const list: VacationPermitData[] = [...activePersonnel]

    if (fillPageBlanks) {
      const remainder = list.length % CARDS_PER_PAGE
      if (remainder > 0 || list.length === 0) {
        const needed = list.length === 0 ? CARDS_PER_PAGE : CARDS_PER_PAGE - remainder
        for (let i = 0; i < needed; i++) {
          list.push({
            isBlank: true,
            templateType: templateMode === 'auto' ? 'military' : templateMode
          })
        }
      }
    }

    const chunked: VacationPermitData[][] = []
    for (let i = 0; i < list.length; i += CARDS_PER_PAGE) {
      chunked.push(list.slice(i, i + CARDS_PER_PAGE))
    }

    return chunked.length > 0 ? chunked : [[]]
  }, [activePersonnel, fillPageBlanks, templateMode])

  // Toggle selection
  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = (): void => {
    setSelectedIds(new Set(personnelList.map((p, idx) => p.id || `idx-${idx}`)))
  }

  const deselectAll = (): void => {
    setSelectedIds(new Set())
  }

  // Update dates for an individual
  const updatePersonDate = (idx: number, field: 'startDate' | 'returnDate', value: string): void => {
    setPersonnelList((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  // Update specific template for an individual
  const updatePersonTemplate = (
    idx: number,
    value: 'auto' | 'military' | 'internal'
  ): void => {
    setPersonnelList((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        templateType: value === 'auto' ? undefined : value
      }
      return next
    })
  }

  // Direct Browser/Electron Print
  const handleDirectPrint = (): void => {
    const printContent = printAreaRef.current
    if (!printContent) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${
          templateMode === 'military'
            ? 'تصاريح إجازة حربية'
            : templateMode === 'internal'
              ? 'تصاريح إجازة داخلية وتشغيل'
              : 'تصاريح إجازة (حربية وداخلية)'
        }</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap');
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: 'Amiri', 'Traditional Arabic', 'Cairo', Tahoma, Arial, sans-serif;
            direction: rtl;
          }
          .a4-page-container {
            width: 202mm;
            min-height: 289mm;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(3, 64.5mm);
            grid-template-rows: repeat(5, 55mm);
            gap: 2.2mm 3.5mm;
            justify-content: center;
            align-content: start;
            page-break-after: always;
            break-after: page;
            box-sizing: border-box;
            padding: 1mm 0;
          }
          .a4-page-container:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .permit-card {
            width: 64.5mm !important;
            height: 55mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .flex { display: flex !important; }
          .flex-col { flex-direction: column !important; }
          .justify-between { justify-content: space-between !important; }
          .items-center { align-items: center !important; }
          .items-baseline { align-items: baseline !important; }
          .w-full { width: 100% !important; }
          .h-full { height: 100% !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .underline { text-decoration: underline !important; }
          .font-bold { font-weight: bold !important; }
          .font-extrabold { font-weight: 800 !important; }
          .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .shrink-0 { flex-shrink: 0 !important; }
          .flex-1 { flex: 1 1 0% !important; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1200)
    }, 400)
  }

  // Native Electron PDF Download (uses Chromium's actual text rendering for proper Arabic support)
  const handleDownloadPDF = async (): Promise<void> => {
    const printContent = printAreaRef.current
    if (!printContent) return

    setDownloading(true)

    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      const typeLabel =
        templateMode === 'military'
          ? 'حربية'
          : templateMode === 'internal'
            ? 'داخلية_تشغيل'
            : 'طابور_مشترك'

      const html = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>${
            templateMode === 'military'
              ? 'تصاريح إجازة حربية'
              : templateMode === 'internal'
                ? 'تصاريح إجازة داخلية وتشغيل'
                : 'تصاريح إجازة (حربية وداخلية)'
          }</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap');
            @page {
              size: A4 portrait;
              margin: 4mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: 'Amiri', 'Traditional Arabic', 'Cairo', Tahoma, Arial, sans-serif;
              direction: rtl;
            }
            .a4-page-container {
              width: 202mm;
              min-height: 289mm;
              margin: 0 auto;
              display: grid;
              grid-template-columns: repeat(3, 64.5mm);
              grid-template-rows: repeat(5, 55mm);
              gap: 2.2mm 3.5mm;
              justify-content: center;
              align-content: start;
              page-break-after: always;
              break-after: page;
              box-sizing: border-box;
              padding: 1mm 0;
            }
            .a4-page-container:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .permit-card {
              width: 64.5mm !important;
              height: 55mm !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .justify-between { justify-content: space-between !important; }
            .items-center { align-items: center !important; }
            .items-baseline { align-items: baseline !important; }
            .w-full { width: 100% !important; }
            .h-full { height: 100% !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .underline { text-decoration: underline !important; }
            .font-bold { font-weight: bold !important; }
            .font-extrabold { font-weight: 800 !important; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .shrink-0 { flex-shrink: 0 !important; }
            .flex-1 { flex: 1 1 0% !important; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `

      const result = await window.api.printToPDF({
        html,
        fileName: `تصاريح_إجازة_${typeLabel}_${dateStr}.pdf`
      })

      if (result.error) {
        alert(`حدث خطأ أثناء تحميل الـ PDF: ${result.error}`)
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      alert(
        `حدث خطأ أثناء تحميل الـ PDF: ${msg}\nيمكنك استخدام خيار "طباعة مباشرة (A4)" واختيار "حفظ بتنسيق PDF" مباشرة.`
      )
    } finally {
      setDownloading(false)
    }
  }

  const filteredPersonnel = personnelList.filter((p) =>
    matchesAnySearch([p.fullName, p.militaryId, p.rank], searchQuery)
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        templateMode === 'military'
          ? 'طباعة تصاريح إجازة حربية (15 تصريح في الورقة A4)'
          : templateMode === 'internal'
            ? 'طباعة تصاريح إجازة داخلية وتشغيل (15 تصريح في الورقة A4)'
            : 'طباعة تصاريح الإجازة (تلقائي حسب الفرد - 15 تصريح في الورقة A4)'
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-400 flex items-center gap-3">
            <span>
              تم اختيار <strong className="text-emerald-400">{activePersonnel.length}</strong> فرد
            </span>
            <span>•</span>
            <span>
              عدد الأوراق: <strong className="text-sky-400">{pages.length}</strong> ورقة A4
            </span>
            <span>•</span>
            <span>
              إجمالي التصاريح المطبوعة: <strong className="text-white">{pages.length * CARDS_PER_PAGE}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              إغلاق
            </Button>
            <Button
              variant="secondary"
              startIcon={<Download className="h-4 w-4" />}
              onClick={handleDownloadPDF}
              loading={downloading}
              disabled={activePersonnel.length === 0 && !fillPageBlanks}
            >
              تحميل PDF
            </Button>
            <Button
              variant="primary"
              startIcon={<Printer className="h-4 w-4" />}
              onClick={handleDirectPrint}
              disabled={activePersonnel.length === 0 && !fillPageBlanks}
            >
              طباعة مباشرة (A4)
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-start max-h-[75vh]">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-military-primary text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="h-4 w-4" />
              معاينة الصفحة (A4)
            </button>

            <button
              onClick={() => setActiveTab('selection')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'selection'
                  ? 'bg-military-primary text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="h-4 w-4" />
              تحديد الأفراد ({activePersonnel.length}/{personnelList.length})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-military-primary text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              إعدادات التصريح
            </button>
          </div>

          {/* Quick options and template switcher in top bar */}
          <div className="flex items-center gap-3 text-xs text-gray-300">
            {/* Template Selector Button Group */}
            <div className="flex items-center gap-1 bg-military-950 p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setTemplateMode('auto')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  templateMode === 'auto'
                    ? 'bg-military-accent text-military-900 shadow font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="تحديد نموذج كل فرد تلقائياً حسب تبعيته (حربية أو داخلية/تشغيل)"
              >
                تلقائي حسب الفرد
              </button>
              <button
                type="button"
                onClick={() => setTemplateMode('military')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  templateMode === 'military'
                    ? 'bg-military-accent text-military-900 shadow font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="تطبيق تصريح إجازة حربية للكل"
              >
                الكل إجازة حربية
              </button>
              <button
                type="button"
                onClick={() => setTemplateMode('internal')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  templateMode === 'internal'
                    ? 'bg-military-accent text-military-900 shadow font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="تطبيق تصريح داخلي وتشغيل للكل"
              >
                الكل داخلي وتشغيل
              </button>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-military-primary"
                checked={fillPageBlanks}
                onChange={(e) => setFillPageBlanks(e.target.checked)}
              />
              ملء باقي الصفحة بتصاريح فارغة
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-military-primary"
                checked={useArabicDigits}
                onChange={(e) => setUseArabicDigits(e.target.checked)}
              />
              أرقام عربية (٢٠٢٦)
            </label>
          </div>
        </div>

        {/* TAB 1: Live A4 Sheet Preview */}
        {activeTab === 'preview' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-military-900/60 p-2 rounded-lg border border-white/5 text-xs text-gray-300">
              <span>
                كل صفحة A4 مقسمة إلى <strong>15 تصريح</strong> (3 أعمدة × 5 صفوف) مطابقة للنموذج الرسمي
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewScale((s) => Math.max(0.4, s - 0.1))}
                  title="تصغير المعاينة"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="font-mono text-xs">{Math.round(previewScale * 100)}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewScale((s) => Math.min(1.2, s + 0.1))}
                  title="تكبير المعاينة"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Scrollable container for preview */}
            <div className="overflow-auto max-h-[56vh] bg-neutral-900/80 p-4 rounded-xl border border-white/10 flex flex-col items-center gap-6">
              {pages.map((pageCards, pIndex) => (
                <div key={pIndex} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">
                    ورقة {pIndex + 1} من {pages.length} ({pageCards.filter((c) => !c.isBlank).length} فرد مكتوب
                    {pageCards.filter((c) => c.isBlank).length > 0 &&
                      ` + ${pageCards.filter((c) => c.isBlank).length} تصريح فارغ`}
                    )
                  </span>

                  {/* Scaled A4 Sheet preview wrapper */}
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                      width: '202mm',
                      marginBottom: `${(previewScale - 1) * 289}mm`
                    }}
                  >
                    <div
                      className="bg-white text-black shadow-2xl p-2 rounded-sm border border-neutral-300"
                      style={{
                        width: '202mm',
                        minHeight: '289mm',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 64.5mm)',
                        gridTemplateRows: 'repeat(5, 55mm)',
                        gap: '2.2mm 3.5mm',
                        justifyContent: 'center',
                        alignContent: 'start',
                        boxSizing: 'border-box'
                      }}
                    >
                      {pageCards.map((card, cIndex) => (
                        <VacationPermitCard
                          key={cIndex}
                          data={card}
                          templateType={card.templateType || templateMode}
                          sectorTitle={sectorTitle}
                          departmentTitle={departmentTitle}
                          authorityTitle={authorityTitle}
                          commandTitle={commandTitle}
                          militarySectorTitle={militarySectorTitle}
                          timePrefix={timePrefix}
                          useArabicDigits={useArabicDigits}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Personnel Selection and Date Edits */}
        {activeTab === 'selection' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Input
                placeholder="ابحث بالاسم، الرقم العسكري، الرتبة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={selectAll} startIcon={<CheckSquare className="h-3.5 w-3.5" />}>
                  تحديد الكل
                </Button>
                <Button variant="secondary" size="sm" onClick={deselectAll} startIcon={<Square className="h-3.5 w-3.5" />}>
                  إلغاء التحديد
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[50vh] rounded-lg border border-white/10 bg-military-950 divide-y divide-white/5">
              {filteredPersonnel.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">لا يوجد أفراد مطابقين للبحث</div>
              ) : (
                filteredPersonnel.map((p, idx) => {
                  const id = p.id || `idx-${idx}`
                  const isChecked = selectedIds.has(id)
                  return (
                    <div
                      key={id}
                      className={`p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                        isChecked ? 'bg-military-primary/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          className="accent-military-primary h-4 w-4 rounded"
                          checked={isChecked}
                          onChange={() => toggleSelect(id)}
                        />
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                            <span>{p.fullName}</span>
                            <span className="text-xs text-military-primary">({p.grade || displayRank(p.rank, p.personnelType) || p.rank})</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                (p.personnelType || '').includes('تشغيل')
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : (p.personnelType || '').includes('داخلية')
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {p.personnelType || 'حربية'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            الرقم العسكري: {p.militaryId || '—'}
                          </div>
                        </div>
                      </label>

                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={p.templateType || 'auto'}
                          onChange={(e) => updatePersonTemplate(idx, e.target.value as any)}
                          className="bg-military-900 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 cursor-pointer"
                          title="نموذج التصريح لهذا الفرد"
                        >
                          <option value="auto">
                            تلقائي (
                            {getPermitTemplateForPersonnel(p.personnelType) === 'military'
                              ? 'إجازة حربية'
                              : 'داخلي وتشغيل'}
                            )
                          </option>
                          <option value="military">تصريح إجازة حربية</option>
                          <option value="internal">تصريح داخلي وتشغيل</option>
                        </select>

                        <div className="flex items-center gap-1 text-xs text-gray-300">
                          <span>نزول:</span>
                          <input
                            type="date"
                            className="bg-military-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                            value={p.startDate || ''}
                            onChange={(e) => updatePersonDate(idx, 'startDate', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-300">
                          <span>عودة:</span>
                          <input
                            type="date"
                            className="bg-military-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                            value={p.returnDate || ''}
                            onChange={(e) => updatePersonDate(idx, 'returnDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Settings Customization */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-5 bg-military-950 p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>نمط اختيار النموذج:</span>
                <span className="text-military-accent font-extrabold">
                  {templateMode === 'auto'
                    ? 'تلقائي حسب الفرد (حربية -> إجازة حربية | داخلية أو تشغيل -> داخلي وتشغيل)'
                    : templateMode === 'military'
                      ? 'إجازة حربية للكل'
                      : 'داخلي وتشغيل للكل'}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-military-900 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setTemplateMode('auto')}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                    templateMode === 'auto'
                      ? 'bg-military-accent text-military-900 shadow font-extrabold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  تلقائي
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateMode('military')}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                    templateMode === 'military'
                      ? 'bg-military-accent text-military-900 shadow font-extrabold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  إجازة حربية
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateMode('internal')}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                    templateMode === 'internal'
                      ? 'bg-military-accent text-military-900 shadow font-extrabold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  داخلي وتشغيل
                </button>
              </div>
            </div>

            {/* Military permit header settings */}
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-military-900/60 border border-white/5">
              <span className="text-xs font-bold text-emerald-400">
                ترويسة تصريح إجازة حربية (3 أسطر)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="الترويسة 1: الهيئة"
                  value={authorityTitle}
                  onChange={(e) => setAuthorityTitle(e.target.value)}
                  placeholder="هَيْئَـــــة الإِسْتِخْبَـــــارَات العَسْـــــكَرِيّة"
                />
                <Input
                  label="الترويسة 2: القيادة / المنطقة"
                  value={commandTitle}
                  onChange={(e) => setCommandTitle(e.target.value)}
                  placeholder="قِـيَــــادَة المَنْطِـقَــــه (ج)"
                />
                <Input
                  label="الترويسة 3: القطاع"
                  value={militarySectorTitle}
                  onChange={(e) => setMilitarySectorTitle(e.target.value)}
                  placeholder="قِطَــــاع جَنُـوب سَيْنَـــاء"
                />
              </div>
            </div>

            {/* Internal & operations permit header settings */}
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-military-900/60 border border-white/5">
              <span className="text-xs font-bold text-sky-400">
                ترويسة تصريح داخلي وتشغيل (سطران)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="عنوان الترويسة الرئيسية"
                  value={sectorTitle}
                  onChange={(e) => setSectorTitle(e.target.value)}
                  placeholder="قِطَـــاع جَنُـوب سَيْنَـــاء"
                />
                <Input
                  label="عنوان الترويسة الفرعية"
                  value={departmentTitle}
                  onChange={(e) => setDepartmentTitle(e.target.value)}
                  placeholder="قِسْـم الشُّـئُـون الإِدَارِيّـة"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <Input
                label="تحديد وقت السفر (اختياري، مثلاً: ٠٧٠٠)"
                value={timePrefix}
                onChange={(e) => setTimePrefix(e.target.value)}
                placeholder="مثال: ٠٧٠٠ أو اتركه فارغاً"
              />

              <div className="flex flex-col gap-2 justify-center">
                <label className="text-xs text-gray-400">خيارات التنسيق</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-military-primary"
                      checked={useArabicDigits}
                      onChange={(e) => setUseArabicDigits(e.target.checked)}
                    />
                    عرض التواريخ والأرقام بالأرقام العربية المشرقية (٢٠٢٦)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-military-primary"
                      checked={fillPageBlanks}
                      onChange={(e) => setFillPageBlanks(e.target.checked)}
                    />
                    إكمال ما تبقى من الـ 15 تصريحاً في الورقة بكروت فارغة
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Printable Container for Print/PDF */}
        <div style={{ display: 'none' }}>
          <div ref={printAreaRef}>
            {pages.map((pageCards, pIndex) => (
              <div key={pIndex} className="a4-page-container">
                {pageCards.map((card, cIndex) => (
                  <VacationPermitCard
                    key={cIndex}
                    data={card}
                    templateType={card.templateType || templateMode}
                    sectorTitle={sectorTitle}
                    departmentTitle={departmentTitle}
                    authorityTitle={authorityTitle}
                    commandTitle={commandTitle}
                    militarySectorTitle={militarySectorTitle}
                    timePrefix={timePrefix}
                    useArabicDigits={useArabicDigits}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default VacationPermitsModal
