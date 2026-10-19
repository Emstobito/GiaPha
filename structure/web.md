# structure/web.md — web/ (React + Vite + React Flow)

Dev: `npm run dev:web` → `http://localhost:5173`, proxy `/api` → `http://localhost:3700` (`vite.config.ts`). Cần chạy server song song.
Font tự host qua `@fontsource` (Be Vietnam Pro 400–700, Noto Serif 700) — không gọi Google Fonts (chạy offline, không lộ lượt truy cập).

## `web/src/main.tsx`
Mount `<App/>`, nạp font + CSS React Flow + `styles.css`.

## `web/src/App.tsx`
- `App` — tải `/api/tree` 1 lần; state `selected`, `focusRequest` (`{personId, seq}` — đổi `seq` để yêu cầu cây nhảy tới người). Thanh trên: logo + tiêu đề + thống kê (`N thành viên · M đời`) + `SearchBox`. Gắn `data-theme` lên `.app`.
- `useColorMode()` — theo `prefers-color-scheme` của hệ điều hành (sáng/tối), truyền xuống React Flow `colorMode`.

## `web/src/api.ts`
`api.tree()`, `api.person(id)`, `api.search(q)`.

## `web/src/layout.ts` (thuần, có test)
- Hằng: `PERSON_W`(196), `PERSON_H`(72), `LINK_W`(34 — vòng nối vợ chồng), `REF_W`(168), `H_GAP`, `LEVEL_GAP`(168).
- `cardSlots(tree)` → `{slots, width, selfCenterX, unionHandleX}` — **nơi DUY NHẤT** quyết định thứ tự/vị trí trong 1 ô gia đình (dùng chung cho bố cục và FamilyCard). 1 vợ: chồng | ⚭ | vợ. ≥2 vợ: vợ cả | ⚭1 | chồng | ⚭2 | vợ hai | ⚭3 | vợ ba... Đường xuống con đi ra từ vòng nối của đúng cặp; đơn thân đi ra từ chính người đó.
- `nodeWidth(tree)` — `REF_W` cho ô tham chiếu, còn lại `cardSlots().width`.
- `layoutTree(roots, collapsed)` → `{nodes, edges}` (d3-hierarchy, separation theo độ rộng thật). `LayoutNode` có `depth`.
- `findPrimaryKey`, `ancestorKeys` — nhảy tới người.
- `keysWithChildrenAtDepth(roots, depth)` — dùng cho "Hiện tới đời N" (thu gọn mọi ô có con ở đời N).
- `maxDepth(roots)` — số đời sâu nhất.

## `web/src/format.ts`
`formatDate(PartialDate)`, `lifeSpan(person)` ("1850 – 1920" / "Sinh 1965"), `initials(fullName)` (chữ đầu của TÊN = từ cuối).

## `web/src/components/icons.tsx`
Icon SVG nội tuyến (stroke = currentColor): `TreeLogo`, `SearchIcon`, `PlusIcon`, `MinusIcon`, `FitIcon`, `ExpandIcon`, `CloseIcon`, `CalendarIcon`, `PinIcon`, `IncenseIcon` (ngày giỗ), `NoteIcon`, `PhoneIcon`, `TagIcon`, `LockIcon`.

## `web/src/components/Avatar.tsx`
`Avatar({person, size})` — ảnh nếu có, không thì chữ cái đầu tên trên nền gradient theo giới tính; người đã mất giảm bão hoà + viền vàng.

## `web/src/components/FamilyCard.tsx`
- `FamilyCard` (node `family`) — render theo `cardSlots`: `PersonTile` + `union-link` (vòng ⚭, hoặc số thứ tự khi nhiều hôn nhân). Handle target ở `selfCenterX`; mỗi union 1 handle source `u-<unionId>` ở `unionHandleX`. Nút `toggle-btn` (`−` / `+N`, đỏ khi đang thu gọn). Ô `ref` nét đứt → `onGoToPrimary`.
- `PersonTile` — avatar + tên + năm sinh–mất (hoặc "Còn sống"/"Đã mất") + khoá khi `detailsHidden`; vạch màu giới tính bên trái; người trong họ viền vàng nhạt.
- `GenerationLabel` (node `gen`) — nhãn "ĐỜI N" bên trái mỗi tầng.

## `web/src/components/FamilyTree.tsx`
- `FamilyTree({data, selectedPersonId, onSelect, focusRequest, colorMode})` — node `family` + node `gen` (đặt ở `minX - 104`, số đời lấy từ API), edge `smoothstep` bo góc 18, nét đứt cho con nuôi.
- `toggle(key)`, `goTo(personId)` (mở tổ tiên + `setCenter`), `showUntil(depth|null)` (hiện tới đời N / mở tất cả + fitView), `refit()`.
- `Panel` dưới giữa = thanh công cụ (thu nhỏ, phóng to, vừa màn hình, Mở tất cả, chọn "Hiện tới đời"); `Panel` dưới trái = chú giải (Nam, Nữ, Đã mất, Con nuôi); `MiniMap`.
- ⚠️ Node đặt `style: { pointerEvents: 'all' }` — node không kéo/chọn bị React Flow gán `pointer-events:none` (lỗi thật 2026-10-19).
- Không ẩn logo React Flow.

## `web/src/components/SearchBox.tsx`
Ô tìm kiếm (icon, gợi ý phím `/`), debounce 180ms, dropdown; phím `/` ở bất kỳ đâu → focus; ↑/↓ chọn, Enter mở, Esc thoát.

## `web/src/components/DetailPanel.tsx`
Bảng chi tiết trượt từ phải (mobile: nửa dưới): phần đầu avatar lớn + tên (serif) + chip giới tính/đời/còn sống; danh sách thông tin có icon (chỉ dòng máy chủ gửi; "Ngày giỗ" khi ngày mất âm lịch); cha mẹ / vợ chồng / con dạng thẻ bấm được. Esc để đóng. Skeleton khi tải.

## `web/src/styles.css`
Token màu trên `.app` (sáng: nền giấy dó, đỏ son `--accent`, vàng đồng `--gold`; `[data-theme='dark']`: bộ màu tối). Các phần: thanh trên, tìm kiếm, ô gia đình (`.tile`, `.avatar`, `.union-link`, `.toggle-btn`, `.ref-card`, `.gen-label`), thanh công cụ, chú giải, minimap, bảng chi tiết, media query ≤720px.

## `web/test/layout.test.ts`
10 test: thứ tự ô 2 vợ + vị trí handle, ô 1 vợ / đơn thân, ô tham chiếu, tầng theo đời, không đè nhau, edge đúng union/con nuôi, thu gọn + đếm, `findPrimaryKey`, `ancestorKeys`, "hiện tới đời N".
