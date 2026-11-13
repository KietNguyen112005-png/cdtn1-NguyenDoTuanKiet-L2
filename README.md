# cdtn1-NguyenDoTuanKiet-L2

Sinh viên: Nguyễn Đỗ Tuấn Kiệt - 2374802010260 - Track SE
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027
Luồng nghiệp vụ: L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu

Hệ thống giải quyết tình trạng ghi nhận thủ công, dữ liệu phân tán và thiếu căn cứ tính thời hạn cam kết (SLA) tại khâu tiếp nhận bảo hành của Mekong Mobile. Chức năng hỗ trợ Nhân viên tiếp nhận tra cứu nhanh thông tin khách hàng qua số điện thoại, ghi nhận thiết bị cùng mô tả lỗi, tự động xác định còn hay hết bảo hành, tự động tính SLA và khởi tạo phiếu bảo hành. Nhờ đó, công việc được chuyển giao tức thì cho Kỹ thuật viên, giúp chuẩn hóa quy trình tiếp nhận và nâng cao sự hài lòng của khách hàng.

Hệ thống gồm backend Node.js (Express) và cơ sở dữ liệu PostgreSQL, tách ba lớp `routes → services → repositories`.

## 2. Yêu cầu môi trường
**Cách 1, chạy bằng Docker (khuyến nghị, dành cho người chấm):**
- Docker Engine 24 trở lên và Docker Compose v2 (kiểm tra bằng `docker compose version`), Git, khoảng 2 GB đĩa trống, cổng 3000 trống.
- Không cần cài Node.js hay PostgreSQL.

**Cách 2, chạy Node trực tiếp (để phát triển):** Node.js 20 trở lên, npm 10, PostgreSQL 16 trở lên (cài sẵn hoặc chạy bằng Docker).

**Biến môi trường:** tạo `.env` từ `.env.example` (file mẫu đã có giá trị chạy được). Các biến: `APP_PORT` (cổng mở ra máy chủ khi dùng Docker), `DB_NAME`, `DB_USER`, `DB_PASSWORD` (cơ sở dữ liệu), `DB_HOST`, `DB_PORT` (chỉ khi chạy Node trực tiếp, mặc định `localhost` và `5432`), `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET` (đăng nhập và khóa ký phiên, bắt buộc), `SLA_TZ_OFFSET_MINUTES` (lệch múi giờ khi tính SLA, Việt Nam là 420). Cách cũ `DATABASE_URL` vẫn dùng được và được ưu tiên nếu có. File `.env` thật nằm trong `.gitignore`, không được commit. Thiếu biến bắt buộc thì hệ thống dừng ngay và báo tên biến còn thiếu.

## 3. Hướng dẫn chạy

### Cách 1 (khuyến nghị): chạy bằng Docker, hai lệnh

```bash
npm install
npm audit fix (nếu hiện lỗi: 1 high severity vulnerability)
cp .env.example .env
docker compose up -d --build
```

Trên Windows PowerShell, lệnh đầu là `Copy-Item .env.example .env`. Lần build đầu mất khoảng 2 phút. Khi khởi động, ứng dụng tự dựng bảng và nạp dữ liệu mẫu (`npm run setup`), không cần gõ thêm lệnh nào.

- Kiểm tra: `docker compose ps` phải hiện hai dịch vụ `db` và `app` ở trạng thái `healthy`, rồi mở `http://localhost:3000`.
- Xem nhật ký: `docker compose logs app --tail 50`. Dừng: `docker compose down`. Xóa cả dữ liệu để dựng lại từ đầu: `docker compose down -v`.
- Cổng 3000 đang bị chiếm thì đổi `APP_PORT` trong `.env` (ví dụ 3001) rồi chạy lại lệnh thứ hai.
- Chạy bộ kiểm thử trong container: `docker compose exec app npm test`.

### Cách 2: chạy Node trực tiếp trong VS Code (phát triển)

