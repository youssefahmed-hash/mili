import { getPersonnelById } from '../../api/personnel.api'
import { getVacationsByPersonnel } from '../../api/vacations.api'
import { getPenaltiesByPersonnel } from '../../api/penalties.api'
import { getRewardsByPersonnel } from '../../api/rewards.api'
import { getClinicByPersonnel } from '../../api/clinic.api'
import { getServicesByPersonnel } from '../../api/services.api'
import { getOperationsByPersonnel } from '../../api/operations.api'
import { getSecurityByPersonnel } from '../../api/security.api'
import { getDocumentsByPersonnel } from '../../api/documents.api'
import { getFormsByPersonnel } from '../../api/forms.api'
import { getLineAssignments } from '../../api/line.api'
import { displayRank } from '../../utils/rankDisplay'
import { effectiveReturnYmd } from '../../utils/vacationDates'
import type {
  Personnel,
  Vacation,
  PenaltyRecord,
  RewardRecord,
  ClinicRecord,
  ServiceRecord,
  OperationRecord,
  SecurityRecord,
  Document,
  Form,
  LineAssignment
} from '../../types/personnel'

// ==================== الملف الشامل للعسكري (دوسيه — للأدمن) ====================

interface DossierData {
  personnel: Personnel
  vacations: Vacation[]
  penalties: PenaltyRecord[]
  rewards: RewardRecord[]
  clinic: ClinicRecord[]
  services: ServiceRecord[]
  operations: OperationRecord[]
  security: SecurityRecord[]
  documents: Document[]
  forms: Form[]
  lineAssignments: LineAssignment[]
  failed: string[]
}

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const fmtDate = (v: unknown): string => {
  if (!v) return '—'
  const s = String(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : esc(String(v))
}

const val = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—'
  return esc(v)
}

async function fetchDossier(personnelId: string): Promise<DossierData> {
  const failed: string[] = []
  const take = async <T,>(label: string, p: Promise<{ success: boolean; data: T[] }>): Promise<T[]> => {
    try {
      const res = await p
      if (res.success && Array.isArray(res.data)) return res.data
      failed.push(label)
      return []
    } catch {
      failed.push(label)
      return []
    }
  }

  const personnelRes = await getPersonnelById(personnelId).catch(() => null)
  if (!personnelRes || !personnelRes.success || !personnelRes.data) {
    throw new Error('تعذر تحميل بيانات الفرد')
  }

  const [
    vacations,
    penalties,
    rewards,
    clinic,
    services,
    operations,
    security,
    documents,
    forms,
    lineAssignments
  ] = await Promise.all([
    take<Vacation>('الإجازات', getVacationsByPersonnel(personnelId)),
    take<PenaltyRecord>('الجزاءات', getPenaltiesByPersonnel(personnelId)),
    take<RewardRecord>('المكافآت', getRewardsByPersonnel(personnelId)),
    take<ClinicRecord>('العيادة', getClinicByPersonnel(personnelId)),
    take<ServiceRecord>('الخدمات', getServicesByPersonnel(personnelId)),
    take<OperationRecord>('العمليات', getOperationsByPersonnel(personnelId)),
    take<SecurityRecord>('الأمن', getSecurityByPersonnel(personnelId)),
    take<Document>('المستندات', getDocumentsByPersonnel(personnelId)),
    take<Form>('النماذج', getFormsByPersonnel(personnelId)),
    take<LineAssignment>('تعيينات الخط', getLineAssignments({ personnelId }))
  ])

  return {
    personnel: personnelRes.data,
    vacations,
    penalties,
    rewards,
    clinic,
    services,
    operations,
    security,
    documents,
    forms,
    lineAssignments,
    failed
  }
}

function section(title: string, headers: string[], rows: string[][], emptyNote?: string): string {
  const body =
    rows.length === 0
      ? `<tr><td colspan="${headers.length}" class="empty">${emptyNote || 'لا يوجد سجلات'}</td></tr>`
      : rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
  return `
    <h2>${title} (${rows.length})</h2>
    <table>
      <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
      ${body}
    </table>`
}

