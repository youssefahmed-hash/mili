"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizedLike = exports.normalizedColumnSql = exports.normalizeArabic = void 0;
/**
 * تطبيع النص العربي للبحث — نفس قواعد الواجهة (arabicSearch.ts في العميل):
 * توحيد الهمزات/ة/ى/ؤ/ئ، إزالة التشكيل والتطويل والمسافات.
 */
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const normalizeArabic = (value) => {
    if (!value)
        return "";
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
exports.normalizeArabic = normalizeArabic;
/**
 * تعبير SQL يطبّع عمود نصي بنفس قواعد normalizeArabic
 * (نستخدمه في شروط البحث داخل قاعدة البيانات).
 */
const normalizedColumnSql = (column) => `regexp_replace(translate(translate(translate(translate(translate(${column}, 'أإآٱ', 'اااا'), 'ة', 'ه'), 'ى', 'ي'), 'ؤئ', 'وي'), 'ًٌٍَُِّْـ', ''), '[[:space:]]+', '', 'g')`;
exports.normalizedColumnSql = normalizedColumnSql;
/** نمط LIKE لبحث جزئي على نص مُطبَّع مسبقًا */
const normalizedLike = (term) => `%${(0, exports.normalizeArabic)(term)}%`;
exports.normalizedLike = normalizedLike;
