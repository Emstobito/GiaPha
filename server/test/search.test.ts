import { describe, expect, it } from 'vitest';
import { normalizeVi, searchPersons } from '../src/domain/search.js';
import { sampleIndex } from './helpers.js';

describe('tìm kiếm tiếng Việt', () => {
  it('bỏ dấu, chữ đ, khoảng trắng thừa', () => {
    expect(normalizeVi('  Đỗ   Thị  E ')).toBe('do thi e');
    expect(normalizeVi('Nguyễn Văn Năm')).toBe('nguyen van nam');
  });

  it('gõ không dấu / chữ hoa vẫn tìm ra, mọi từ đều phải khớp', () => {
    const { index, generations, ids } = sampleIndex();
    expect(searchPersons(index, generations, 'NGUYEN van nam').map((h) => h.id)).toEqual([ids.nam]);
    expect(searchPersons(index, generations, 'do e')).toEqual([{ id: ids.namVo, fullName: 'Đỗ Thị E', generation: 4 }]);
    expect(searchPersons(index, generations, '   ')).toEqual([]);
  });

  it('tìm được theo tên khác (tên huý)', () => {
    const { index, generations, ids } = sampleIndex();
    expect(searchPersons(index, generations, 'huy mau gia').map((h) => h.id)).toEqual([ids.to]);
  });
});