function buildDossierHTML(d: DossierData, printedBy: string): string {
  const p = d.personnel
  const info: [string, string][] = [
    ['الاسم', val(p.fullName)],
    ['الرتبة', val(displayRank(p.rank, p.personnelType) || p.rank)],
    ['الرقم العسكري', val(p.militaryId)],
    ['الرقم القومي', val(p.nationalId)],
    ['القسم / الإدارة', val(p.unit)],
    ['النوع', val(p.personnelType)],
    ['الحالة', val(p.status)],
    ['تاريخ الميلاد', fmtDate(p.birthDate)],
    ['محل الميلاد', val(p.birthPlace)],
    ['محل الإقامة', val(p.residencePlace)],
    ['المهنة قبل التجنيد', val(p.workBeforeEnlistment)],
    ['المؤهل', val(p.qualification)],
    ['المستوى التعليمي', val(p.education)],
    ['تاريخ الالتحاق بالخدمة', fmtDate(p.enlistmentDate)],
    ['تاريخ التسريح', fmtDate(p.dischargeDate)],
    ['تاريخ الضم / التأميد', fmtDate(p.joiningDate)],
    ['مدة الخدمة', val(p.serviceDuration)],
    ['فصيلة الدم', val(p.bloodType)],
    ['السلاح', val(p.weapon)],
    ['رقم الشرطة', val(p.policeNumber)],
    ['الهاتف', val(p.phone)],
    ['العنوان', val(p.address)],
    ['شخص للطوارئ', val(p.emergencyContact)],
    ['هاتف الطوارئ', val(p.emergencyPhone)]
  ]

  const failedNote =
    d.failed.length > 0
      ? `<p class="warn">تعذر تحميل: ${d.failed.map(esc).join('، ')}</p>`
      : ''

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>ملف العسكري - ${esc(p.fullName)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; direction: rtl; color: #111; }
    h1 { text-align: center; margin-bottom: 4px; }
    .sub { text-align: center; color: #555; margin-bottom: 16px; font-size: 13px; }
    h2 { background: #1a1a2e; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 15px; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 12px; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: right; }
    th { background: #eee; }
    .empty { text-align: center; color: #777; }
    .warn { background: #fff3cd; border: 1px solid #e0a800; padding: 8px 12px; border-radius: 6px; font-size: 12px; }
    .footer { margin-top: 20px; font-size: 11px; color: #555; text-align: left; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>الملف الشامل للعسكري</h1>
  <div class="sub">${esc(p.fullName)} — ${esc(displayRank(p.rank, p.personnelType) || p.rank)} — ${esc(p.militaryId)}</div>
  ${failedNote}

  <h2>البيانات الأساسية</h2>
  <table>
    ${info.map(([k, v]) => `<tr><th style="width:30%">${k}</th><td>${v}</td></tr>`).join('')}
  </table>

  ${section('الإجازات', ['النوع', 'من', 'إلى (العودة)', 'خصم / مد', 'الحالة', 'ملاحظات'],
    d.vacations.map((v) => {
      const adjust = [
        v.deductionDays ? `خصم ${v.deductionDays}` : '',
        v.extensionDays ? `مد ${v.extensionDays}` : ''
      ].filter(Boolean).join(' / ') || '—'
      return [
        val(v.vacationType),
        fmtDate(v.startDate),
        fmtDate(effectiveReturnYmd(v.expectedReturnDate, v.deductionDays, v.extensionDays)),
        adjust,
        val(v.status),
        val(v.notes)
      ]
    }))}

  ${section('الجزاءات', ['النوع', 'التاريخ', 'ملاحظات'],
    d.penalties.map((r) => [val(r.penaltyType), fmtDate(r.penaltyDate), val(r.notes)]))}

  ${section('المكافآت', ['النوع', 'التاريخ', 'ملاحظات'],
    d.rewards.map((r) => [val(r.rewardType), fmtDate(r.rewardDate), val(r.notes)]))}

  ${section('العيادة', ['نوع الكشف', 'التاريخ', 'التشخيص', 'العلاج', 'ملاحظات'],
    d.clinic.map((r) => [val(r.examinationType), fmtDate(r.examinationDate), val(r.diagnosis), val(r.treatment), val(r.notes)]))}

  ${section('الخدمات', ['اليوم', 'من - إلى', 'المكان', 'القسم', 'ملاحظات'],
    d.services.map((r) => [fmtDate(r.serviceDay), `${val(r.startTime)} - ${val(r.endTime)}`, val(r.location), val(r.department), val(r.notes)]))}

  ${section('العمليات', ['المهمة', 'المكان', 'التاريخ', 'الحالة'],
    d.operations.map((r) => [val(r.missionName), val(r.location), fmtDate(r.missionDate), val(r.status)]))}

  ${section('الأمن', ['النوع', 'التاريخ', 'التفاصيل', 'ملاحظات'],
    d.security.map((r) => [val(r.type), fmtDate(r.situationDate), val(r.details), val(r.notes)]))}

  ${section('تعيينات الخط', ['النقطة', 'العمالة', 'الحالة', 'ملاحظات'],
    d.lineAssignments.map((a) => [val(a.linePoint?.name), val(a.shift?.name), val(a.status), val(a.notes)]))}

  ${section('المستندات', ['النوع', 'اسم الملف', 'تاريخ الرفع'],
    d.documents.map((x) => [val(x.type), val(x.fileName), fmtDate(x.uploadedAt)]))}

  ${section('النماذج', ['النوع', 'الاسم', 'الحالة', 'التاريخ'],
    d.forms.map((x) => [val(x.formType), val(x.formName), val(x.status), fmtDate(x.createdAt)]))}

  <div class="footer">طُبع بواسطة: ${esc(printedBy)} — بتاريخ: ${esc(new Date().toLocaleString('ar-EG'))}</div>
</body>
</html>`
}

export async function printPersonnelDossier(
  personnelId: string,
  printedBy: string
): Promise<{ filePath?: string; canceled?: boolean }> {
  const data = await fetchDossier(personnelId)
  const html = buildDossierHTML(data, printedBy)

  // 1) تطبيق سطح المكتب: PDF أصلي + حوار حفظ
  if (typeof window !== 'undefined' && window.api?.printToPDF) {
    const safeName = (data.personnel.fullName || 'عسكري').replace(/[\\/:*?"<>|]/g, '_')
    const result = await window.api.printToPDF({
      html,
      fileName: `ملف-العسكري-${safeName}.pdf`
    })
    if (result?.error && !result?.canceled) {
      throw new Error(result.error)
    }
    return result
  }

  // 2) المتصفح (موبايل/تابلت): تبويب قابل للطباعة + زرار طباعة (حفظ PDF من حوار المتصفح)
  if (typeof window !== 'undefined') {
    const bar =
      '<div style="position:sticky;top:0;background:#1a1a2e;padding:10px;text-align:center;">' +
      '<button onclick="window.print()" style="background:#fff;color:#1a1a2e;border:none;border-radius:8px;padding:10px 28px;font-size:15px;font-weight:bold;cursor:pointer;">🖨️ اطبع / احفظ PDF</button></div>'
    const browserHtml = html.replace('<body>', `<body>${bar}`)
    const w = window.open('', '_blank', 'noopener')
    if (!w) {
      throw new Error('المتصفح منع فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة ثم حاول مجددًا')
    }
    w.document.write(browserHtml)
    w.document.close()
    w.focus()
    return {}
  }

  throw new Error('الطباعة غير متاحة في هذه البيئة')
}
