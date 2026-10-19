import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { PersonDetail, TreeResponse } from '@giapha/shared';
import { createApp } from '../src/http/app.js';
import { sampleDb } from './helpers.js';

describe('API đọc (khách chưa đăng nhập)', () => {
  it('GET /api/tree: cả cây, dữ liệu người còn sống đã được lọc NGAY TRONG JSON', async () => {
    const { db, ids } = sampleDb();
    const res = await request(createApp(db)).get('/api/tree').expect(200);
    const body = res.body as TreeResponse;
    expect(body.roots.map((r) => r.personId)).toEqual([ids.to]);
    expect(Object.keys(body.persons)).toHaveLength(18);
    expect(res.text).not.toContain('0900 000 001');
    expect(res.text).not.toContain('Thành phố Mẫu');
    expect(body.persons[ids.to]?.deathDate).toEqual({ year: 1920, month: 3, day: 12, lunar: true });
  });

  it('GET /api/tree?root=: chỉ 1 nhánh; root không tồn tại → 404', async () => {
    const { db, ids } = sampleDb();
    const app = createApp(db);
    const body = (await request(app).get(`/api/tree?root=${ids.ba}`).expect(200)).body as TreeResponse;
    expect(body.roots.map((r) => r.personId)).toEqual([ids.ba]);
    expect(body.persons[ids.bay]).toBeUndefined();
    await request(app).get('/api/tree?root=99999').expect(404);
  });

  it('GET /api/persons/:id: cha mẹ, vợ/chồng theo thứ tự, con (kể cả con nuôi)', async () => {
    const { db, ids } = sampleDb();
    const body = (await request(createApp(db)).get(`/api/persons/${ids.ca}`).expect(200)).body as PersonDetail;
    expect(body.parents.sort()).toEqual([ids.to, ids.toVo].sort());
    expect(body.spouses.map((s) => [s.personId, s.order])).toEqual([[ids.caVoCa, 1], [ids.caVoHai, 2]]);
    expect(body.children).toEqual([
      { personId: ids.ba, kind: 'biological' },
      { personId: ids.nuoi, kind: 'adopted' },
      { personId: ids.tu, kind: 'biological' },
    ]);
  });

  it('GET /api/persons/:id: không tồn tại → 404; người ẩn công khai chỉ còn tên', async () => {
    const { db, ids } = sampleDb();
    const app = createApp(db);
    await request(app).get('/api/persons/99999').expect(404);
    const body = (await request(app).get(`/api/persons/${ids.sau}`).expect(200)).body as PersonDetail;
    expect(body.person).toEqual({ id: ids.sau, fullName: 'Nguyễn Thị Sáu', gender: 'female', isLiving: true, generation: 4, detailsHidden: true });
  });

  it('GET /api/search', async () => {
    const { db, ids } = sampleDb();
    const body = (await request(createApp(db)).get('/api/search?q=van ut').expect(200)).body;
    expect(body).toEqual([{ id: ids.ut, fullName: 'Nguyễn Văn Út', generation: 5 }]);
  });
});
