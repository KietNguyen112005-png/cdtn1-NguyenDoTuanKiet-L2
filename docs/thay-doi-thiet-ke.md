# Thay đổi so với thiết kế Bài tập 1

Mỗi thay đổi gồm đúng ba dòng: thay đổi gì · vì sao · ảnh hưởng tới thành phần nào.
Phần phản hồi của giảng viên về BT1 (mỗi điểm bốn dòng) được giữ ở Phụ lục cuối file.

## 1. Migration chạy lại được
- **Thay đổi gì:** `schema.sql` của BT1 được chuyển thành `migrations/001_init.sql` với `CREATE ... IF NOT EXISTS` và bảng theo dõi `schema_migrations`; dữ liệu mẫu tách sang `seeds/001_seed.sql` dùng `ON CONFLICT DO NOTHING`.
- **Vì sao:** `schema.sql` gốc chạy lần hai sẽ lỗi (bảng đã tồn tại, dữ liệu mẫu trùng khóa duy nhất), không đạt yêu cầu chạy lại không lỗi và không nhân đôi dữ liệu.
- **Ảnh hưởng:** thư mục `migrations/`, `seeds/`, `scripts/migrate.js`, `scripts/seed.js`; cấu trúc bảng không đổi.

## 2. "Xóa" được hiện thực bằng ngừng hoạt động hoặc hủy phiếu
- **Thay đổi gì:** `DELETE /customers/:id` đặt `is_active = false`; `DELETE /tickets/:id` chuyển phiếu sang `DA_HUY` (chỉ từ MOI hoặc DA_PHAN_CONG).
- **Vì sao:** BR7 cấm xóa vật lý khách hàng và BR5 quy định vòng đời trạng thái của phiếu.
- **Ảnh hưởng:** `src/services/customer.service.js`, `src/services/ticket.service.js`, `src/routes/*.routes.js`; bảng `customer`, `ticket`, `ticket_status_log`.

## 3. Làm rõ cách tính giờ SLA
- **Thay đổi gì:** hạn cam kết = thời điểm tiếp nhận + số giờ SLA, tính liên tục 24 giờ mỗi ngày và bỏ hoàn toàn Chủ nhật (nhận thứ Bảy 10:00 cộng 24 giờ thì hạn là thứ Hai 10:00).
- **Vì sao:** BT1 chỉ ghi "giờ làm việc, tính T2–T7" mà chưa định nghĩa số giờ mỗi ngày; cần một quy ước cụ thể để hiện thực và kiểm thử được.
- **Ảnh hưởng:** `src/rules/sla.js`, quy tắc BR2 trong `docs/srs.md`; bảng `sla_config` giữ nguyên giá trị 24/72/120.

## 4. Trạng thái bảo hành không lưu thành cột
- **Thay đổi gì:** nhãn `CHUA_XAC_MINH` (và `CON_BAO_HANH`, `HET_BAO_HANH`) được tính tại thời điểm tiếp nhận từ `purchase_date` và `warranty_months`, trả về qua trường `warrantyStatus` của API; trong bảng chỉ lưu `ticket.is_warranty`.
- **Vì sao:** `schema.sql` không có cột `warranty_status`, và trạng thái bảo hành là giá trị suy ra được, lưu thêm sẽ dễ lệch với ngày mua.
- **Ảnh hưởng:** `src/rules/warranty.js`, `src/services/ticket.service.js`, bảng thuật ngữ mục 1.5 trong `docs/srs.md`.

## 5. Thêm đăng nhập cơ bản và API danh mục
- **Thay đổi gì:** thêm `POST /auth/login` (tài khoản cấu hình bằng biến môi trường, token ký HMAC có hạn 8 giờ), bắt buộc đăng nhập cho mọi API nghiệp vụ, thêm `GET /catalog/categories` và `GET /catalog/devices`.
- **Vì sao:** BT2 yêu cầu xác thực đăng nhập mức cơ bản; màn hình tạo phiếu cần danh sách nhóm sự cố và thiết bị của khách mà BT1 chưa có API riêng.
- **Ảnh hưởng:** `src/services/auth.service.js`, `src/routes/auth.routes.js`, `src/routes/require-auth.js`, `src/routes/catalog.routes.js`, `.env.example` (thêm `AUTH_*`), `docs/api-contract.md`; chưa có bảng người dùng trong `schema.sql`.

