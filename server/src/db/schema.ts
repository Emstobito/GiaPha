import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
};

/** Ngày lưu tách năm/tháng/ngày (đều có thể trống) + cờ âm lịch — gia phả hay chỉ biết 1 phần. */
export const persons = sqliteTable('persons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fullName: text('full_name').notNull(),
  otherNames: text('other_names'),
  gender: text('gender', { enum: ['male', 'female', 'unknown'] }).notNull().default('unknown'),
  isLiving: integer('is_living', { mode: 'boolean' }).notNull().default(true),
  birthYear: integer('birth_year'),
  birthMonth: integer('birth_month'),
  birthDay: integer('birth_day'),
  birthLunar: integer('birth_lunar', { mode: 'boolean' }).notNull().default(false),
  birthPlace: text('birth_place'),
  deathYear: integer('death_year'),
  deathMonth: integer('death_month'),
  deathDay: integer('death_day'),
  deathLunar: integer('death_lunar', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  contact: text('contact'),
  photo: text('photo'),
  /** Quản trị đánh dấu: ẩn toàn bộ chi tiết với khách (vd người không muốn công khai). */
  hidePublic: integer('hide_public', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

/** Hôn nhân. partner2 trống = cha/mẹ đơn thân (vẫn cần union để gắn con). */
export const unions = sqliteTable('unions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  partner1Id: integer('partner1_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  partner2Id: integer('partner2_id').references(() => persons.id, { onDelete: 'cascade' }),
  /** Thứ tự hôn nhân của partner1 (1 = vợ/chồng cả, 2 = vợ/chồng hai...). */
  orderIndex: integer('order_index').notNull().default(1),
  status: text('status', { enum: ['married', 'divorced', 'widowed'] }).notNull().default('married'),
  ...timestamps,
});

export const parentChild = sqliteTable(
  'parent_child',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    unionId: integer('union_id').notNull().references(() => unions.id, { onDelete: 'cascade' }),
    childId: integer('child_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['biological', 'adopted'] }).notNull().default('biological'),
    /** Thứ tự con (con trưởng = 1) để xếp trái → phải trên cây. */
    birthOrder: integer('birth_order'),
  },
  (t) => [uniqueIndex('parent_child_union_child').on(t.unionId, t.childId)],
);

/** Chi/nhánh = cây con tính từ 1 người gốc. */
export const branches = sqliteTable('branches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  rootPersonId: integer('root_person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: ['admin', 'editor'] }).notNull().default('editor'),
  ...timestamps,
});

export const userBranches = sqliteTable(
  'user_branches',
  {
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    branchId: integer('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.branchId] })],
);

/** Ma trận ẩn/hiện: trường × đối tượng xem (guest/member) × người còn sống/đã mất. */
export const fieldVisibility = sqliteTable(
  'field_visibility',
  {
    field: text('field').notNull(),
    audience: text('audience', { enum: ['guest', 'member'] }).notNull(),
    subject: text('subject', { enum: ['living', 'deceased'] }).notNull(),
    visible: integer('visible', { mode: 'boolean' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.field, t.audience, t.subject] })],
);

export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