1. Lấy mã nguồn: `git clone https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2.git`, hoặc trên trang repo bấm **Code → Download ZIP** rồi giải nén.
2. Mở VS Code, chọn **File → Open Folder**, chọn thư mục **chứa file `package.json`**. Khi giải nén ZIP, Windows thường tạo thêm một thư mục lồng cùng tên, hãy mở thư mục bên trong.
3. Mở terminal (**Terminal → New Terminal**) rồi kiểm tra đúng thư mục bằng `dir package.json`. Báo không thấy file thì `cd` vào thư mục bên trong.
4. Cài thư viện và tạo `.env`: `npm install` rồi `Copy-Item .env.example .env`.
5. Chuẩn bị PostgreSQL (bỏ qua nếu máy đã có PostgreSQL với người dùng, mật khẩu, cơ sở dữ liệu khớp `DB_*` trong `.env`). Chọn một cách:
   - **Cách A, chỉ chạy cơ sở dữ liệu bằng Docker:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db`. Cần Docker Desktop đang chạy; báo `docker is not recognized` nghĩa là máy chưa cài Docker, dùng Cách B.
   - **Cách B, PostgreSQL cài sẵn:** tạo người dùng và cơ sở dữ liệu rỗng đúng với `.env.example`: `psql -U postgres -h localhost -c "CREATE USER crm WITH PASSWORD 'crm_dev_password';"` rồi `psql -U postgres -h localhost -c "CREATE DATABASE smart_crm OWNER crm;"`. Trên Windows nếu `psql` chưa có trong PATH, dùng đường dẫn đầy đủ, ví dụ `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "..."`.
6. Dựng bảng, nạp dữ liệu mẫu và chạy: `npm run setup` rồi `npm start`.
7. Mở `http://localhost:3000` và đăng nhập (xem mục "Đăng nhập" bên dưới). Nếu đang chạy Docker ở Cách 1, hãy `docker compose down` trước vì cùng dùng cổng 3000.

### Chạy trong GitHub Codespaces

1. Trên trang repo bấm nút xanh **Code**, chọn thẻ **Codespaces**, bấm **Create codespace on main**. Chờ trình soạn thảo VS Code mở ra trên trình duyệt.
2. Trong terminal có sẵn ở phía dưới (hoặc **Terminal → New Terminal**), chạy lần lượt:

```bash
npm install
npm audit fix (nếu hiện lỗi: 1 high severity vulnerability)
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

### Xử lý sự cố thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Cổng bị chiếm (có thể do `npm start` đang chạy). Dừng chương trình đó hoặc đổi `APP_PORT` trong `.env` |
| Ứng dụng thoát với "Thiếu biến môi trường: ..." | `.env` thiếu dòng có trong `.env.example`. Bổ sung các biến được nêu tên |
| `password authentication failed` sau khi đổi `DB_PASSWORD` | Dữ liệu cũ vẫn giữ mật khẩu cũ. Chạy `docker compose down -v` rồi dựng lại |
| `docker: command not found` | Máy chưa cài Docker. Dùng Cách 2 hoặc Codespaces |
| Danh sách phiếu trống sau khi dựng | Chạy `docker compose logs app --tail 50` xem bước nạp dữ liệu mẫu có lỗi không |

### Kiểm tra hệ thống đã chạy đúng

- Với Docker: `docker compose ps` hiện `db` và `app` đều `healthy`.
- Mở `http://localhost:3000/health`, kết quả phải là `{"status":"ok"}`.
- Giao diện web nằm tại `http://localhost:3000`. Đăng nhập bằng tài khoản thử nghiệm ghi trong mục "Đăng nhập" bên dưới.
- Có thể thử thêm các yêu cầu mẫu trong file `requests.http` (dùng extension REST Client của VS Code; yêu cầu số 0 đăng nhập và tự lấy token cho các yêu cầu sau).

### Đăng nhập

Mở `http://localhost:3000`, màn hình đăng nhập hiện ra. Dùng tài khoản thử nghiệm sau (giá trị mẫu trong `.env.example`, sao chép sang `.env` ở bước tạo `.env`):

| Thông tin | Giá trị |
|---|---|
| Tài khoản | `nhanvien` |
| Mật khẩu | `1234` |

Sau khi đăng nhập, hệ thống vào màn hình **Tạo phiếu**; dùng thanh trên cùng để chuyển sang **Danh sách phiếu** hoặc bấm **Đăng xuất**. Dữ liệu mẫu có hai khách (số điện thoại `0937482915` và `0865139704`): ở màn hình Tạo phiếu nhập một trong hai số rồi bấm Tìm khách; nhập số khác để thử trường hợp khách mới.

Đây chỉ là tài khoản thử nghiệm cho môi trường phát triển. Muốn đổi, sửa `AUTH_USERNAME` và `AUTH_PASSWORD` trong `.env` rồi chạy lại `npm start`. Nếu quên đăng nhập hoặc đăng nhập sai, hệ thống báo "Sai tên đăng nhập hoặc mật khẩu".

### Chạy lại lần hai (không lỗi, không nhân đôi dữ liệu)

Với Docker: `docker compose restart app` (hoặc `docker compose up -d` lần nữa); bước dựng bảng và nạp dữ liệu mẫu chạy lại khi ứng dụng khởi động. Với Node trực tiếp: `npm run setup`.

`migrate` bỏ qua file đã áp dụng (bảng `schema_migrations`), `seed` dùng `ON CONFLICT DO NOTHING` nên không nhân đôi dữ liệu.

### Nạp bộ dữ liệu đầy đủ (tùy chọn)

Bộ dữ liệu mô phỏng của học phần (file `dataset.zip`, khoảng 13 MB) không nằm trong repo vì quá lớn. Hệ thống vẫn chạy đầy đủ với dữ liệu mẫu nhỏ của `npm run setup`; bước này chỉ để có dữ liệu thật hơn (khoảng 51 nghìn khách, 7 nghìn phiếu lịch sử).

