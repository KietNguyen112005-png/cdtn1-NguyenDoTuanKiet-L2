# Test Report – Luồng L2 (track SE)

Mỗi test case có đủ tám mục: mã, tiền điều kiện, các bước, dữ liệu thử, kết quả mong đợi, mức ưu tiên, **kết quả thực tế** và **PASS/FAIL**. Hai mục cuối được điền sau khi chạy thật; ảnh chụp kết quả đặt trong thư mục `docs/anh-test/` (tên tệp là mã test case).

## TC-01 · Luồng đúng · BR1, BR2, BR3

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-01 |
| 2. Tiền điều kiện | Khách id 1 đang hoạt động; thiết bị id 10 của khách 1 (mua 15/12/2025, bảo hành 12 tháng); nhóm PIN (ưu tiên mặc định TRUNG_BINH); đồng hồ cố định thứ Sáu 16/10/2026 10:00 giờ VN |
| 3. Các bước | Gọi `ticketService.create` với dữ liệu thử |
| 4. Dữ liệu thử | customerId=1, deviceId=10, categoryId=2, issueDesc="Pin sụt nhanh, máy tự tắt nguồn" |
| 5. Kết quả mong đợi | Phiếu ở trạng thái MOI; ticketCode `BH-000231/2026`; isWarranty = true; dueDate = 20/10/2026 10:00 (72 giờ, bỏ Chủ nhật); đúng 1 phiếu được lưu |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-01"` |

## TC-02 · Luồng đúng · BR5

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-02 |
| 2. Tiền điều kiện | Có một phiếu ở trạng thái MOI (tạo bằng TC-01) |
| 3. Các bước | Gọi `changeStatus` chuyển sang DA_PHAN_CONG với người thực hiện nv01 |
| 4. Dữ liệu thử | toStatus="DA_PHAN_CONG" |
| 5. Kết quả mong đợi | Trạng thái thành DA_PHAN_CONG; ghi đúng một lần chuyển MOI → DA_PHAN_CONG kèm người thực hiện nv01 |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-02"` |

## TC-03 · Luồng đúng · BR6, BR7

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-03 |
| 2. Tiền điều kiện | Kho khách hàng giả đang trống |
| 3. Các bước | 1) Tạo khách. 2) Ngừng hoạt động khách vừa tạo |
| 4. Dữ liệu thử | fullName="  Nguyễn Văn A " (thừa khoảng trắng), phone="0937482915" |
| 5. Kết quả mong đợi | Tên được cắt khoảng trắng thành "Nguyễn Văn A"; sau khi ngừng hoạt động isActive = false và bản ghi vẫn còn (không xoá vật lý) |
| 6. Mức ưu tiên | Trung bình |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-03"` |

## TC-04 · Luồng đúng · BR4

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-04 |
| 2. Tiền điều kiện | Có một phiếu ở trạng thái MOI |
| 3. Các bước | Gọi `updateDescription` với mô tả mới |
| 4. Dữ liệu thử | issueDesc="Pin phồng, máy nóng bất thường" |
| 5. Kết quả mong đợi | Mô tả lỗi của phiếu được đổi thành mô tả mới |
| 6. Mức ưu tiên | Trung bình |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-04"` |

## TC-05 · Giá trị biên · BR1

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-05 |
| 2. Tiền điều kiện | Thiết bị mua 15/06/2025, bảo hành 12 tháng (hạn cuối 15/06/2026) |
| 3. Các bước | Gọi `evaluateWarranty` với ngày tiếp nhận đúng ngày cuối hạn |
| 4. Dữ liệu thử | receivedDate="2026-06-15" |
| 5. Kết quả mong đợi | isWarranty = true; status CON_BAO_HANH; expiresOn "2026-06-15" (ngày cuối vẫn còn bảo hành) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-05"` |

## TC-06 · Giá trị biên · BR1

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-06 |
| 2. Tiền điều kiện | Như TC-05 |
| 3. Các bước | Gọi `evaluateWarranty` với ngày tiếp nhận sau hạn đúng một ngày |
| 4. Dữ liệu thử | receivedDate="2026-06-16" |
| 5. Kết quả mong đợi | isWarranty = false; status HET_BAO_HANH (ngày đầu tiên hết bảo hành) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-06"` |

## TC-07 · Dữ liệu sai · BR3

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-07 |
| 2. Tiền điều kiện | Đối tượng giả; chưa có phiếu nào |
| 3. Các bước | Gọi `ticketService.create` thiếu trường mô tả lỗi |
| 4. Dữ liệu thử | customerId=1, deviceId=10, categoryId=2, KHÔNG có issueDesc |
| 5. Kết quả mong đợi | Bị từ chối bằng lỗi nhập liệu (API trả 400) nêu đúng tên trường `issueDesc`; không có phiếu nào được lưu |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-07"` |

