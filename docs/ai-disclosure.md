# PHỤ LỤC – BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI

Công cụ AI đã sử dụng: **Claude (Anthropic)**, giao diện chat claude.ai.

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
| --- | --- | --- | --- |
| Claude | Rà soát bản nháp SRS với danh sách mục kiểm chứng; gợi ý và soạn lại User Story, tiêu chí chấp nhận Given–When–Then, FR, NFR, quy tắc nghiệp vụ, bảng truy vết, bảng thuật ngữ | Mục 1 – SRS (các mục 1.1–6) | Đối chiếu quy tắc nghiệp vụ với Bảng 9.1 của case study và cấu trúc SRS trong tài liệu buổi 3;
| Claude | Soạn mã PlantUML cho Use Case Diagram; soạn đặc tả use case UC6 (điều kiện trước/sau, luồng chính, luồng ngoại lệ đánh số) | Mục 2 – Use Case | Chèn mã vào draw.io, tự sửa các đường nối bị đứt; đối chiếu tên use case, User Story với bảng truy vết của SRS; 
| Claude | Đề xuất kiến trúc phân lớp 4 lớp, vẽ sơ đồ kiến trúc và viết 3 câu lập luận theo khuôn "Vì NFR…, tôi chọn…, đánh đổi là…" | Mục 3 – Thiết kế kiến trúc | Đối chiếu từng câu với ngưỡng số trong NFR1, NFR3, NFR4 của SRS và với các nguyên tắc phân lớp ở tài liệu buổi 5; 
| Claude | Thiết kế ERD 6 bảng, viết SQL DDL, chọn index, đối chiếu tên trường API với ERD | Mục 4 – Mô hình dữ liệu; `docs/schema.sql`; `docs/api-contract.md` | DDL được chạy thử trên một PostgreSQL thật với 15 trường hợp (dữ liệu hợp lệ được ghi, dữ liệu sai bị chặn); đối chiếu checklist ERD của tài liệu buổi 5 (4–6 bảng, khóa chính, khóa ngoại, không bảng cô lập, có bảng lịch sử); 
| Tự làm | Thiết kế bố cục 3 màn hình wireframe và bảng đối chiếu trường màn hình với cột dữ liệu | Mục 5 – Wireframe | Đối chiếu từng trường trên màn hình với cột trong ERD (kiểm hai chiều theo tài liệu buổi 5); 

Họ tên: Nguyễn Đỗ Tuấn Kiệt  ·  MSSV: 2374802010260  ·  Ngày: 08/10/2026

---

# PHỤ LỤC – BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI (BÀI TẬP 2)

Công cụ AI đã sử dụng: **Claude (Anthropic)**, giao diện chat claude.ai.

| Công cụ | Dùng vào việc gì | Áp dụng ở tệp / hàm nào | Em đã kiểm chứng thế nào |
| --- | --- | --- | --- |
| Claude | Đề xuất cấu trúc dự án ba lớp `routes → services → repositories` và dựng khung mã (lớp lỗi dùng chung, lắp ráp phụ thuộc, bộ xử lý lỗi HTTP) | `src/` (toàn bộ), đặc biệt `src/errors.js`, `src/container.js`, `src/routes/error-handler.js` | Khởi động hệ thống bằng `npm start` và gửi bảy yêu cầu trong `requests.http`; kết quả đúng mã mong đợi (200, 201, 400 khi thiếu mô tả lỗi, 422 khi chuyển trạng thái sai) |
| Claude | Gợi ý hàm tính hạn SLA bỏ Chủ nhật và hàm tính bảo hành có xử lý ngày cuối tháng | `src/rules/sla.js` (`addWorkingHours`, `toLocalDate`), `src/rules/warranty.js` (`addMonths`, `evaluateWarranty`) | Chạy `npm test`: các kiểm thử giá trị biên trong `tests/rules.test.js` đều PASS (ngày cuối còn bảo hành và ngày đầu hết bảo hành, mua ngày 31/08 bảo hành 6 tháng, nhận thứ Bảy 10:00 cộng 24 giờ ra thứ Hai 10:00) |
| Claude | Soạn nghiệp vụ tạo phiếu, sửa mô tả lỗi, chuyển trạng thái, huỷ phiếu và nghiệp vụ khách hàng (BR1, BR2, BR4, BR5, BR6, BR7) | `src/services/ticket.service.js` (`create`, `updateDescription`, `changeStatus`, `cancel`), `src/services/customer.service.js`, `src/rules/ticket-status.js`, `src/validators/*.js` | Chạy `npm test`, các test `[BR4]`, `[BR5]`, `[BR7]`, `[Luồng đúng]` và `[Dữ liệu sai]` đều PASS; gửi yêu cầu chuyển phiếu từ DA_PHAN_CONG thẳng sang HOAN_TAT, hệ thống trả 422 |
| Claude | Viết câu lệnh SQL truy cập dữ liệu | `src/repositories/*.js` (`customer`, `device`, `category`, `sla`, `ticket`) | Tạo phiếu thật qua API và đọc lại bằng yêu cầu danh sách phiếu trong `requests.http`; phiếu được lưu đúng với mã dạng `BH-000001/2026` |
| Claude | Chuyển `schema.sql` thành migration chạy lại được và viết dữ liệu mẫu | `migrations/001_init.sql`, `seeds/001_seed.sql`, `scripts/migrate.js`, `scripts/seed.js` | Chạy `npm run setup` hai lần liên tiếp: lần hai không lỗi và báo bỏ qua migration đã áp dụng |
| Claude | Viết bộ kiểm thử ba loại (luồng đúng, giá trị biên, dữ liệu sai) kèm đối tượng giả | `tests/ticket.service.test.js`, `tests/rules.test.js`, `tests/customer.service.test.js`, `tests/helpers/fakes.js` | Chạy `npm test` trên máy của em, toàn bộ kiểm thử PASS và không cần cơ sở dữ liệu |
| Claude | Soạn README, `.env.example`, `docker-compose.yml`, `requests.http` | `README.md`, `.env.example`, `docker-compose.yml`, `requests.http` | Làm đúng theo README từng bước trên máy để dựng lại hệ thống từ đầu |
| Claude | Soạn giao diện web ba màn hình và lớp client API | `public/index.html`, `public/js/api-client.js`, `public/js/app.js` | (điền việc em đã làm thật, ví dụ tự thử ba trạng thái đang tải, rỗng, lỗi trên trình duyệt) |
| Claude | Soạn chức năng đăng nhập và kiểm thử đăng nhập | `src/services/auth.service.js` (`login`, `verify`), `tests/auth.service.test.js` | (điền việc em đã làm thật, ví dụ chạy `npm test` và thử đăng nhập sai mật khẩu trên giao diện) |

Họ tên: Nguyễn Đỗ Tuấn Kiệt  ·  MSSV: 2374802010260  ·  Ngày: 17/10/2026