1. Giải nén `dataset.zip`, chép các file `customers_raw.csv`, `products.csv`, `issue_categories.csv`, `tickets_history.csv`, `ticket_status_log.csv` vào thư mục `data/raw/` (thư mục này đã nằm trong `.gitignore`).
2. Chạy thử, chỉ làm sạch và đếm, chưa ghi vào cơ sở dữ liệu:

```bash
npm run import:dataset -- data/raw --dry-run
```

3. Nạp thật (cần đã chạy `npm run setup`). Chạy lại nhiều lần không nhân đôi dữ liệu:

```bash
npm run import:dataset -- data/raw
```

Quy tắc làm sạch: số điện thoại được đưa về dạng `0xxxxxxxxx` (bỏ dấu cách, dấu chấm, `+84`); hồ sơ trùng số điện thoại được gộp thành một khách; khách không có số điện thoại hợp lệ và các phiếu của họ bị loại, ghi lý do vào `data/reject/rejected.csv`. Phiếu lịch sử không có ngày mua thiết bị nên thiết bị được nạp với ghi chú nguồn gốc thay cho ngày mua. Hạn cam kết (`due_date`) của phiếu lịch sử do dataset tính bằng giờ lịch đơn giản, chưa bỏ Chủ nhật như BR2 của hệ thống.

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
│   ├── ai-disclosure.md       # Bảng khai báo sử dụng công cụ AI
│   └── architecture-thuc-te.png # Sơ đồ kiến trúc thực tế
├── src/                       # Mã nguồn, tách ba lớp
│   ├── routes/                # Lớp HTTP: đọc request, gọi service, trả response, đổi lỗi thành mã HTTP
│   ├── services/              # Lớp nghiệp vụ: tạo phiếu, tính SLA, kiểm tra bảo hành, chuyển trạng thái
│   ├── repositories/          # Lớp truy cập dữ liệu, chỉ chứa SQL
│   ├── rules/                 # Quy tắc thuần: bảo hành, SLA, vòng đời trạng thái, mã phiếu
│   └── validators/            # Kiểm tra dữ liệu đầu vào
├── public/                    # Giao diện web (HTML + JS thuần), do chính server phục vụ
│   ├── index.html             # Khung trang và các màn hình: đăng nhập, tạo phiếu (kèm tạo khách và thiết bị mới), danh sách phiếu, khách hàng (sửa, ngừng hoạt động)
│   └── js/                    # api-client.js (lớp client API riêng) và app.js (màn hình, ba trạng thái)
├── migrations/                # Dựng cơ sở dữ liệu từ trạng thái trống (chạy lại được)
├── seeds/                     # Dữ liệu mẫu để hệ thống không lên trống trơn
├── scripts/                   # Lệnh migrate, seed và nạp dataset đầy đủ (import-dataset.js)
├── tests/                     # Bộ kiểm thử
├── data/                      # Dữ liệu mẫu nhỏ của case study (không commit dữ liệu lớn)
├── requests.http              # Yêu cầu mẫu để thử API trong VS Code
├── Dockerfile                 # Đóng gói ứng dụng (Node.js 20 alpine, chạy bằng người dùng không phải root)
├── docker-compose.yml         # Ứng dụng + PostgreSQL 16, có healthcheck; chạy bằng `docker compose up -d --build`
├── docker-compose.dev.yml     # Chỉ mở cổng CSDL ra máy khi chạy Node trực tiếp
├── .dockerignore              # Không đưa node_modules, .env, .git vào image
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
| POST | `/auth/login` | Đăng nhập, trả token. Mọi API bên dưới cần header `Authorization: Bearer <token>`, thiếu thì trả 401 |
| GET | `/catalog/categories`, `/catalog/devices?customerId=` | Danh sách nhóm sự cố và thiết bị của khách (dùng cho màn hình tạo phiếu) |
| POST | `/catalog/devices` | Thêm thiết bị mới cho khách (IMEI/Serial duy nhất; không có ngày mua thì phải ghi chú nguồn gốc) |
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
- [x] Giao diện: đăng nhập, tạo phiếu (nhập số điện thoại, khách cũ hiện thiết bị, khách mới nhập họ tên và thiết bị), danh sách phiếu, khách hàng (tra cứu, sửa, ngừng hoạt động); có ba trạng thái (đang tải, rỗng, lỗi có nút Thử lại)
- [x] Nạp được bộ dữ liệu mô phỏng đầy đủ (tùy chọn): làm sạch, gộp khách trùng, ghi dòng bị loại kèm lý do
- [x] Đăng nhập cơ bản (một tài khoản cấu hình trong `.env`, token có hạn 8 giờ)
- [x] Sơ đồ kiến trúc thực tế và tag `v0.2`
