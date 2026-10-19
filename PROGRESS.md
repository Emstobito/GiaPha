# Nhật ký tiến độ — GiaPha

## 2026-10-19 — Nâng cấp giao diện (đẹp, hiện đại hơn)

Theo yêu cầu người dùng. Phong cách: hiện đại nhưng mang chất gia phả Việt — nền giấy dó, đỏ son, vàng đồng;
font **Be Vietnam Pro** (tối ưu dấu tiếng Việt) + Noto Serif cho tiêu đề, **tự host** qua `@fontsource`.
- Ô người: avatar chữ cái đầu TÊN (gradient theo giới tính, người đã mất giảm màu + viền vàng), vạch giới tính,
  hover nổi; vòng nối ⚭ giữa vợ chồng; nhiều vợ: **vợ cả trái – chồng giữa – vợ hai phải** (`cardSlots`).
- Dải nhãn "ĐỜI N" bên trái; thanh công cụ nổi (zoom, vừa màn hình, Mở tất cả, **Hiện tới đời N**); chú giải;
  minimap bo góc; **chế độ tối tự theo hệ điều hành**.
- Tìm kiếm: phím `/`, ↑↓ Enter Esc. Bảng chi tiết: hero avatar + chip, thông tin có icon ("Ngày giỗ" khi âm
  lịch), người thân dạng thẻ; Esc đóng; mobile dạng tấm trượt lên.

**Kiểm thử**: 10 test bố cục + 24 test server, typecheck/lint/build sạch. Chạy thật + chụp màn hình cả chế độ
tối (hệ thống người dùng đang tối) lẫn sáng (giả lập), bảng chi tiết, bộ lọc "hiện tới đời 2" (còn 3 ô, nút
+8/+1, mở lại đủ 11 ô), mobile 390px (đo được bảng chi tiết nằm trên cùng, không bị ô đè — ảnh mờ ban đầu
chỉ là chụp giữa animation).

## 2026-10-19 — Giai đoạn 3 (giao diện sơ đồ cây, chỉ xem) XONG

**Đã làm:** workspace `web` (React 19 + Vite 8 + React Flow 12 + d3-hierarchy). Ô gia đình (người trong họ
+ vợ/chồng, nhãn "cả"/"thứ N"), đường nối từ đúng cặp vợ chồng, con nuôi nét đứt + ô tham chiếu nhảy về nhánh
chính, kéo/zoom/minimap, thu gọn/mở nhánh (`+N`), tìm kiếm không dấu → tự mở nhánh + căn giữa, bảng chi
tiết (cha mẹ / vợ chồng / con bấm được), giao diện mobile cơ bản.

**Kiểm thử:** 7 test bố cục (web) + 24 test server, typecheck/lint/build production sạch. Chạy thật trên
trình duyệt (Playwright): cây hiển thị đúng 5 đời; khách không thấy năm sinh/SĐT người còn sống (kiểm cả
DOM); bảng chi tiết; tìm kiếm; thu gọn nhánh Ba rồi tìm Út → nhánh tự mở + Út được chọn.

**Lỗi thật bắt được khi chạy thử:** không bấm được vào ô người nào — node `draggable:false`+`selectable:false`
bị React Flow gán `pointer-events:none`. Sửa: `style: { pointerEvents: 'all' }` cho node.

**Khác:** bỏ ẩn logo React Flow (lúc đầu ẩn, nhưng tác giả yêu cầu chỉ ẩn khi mua Pro); thêm favicon.

**Ghi chú test:** Playwright MCP nối vào Chrome thật của người dùng, tab ở nền làm `click` treo — xem mục
cuối `CLAUDE.md`.

**Bước tiếp theo:** Giai đoạn 4 — đăng nhập + phân quyền theo nhánh + lịch sử/hoàn tác + trang cấu hình
ẩn/hiện trường.

## 2026-10-19 — Giai đoạn 1 (khung) + 2 (API đọc) XONG

Kế hoạch 7 giai đoạn đã được duyệt: `C:\Users\ADMIN\.claude\plans\zany-watching-otter.md`.

**Quyết định đã chốt với người dùng**: web app; cả dòng họ cùng xem & sửa online nhưng **làm bản local
trước** (hosting quyết sau); **xem công khai, đăng nhập mới sửa**; **phân quyền sửa theo chi/nhánh**;
**quản trị ẩn/hiện từng trường** (bổ sung khi duyệt plan); sơ đồ thuỷ tổ ở trên, con cháu toả xuống;
nhập/xuất Excel + GEDCOM; quy mô chưa rõ.

**Đã làm:**
- npm workspaces (`shared`, `server`), TS 5.9, ESLint, `.gitignore` loại `data/` (đã kiểm `git check-ignore`), `git init` (CHƯA commit — chờ người dùng).
- Schema Drizzle 8 bảng + migration `0000_init`; cấu hình ẩn/hiện mặc định an toàn tự chèn khi mở DB.
- Dữ liệu mẫu giả 18 người/5 đời; `db:seed` từ chối nạp nếu DB đã có người (đã thử thật).
- Logic: thuỷ tổ, đời, dựng cây (người nhiều vị trí → `ref`), chống vòng lặp tổ tiên, thành viên nhánh,
  lọc trường theo người xem, tìm kiếm không dấu.
- API đọc: `/api/tree`, `/api/persons/:id`, `/api/search`, `/api/health`.

**Kiểm thử**: 24/24 test (Vitest + supertest), typecheck + lint sạch. Chạy server thật + gọi API: khách
chỉ thấy tên/đời của người còn sống, SĐT người còn sống KHÔNG có trong JSON, tìm kiếm tiếng Việt, 404.

**Ghi chú kỹ thuật:**
- npm tự kéo **TypeScript 7** (bản Go) → đã ghim về TS 5 vì typescript-eslint/drizzle-kit cần API JS của TS.
- Giới hạn đã biết: người dâu/rể có hôn nhân thứ 2 với người ngoài họ → con của hôn nhân đó chưa hiện trên cây
  (chỉ bung các hôn nhân của người trong họ). Xử lý khi gặp ca thật.

**Bước tiếp theo — chờ người dùng xem**: Giai đoạn 3 (giao diện sơ đồ cây công khai, React + Vite + React Flow).
