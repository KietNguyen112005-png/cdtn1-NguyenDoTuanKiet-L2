# cdtn1-NguyenDoTuanKiet-L2

Sinh viên: Nguyễn Đỗ Tuấn Kiệt - 2374802010260 - Track SE
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027
Luồng nghiệp vụ: L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu

Hệ thống giải quyết tình trạng ghi nhận thủ công, dữ liệu phân tán và thiếu căn cứ tính thời hạn cam kết (SLA) tại khâu tiếp nhận bảo hành của Mekong Mobile. Chức năng hỗ trợ Nhân viên tiếp nhận tra cứu nhanh thông tin khách hàng qua số điện thoại, ghi nhận thiết bị cùng mô tả lỗi, tự động xác định còn hay hết bảo hành, tự động tính SLA và khởi tạo phiếu bảo hành. Nhờ đó, công việc được chuyển giao tức thì cho Kỹ thuật viên, giúp chuẩn hóa quy trình tiếp nhận và nâng cao sự hài lòng của khách hàng.

Hệ thống gồm backend Node.js (Express) và cơ sở dữ liệu PostgreSQL, tách ba lớp `routes → services → repositories`.

## 2. Yêu cầu môi trường

- Node.js: v20 LTS trở lên (kiểm tra bằng `node -v`)
- Trình quản lý gói: npm v10.x
- Cơ sở dữ liệu: PostgreSQL 16 (cách nhanh nhất là dùng Docker, đã có sẵn `docker-compose.yml`)
- Biến môi trường: tạo file `.env` từ `.env.example`, gồm `DATABASE_URL` (chuỗi kết nối PostgreSQL), `PORT` (cổng ứng dụng, mặc định 3000) và `SLA_TZ_OFFSET_MINUTES` (lệch múi giờ khi tính SLA, Việt Nam là 420). File `.env` thật nằm trong `.gitignore`, không được commit.

## 3. Hướng dẫn chạy

Mỗi bước là một lệnh:

```bash
git clone https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2.git
cd cdtn1-NguyenDoTuanKiet-L2
npm install
cp .env.example .env
docker compose up -d
npm run setup
npm start
```

Ghi chú:

- Trên Windows PowerShell, lệnh tạo `.env` là `Copy-Item .env.example .env`.
- `npm run setup` chạy `migrate` (dựng bảng từ cơ sở dữ liệu trống) rồi `seed` (nạp dữ liệu mẫu).
- Sau `npm start`, hệ thống chạy tại `http://localhost:3000`.

Kiểm tra hệ thống đã chạy đúng, mở trình duyệt vào `http://localhost:3000/health`, kết quả phải là `{"status":"ok"}`. Có thể thử thêm các yêu cầu mẫu trong file `requests.http` (dùng extension REST Client của VS Code).

Chạy lại lần hai (không lỗi, không nhân đôi dữ liệu):

```bash
npm run setup
```

`migrate` bỏ qua file đã áp dụng (bảng `schema_migrations`), `seed` dùng `ON CONFLICT DO NOTHING`.

## 4. Cấu trúc thư mục

```
cdtn1-nguyendotuankiet-l2/
├── docs/                      # Tài liệu kỹ thuật
│   ├── srs.md                 # Đặc tả yêu cầu rút gọn (BT1)
│   ├── schema.sql             # Lược đồ cơ sở dữ liệu đầy đủ 6 bảng (BT1)
│   ├── erd.drawio             # Mô hình dữ liệu
│   ├── architecture.drawio    # Sơ đồ kiến trúc dự kiến (BT1)
│   ├── UseCaseDiagram.drawio  # Sơ đồ use case
│   ├── wireframe.drawio       # Wireframe 3 màn hình chính
│   ├── api-contract.md        # Hợp đồng API
│   ├── thay-doi-thiet-ke.md   # Các thay đổi so với thiết kế BT1
│   └── ai-disclosure.md       # Bảng khai báo sử dụng công cụ AI
├── src/                       # Mã nguồn, tách ba lớp
│   ├── routes/                # Lớp HTTP: đọc request, gọi service, trả response, đổi lỗi thành mã HTTP
│   ├── services/              # Lớp nghiệp vụ: tạo phiếu, tính SLA, kiểm tra bảo hành, chuyển trạng thái
│   ├── repositories/          # Lớp truy cập dữ liệu, chỉ chứa SQL
│   ├── rules/                 # Quy tắc thuần: bảo hành, SLA, vòng đời trạng thái, mã phiếu
│   └── validators/            # Kiểm tra dữ liệu đầu vào
├── migrations/                # Dựng cơ sở dữ liệu từ trạng thái trống (chạy lại được)
├── seeds/                     # Dữ liệu mẫu để hệ thống không lên trống trơn
├── scripts/                   # Lệnh migrate và seed
├── tests/                     # Bộ kiểm thử
├── data/                      # Dữ liệu mẫu nhỏ của case study (không commit dữ liệu lớn)
├── requests.http              # Yêu cầu mẫu để thử API trong VS Code
├── docker-compose.yml         # Dựng PostgreSQL 16 cho môi trường phát triển
├── .env.example               # Danh sách biến môi trường với giá trị mẫu
├── .gitignore                 # Loại trừ node_modules/, .env, *.log, ...
├── package.json               # Khai báo thư viện và các lệnh npm
├── package-lock.json          # Khoá phiên bản thư viện
└── README.md                  # Tài liệu hướng dẫn này
```

