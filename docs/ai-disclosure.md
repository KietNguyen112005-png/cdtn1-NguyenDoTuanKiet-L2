# PHỤ LỤC – BẢNG KHAI BÁO SỬ DỤNG CÔNG CỤ AI

Công cụ AI đã sử dụng: **Claude (Anthropic)**, giao diện chat claude.ai.

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
| --- | --- | --- | --- |
| Claude | Rà soát bản nháp SRS với danh sách mục kiểm chứng; gợi ý và soạn lại User Story, tiêu chí chấp nhận Given–When–Then, FR, NFR, quy tắc nghiệp vụ, bảng truy vết, bảng thuật ngữ | Mục 1 – SRS (các mục 1.1–6) | Đối chiếu quy tắc nghiệp vụ với Bảng 9.1 của case study và cấu trúc SRS trong tài liệu buổi 3; [BẠN ĐIỀN: bạn tự đọc lại toàn bộ và giải thích được từng quyết định] |
| Claude | Soạn mã PlantUML cho Use Case Diagram; soạn đặc tả use case UC6 (điều kiện trước/sau, luồng chính, luồng ngoại lệ đánh số) | Mục 2 – Use Case | Chèn mã vào draw.io, tự sửa các đường nối bị đứt; đối chiếu tên use case, User Story với bảng truy vết của SRS; [BẠN ĐIỀN: phần bạn tự chỉnh] |
| Claude | Đề xuất kiến trúc phân lớp 4 lớp, vẽ sơ đồ kiến trúc và viết 3 câu lập luận theo khuôn "Vì NFR…, tôi chọn…, đánh đổi là…" | Mục 3 – Thiết kế kiến trúc | Đối chiếu từng câu với ngưỡng số trong NFR1, NFR3, NFR4 của SRS và với các nguyên tắc phân lớp ở tài liệu buổi 5; [BẠN ĐIỀN: bạn tự kiểm lại] |
| Claude | Thiết kế ERD 6 bảng, viết SQL DDL, chọn index, đối chiếu tên trường API với ERD | Mục 4 – Mô hình dữ liệu; `docs/schema.sql`; `docs/api-contract.md` | DDL được chạy thử trên một PostgreSQL thật với 15 trường hợp (dữ liệu hợp lệ được ghi, dữ liệu sai bị chặn); đối chiếu checklist ERD của tài liệu buổi 5 (4–6 bảng, khóa chính, khóa ngoại, không bảng cô lập, có bảng lịch sử); [BẠN ĐIỀN: bạn tự vẽ lại hoặc kiểm tra ERD] |
| Claude | Thiết kế bố cục 3 màn hình wireframe và bảng đối chiếu trường màn hình với cột dữ liệu | Mục 5 – Wireframe | Đối chiếu từng trường trên màn hình với cột trong ERD (kiểm hai chiều theo tài liệu buổi 5); [BẠN ĐIỀN: bạn tự xem lại] |
| — tự làm hoàn toàn — | [BẠN ĐIỀN: liệt kê các phần bạn tự làm, ví dụ: chọn luồng L2, đọc case study, quyết định giữ 9 User Story, sửa sơ đồ trong draw.io, commit và quản lý repo] | [BẠN ĐIỀN: mục tương ứng] | Không áp dụng |

**Cam kết:** Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.

Họ tên: Nguyễn Đỗ Tuấn Kiệt  ·  MSSV: 2374802010260  ·  Ngày: 08/10/2026
