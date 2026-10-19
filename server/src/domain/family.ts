import type { Db } from '../db/client.js';
import { parentChild, persons, unions } from '../db/schema.js';

export type PersonRow = typeof persons.$inferSelect;
export type UnionRow = typeof unions.$inferSelect;
export type ParentChildRow = typeof parentChild.$inferSelect;

export interface FamilyData {
  persons: PersonRow[];
  unions: UnionRow[];
  parentChild: ParentChildRow[];
}

/** Nạp toàn bộ dòng họ 1 lần — vài nghìn dòng SQLite vẫn chỉ vài ms, đơn giản hơn truy vấn đệ quy. */
export function loadFamily(db: Db): FamilyData {
  return {
    persons: db.select().from(persons).all(),
    unions: db.select().from(unions).all(),
    parentChild: db.select().from(parentChild).all(),
  };
}
