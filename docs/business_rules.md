# Quy tắc nghiệp vụ — GiaPha

## Mô hình quan hệ
- **Người** (`persons`) và **hôn nhân** (`unions`, gồm 2 người; `partner2` trống = cha/mẹ đơn thân).
- Con gắn vào **1 hôn nhân** (`parent_child`), không gắn trực tiếp vào từng cha/mẹ → biết rõ con của vợ
  nào. Loại quan hệ: `biological` (ruột) / `adopted` (nuôi). 1 người có thể có nhiều dòng `parent_child`
  (vd con ruột nhà này, con nuôi nhà kia).
- `unions.order_index`: thứ tự hôn nhân (1 = vợ/chồng cả, 2 = vợ/chồng hai...) → xếp trái→phải trên cây.
- `parent_child.birth_order`: thứ tự con (con trưởng = 1).

## Thuỷ tổ & đời
- **Thuỷ tổ (gốc cây)** = người không có cha mẹ trong dữ liệu VÀ không phải người dâu/rể. Người dâu/rể =
  không có cha mẹ nhưng lấy người CÓ cha mẹ trong họ. Cặp vợ chồng thuỷ tổ đều không có cha mẹ → chỉ
  `partner1` làm gốc. Có thể có nhiều gốc (nhiều nhánh không nối nhau).
- **Đời**: thuỷ tổ = 1; vợ/chồng cùng đời với người trong họ; con = đời cha mẹ + 1. Không lưu DB — tính
  lại mỗi lần (`computeGenerations`).

## Người xuất hiện nhiều chỗ trên cây
Con nuôi mà cha mẹ ruột cũng trong dòng họ → 2 vị trí. **Vị trí chính** = quan hệ ruột (không có thì vị
trí đầu tiên): chỉ ở đây mới bung con cháu; vị trí còn lại là ô **tham chiếu** (`ref: true`) — tránh vẽ
trùng cả nhánh và tránh vòng lặp vô hạn.

## Ngày tháng
Lưu tách năm/tháng/ngày, đều có thể trống (gia phả hay chỉ biết năm sinh, hoặc chỉ ngày tháng giỗ), kèm cờ
**âm lịch**. Ngày giỗ = ngày mất âm lịch.

## Ràng buộc
- Không tạo **vòng lặp tổ tiên**: không tự làm cha/mẹ mình, con cháu không thành tổ tiên của chính mình
  (`wouldCreateCycle`).

## Chi/nhánh & quyền sửa
- **Chi/nhánh** (`branches`) = cây con tính từ 1 người gốc.
- **Thành viên nhánh** = người gốc + toàn bộ con cháu (ruột lẫn nuôi) + vợ/chồng của họ (`branchMembers`).
- Editor chỉ sửa được người thuộc nhánh được giao (`user_branches`); quản trị sửa tất cả. *(Áp dụng từ giai đoạn 4.)*

## Ẩn/hiện trường thông tin
- Trường ẩn/hiện được: tên khác, ngày sinh, nơi sinh, ngày mất, ghi chú, liên hệ, ảnh.
- Cấu hình theo **đối tượng xem** (khách chưa đăng nhập / thành viên đăng nhập) × **người còn sống / đã mất**.
  Quản trị luôn thấy tất cả.
- **Mặc định**: khách — người còn sống: ẩn hết; người đã mất: hiện hết trừ liên hệ. Thành viên: hiện hết.
- **Ghi đè từng người** (`hide_public`): khách chỉ thấy tên/giới tính/đời/còn sống của người đó (`detailsHidden: true`); thành viên vẫn thấy theo cấu hình.
