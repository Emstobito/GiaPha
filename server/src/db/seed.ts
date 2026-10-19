import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { count } from 'drizzle-orm';
import { DB_FILE } from '../config.js';
import { openDb } from './client.js';
import { insertSampleFamily } from './sample-family.js';
import { persons } from './schema.js';

// Chỉ nạp vào DB TRỐNG — tránh lẫn dữ liệu giả vào gia phả thật.
mkdirSync(dirname(DB_FILE), { recursive: true });
const { db, sqlite } = openDb(DB_FILE);
const existing = db.select({ n: count() }).from(persons).get()?.n ?? 0;
if (existing > 0) {
  console.error(`DB đã có ${existing} người (${DB_FILE}) — không nạp dữ liệu mẫu để tránh lẫn với dữ liệu thật.`);
  sqlite.close();
  process.exit(1);
}
insertSampleFamily(db);
console.log(`Đã nạp dữ liệu mẫu giả vào ${DB_FILE}`);
sqlite.close();
