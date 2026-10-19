import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DB_FILE, PORT } from './config.js';
import { openDb } from './db/client.js';
import { createApp } from './http/app.js';

mkdirSync(dirname(DB_FILE), { recursive: true });
const { db } = openDb(DB_FILE);
createApp(db).listen(PORT, () => {
  console.log(`GiaPha API: http://localhost:${PORT}  (DB: ${DB_FILE})`);
});
