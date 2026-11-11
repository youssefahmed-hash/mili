// دوال تواريخ آمنة للـtimezone — كل تواريخ الإجازات بصيغة YYYY-MM-DD
// القاعدة: لا نستخدم new Date(str) مباشرة على تواريخ تقويمية، لأن
// التحويل بين UTC والمحلي قد يزيح اليوم (خصوصاً DST وتوقيتات خلف UTC).

/** تحويل YYYY-MM-DD إلى Date بمُنتصف الليل المحلي (آمن للعرض والحساب المحلي) */
export function toLocalDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null
  const s = dateStr.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const fallback = new Date(dateStr)
    return isNaN(fallback.getTime()) ? null : fallback
  }
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** عرض تاريخ بصيغة ar-EG — مطابق بصرياً للسابق في توقيت القاهرة، وصحيح في كل المناطق */
export function formatDateAr(dateStr?: string | null): string {
  const d = toLocalDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('ar-EG')
}

/** إضافة أيام على تاريخ YYYY-MM-DD بحساب UTC (لا يتأثر بـDST) */
export function addDaysYmd(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/** تجهيز قيمة لحقل <input type="date"> من أي صيغة راجعة من الـAPI */
export function toYmdInput(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

/** مدة الإجازة بالأيام (يوم النزول ويوم العودة محسوبان) */
export function leaveDurationDays(startStr?: string | null, retStr?: string | null): number {
  if (!startStr || !retStr) return 0
  const [sy, sm, sd] = startStr.slice(0, 10).split('-').map(Number)
  const [ry, rm, rd] = retStr.slice(0, 10).split('-').map(Number)
  const diff = Math.round(
    (Date.UTC(ry, rm - 1, rd) - Date.UTC(sy, sm - 1, sd)) / 86400000
  )
  return Math.max(1, diff + 1)
}

/** تاريخ العودة الفعلي = العودة المتوقعة + أيام المد − أيام الخصم */
export function effectiveReturnYmd(
  expectedReturnDate?: string | null,
  deductionDays?: number | null,
  extensionDays?: number | null
): string {
  if (!expectedReturnDate) return ''
  const delta = Math.max(0, extensionDays || 0) - Math.max(0, deductionDays || 0)
  return delta === 0 ? expectedReturnDate.slice(0, 10) : addDaysYmd(expectedReturnDate, delta)
}

/** تاريخ اليوم بصيغة YYYY-MM-DD حسب التوقيت المحلي للجهاز */
export function todayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
