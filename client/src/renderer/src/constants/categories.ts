import type { TabItem } from '../components/ui/Tabs'

export const CATEGORY_TABS: TabItem[] = [
  { id: 'soldier', label: 'جندي' },
  { id: 'non_commissioned_officer', label: 'صف ضابط' },
  { id: 'officer', label: 'ضابط' }
]

export const RECORD_TABS: TabItem[] = [
  { id: 'all', label: 'الكل' },
  { id: 'soldier', label: 'جندي' },
  { id: 'non_commissioned_officer', label: 'صف ضابط' },
  { id: 'officer', label: 'ضابط' }
]

export const TAB_RANK_MAP: Record<string, string[]> = {
  all: [
    'جندي',
    'مستجد حربية',
    'مستجد داخلية',
    'صف ضابط',
    'عريف',
    'رقيب',
    'رقيب أول',
    'مساعد',
    'مساعد أول',
    'ضابط',
    'ملازم',
    'ملازم أول',
    'نقيب',
    'رائد',
    'مقدم',
    'عقيد',
    'عميد',
    'لواء'
  ],
  soldier: ['جندي', 'مستجد حربية', 'مستجد داخلية'],
  non_commissioned_officer: [
    'صف ضابط',
    'عريف',
    'رقيب',
    'رقيب أول',
    'مساعد',
    'مساعد أول',
    'أمين شرطة'
  ],
  officer: ['ضابط', 'ملازم', 'ملازم أول', 'نقيب', 'رائد', 'مقدم', 'عقيد', 'عميد', 'لواء']
}

export type RankCategory = 'soldier' | 'non_commissioned_officer' | 'officer'

export const getRankCategory = (rank: string): RankCategory => {
  if (TAB_RANK_MAP.officer.includes(rank)) return 'officer'
  if (TAB_RANK_MAP.non_commissioned_officer.includes(rank)) return 'non_commissioned_officer'
  return 'soldier'
}
