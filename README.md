# cdtn1-NguyenDoTuanKiet-L2
Sinh viên:
Nguyễn Đỗ Tuấn Kiêth - 2374802010260 - Track SE
Học phần:
Chuyên đề Tốt nghiệp 1, HK1 2026-2027
Luồng nghiệp vụ:
L2 – Tiếp nhận và phân loại yêu cầu bảo hành
## 1. Mục tiêu
Hệ thống giải quyết tình trạng ghi nhận thủ công, dữ liệu phân tán và thiếu căn cứ tính thời hạn cam kết (SLA) tại khâu tiếp nhận bảo hành của Mekong Mobile. Chức năng hỗ trợ Nhân viên tiếp nhận tra cứu nhanh thông tin khách hàng qua số điện thoại, ghi nhận thiết bị cùng mô tả lỗi, tự động tính SLA và khởi tạo phiếu bảo hành. Nhờ đó, công việc được chuyển giao tức thì cho Kỹ thuật viên, giúp chuẩn hóa quy trình tiếp nhận và nâng cao sự hài lòng của khách hàng.
## 2. Yêu cầu môi trường
Node.js: v20 LTS trở lên   
Cơ sở dữ liệu: MongoDB v7.0 (hoặc PostgreSQL 16)   
Trình quản lý gói: npm v10.x   
Biến môi trường: Tạo file .env dựa trên .env.example và thiết lập các tham số kết nối database (DB_URI), cổng ứng dụng (PORT), và cấu hình bảo mật
PostgreSQL 16
Biến môi trường: xem .env.example
## 3. Hướng dẫn chạy
(BT2 yêu cầu ≤ 4 bước)
cp .env.example .env và điền giá trị
npm install
npm run db:migrate
npm run dev → mở http://localhost:3000/health
## 4. Cấu trúc thư mục
```
cdtn1-nguyendotuankiet-l2/
├── docs/                  # Tài liệu kỹ thuật
│   ├── srs.md             # Đặc tả yêu cầu rút gọn (BT1)
│   ├── architecture.drawio  # Sơ đồ kiến trúc (file gốc)
│   ├── erd.drawio         # Mô hình dữ liệu (các collection MongoDB)
│   ├── wireframe.fig      # Wireframe 3 màn hình chính
│   └── ai-disclosure.md   # Bảng khai báo sử dụng công cụ AI
├── src/                   # Mã nguồn, tách lớp theo kiến trúc đã thiết kế
│   ├── api/               # Tầng giao tiếp: route và controller (Express)
│   ├── service/           # Tầng nghiệp vụ: phân loại, tính thời hạn cam kết, tạo phiếu
│   ├── repository/        # Tầng truy cập dữ liệu MongoDB
│   └── client/            # Giao diện React cho nhân viên tiếp nhận
├── tests/                 # Unit test và integration test
├── data/                  # Dữ liệu mẫu nhỏ của case study (không commit dữ liệu lớn)
├── .env.example           # Danh sách tên biến môi trường, không chứa giá trị thật
├── .gitignore             # Loại trừ node_modules/, .env, *.log, ...
└── README.md              # Tài liệu hướng dẫn này
```

| Thư mục / file | Vai trò |
|---|---|
| `docs/` | Chứa tài liệu phân tích, thiết kế và bảng khai báo AI. Lưu file `.drawio` gốc để chỉnh sửa khi cần. |
| `src/` | Mã nguồn chính, chia lớp để không dồn toàn bộ mã vào một file. |
| `tests/` | Các test kiểm chứng chức năng, lấy nguồn từ tiêu chí chấp nhận của User Story. |
| `data/` | Dữ liệu mẫu để chạy thử và kiểm thử. |
| `.env.example` | Mẫu cấu hình môi trường. Sao chép thành `.env` rồi điền giá trị thật. |
| `.gitignore` | Ngăn commit thư viện cài đặt, file bí mật và log. |
## 5. Kiểm thử
npm test → hiển thị số test PASS
## 6. Trạng thái hiện tại
 Khởi tạo project, smoke test chạy được (buổi 2)
□ Module tiếp nhận yêu cầu (buổi 8–10)
□ Module phân công kỹ thuật viên (buổi 10–12)
