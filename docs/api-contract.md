# API contract – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)

Mẫu đặc tả riêng theo track SE (Hợp đồng API). File này thay thế mục 8 của `docs/srs.md` và đã đối chiếu với `docs/erd.drawio`, `docs/schema.sql`. Thuật ngữ khớp bảng thuật ngữ SRS mục 1.5 (phiếu bảo hành = ticket).

> Ghi chú khi sửa (xóa trước khi nộp): `[BẠN QUYẾT ĐỊNH]` là điểm tôi chọn thay bạn.

---

## 1. Danh sách endpoint

| # | Phương thức | Đường dẫn | Mục đích | FR | User Story | Mức | Bảng (ERD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | GET | `/api/customers?phone={phone}` | Tra cứu khách hàng theo số điện thoại | FR1 | US1 | MUST | customer |
| E2 | GET | `/api/customers/{customer_id}/tickets` | Lịch sử bảo hành của khách | FR1 | US1 | MUST | ticket, device, issue_category |
| E3 | POST | `/api/customers` | Tạo khách hàng mới khi chưa tồn tại | FR2 | US2 | MUST | customer |
| E4 | GET | `/api/customers/{customer_id}/devices` | Danh sách thiết bị của khách, kèm tình trạng bảo hành | FR3 | US3 | MUST | device |
| E5 | POST | `/api/devices` | Ghi nhận thiết bị ngoài lịch sử mua hàng | FR3 | US3 | MUST | device |
| E6 | GET | `/api/issue-categories` | Danh mục nhóm sự cố | FR5 | US5 | SHOULD | issue_category |
| E7 | GET | `/api/sla/due-date?priority={priority}` | Xem trước hạn cam kết theo mức ưu tiên | FR6 | US6 | SHOULD | sla_config |
| E8 | POST | `/api/tickets` | Khởi tạo phiếu bảo hành (trạng thái MỚI) | FR4, FR5, FR6, FR7 | US4, US5, US6, US7 | SHOULD | ticket, ticket_status_log |
| E9 | GET | `/api/tickets?status=&page=&size=` | Danh sách phiếu: phiếu mới cho kỹ thuật viên, tổng quan cho quản lý | FR7, FR10 | US7, US9 | SHOULD | ticket, customer, device, issue_category |
| E10 | GET | `/api/tickets/{ticket_id}/receipt` | Xuất phiếu biên nhận PDF | FR8 | US8 | COULD | ticket, customer, device |
| E11 | PUT | `/api/sla-configs/{priority}` | Quản lý thiết lập số giờ xử lý SLA cho một mức ưu tiên | FR9 | US9 | COULD | sla_config |

Không có endpoint chuyển trạng thái phiếu (thuộc W2 / luồng L4) và không có endpoint tệp đính kèm (ngoài phạm vi, xem mục 7).

## 2. Quy ước chung

- Định dạng: JSON, UTF-8; header `Content-Type: application/json`.
- Tên trường dùng `snake_case`, khớp tên cột trong `schema.sql`.
- Khóa định danh (`*_id`): số nguyên (BIGSERIAL/SERIAL), ví dụ `"customer_id": 1024`.
- Thời gian: ISO 8601 kèm múi giờ, ví dụ `2026-10-05T14:30:00+07:00`; ngày mua: `2025-12-20`.
- Số điện thoại: request nhận nhiều dạng (`0xxxxxxxxx`, `84xxxxxxxxx`, `+84…`, có dấu cách hoặc chấm) và được chuẩn hóa về 10 chữ số bắt đầu bằng 0 (BR6); response hiển thị dạng che `090****567` trừ vai trò Quản lý trung tâm (BR8).
- Giá trị liệt kê: `priority` ∈ CAO, TRUNG_BINH, THAP; `status` ∈ MOI, DA_PHAN_CONG, DANG_XU_LY, CHO_LINH_KIEN, HOAN_TAT, DA_DONG, DA_HUY.
- Phân trang: `page` (từ 1) và `size` (mặc định 20, tối đa 100); response có `total`.
- Giá trị tính ra, không lưu trong CSDL: `warranty_status` (CON_BAO_HANH, HET_BAO_HANH, CHUA_XAC_MINH) và `warranty_expires_on`, tính từ `purchase_date` và `warranty_months` (BR1).
- Cấu trúc lỗi thống nhất:
  ```json
  { "error": { "code": "VALIDATION_FAILED", "message": "Dữ liệu không hợp lệ", "fields": { "full_name": "Họ tên khách hàng là bắt buộc" } } }
  ```
