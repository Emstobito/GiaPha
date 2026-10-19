import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { fieldVisibility } from '../src/db/schema.js';
import { loadVisibility, toPersonView } from '../src/domain/visibility.js';
import { sampleIndex } from './helpers.js';

function view(viewer: 'guest' | 'member' | 'admin', key: 'nam' | 'to' | 'sau', ctx = sampleIndex()) {
  const { db, index, ids, generations } = ctx;
  const id = ids[key];
  return toPersonView(index.personById.get(id)!, viewer, loadVisibility(db), generations.get(id) ?? null);
}

describe('ẩn/hiện trường theo đối tượng xem (mặc định)', () => {
  it('khách: người còn sống chỉ có tên/giới tính/đời/còn sống — trường ẩn KHÔNG có trong object', () => {
    const v = view('guest', 'nam');
    expect(Object.keys(v).sort()).toEqual(['fullName', 'gender', 'generation', 'id', 'isLiving']);
  });

  it('khách: người đã mất thấy ngày giỗ, tên khác, nơi sinh nhưng không thấy liên hệ', () => {
    const v = view('guest', 'to');
    expect(v.deathDate).toEqual({ year: 1920, month: 3, day: 12, lunar: true });
    expect(v.otherNames).toBe('Huý: Mẫu Giả');
    expect('contact' in v).toBe(false);
  });

  it('thành viên: thấy đầy đủ người còn sống', () => {
    const v = view('member', 'nam');
    expect(v.contact).toBe('0900 000 001');
    expect(v.birthDate).toEqual({ year: 1965, month: 4, day: 2, lunar: false });
  });

  it('quản trị: luôn thấy mọi trường kể cả khi cấu hình tắt hết', () => {
    const ctx = sampleIndex();
    ctx.db.update(fieldVisibility).set({ visible: false }).run();
    const v = view('admin', 'nam', ctx);
    expect(v.contact).toBe('0900 000 001');
    expect(v.birthPlace).toBe('Thành phố Mẫu');
  });
});

describe('ghi đè & thay đổi cấu hình', () => {
  it('người bị đánh dấu ẩn công khai: khách chỉ thấy tên, thành viên vẫn thấy chi tiết', () => {
    const ctx = sampleIndex();
    const guest = view('guest', 'sau', ctx);
    expect(guest.detailsHidden).toBe(true);
    expect('birthDate' in guest).toBe(false);
    expect(view('member', 'sau', ctx).birthDate).toEqual({ year: 1968, lunar: false });
  });

  it('quản trị tắt ngày mất cho khách (người đã mất) → trường biến mất ngay', () => {
    const ctx = sampleIndex();
    ctx.db.update(fieldVisibility).set({ visible: false }).where(and(
      eq(fieldVisibility.field, 'deathDate'), eq(fieldVisibility.audience, 'guest'), eq(fieldVisibility.subject, 'deceased'),
    )).run();
    expect('deathDate' in view('guest', 'to', ctx)).toBe(false);
    expect(view('member', 'to', ctx).deathDate).toBeTruthy();
  });

  it('quản trị bật ngày sinh cho khách (người còn sống) → xuất hiện', () => {
    const ctx = sampleIndex();
    ctx.db.update(fieldVisibility).set({ visible: true }).where(and(
      eq(fieldVisibility.field, 'birthDate'), eq(fieldVisibility.audience, 'guest'), eq(fieldVisibility.subject, 'living'),
    )).run();
    expect(view('guest', 'nam', ctx).birthDate).toEqual({ year: 1965, month: 4, day: 2, lunar: false });
  });
});