## 6. Giao diện web thuần phục vụ cùng máy chủ
- **Thay đổi gì:** giao diện ba màn hình viết bằng HTML và JavaScript thuần trong `public/`, do chính Express phục vụ, thay cho thư mục `src/client` dùng React dự kiến ở README của BT1.
- **Vì sao:** đề BT2 chấm chức năng và ba trạng thái chứ không chấm giao diện đẹp; bỏ bước build giúp người khác dựng lại hệ thống chỉ bằng `npm start`.
- **Ảnh hưởng:** `public/index.html`, `public/js/api-client.js`, `public/js/app.js`, sơ đồ kiến trúc thực tế, cấu trúc thư mục trong `README.md`.

---

# Phụ lục: Phản hồi của giảng viên về Bài tập 1 và cách đã sửa

Mỗi điểm góp ý gồm đúng bốn dòng: **Góp ý**, **Nguyên nhân**, **Đã sửa**, **Commit**.

## A1. Số lượng User Story (đề yêu cầu 5–7, bài có 9)

- **Góp ý:** SRS có 9 User Story, vượt mức 5–7; gợi ý gộp US8, US9 hoặc chuyển xuống WON'T.
- **Nguyên nhân:** mỗi chức năng nhỏ được tách thành một story riêng (mô tả lỗi, nhóm sự cố, tính SLA tách khỏi story cha).
- **Đã sửa:** gộp US3+US4 thành US3 (thêm AC3), US5+US6 thành US4, đổi US7–US9 thành US5–US7; cập nhật bảng truy vết, bảng use case, đặc tả UC6, bảng index, bảng wireframe và Lịch sử thay đổi (phiên bản 1.2).
- **Commit:** `docs(srs): gộp 9 User Story còn 7, cập nhật bảng truy vết`

## A2. DDL trong báo cáo chỉ trích 3/6 bảng

- **Góp ý:** phần SQL DDL ở Mục 4 chỉ có customer, device, ticket; thiếu sla_config, issue_category, ticket_status_log.
- **Nguyên nhân:** báo cáo để dạng skeleton "trích các bảng cốt lõi", không khớp với docs/schema.sql có đủ 6 bảng.
- **Đã sửa:** thay bằng DDL đầy đủ 6 bảng, 4 index và dữ liệu mẫu, sao nguyên văn từ schema.sql; đổi tiêu đề thành "SQL DDL đầy đủ 6 bảng".
- **Commit:** `docs(erd): thay DDL skeleton bằng DDL đầy đủ 6 bảng trong báo cáo`

## A3. Repo thiếu file và sai tên file so với bài ghi

- **Góp ý:** repo không có docs/schema.sql và docs/wireframe.drawio; file use case tên UseCaseDiagram.drawio, không phải usecase.drawio như bài ghi.
- **Nguyên nhân:** các file chưa được đưa lên repo, và tên file trong báo cáo không đồng nhất với tên file thật.
- **Đã sửa:** thêm docs/schema.sql và docs/wireframe.drawio vào repo; thống nhất dùng tên docs/UseCaseDiagram.drawio ở mọi nơi nhắc tới (báo cáo, README, ai-disclosure.md).
- **Commit:** `docs(erd): thêm docs/schema.sql` · `docs(wireframe): thêm docs/wireframe.drawio` · `docs(usecase): thống nhất tên file UseCaseDiagram.drawio`

## A4. Trang bìa và dòng cam kết

- **Góp ý:** bìa ghi chữ "REPO GITHUB" thay vì URL repo, thiếu ngày nộp; dòng cam kết ghi sai MSSV (23740802010260).
- **Nguyên nhân:** để chữ giữ chỗ cho liên kết, chưa điền ngày nộp, và chưa đối chiếu MSSV với thẻ sinh viên.
- **Đã sửa:** thay "REPO GITHUB" bằng URL đầy đủ `https://github.com/<tài-khoản>/<tên-repo>`; thêm ngày nộp trên bìa và điền ô "Ngày nộp" ở dòng cam kết; sửa MSSV ở bìa và dòng cam kết cho giống thẻ sinh viên.
- **Commit:** `docs(report): ghi URL repo, ngày nộp và sửa MSSV ở bìa và dòng cam kết`

## A5. Lịch sử commit chưa đúng quy ước

- **Góp ý:** nhiều commit dạng "Add files via upload", "Update ai-disclosure.md"; nên commit bằng Git với message kiểu `docs(erd): ...`.
- **Nguyên nhân:** tải file lên bằng giao diện web GitHub nên message do GitHub tự sinh, không mô tả nội dung thay đổi.
- **Đã sửa:** từ nay làm việc bằng Git trên máy (`git add`, `git commit`, `git push`), mỗi commit một thay đổi, message theo mẫu `loại(phạm-vi): mô tả ngắn`, ví dụ `docs(srs)`, `docs(erd)`, `docs(wireframe)`, `docs(ai)`.
- **Commit:** `docs(design): them file thay-doi-thiet-ke.md`
