import type { PartialDate, PersonView } from '@giapha/shared';

export function formatDate(d: PartialDate | null | undefined): string | null {
  if (!d) return null;
  let text: string;
  if (d.day != null && d.month != null && d.year != null) text = `${d.day}/${d.month}/${d.year}`;
  else if (d.day != null && d.month != null) text = `${d.day}/${d.month}`;
  else if (d.month != null && d.year != null) text = `tháng ${d.month}/${d.year}`;
  else if (d.year != null) text = `năm ${d.year}`;
  else return null;
  return d.lunar ? `${text} (âm lịch)` : text;
}

/** Dòng năm sinh – năm mất ngắn gọn trên ô của cây. Trường bị ẩn thì không có dữ liệu → không hiện. */
export function lifeSpan(p: PersonView): string | null {
  const born = p.birthDate?.year;
  const died = p.deathDate?.year;
  if (born == null && died == null) return null;
  if (p.isLiving) return born != null ? `Sinh ${born}` : null;
  return `${born ?? '?'} – ${died ?? '?'}`;
}

/** Chữ cái đại diện trên avatar: chữ đầu của TÊN (từ cuối) — người Việt gọi nhau bằng tên, không bằng họ. */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  return (words[words.length - 1]?.[0] ?? '?').toUpperCase();
}
