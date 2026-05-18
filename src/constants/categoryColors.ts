export const CATEGORY_SMALL_COLORS: Record<string, string> = {
  'CAT-01-01': '#378ADD',
  'CAT-01-02': '#1D9E75',
  'CAT-01-03': '#85B7EB',
  'CAT-01-04': '#534AB7',
  'CAT-02-01': '#EF9F27',
  'CAT-02-02': '#D85A30',
  'CAT-02-03': '#D4537E',
  'CAT-03-01': '#888780',
  'CAT-03-02': '#5F5E5A',
  'CAT-03-03': '#444441',
  'CAT-03-04': '#7F77DD',
};

export const DEFAULT_CATEGORY_SMALL_COLOR = '#CCCCCC';

export function getCategorySmallColor(id: string): string {
  return CATEGORY_SMALL_COLORS[id] ?? DEFAULT_CATEGORY_SMALL_COLOR;
}

export const CATEGORY_SMALL_NAME_COLORS: Record<string, string> = {
  'チルド':   '#378ADD',
  '若菜':     '#1D9E75',
  '生鮮':     '#85B7EB',
  '冷凍':     '#534AB7',
  '通過':     '#EF9F27',
  '在庫入荷': '#D85A30',
  '在庫出荷': '#D4537E',
  '0便':      '#888780',
  '1便':      '#5F5E5A',
  '2便':      '#444441',
  '3便':      '#7F77DD',
};

export function getCategorySmallNameColor(name: string): string {
  return CATEGORY_SMALL_NAME_COLORS[name] ?? DEFAULT_CATEGORY_SMALL_COLOR;
}
