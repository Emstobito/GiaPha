# GiaPha

Viết cho AI đọc — không phải cho người. "System prompt" của dự án.

Ứng dụng web quản lý **gia phả dòng họ**: sơ đồ dạng **rễ cây** (thuỷ tổ ở trên, con cháu toả xuống), cả
dòng họ **xem công khai**, **đăng nhập mới được sửa**, **phân quyền sửa theo chi/nhánh**, quản trị **ẩn/hiện
từng trường thông tin**, nhập/xuất Excel + GEDCOM. Kế hoạch đầy đủ 7 giai đoạn: `C:\Users\ADMIN\.claude\plans\zany-watching-otter.md`. Tiến độ: `PROGRESS.md`.

## Stack
- TypeScript toàn bộ, **npm workspaces**: `shared/` (kiểu dùng chung), `server/` (API), `web/` (giao diện).
- Web: **React 19 + Vite 8 + React Flow (`@xyflow/react` 12)** + `d3-hierarchy` (bố cục). Dev `npm run dev:web` (:5173, proxy `/api` → :3700 — chạy kèm `dev:server`). KHÔNG ẩn logo React Flow (chỉ được ẩn khi mua Pro).
- Server: Node 22 + **Express 5** + **SQLite** (`better-sqlite3`) + **Drizzle ORM** (migration bằng `drizzle-kit`), chạy TS trực tiếp bằng `tsx`.
- **TypeScript 5.x** — CỐ Ý không dùng TS 7 (bản Go, npm tự kéo về nếu không ghim) vì `typescript-eslint`/`drizzle-kit` cần API JS của TS.
- Test: **Vitest** + `supertest` (gọi API thật qua HTTP, DB `:memory:`). Lint: ESLint flat config + typescript-eslint.
- Máy không có Docker → không dùng Postgres/container ở giai đoạn local.

## Lệnh
- `npm test` · `npm run typecheck` · `npm run lint` (chạy ở gốc `E:\GiaPha`).
- `npm run db:seed` — nạp dữ liệu MẪU GIẢ, tự từ chối nếu DB đã có người.
- `npm run dev:server` — API tại `http://localhost:3700` (đổi bằng `PORT`), DB `data/giapha.sqlite` (đổi bằng `GIAPHA_DB`).
- Sửa schema (`server/src/db/schema.ts`) → `npm run db:generate` sinh migration mới trong `server/drizzle/` (KHÔNG sửa tay migration đã có).

## Quy tắc cứng
- **Dữ liệu thật của dòng họ nằm trong `data/` — KHÔNG BAO GIỜ đưa vào git, backup GitHub (`E:\ClaudeEnvBackup` chỉ chép tài liệu), log, hay câu trả lời.** Test/dev chỉ dùng dữ liệu mẫu giả (`server/src/db/sample-family.ts`).
- **Lọc trường ẩn ở BACKEND** (`toPersonView`): trường không được phép xem KHÔNG có trong JSON trả về (không phải gửi rồi ẩn ở giao diện). Mọi API/xuất file mới trả thông tin người đều phải đi qua `toPersonView`.
- Trường cốt lõi để vẽ cây (họ tên, giới tính, đời, còn sống/đã mất, quan hệ) luôn hiện, không đưa vào `HIDEABLE_FIELDS`.
- Mọi API ghi (từ giai đoạn 4) phải: kiểm quyền theo nhánh (`branchMembers`), chặn vòng lặp tổ tiên (`wouldCreateCycle`), ghi `audit_log`.
- Thêm trường hồ sơ có thể ẩn → thêm vào `HIDEABLE_FIELDS` (shared) + `fieldValue()` + giá trị mặc định trong `DEFAULT_VISIBILITY` (mặc định cho khách xem người còn sống = ẨN).

## Nghiệp vụ cốt lõi
Xem `docs/business_rules.md` (thuỷ tổ, đời, vợ/chồng nhiều đời, con nuôi, cha/mẹ đơn thân, ngày không đầy đủ/âm lịch, phạm vi chi/nhánh, ẩn/hiện trường).

## Bản đồ code
`ARCHITECTURE.md` (tổng quan) → `structure/server.md`, `structure/web.md` (cấp hàm).

## Test giao diện bằng Playwright MCP
Playwright MCP trên máy này **nối vào Chrome thật của người dùng** (qua extension) — người dùng có thể đang
thao tác cùng tab, và tab hay ở trạng thái nền (`visibilityState: hidden`) → requestAnimationFrame bị hãm,
`browser_click` treo ở "waiting for element to be stable". Khi gặp: kiểm tra bằng `browser_evaluate` gọi
`element.click()` / set value + dispatch `input` trực tiếp (không phụ thuộc animation).
