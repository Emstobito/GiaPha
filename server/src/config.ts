import { fileURLToPath } from 'node:url';

export const PORT = Number(process.env.PORT ?? 3700);
/** Mặc định E:\GiaPha\data\giapha.sqlite — thư mục data/ bị git-ignore vì chứa dữ liệu thật của dòng họ. */
export const DB_FILE = process.env.GIAPHA_DB ?? fileURLToPath(new URL('../../data/giapha.sqlite', import.meta.url));
