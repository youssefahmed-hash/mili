// توحيد عرض الرتب/الدرجات — عرض فقط، بدون تغيير أي قيم مخزنة أو منطق صلاحيات.
// القاعدة: رتب صف الضابط (عريف/رقيب/رقيب أول/مساعد/مساعد أول) مع النوع داخلية → أمين شرطة.

export const NCO_RANKS = ['عريف', 'رقيب', 'رقيب أول', 'مساعد', 'مساعد أول'] as const;

export const isNcoRank = (rank?: string | null): boolean => {
  if (!rank) return false;
  return (NCO_RANKS as readonly string[]).includes(rank);
};

/** اسم الرتبة للعرض حسب نوع الفرد */
export const displayRank = (rank?: string | null, personnelType?: string | null): string => {
  if (!rank) return '';
  if (personnelType === 'داخلية' && isNcoRank(rank)) return 'أمين شرطة';
  return rank;
};

/** اسم الدرجة للعرض حسب نوع المستخدم */
export const displayDegree = (degree?: string | null, userType?: string | null): string => {
  if (!degree) return '';
  if (userType === 'داخلية' && degree === 'صف ضابط') return 'أمين شرطة';
  return degree;
};