| Thư mục / file | Vai trò |
|---|---|
| `docs/` | Tài liệu phân tích, thiết kế, thay đổi thiết kế và bảng khai báo AI. Lưu file `.drawio` gốc để chỉnh sửa khi cần. |
| `src/` | Mã nguồn chính, chia ba lớp để không dồn toàn bộ mã vào một file. |
| `migrations/`, `seeds/` | Dựng cơ sở dữ liệu và nạp dữ liệu mẫu, chạy lại nhiều lần vẫn an toàn. |
| `tests/` | Các kiểm thử cho phần nghiệp vụ, chạy bằng `npm test`. |
| `.env.example` | Mẫu cấu hình môi trường. Sao chép thành `.env` rồi chỉnh nếu cần. |
| `.gitignore` | Ngăn commit thư viện cài đặt, file bí mật và log. |

## 5. Kiểm thử

```bash
npm test
```

Kết quả mong đợi: tất cả kiểm thử PASS. Bộ kiểm thử dùng đối tượng giả nên không cần PostgreSQL và không phụ thuộc dữ liệu trên máy. Kiểm thử gồm ba loại, tên mỗi test có tiền tố tương ứng:

| Loại | Ví dụ |
|---|---|
| `[Luồng đúng]` | Tiếp nhận thiết bị còn bảo hành thì tạo được phiếu MỚI với hạn SLA đúng |
| `[Giá trị biên]` | Ngày cuối cùng còn bảo hành và ngày đầu tiên hết bảo hành; SLA bỏ qua Chủ nhật |
| `[Dữ liệu sai]` | Thiếu mô tả lỗi thì bị từ chối kèm tên trường, không lưu phiếu |

## 6. Các quy tắc nghiệp vụ và API

Quy tắc nghiệp vụ đã hiện thực (mã BR theo `docs/srs.md`):

| Mã | Quy tắc |
|---|---|
| BR1 | Còn bảo hành khi ngày tiếp nhận không quá ngày mua cộng số tháng bảo hành; thiết bị không có ngày mua gắn nhãn `CHUA_XAC_MINH` |
| BR2 | Hạn cam kết (SLA) = thời điểm tiếp nhận + số giờ theo mức ưu tiên (CAO 24, TRUNG_BINH 72, THAP 120), bỏ qua Chủ nhật |
| BR4 | Chỉ sửa mô tả lỗi khi phiếu còn ở trạng thái MOI |
| BR5 | Chỉ chuyển trạng thái hợp lệ theo vòng đời, mỗi lần chuyển được ghi vào `ticket_status_log` |
| BR6 | Số điện thoại gồm 10 chữ số và bắt đầu bằng 0 |
| BR7 | Khách hàng không bị xoá vật lý, chỉ ngừng hoạt động (`is_active = false`) |

| Phương thức | Đường dẫn | Ý nghĩa |
|---|---|---|
| GET | `/health` | Kiểm tra hệ thống đang chạy |
| POST, GET | `/customers`, `/customers?phone=...` | Tạo khách hàng, tra cứu theo số điện thoại |
| GET, PUT, DELETE | `/customers/:id` | Đọc, sửa, ngừng hoạt động khách hàng |
| POST, GET | `/tickets`, `/tickets?status=...` | Tạo phiếu, liệt kê phiếu theo trạng thái |
| GET, PUT | `/tickets/:id` | Đọc phiếu, sửa mô tả lỗi |
| PATCH | `/tickets/:id/status` | Chuyển trạng thái phiếu (BR5) |
| DELETE | `/tickets/:id` | Huỷ phiếu (chuyển sang `DA_HUY`) |

Lỗi trả về luôn có dạng `{"error": {"code": "...", "message": "..."}}`: dữ liệu sai trả 400 kèm tên trường, vi phạm quy tắc nghiệp vụ trả 422, không tìm thấy trả 404, mất kết nối cơ sở dữ liệu trả 503.

## 7. Trạng thái hiện tại

- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [x] Module cốt lõi phía backend: khách hàng và phiếu bảo hành (đủ CRUD, BR1, BR2, BR4, BR5, BR6, BR7)
- [x] Migration và dữ liệu mẫu chạy lại được, không nhân đôi dữ liệu
- [x] Bộ kiểm thử ba loại, chạy bằng `npm test`
- [ ] Giao diện ba màn hình với ba trạng thái (đang tải, rỗng, lỗi)
- [ ] Đăng nhập cơ bản
- [ ] Sơ đồ kiến trúc thực tế và tag `v0.2`
