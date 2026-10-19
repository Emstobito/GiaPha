import type { SearchHit } from '@giapha/shared';
import type { FamilyIndex } from './tree.js';

/** Bỏ dấu tiếng Việt + chữ thường để gõ "nguyen van nam" vẫn tìm ra "Nguyễn Văn Năm". */
export function normalizeVi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mọi từ trong câu tìm đều phải có trong họ tên hoặc tên khác (không cần đúng thứ tự). */
export function searchPersons(index: FamilyIndex, generations: Map<number, number>, query: string, limit = 20): SearchHit[] {
  const tokens = normalizeVi(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const p of index.personById.values()) {
    const haystack = normalizeVi(`${p.fullName} ${p.otherNames ?? ''}`);
    if (tokens.every((t) => haystack.includes(t))) {
      hits.push({ id: p.id, fullName: p.fullName, generation: generations.get(p.id) ?? null });
      if (hits.length >= limit) break;
    }
  }
  return hits;
}