## TC-08 · Dữ liệu sai · BR5

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-08 |
| 2. Tiền điều kiện | Có một phiếu ở trạng thái MOI |
| 3. Các bước | Gọi `changeStatus` nhảy thẳng sang HOAN_TAT |
| 4. Dữ liệu thử | toStatus="HOAN_TAT" |
| 5. Kết quả mong đợi | Bị từ chối bằng lỗi nghiệp vụ (API trả 422); không ghi lần chuyển nào; trạng thái vẫn là MOI |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-08"` |

## TC-09 · Dữ liệu sai · BR1

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-09 |
| 2. Tiền điều kiện | Hôm nay là 28/10/2026 (giờ VN) |
| 3. Các bước | Gọi `validateDevice` hai lần: ngày mua ngày mai, rồi ngày mua hôm nay |
| 4. Dữ liệu thử | purchaseDate="2026-10-29" và "2026-10-28" |
| 5. Kết quả mong đợi | Ngày mai bị từ chối nêu tên trường `purchaseDate`; ngày hôm nay hợp lệ (biên trên) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-09"` |

## TC-10 · Bảo mật (A07) · Xác thực

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-10 |
| 2. Tiền điều kiện | Dịch vụ xác thực có tài khoản nv; token hợp lệ có hạn 500 ms theo đồng hồ giả |
| 3. Các bước | Gọi `verify` với: không token, token sửa một ký tự cuối, token thêm đuôi ".x", token đã quá hạn |
| 4. Dữ liệu thử | Bốn biến thể token như mô tả |
| 5. Kết quả mong đợi | Cả bốn trường hợp bị từ chối bằng lỗi xác thực (API trả 401) |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `node --test --test-name-pattern="TC-10"` |

## TC-11 · Bảo mật (A02) · Phản hồi lỗi API

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-11 |
| 2. Tiền điều kiện | Máy chủ đang chạy với PostgreSQL; đã đăng nhập bằng yêu cầu số 0 trong `requests.http` |
| 3. Các bước | Gửi yêu cầu `GET /tickets/abc` (mục TC-11 trong `requests.http`) rồi đọc phản hồi |
| 4. Dữ liệu thử | id = "abc" (không phải số) |
| 5. Kết quả mong đợi | Mã 400; error.code là VALIDATION; thông báo nêu `id`; phản hồi không chứa vết ngăn xếp, tên bảng hay chuỗi kết nối; tuyệt đối không phải 500 |
| 6. Mức ưu tiên | Trung bình |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | `Bấm Send Request ở mục "TC-11" trong `requests.http`` |

## TC-12 · Tái lập · Migration, seed

| Mục | Nội dung |
|---|---|
| 1. Mã | TC-12 |
| 2. Tiền điều kiện | Cơ sở dữ liệu đã chạy `npm run setup` một lần |
| 3. Các bước | 1) Đếm số dòng bảng customer, device, issue_category. 2) Chạy `npm run setup` lần hai. 3) Đếm lại |
| 4. Dữ liệu thử | Lệnh đếm: `SELECT (SELECT count(*) FROM customer), (SELECT count(*) FROM device), (SELECT count(*) FROM issue_category);` |
| 5. Kết quả mong đợi | Lần hai không lỗi, in "bỏ qua 001_init.sql (đã áp dụng)"; số dòng ba bảng giống hệt trước khi chạy lại |
| 6. Mức ưu tiên | Cao |
| 7. Kết quả thực tế | 10 |
| 8. PASS / FAIL | PASS |
| Cách chạy lại | ``npm run setup` rồi chạy lại lệnh đếm` |

## Tổng hợp

| Test case | Loại | Quy tắc | PASS / FAIL |
|---|---|---|---|
| TC-01 | Luồng đúng | BR1, BR2, BR3 | PASS |
| TC-02 | Luồng đúng | BR5 | PASS |
| TC-03 | Luồng đúng | BR6, BR7 | PASS |
| TC-04 | Luồng đúng | BR4 | PASS |
| TC-05 | Giá trị biên | BR1 | PASS |
| TC-06 | Giá trị biên | BR1 | PASS |
| TC-07 | Dữ liệu sai | BR3 | PASS |
| TC-08 | Dữ liệu sai | BR5 | PASS |
| TC-09 | Dữ liệu sai | BR1 | PASS |
| TC-10 | Bảo mật (A07) | Xác thực | PASS |
| TC-11 | Bảo mật (A02) | Phản hồi lỗi API | PASS |
| TC-12 | Tái lập | Migration, seed | PASS |

Phủ quy tắc: BR1 (TC-01, 05, 06, 09) · BR2 (TC-01) · BR3 (TC-01, 07) · BR4 (TC-04) · BR5 (TC-02, 08) · BR6 (TC-03) · BR7 (TC-03) · xác thực (TC-10) · phản hồi lỗi (TC-11) · chạy lại (TC-12).

Số test case PASS: 12/12 · Bug phát hiện: xem `docs/bug-log.md`.
