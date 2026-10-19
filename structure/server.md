# structure/server.md — server/ + shared/

## `shared/src/index.ts`
Kiểu dùng chung server ↔ web: `Gender`, `ChildKind`, `UnionStatus`, `PartialDate`, `HIDEABLE_FIELDS`/`HideableField`, `AUDIENCES`/`Audience`, `SUBJECTS`/`Subject`, `ViewerRole`, `PersonView`, `TreeUnion`, `TreeNode`, `TreeResponse`, `PersonDetail`, `SearchHit`.

## `server/src/config.ts`
`PORT` (mặc định 3700), `DB_FILE` (mặc định `data/giapha.sqlite`, đổi bằng `GIAPHA_DB`).

## `server/src/index.ts`
Tạo thư mục data, `openDb(DB_FILE)`, `createApp(db).listen(PORT)`.

## `server/src/db/schema.ts`
Bảng Drizzle: `persons` (ngày tách năm/tháng/ngày + cờ âm lịch, `hidePublic`), `unions` (`partner2Id` null = đơn thân, `orderIndex`), `parentChild` (unique union+child, `kind`, `birthOrder`), `branches` (`rootPersonId`), `users`, `userBranches`, `fieldVisibility` (PK field+audience+subject), `auditLog`.

## `server/src/db/client.ts`
- `openDb(file)` → `{db, sqlite}`: bật WAL (trừ `:memory:`) + foreign keys, chạy migration từ `server/drizzle`, `ensureDefaultVisibility`. Type `Db`.

## `server/src/db/sample-family.ts`
- `insertSampleFamily(db)` → object id các nhân vật (`to`, `ca`, `nam`...) + `unions` + `branches`. DỮ LIỆU GIẢ: 18 người/5 đời, vợ hai, con nuôi có cha mẹ ruột trong họ, cha đơn thân, người `hidePublic`, ngày giỗ âm lịch. Dùng cho seed + test.

## `server/src/db/seed.ts`
Script `npm run db:seed`: nạp dữ liệu mẫu, **từ chối nếu DB đã có người** (exit 1).

## `server/src/domain/family.ts`
- `loadFamily(db)` → `FamilyData {persons, unions, parentChild}`. Type `PersonRow`, `UnionRow`, `ParentChildRow`.

## `server/src/domain/tree.ts`
- `class FamilyIndex` — map tra cứu: `personById`, `unionsOf(pid)` (sắp theo `orderIndex`), `childrenOf(unionId)` (sắp theo `birthOrder`), `parentRowsOf`, `parentsOf`, `spouseIn(union, pid)`, `primaryParentRow(childId)` (ruột ưu tiên), `hasParents`.
- `findRoots(index)` — thuỷ tổ (loại dâu/rể, cặp thuỷ tổ lấy partner1).
- `buildTree(index, rootIds)` → `TreeNode[]`; người nhiều vị trí chỉ bung ở vị trí chính, còn lại `ref:true`.
- `computeGenerations(index, roots)` → `Map<id, đời>` (BFS).
- `isAncestor(index, a, b)`, `wouldCreateCycle(index, parentId, childId)` — chống vòng lặp tổ tiên.
- `branchMembers(index, rootId)` → `Set` người thuộc nhánh (con cháu + vợ/chồng) — phạm vi quyền sửa.

## `server/src/domain/visibility.ts`
- `VisibilityConfig` (audience × subject × field → bool), `DEFAULT_VISIBILITY`.
- `ensureDefaultVisibility(db)` — chèn dòng cấu hình còn thiếu (không ghi đè cấu hình quản trị đã đổi).
- `loadVisibility(db)` → `VisibilityConfig`.
- `toPersonView(row, viewer, config, generation)` → `PersonView` chỉ gồm trường được phép (admin thấy hết; khách + `hidePublic` → `detailsHidden`). Helper nội bộ `partialDate`, `fieldValue`.

## `server/src/domain/search.ts`
- `normalizeVi(text)` — bỏ dấu, đ→d, chữ thường, gộp khoảng trắng.
- `searchPersons(index, generations, query, limit=20)` — mọi từ phải có trong họ tên + tên khác.

## `server/src/http/app.ts`
- `createApp(db)` — Express: `/api/health`, `/api/tree`, `/api/persons/:id`, `/api/search`.
- `viewerOf(req)` — tạm luôn `'guest'` (thay ở giai đoạn 4).
- `snapshot(db)` — nạp family + index + roots + generations + visibility cho 1 request.

## `server/test/`
`helpers.ts` (`sampleDb`, `sampleIndex`), `tree.test.ts`, `visibility.test.ts`, `search.test.ts`, `api.test.ts` (supertest) — 24 test.
