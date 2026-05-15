/** HTML date input: yyyy-mm-dd */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** DB / 表示用: yyyy/mm/dd → yyyy-mm-dd */
export function slashDateToIso(slash: string): string {
  const [y, m, d] = slash.split('/');
  if (!y || !m || !d) return todayIsoDate();
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** yyyy-mm-dd → yyyy/mm/dd */
export function isoDateToSlash(iso: string): string {
  return iso.replace(/-/g, '/');
}

/**
 * 作業内容一覧の開始・終了表示（年月日 + 時分）
 * task_date が無い既存行は pageFallbackIso（ページの対象日）で補完
 */
export function formatTaskDateTime(
  taskDateSlash: string | undefined,
  hm: string,
  pageFallbackIso: string
): string {
  const datePart = taskDateSlash ?? isoDateToSlash(pageFallbackIso);
  return `${datePart} ${hm}`;
}
