/**
 * تطبيع النص العربي للبحث الذكي:
 * - توحيد الهمزات (أ إ آ ٱ → ا)
 * - التاء المربوطة (ة → ه) والياء (ى → ي) والهمزات على الواو/الياء (ؤ → و، ئ → ي)
 * - إزالة التشكيل والتطويل
 * - إزالة المسافات (عشان «عبد الرحمن» = «عبدالرحمن»)
 * النتيجة: مقارنة متسامحة مع الفروق الكتابية البسيطة.
 */

// التشكيل (الفتحة/الضمة/الكسرة/السكون/الشدة/التنوين...) + التطويل
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g

export const normalizeArabic = (value: string | null | undefined): string => {
  if (!value) return ''
  return value
    .toString()
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, '')
    .toLowerCase()
}

/**
 * تقسيم نص البحث لكلمات مُطبَّعة.
 * كل كلمة لازم تتحقق لوحدها (AND) — يعني «يوسف منشاء» = اسمه يوسف وفي قسم منشاء.
 */
export const splitSearchQuery = (query: string | null | undefined): string[] =>
  (query || '')
    .trim()
    .split(/\s+/)
    .map((t) => normalizeArabic(t))
    .filter(Boolean)
    .slice(0, 8)

/** هل النص فيه كل كلمات البحث بعد التطبيع؟ (بحث جزئي متسامح + تجميع بالكلمات) */
export const matchesSearch = (
  text: string | null | undefined,
  query: string | null | undefined
): boolean => {
  const tokens = splitSearchQuery(query)
  if (tokens.length === 0) return true
  const hay = normalizeArabic(text)
  return tokens.every((t) => hay.includes(t))
}

/** نفس البحث لكن على أكثر من حقل (اسم / رقم عسكري / قسم / رتبة...) */
export const matchesAnySearch = (
  values: Array<string | null | undefined>,
  query: string | null | undefined
): boolean => {
  const tokens = splitSearchQuery(query)
  if (tokens.length === 0) return true
  const hay = values.map((v) => normalizeArabic(v)).join(' ')
  return tokens.every((t) => hay.includes(t))
}
