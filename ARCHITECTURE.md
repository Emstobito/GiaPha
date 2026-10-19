# Kiến trúc — GiaPha

Đã có: giai đoạn 1 (khung) + 2 (API đọc) + 3 (giao diện sơ đồ cây chỉ xem). Chưa có: đăng nhập/sửa,
nhập/xuất, đóng gói (xem `PROGRESS.md` và plan).

## Cấu trúc thư mục

```
E:\GiaPha\
├── package.json            # npm workspaces (shared, server) + lệnh test/typecheck/lint/db
├── tsconfig.base.json      # cấu hình TS chung (NodeNext, strict)
├── eslint.config.mjs
├── shared/src/index.ts     # kiểu dùng chung: PersonView, TreeNode, PersonDetail, HIDEABLE_FIELDS...
├── server/
│   ├── drizzle/            # migration SQL sinh bởi drizzle-kit (không sửa tay)
│   ├── src/
│   │   ├── config.ts       # PORT, DB_FILE (biến môi trường)
│   │   ├── index.ts        # khởi động API
│   │   ├── db/             # schema, mở DB + migrate, dữ liệu mẫu giả, script seed
│   │   ├── domain/         # logic thuần: nạp dữ liệu, cây, đời, nhánh, ẩn/hiện trường, tìm kiếm
│   │   └── http/app.ts     # Express routes
│   └── test/               # Vitest: logic + API qua HTTP (DB :memory:)
├── web/                    # React + Vite + React Flow (dev :5173, proxy /api → :3700)
│   ├── src/layout.ts       # bố cục cây thuần (d3-hierarchy) — có test
│   ├── src/components/     # FamilyTree, FamilyCard, SearchBox, DetailPanel
│   └── test/
├── docs/business_rules.md
└── data/                   # SQLite thật — git-ignore (KHÔNG commit)
```

## Luồng 1 request đọc
`app.ts` → `snapshot(db)`: `loadFamily` nạp TOÀN BỘ persons/unions/parent_child (đơn giản, vài nghìn dòng
SQLite vẫn chỉ vài ms) → `FamilyIndex` (map tra cứu) → `findRoots` → `computeGenerations` →
`loadVisibility` → dựng kết quả → **`toPersonView` lọc trường theo người xem** trước khi trả JSON.

## Quyết định thiết kế
- **Con gắn vào hôn nhân, không gắn từng cha/mẹ**: biết chính xác con của vợ cả/vợ hai; cha/mẹ đơn thân =
  union có 1 người.
- **Đời không lưu DB**: tính lại mỗi request, không bao giờ lệch khi sửa quan hệ.
- **Lọc trường ở backend** (không ẩn ở giao diện): trường ẩn không rời máy chủ — yêu cầu cốt lõi vì cây xem
  công khai trên Internet.
- **Người nhiều vị trí trên cây** chỉ bung ở vị trí chính, các vị trí khác là tham chiếu (`ref`).
- **SQLite + Drizzle**: không cần Docker/server DB; 1 file dễ sao lưu; đủ cho quy mô dòng họ kể cả khi online.
- **Người xem** hiện cố định là khách (`viewerOf` trong `app.ts`) — giai đoạn 4 thay bằng vai trò thật từ session.

## Giao diện (giai đoạn 3)
- **Ô gia đình** = người trong họ + các vợ/chồng cạnh nhau; đường nối xuống con đi ra từ **đúng cặp vợ chồng**
  sinh ra con (handle `u-<unionId>`), con nuôi nét đứt.
- Bố cục tính ở `web/src/layout.ts` bằng `d3-hierarchy` (khoảng cách theo độ rộng thật của ô), React Flow chỉ
  vẽ + kéo/zoom (`onlyRenderVisibleElements` cho cây lớn). Tách bố cục ra hàm thuần để test được.
- Thu gọn/mở từng nhánh (`+N` = số con cháu đang ẩn); tìm kiếm → tự mở các nhánh tổ tiên + căn giữa.
- Giao diện KHÔNG tự lọc trường: hiện đúng những gì API gửi (đã lọc ở backend).

## API (giai đoạn 2, chỉ đọc)
| Method | Path | Trả về |
|---|---|---|
| GET | `/api/health` | `{ok:true}` |
| GET | `/api/tree[?root=id]` | `TreeResponse` — cả cây (mọi thuỷ tổ) hoặc 1 nhánh từ `root`; 404 nếu root không tồn tại |
| GET | `/api/persons/:id` | `PersonDetail` — người + cha mẹ + vợ/chồng (theo thứ tự) + con (kèm ruột/nuôi) |
| GET | `/api/search?q=` | `SearchHit[]` (tối đa 20), không phân biệt dấu/hoa thường |