- Mọi endpoint đều có thể trả `401 UNAUTHENTICATED` (thiếu hoặc hết hạn token) và `403 FORBIDDEN` (sai vai trò).

## 3. Xác thực và phân quyền

Cơ chế: đăng nhập nhận JWT, gửi qua header `Authorization: Bearer <token>`; hết hạn sau 30 phút không thao tác (NFR3).

| Endpoint | Nhân viên tiếp nhận | Kỹ thuật viên | Quản lý trung tâm |
| --- | --- | --- | --- |
| E1–E8, E10 | Có | Không | Có |
| E9 | Có | Có (chỉ xem) | Có |
| E11 | Không | Không | Có |

## 4. Chi tiết endpoint của các User Story MUST (US1, US2, US3)

### E1 – `GET /api/customers?phone={phone}` (US1)

Request: query `phone` (bắt buộc).

Response **200 OK** – tìm thấy:
```json
{
  "customer_id": 1024,
  "full_name": "Nguyễn Văn A",
  "phone": "098****888",
  "address": "12 Lê Lợi, Q.1, TP.HCM",
  "email": null
}
```
Response **404 Not Found** – không tìm thấy (US1-AC2); giao diện hiện "Không tìm thấy thông tin khách hàng" kèm nút Tạo khách hàng mới:
```json
{ "error": { "code": "CUSTOMER_NOT_FOUND", "message": "Không tìm thấy thông tin khách hàng" } }
```
Response **400 Bad Request** – `INVALID_PHONE` khi không quy về được 10 chữ số bắt đầu bằng 0.

### E2 – `GET /api/customers/{customer_id}/tickets` (US1)

Response **200 OK** (có phân trang):
```json
{
  "total": 1,
  "items": [
    { "ticket_code": "BH-000112/2026", "received_at": "2026-03-02T09:10:00+07:00", "model_name": "iPhone 13", "category_name": "PIN", "status": "DA_DONG" }
  ]
}
```
Response **404** – `CUSTOMER_NOT_FOUND`. Response **400** – `VALIDATION_FAILED` khi `page` hoặc `size` ngoài dải cho phép.

### E3 – `POST /api/customers` (US2)

Request:
```json
{ "full_name": "Nguyễn Văn A", "phone": "0988888888", "address": "12 Lê Lợi, Q.1, TP.HCM", "email": "a@example.com" }
```
Response **201 Created**: trả đối tượng khách hàng gồm `customer_id`, `full_name`, `phone` (che), `address`, `email`, `created_at`.

