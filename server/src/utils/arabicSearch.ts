/**
 * تطبيع النص العربي للبحث — نفس قواعد الواجهة (arabicSearch.ts في العميل):
 * توحيد الهمزات/ة/ى/ؤ/ئ، إزالة التشكيل والتطويل والمسافات.
 */
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g

export const normalizeArabic = (value: string | null | undefined): string => {
    if (!value) return "";
    return value
        .toString()
        .replace(DIACRITICS, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ي")
        .replace(/\s+/g, "")
        .toLowerCase();
};

/**
 * تعبير SQL يطبّع عمود نصي بنفس قواعد normalizeArabic
 * (نستخدمه في شروط البحث داخل قاعدة البيانات).
 */
export const normalizedColumnSql = (column: string): string =>
    `regexp_replace(translate(translate(translate(translate(translate(${column}, 'أإآٱ', 'اااا'), 'ة', 'ه'), 'ى', 'ي'), 'ؤئ', 'وي'), 'ًٌٍَُِّْـ', ''), '[[:space:]]+', '', 'g')`;

/** نمط LIKE لبحث جزئي على نص مُطبَّع مسبقًا */
export const normalizedLike = (term: string): string => `%${normalizeArabic(term)}%`;
