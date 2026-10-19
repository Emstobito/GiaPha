import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import * as schema from './schema.js';
import { ensureDefaultVisibility } from '../domain/visibility.js';

export type Db = BetterSQLite3Database<typeof schema>;

const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

/** Mở (hoặc tạo) DB, chạy migration, bổ sung cấu hình ẩn/hiện mặc định còn thiếu. ':memory:' cho test. */
export function openDb(file: string): { db: Db; sqlite: Database.Database } {
  const sqlite = new Database(file);
  if (file !== ':memory:') sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  ensureDefaultVisibility(db);
  return { db, sqlite };
}
