import type { Db } from './client.js';
import { branches, parentChild, persons, unions } from './schema.js';

type NewPerson = typeof persons.$inferInsert;

/**
 * DỮ LIỆU MẪU GIẢ để dev/test — KHÔNG phải người thật. 5 đời, có vợ hai, con nuôi (đồng thời là con ruột
 * của 1 nhánh khác trong họ), cha đơn thân, người còn sống bị ẩn chi tiết, ngày giỗ âm lịch.
 */
export function insertSampleFamily(db: Db) {
  const add = (p: NewPerson) =>
    db.insert(persons).values({ notes: 'Dữ liệu mẫu giả', ...p }).returning({ id: persons.id }).get().id;
  const marry = (partner1Id: number, partner2Id: number | null, orderIndex = 1) =>
    db.insert(unions).values({ partner1Id, partner2Id, orderIndex }).returning({ id: unions.id }).get().id;
  const child = (unionId: number, childId: number, birthOrder: number, kind: 'biological' | 'adopted' = 'biological') =>
    db.insert(parentChild).values({ unionId, childId, birthOrder, kind }).run();

  // Đời 1 — thuỷ tổ
  const to = add({ fullName: 'Nguyễn Văn Tổ', gender: 'male', isLiving: false, otherNames: 'Huý: Mẫu Giả',
    birthYear: 1850, birthPlace: 'Làng Mẫu', deathYear: 1920, deathMonth: 3, deathDay: 12, deathLunar: true });
  const toVo = add({ fullName: 'Trần Thị Mẫu', gender: 'female', isLiving: false, deathMonth: 8, deathDay: 5, deathLunar: true });
  const u1 = marry(to, toVo);

  // Đời 2
  const ca = add({ fullName: 'Nguyễn Văn Cả', gender: 'male', isLiving: false, birthYear: 1880, deathYear: 1950 });
  const hai = add({ fullName: 'Nguyễn Thị Hai', gender: 'female', isLiving: false, birthYear: 1885 });
  child(u1, ca, 1);
  child(u1, hai, 2);
  const caVoCa = add({ fullName: 'Lê Thị A', gender: 'female', isLiving: false });
  const caVoHai = add({ fullName: 'Phạm Thị B', gender: 'female', isLiving: false });
  const uCa1 = marry(ca, caVoCa, 1);
  const uCa2 = marry(ca, caVoHai, 2);
  const haiChong = add({ fullName: 'Đinh Văn Rể', gender: 'male', isLiving: false });
  const uHai = marry(haiChong, hai);

  // Đời 3
  const ba = add({ fullName: 'Nguyễn Văn Ba', gender: 'male', isLiving: false, birthYear: 1910, deathYear: 1980 });
  const tu = add({ fullName: 'Nguyễn Văn Tư', gender: 'male', isLiving: false, birthYear: 1915 });
  child(uCa1, ba, 1);
  child(uCa2, tu, 1);
  // Con ruột của Nguyễn Thị Hai, được Nguyễn Văn Cả nhận làm con nuôi → 2 vị trí trên cây.
  const nuoi = add({ fullName: 'Đinh Văn Nuôi', gender: 'male', isLiving: false, birthYear: 1912 });
  child(uHai, nuoi, 1);
  child(uCa1, nuoi, 2, 'adopted');

  // Đời 4
  const baVo = add({ fullName: 'Hoàng Thị C', gender: 'female', isLiving: false });
  const uBa = marry(ba, baVo);
  const nam = add({ fullName: 'Nguyễn Văn Năm', gender: 'male', isLiving: true, birthYear: 1965, birthMonth: 4,
    birthDay: 2, birthPlace: 'Thành phố Mẫu', contact: '0900 000 001' });
  const sau = add({ fullName: 'Nguyễn Thị Sáu', gender: 'female', isLiving: true, birthYear: 1968, hidePublic: true });
  child(uBa, nam, 1);
  child(uBa, sau, 2);
  const tuVo = add({ fullName: 'Vũ Thị D', gender: 'female', isLiving: false });
  const uTu = marry(tu, tuVo);
  const bay = add({ fullName: 'Nguyễn Văn Bảy', gender: 'male', isLiving: true, birthYear: 1960 });
  child(uTu, bay, 1);

  // Đời 5
  const namVo = add({ fullName: 'Đỗ Thị E', gender: 'female', isLiving: true, birthYear: 1970 });
  const uNam = marry(nam, namVo);
  const ut = add({ fullName: 'Nguyễn Văn Út', gender: 'male', isLiving: true, birthYear: 1995 });
  child(uNam, ut, 1);
  const uBayDon = marry(bay, null);
  const tam = add({ fullName: 'Nguyễn Văn Tám', gender: 'male', isLiving: true, birthYear: 1990 });
  child(uBayDon, tam, 1);

  const chiTruong = db.insert(branches).values({ name: 'Chi trưởng', rootPersonId: ba }).returning({ id: branches.id }).get().id;
  const chiThu = db.insert(branches).values({ name: 'Chi thứ', rootPersonId: tu }).returning({ id: branches.id }).get().id;

  return {
    to, toVo, ca, hai, caVoCa, caVoHai, haiChong, ba, tu, nuoi, baVo, nam, sau, tuVo, bay, namVo, ut, tam,
    unions: { u1, uCa1, uCa2, uHai, uBa, uTu, uNam, uBayDon },
    branches: { chiTruong, chiThu },
  };
}

export type SampleIds = ReturnType<typeof insertSampleFamily>;
