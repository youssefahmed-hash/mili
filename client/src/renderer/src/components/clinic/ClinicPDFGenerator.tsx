import html2pdf from 'html2pdf.js'
import type { ClinicRecord } from '../../types/personnel'
import { displayRank } from '../../utils/rankDisplay'

interface ClinicPDFOptions {
  records: ClinicRecord[]
  title: string
  fromDate?: string
  toDate?: string
  personnelName?: string
  printType: 'all' | 'personnel'
  /** الأدوية المصروفة لكل كشف — تُطبع بدل نص العلاج */
  dispensedByRecord?: Record<string, string[]>
}

export const generateClinicPDF = async (options: ClinicPDFOptions): Promise<void> => {
  const { records, title, fromDate, toDate, personnelName, printType, dispensedByRecord } = options

  const container = document.createElement('div')
  container.style.cssText = 'direction:rtl;text-align:right;font-family:Cairo,Tahoma,Arial,sans-serif;padding:20px;width:1100px;color:#000;background:#fff;'

  let subtitle = ''
  if (fromDate && toDate) {
    subtitle = `من ${fromDate} إلى ${toDate}`
  } else if (fromDate) {
    subtitle = `من ${fromDate}`
  } else if (toDate) {
    subtitle = `إلى ${toDate}`
  }

  const rows = records.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.personnel?.fullName || '—'}</td>
      <td>${displayRank(r.personnel?.rank, r.personnel?.personnelType) || '—'}</td>
      <td>${r.personnel?.militaryId || '—'}</td>
      <td>${r.personnel?.category || '—'}</td>
      <td>${r.examinationType}</td>
      <td>${r.medicalStatus}</td>
      <td>${r.clinicType}</td>
      <td>${r.carnetNumber || '—'}</td>
      <td>${r.specialty || '—'}</td>
      <td>${r.diagnosis || '—'}</td>
      <td>${
        dispensedByRecord?.[r.id]?.length
          ? dispensedByRecord[r.id].join('، ')
          : r.treatment || '—'
      }</td>
      <td>${r.notes || '—'}</td>
      <td>${r.examinationDate ? new Date(r.examinationDate).toLocaleDateString('ar-EG') : '—'}</td>
      <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : '—'}</td>
    </tr>
  `).join('')

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      table { width:100%;border-collapse:collapse;margin-top:10px; }
      th { background:#1e40af;color:#fff;padding:6px 4px;font-size:9px;font-weight:700; }
      td { padding:5px 4px;font-size:8px;border-bottom:1px solid #e5e7eb; }
      tr:nth-child(even) { background:#f0f5ff; }
      tr:hover { background:#e0e7ff; }
      .title { text-align:center;font-size:18px;font-weight:700;margin:0 0 4px 0; }
      .subtitle { text-align:center;font-size:12px;color:#374151;margin:0 0 2px 0; }
      .personnel { text-align:center;font-size:13px;font-weight:600;margin:0 0 6px 0; }
      .footer { text-align:center;font-size:8px;color:#6b7280;margin-top:10px;border-top:1px solid #d1d5db;padding-top:4px; }
      .summary { font-size:9px;color:#374151;margin-top:8px; }
    </style>
    <h1 class="title">${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    ${printType === 'personnel' && personnelName ? `<p class="personnel">الفرد: ${personnelName}</p>` : ''}
    <table>
      <thead>
        <tr>
          <th>م</th><th>الاسم</th><th>الرتبة</th><th>الرقم العسكري</th><th>الفئة</th>
          <th>نوع الكشف</th><th>القرار الطبي</th><th>النوع</th><th>رقم الكارنية</th>
          <th>التخصص</th><th>التشخيص</th><th>الأدوية المصروفة / التوصيات</th><th>ملاحظات</th>
          <th>تاريخ الكشف</th><th>تاريخ التسجيل</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary">العدد الإجمالي: ${records.length} سجل طبي</div>
    <div class="footer">تم الإنشاء في ${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG')}</div>
  `

  document.body.appendChild(container)

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const typeStr = printType === 'all' ? 'الكل' : personnelName?.replace(/\s+/g, '_') || 'محدد'

  await html2pdf()
    .set({
      margin: [10, 5, 10, 5],
      filename: `عيادة_${typeStr}_${dateStr}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    })
    .from(container)
    .save()

  document.body.removeChild(container)
}