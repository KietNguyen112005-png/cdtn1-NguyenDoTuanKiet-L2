# Test Plan – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)

Sinh viên: Nguyễn Đỗ Tuấn Kiệt · MSSV 2374802010260 · Lập trước khi chạy test case thật.

## 1. Phạm vi

**Kiểm thử:**
- Tạo phiếu và xác định bảo hành (BR1), hạn cam kết SLA (BR2), dữ liệu bắt buộc (BR3).
- Sửa mô tả lỗi khi phiếu còn MOI (BR4) và vòng đời trạng thái (BR5).
- Khách hàng: số điện thoại hợp lệ (BR6), ngừng hoạt động không xoá vật lý (BR7).
- Thêm thiết bị (kiểm tra ngày mua), xác thực đăng nhập (OWASP A07), phản hồi lỗi của API (A02).
- Chạy lại migration và seed không lỗi, không nhân đôi dữ liệu.

**Không kiểm thử, và lý do:**
- Hiệu năng và tải: thuộc Chuyên đề tốt nghiệp 2.
- Giao diện: không chứa quy tắc nghiệp vụ; ba trạng thái (đang tải, rỗng, lỗi) đã kiểm tay và chụp ảnh ở Bài tập 2.
- Phân quyền theo chủ sở hữu (A01): hệ thống chỉ có một tài khoản nên không áp dụng.
- Băm mật khẩu (A04): tài khoản cấu hình bằng biến môi trường, không lưu trong cơ sở dữ liệu nên không áp dụng.
- Tấn công chèn câu lệnh (A05): mọi truy vấn dùng tham số `$1, $2…`, chưa có test riêng.
- Nạp bộ dữ liệu mô phỏng: chỉ có kiểm thử đơn vị cho phần làm sạch, không nằm trong 12 test case.

## 2. Loại test và số lượng

| Tầng | Số lượng | Test case |
|---|---|---|
| Unit (service, quy tắc, validator, dùng đối tượng giả) | 10 | TC-01 đến TC-10 |
| Integration (PostgreSQL thật qua migrate và seed) | 1 | TC-12 |
| API (HTTP thật, gọi bằng REST Client) | 1 | TC-11 |

Đủ năm loại: luồng đúng ×4 (TC-01 đến TC-04) · giá trị biên ×2 (TC-05, TC-06) · dữ liệu sai ×3 (TC-07, TC-08, TC-09) · bảo mật ×2 (TC-10, TC-11) · tái lập ×1 (TC-12).

Kỹ thuật chọn dữ liệu: phân vùng tương đương và giá trị biên (hai bên ranh giới bảo hành 15/06/2026 và 16/06/2026; ngày mua hôm nay và ngày mai). Mỗi bug đã sửa có thêm test hồi quy (tệp `tests/bug-0N-*.test.js` hoặc chính test case phát hiện ra nó).

## 3. Tiêu chí thành công

Đặt trước khi chạy:
1. Cả 12 test case có kết quả thực tế kèm ảnh chụp.
2. Mỗi quy tắc BR1 đến BR7 có ít nhất một test case.
3. Không còn bug Critical đang mở; bug Major còn lại phải có lý do và hướng xử lý.
4. Mỗi bug đã sửa có test hồi quy PASS và một commit riêng.
5. `npm test` chạy PASS toàn bộ bằng một lệnh.

## 4. Môi trường và dữ liệu thử

- Node.js 20; `npm test` dùng `node --test`, không cần cơ sở dữ liệu (TC-01 đến TC-10).
- PostgreSQL 16 trở lên cho TC-11 và TC-12; dữ liệu mẫu từ `seeds/001_seed.sql` (2 khách, 3 thiết bị).
- Test đơn vị tự dựng dữ liệu bằng `tests/helpers/fakes.js`; đồng hồ cố định ở thứ Sáu 16/10/2026 10:00 giờ Việt Nam để kết quả lặp lại được.
- Chạy lại riêng một test case: `node --test --test-name-pattern="TC-05"`.
- CI: GitHub Actions chạy `npm ci` rồi `npm test` mỗi lần đẩy mã (tệp `.github/workflows/ci.yml`).