Response **400 Bad Request** – thiếu họ tên (US2-AC2); giao diện giữ nguyên dữ liệu đã nhập:
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Dữ liệu không hợp lệ", "fields": { "full_name": "Họ tên khách hàng là bắt buộc" } } }
```
Response **409 Conflict** – `PHONE_ALREADY_EXISTS` (BR6), kèm `existing_customer_id` để giao diện mở hồ sơ có sẵn.

Bảng validation E3 (khớp ràng buộc trong `schema.sql`):

| Trường | Bắt buộc | Kiểu / ràng buộc | Thông báo lỗi |
| --- | --- | --- | --- |
| full_name | Có | Chuỗi, 1–120 ký tự, không toàn khoảng trắng | Họ tên khách hàng là bắt buộc |
| phone | Có | Quy về 10 chữ số bắt đầu bằng 0; duy nhất | Số điện thoại không hợp lệ / Số điện thoại đã tồn tại |
| address | Không | Chuỗi, ≤ 255 ký tự | Địa chỉ tối đa 255 ký tự |
| email | Không | Đúng định dạng email, ≤ 120 ký tự | Email không hợp lệ |

### E4 – `GET /api/customers/{customer_id}/devices` (US3)

Response **200 OK**:
```json
[
  {
    "device_id": 3311,
    "model_name": "iPhone 13",
    "serial_no": "861234567890123",
    "purchase_date": "2025-12-20",
    "warranty_months": 12,
    "warranty_status": "CON_BAO_HANH",
    "warranty_expires_on": "2026-12-20"
  }
]
```
Giao diện hiển thị "Còn bảo hành (Hạn đến 12/2026)" từ các trường này (US3-AC1). Thiết bị không có `purchase_date` có `warranty_status = "CHUA_XAC_MINH"`.

Response **404** – `CUSTOMER_NOT_FOUND`. Response **400** – `VALIDATION_FAILED` khi `customer_id` không phải số nguyên dương.

### E5 – `POST /api/devices` (US3, nhập thiết bị ngoài lịch sử)

Request:
```json
{ "customer_id": 1024, "model_name": "Galaxy S23", "serial_no": "861234567890999", "purchase_date": null, "purchase_note": "Khách mua ở cửa hàng ngoài, mất hóa đơn" }
```
Response **201 Created**: trả thiết bị với `warranty_status = "CHUA_XAC_MINH"` khi `purchase_date` là null (US3-AC2).

Response **400** – `VALIDATION_FAILED` (ví dụ thiếu cả `purchase_date` lẫn `purchase_note`). Response **404** – `CUSTOMER_NOT_FOUND`. Response **409** – `SERIAL_ALREADY_REGISTERED`: serial/IMEI đã tồn tại trong hệ thống (BR1).

Bảng validation E5:

| Trường | Bắt buộc | Kiểu / ràng buộc | Thông báo lỗi |
| --- | --- | --- | --- |
| customer_id | Có | Số nguyên dương, phải tồn tại | Không tìm thấy khách hàng |
| model_name | Có | Chuỗi, 1–120 ký tự | Tên model thiết bị là bắt buộc |
| serial_no | Có | Chuỗi 1–50 ký tự, duy nhất toàn hệ thống | Mã IMEI/Serial không hợp lệ / đã được đăng ký |
| purchase_date | Không | Ngày ISO, không lớn hơn ngày hiện tại | Ngày mua không hợp lệ |
| purchase_note | Có, khi không có `purchase_date` | Chuỗi, 1–255 ký tự | Cần ghi chú nguồn gốc hoặc hóa đơn mua hàng |
| warranty_months | Không | Số nguyên > 0, mặc định 12 | Số tháng bảo hành không hợp lệ |

## 5. Chi tiết các endpoint còn lại

### E6 – `GET /api/issue-categories` (US5)
Response **200**: `[ { "category_id": 3, "category_name": "SAC", "default_priority": "TRUNG_BINH" } ]` (chỉ nhóm có `is_active = true`). Lỗi: 401, 403.

### E7 – `GET /api/sla/due-date?priority={priority}` (US6)
Response **200**: `{ "priority": "CAO", "received_at": "2026-10-05T14:30:00+07:00", "due_date": "2026-10-06T14:30:00+07:00" }` (BR2, chỉ tính thứ Hai đến thứ Bảy). Lỗi: **400** `INVALID_PRIORITY`; **422** `SLA_NOT_CONFIGURED` (luồng ngoại lệ 5a của UC6).

### E8 – `POST /api/tickets` (US4, US5, US6, US7)

Request:
```json
{
  "customer_id": 1024,
  "device_id": 3311,
  "category_id": 3,
  "priority": "TRUNG_BINH",
  "issue_desc": "Máy sạc không vào, cắm sạc báo lỗi phụ kiện"
}
```
Response **201 Created** (ghi bảng `ticket` ở trạng thái MOI và dòng đầu tiên của `ticket_status_log`, BR5):
```json
{
  "ticket_id": 88231,
  "ticket_code": "BH-000231/2026",
  "status": "MOI",
  "category_id": 3,
  "priority": "TRUNG_BINH",
  "warranty_status": "CON_BAO_HANH",
  "is_warranty": true,
  "received_at": "2026-10-05T14:30:00+07:00",
  "due_date": "2026-10-08T14:30:00+07:00"
}
```
Các response lỗi:
- **400** `VALIDATION_FAILED` – thiếu hoặc sai trường (luồng 3a của UC6).
- **404** `CUSTOMER_NOT_FOUND` hoặc `DEVICE_NOT_FOUND`.
- **409** `DEVICE_HAS_OPEN_TICKET` – thiết bị đang có phiếu chưa đóng (trạng thái khác DA_DONG, DA_HUY, HOAN_TAT). `[BẠN QUYẾT ĐỊNH]` Quy tắc này lấy từ ví dụ của mẫu, chưa có trong case study; nếu giữ thì cần thêm một BR vào SRS, nếu không thì xóa dòng này.
- **422** `DEVICE_NOT_OWNED` – thiết bị không thuộc khách hàng; **422** `SLA_NOT_CONFIGURED` (luồng 5a).

Ghi chú nghiệp vụ: thiết bị chưa xác minh bảo hành vẫn trả **201** với `warranty_status = "CHUA_XAC_MINH"` và `is_warranty = false` (luồng 4a; việc phê duyệt nằm ngoài phạm vi, W6). Thiết bị hết hạn bảo hành vẫn trả **201** với `is_warranty = false` (luồng 4b). Thông báo cho kỹ thuật viên thể hiện qua việc phiếu xuất hiện trong E9 với `status = MOI`; không có trường trạng thái gửi thông báo.

Bảng validation E8 (khớp `schema.sql`):

| Trường | Bắt buộc | Kiểu / ràng buộc | Thông báo lỗi |
| --- | --- | --- | --- |
| customer_id | Có | Số nguyên dương, phải tồn tại | Không tìm thấy khách hàng |
| device_id | Có | Phải tồn tại và thuộc `customer_id` | Thiết bị không thuộc về khách hàng này |
| category_id | Có | Thuộc `issue_category` đang dùng | Nhóm sự cố không hợp lệ |
| priority | Có | CAO / TRUNG_BINH / THAP, phải có trong `sla_config` | Mức ưu tiên không hợp lệ |
| issue_desc | Có | Chuỗi 10–2000 ký tự | Mô tả lỗi phải có từ 10 đến 2000 ký tự |

### E9 – `GET /api/tickets?status=&page=&size=` (US7, US9)
Response **200**: `{ "total": 12, "items": [ { "ticket_code": "BH-000231/2026", "model_name": "iPhone 13", "category_name": "SAC", "priority": "TRUNG_BINH", "due_date": "2026-10-08T14:30:00+07:00", "status": "MOI" } ] }`, sắp theo `due_date` tăng dần. Lỗi: **400** `INVALID_STATUS`; **400** `VALIDATION_FAILED` khi `page` hoặc `size` sai.

### E10 – `GET /api/tickets/{ticket_id}/receipt` (US8)
Response **200** `application/pdf`. Lỗi: **404** `TICKET_NOT_FOUND`; **403** FORBIDDEN.

### E11 – `PUT /api/sla-configs/{priority}` (US9)
Request: `{ "hours": 72 }` (số giờ làm việc, tính thứ Hai đến thứ Bảy theo BR2). Response **200**: `{ "priority": "TRUNG_BINH", "hours": 72 }`. Lỗi: **400** `VALIDATION_FAILED` (`hours` phải là số nguyên từ 1 đến 720, khớp CHECK trong `schema.sql`); **403** `FORBIDDEN` (không phải Quản lý trung tâm); **404** `PRIORITY_NOT_FOUND`.

## 6. Tự kiểm hợp đồng API (theo checklist của mẫu)

| Mục tự kiểm | Kết quả |
| --- | --- |
| Mỗi endpoint nối được về ≥ 1 User Story trong bảng truy vết | Đạt (cột FR và User Story ở mục 1) |
| Mỗi endpoint có ≥ 1 response thành công và ≥ 2 response lỗi | Đạt (kể cả 401, 403 theo mục 2) |
| Mọi trường request đều tồn tại trong ERD | Đạt: customer_id, full_name, phone, address, email, model_name, serial_no, purchase_date, purchase_note, warranty_months, device_id, category_id, priority, issue_desc, hours đều có cột tương ứng trong `schema.sql` |
| Không có endpoint nào không phục vụ User Story nào | Đạt |
| Quy tắc nghiệp vụ liên quan đã xuất hiện trong validation hoặc mã lỗi | Đạt (BR1, BR2, BR3, BR5, BR6, BR8) |

## 7. Thay đổi so với `srs.md` mục 8 (ghi nhận theo tiêu chí "thay đổi so với bản trước được ghi chú rõ")

| # | Thay đổi | Lý do |
| --- | --- | --- |
| 1 | Khóa định danh đổi từ chuỗi (ObjectId) sang số nguyên | ERD dùng BIGSERIAL (PostgreSQL) |
| 2 | Bỏ `center_id` và các kiểm tra theo trung tâm | ERD không có bảng trung tâm (giữ 6 bảng) |
| 3 | Bỏ endpoint tệp đính kèm (E6 cũ) và `attachment_ids` | ERD không có bảng đính kèm |
| 4 | Bỏ `notification_status` khỏi response tạo phiếu | Không có cột; thông báo thể hiện qua danh sách phiếu MỚI |
| 5 | Request E5: `product_id` đổi thành `model_name`; response E4: `model` đổi thành `model_name` | ERD không có bảng sản phẩm |
| 6 | Đánh số lại endpoint E1–E11 (do bỏ endpoint đính kèm) | Giữ số thứ tự liên tục |

**Cần sửa cho khớp trong `docs/srs.md`:** xóa mục 8 (đã chuyển sang file này); mục 1.3 (PostgreSQL, 6 bảng thay cho MongoDB, 5 collection); phần đính kèm ảnh/video trong FR4 và US4 (chuyển sang mức WON'T, thêm vào mục 1.4); BR8 (bỏ phạm vi theo trung tâm); luồng ngoại lệ 7a và bước 7 của UC6 (bỏ "trạng thái gửi thông báo").
