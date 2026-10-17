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
- Cơ sở dữ liệu: PostgreSQL 16 trở lên (đã chạy thử trên bản 18). Có hai cách: dùng Docker (đã có sẵn `docker-compose.yml`) hoặc dùng PostgreSQL cài sẵn trên máy.
- Biến môi trường: tạo file `.env` từ `.env.example`, gồm `DATABASE_URL` (chuỗi kết nối PostgreSQL), `PORT` (cổng ứng dụng, mặc định 3000) và `SLA_TZ_OFFSET_MINUTES` (lệch múi giờ khi tính SLA, Việt Nam là 420) và `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET` (tài khoản đăng nhập và khóa ký phiên, bắt buộc phải có). File `.env` thật nằm trong `.gitignore`, không được commit.

## 3. Hướng dẫn chạy

Lưu ý: hệ thống cần một PostgreSQL đang chạy trước khi chạy `npm run setup`. Nếu thấy lỗi "Không kết nối được PostgreSQL", hãy làm bước chuẩn bị cơ sở dữ liệu (Cách A hoặc Cách B bên dưới). Có hai nơi để chạy: VS Code trên máy cá nhân, hoặc GitHub Codespaces (chạy ngay trên trình duyệt, không cần cài gì lên máy).

### Chạy trong VS Code trên máy cá nhân

1. Lấy mã nguồn, một trong hai cách:
   - Clone: `git clone https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2.git`
   - Hoặc tải ZIP: trên trang repo bấm **Code → Download ZIP**, giải nén (thư mục có đuôi `-main`).
2. Mở VS Code, chọn **File → Open Folder**, chọn thư mục dự án (thư mục có `package.json`).
3. Mở terminal: **Terminal → New Terminal** (đảm bảo terminal đang ở thư mục dự án).
4. Cài thư viện và tạo `.env`:

```bash
npm install
cp .env.example .env
```

Trên Windows PowerShell, lệnh tạo `.env` là `Copy-Item .env.example .env`.

5. Chuẩn bị cơ sở dữ liệu (chọn một trong hai cách):

**Cách A: dùng Docker**

```bash
docker compose up -d
```

**Cách B: dùng PostgreSQL cài sẵn (không cần Docker)**

Tạo người dùng và cơ sở dữ liệu rỗng đúng với `.env.example` (người dùng `crm`, mật khẩu `crm_dev_password`, cơ sở dữ liệu `smart_crm`). Chạy bằng tài khoản quản trị `postgres`, nhập mật khẩu khi được hỏi:

```bash
psql -U postgres -h localhost -c "CREATE USER crm WITH PASSWORD 'crm_dev_password';"
psql -U postgres -h localhost -c "CREATE DATABASE smart_crm OWNER crm;"
```

Trên Windows, nếu `psql` chưa có trong PATH, dùng đường dẫn đầy đủ, ví dụ `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "..."` (thay `18` bằng phiên bản đã cài). Nếu dùng tên người dùng, mật khẩu hoặc tên cơ sở dữ liệu khác, sửa `DATABASE_URL` trong `.env` cho khớp.

6. Dựng bảng, nạp dữ liệu mẫu và chạy:

```bash
npm run setup
npm start
```

7. Mở trình duyệt vào `http://localhost:3000` và đăng nhập (xem mục "Kiểm tra hệ thống đã chạy đúng" bên dưới).

### Chạy trong GitHub Codespaces

1. Trên trang repo bấm nút xanh **Code**, chọn thẻ **Codespaces**, bấm **Create codespace on main**. Chờ trình soạn thảo VS Code mở ra trên trình duyệt.
2. Trong terminal có sẵn ở phía dưới (hoặc **Terminal → New Terminal**), chạy lần lượt:

```bash
npm install
cp .env.example .env
docker compose up -d
```

Chờ khoảng 10 giây cho cơ sở dữ liệu khởi động. Kiểm tra bằng `docker compose ps`, trạng thái phải là `healthy` hoặc `running`.

3. Dựng bảng, nạp dữ liệu mẫu, kiểm thử và chạy:

```bash
npm run setup
npm test
npm start
```

4. Khi `npm start` chạy, Codespaces hiện thông báo "Your application running on port 3000 is available". Bấm **Open in Browser**, hoặc mở thẻ **PORTS** ở thanh dưới và bấm biểu tượng quả địa cầu cạnh cổng 3000.

Nếu Codespace không có Docker (lệnh `docker` báo không tìm thấy), cài PostgreSQL trực tiếp rồi chạy tiếp từ bước 3:

```bash
sudo apt-get update && sudo apt-get install -y postgresql
sudo service postgresql start
sudo -u postgres psql -c "CREATE USER crm WITH PASSWORD 'crm_dev_password';"
sudo -u postgres psql -c "CREATE DATABASE smart_crm OWNER crm;"
```

### Kiểm tra hệ thống đã chạy đúng

- Mở `http://localhost:3000/health`, kết quả phải là `{"status":"ok"}`.
- Giao diện web nằm tại `http://localhost:3000`. Đăng nhập bằng `AUTH_USERNAME` và `AUTH_PASSWORD` trong `.env` (giá trị mẫu trong `.env.example` là `nhanvien` / `doi-mat-khau-nay`).
- Có thể thử thêm các yêu cầu mẫu trong file `requests.http` (dùng extension REST Client của VS Code; các yêu cầu cần đăng nhập trước bằng `POST /auth/login`).

### Chạy lại lần hai (không lỗi, không nhân đôi dữ liệu)

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
├── public/                    # Giao diện web (HTML + JS thuần), do chính server phục vụ
│   ├── index.html             # Khung trang và ba màn hình: khách hàng, tạo phiếu, danh sách phiếu
│   └── js/                    # api-client.js (lớp client API riêng) và app.js (màn hình, ba trạng thái)
├── migrations/                # Dựng cơ sở dữ liệu từ trạng thái trống (chạy lại được)
├── seeds/                     # Dữ liệu mẫu để hệ thống không lên trống trơn
├── scripts/                   # Lệnh migrate và seed
├── tests/                     # Bộ kiểm thử
├── data/                      # Dữ liệu mẫu nhỏ của case study (không commit dữ liệu lớn)
├── requests.http              # Yêu cầu mẫu để thử API trong VS Code
├── docker-compose.yml         # Dựng PostgreSQL 16 cho môi trường phát triển (tùy chọn)
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
| POST | `/auth/login` | Đăng nhập, trả token. Mọi API bên dưới cần header `Authorization: Bearer <token>` |
| GET | `/catalog/categories`, `/catalog/devices?customerId=` | Danh sách nhóm sự cố và thiết bị của khách (dùng cho màn hình tạo phiếu) |
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
- [x] Giao diện ba màn hình (khách hàng, tạo phiếu, danh sách phiếu) với ba trạng thái (đang tải, rỗng, lỗi có nút Thử lại)
- [x] Đăng nhập cơ bản
- [ ] Sơ đồ kiến trúc thực tế và tag `v0.2`
