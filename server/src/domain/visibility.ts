import {
  AUDIENCES,
  HIDEABLE_FIELDS,
  SUBJECTS,
  type Audience,
  type HideableField,
  type PartialDate,
  type PersonView,
  type Subject,
  type ViewerRole,
} from '@giapha/shared';
import type { Db } from '../db/client.js';
import { fieldVisibility } from '../db/schema.js';
import type { PersonRow } from './family.js';

export type VisibilityConfig = Record<Audience, Record<Subject, Record<HideableField, boolean>>>;

const all = (visible: boolean) =>
  Object.fromEntries(HIDEABLE_FIELDS.map((f) => [f, visible])) as Record<HideableField, boolean>;

/** Mặc định an toàn: khách chỉ thấy tên/đời/quan hệ của người còn sống; người đã mất hiện đầy đủ trừ liên hệ.
 *  Thành viên đã đăng nhập thấy tất cả. Quản trị đổi được trong trang cấu hình. */
export const DEFAULT_VISIBILITY: VisibilityConfig = {
  guest: { living: all(false), deceased: { ...all(true), contact: false } },
  member: { living: all(true), deceased: all(true) },
};

export function ensureDefaultVisibility(db: Db): void {
  const rows = AUDIENCES.flatMap((audience) =>
    SUBJECTS.flatMap((subject) =>
      HIDEABLE_FIELDS.map((field) => ({
        field,
        audience,
        subject,
        visible: DEFAULT_VISIBILITY[audience][subject][field],
      })),
    ),
  );
  db.insert(fieldVisibility).values(rows).onConflictDoNothing().run();
}

export function loadVisibility(db: Db): VisibilityConfig {
  const config: VisibilityConfig = structuredClone(DEFAULT_VISIBILITY);
  for (const row of db.select().from(fieldVisibility).all()) {
    if ((HIDEABLE_FIELDS as readonly string[]).includes(row.field)) {
      config[row.audience][row.subject][row.field as HideableField] = row.visible;
    }
  }
  return config;
}

function partialDate(year: number | null, month: number | null, day: number | null, lunar: boolean): PartialDate | null {
  if (year == null && month == null && day == null) return null;
  const d: PartialDate = { lunar };
  if (year != null) d.year = year;
  if (month != null) d.month = month;
  if (day != null) d.day = day;
  return d;
}

function fieldValue(p: PersonRow, field: HideableField): PersonView[HideableField] {
  switch (field) {
    case 'otherNames': return p.otherNames;
    case 'birthDate': return partialDate(p.birthYear, p.birthMonth, p.birthDay, p.birthLunar);
    case 'birthPlace': return p.birthPlace;
    case 'deathDate': return partialDate(p.deathYear, p.deathMonth, p.deathDay, p.deathLunar);
    case 'notes': return p.notes;
    case 'contact': return p.contact;
    case 'photo': return p.photo;
  }
}

/**
 * Chuyển 1 người sang dạng gửi ra ngoài, CHỈ gồm các trường người xem được phép thấy. Trường bị ẩn
 * không xuất hiện trong object (không phải để undefined) → không bao giờ rời máy chủ.
 */
export function toPersonView(p: PersonRow, viewer: ViewerRole, config: VisibilityConfig, generation: number | null): PersonView {
  const view: PersonView = { id: p.id, fullName: p.fullName, gender: p.gender, isLiving: p.isLiving, generation };
  if (viewer === 'guest' && p.hidePublic) {
    view.detailsHidden = true;
    return view;
  }
  const subject: Subject = p.isLiving ? 'living' : 'deceased';
  for (const field of HIDEABLE_FIELDS) {
    if (viewer === 'admin' || config[viewer][subject][field]) {
      (view as unknown as Record<string, unknown>)[field] = fieldValue(p, field);
    }
  }
  return view;
}
