-- migrations/001_init.sql · PostgreSQL 16 (chạy lại được: IF NOT EXISTS)
-- Luồng L2 – Tiếp nhận và phân loại yêu cầu bảo hành (track SE)
-- Tên bảng/cột khớp bảng thuật ngữ SRS mục 1.5: phiếu bảo hành = ticket.
-- Thứ tự tạo bảng: bảng được tham chiếu trước, bảng tham chiếu sau.
-- Mã BRn, NFRn, FRn, USn: xem docs/srs.md.

-- 1. Cấu hình SLA theo mức ưu tiên (FR9, BR2)
CREATE TABLE IF NOT EXISTS sla_config (
    sla_id    SERIAL PRIMARY KEY,
    priority  VARCHAR(12) NOT NULL UNIQUE
              CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    hours     INT NOT NULL CHECK (hours BETWEEN 1 AND 720)   -- giờ làm việc, tính T2–T7
);

-- 2. Khách hàng (FR1, FR2; BR6, BR7)
CREATE TABLE IF NOT EXISTS customer (
    customer_id BIGSERIAL PRIMARY KEY,                       -- khóa nhân tạo, không dùng SĐT làm khóa chính
    full_name   VARCHAR(120) NOT NULL CHECK (length(trim(full_name)) > 0),
    phone       VARCHAR(10)  NOT NULL UNIQUE                 -- BR6 (QT-01, QT-02): 10 chữ số, bắt đầu bằng 0
                CHECK (phone ~ '^0[0-9]{9}$'),
    address     VARCHAR(255),
    email       VARCHAR(120),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,               -- BR7 (QT-13): không xóa vật lý
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Thiết bị (FR3; BR1)
-- warranty_months lưu theo từng thiết bị: số tháng bảo hành áp dụng tại thời điểm mua
-- (có thể khác nhau giữa các lần mua), nên không tách bảng sản phẩm. Ghi rõ lý do phi chuẩn hóa.
CREATE TABLE IF NOT EXISTS device (
    device_id       BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customer(customer_id),
    model_name      VARCHAR(120) NOT NULL,
    serial_no       VARCHAR(50)  NOT NULL UNIQUE,            -- BR1 (QT-03): IMEI/Serial duy nhất
    purchase_date   DATE,                                    -- NULL = chưa xác minh bảo hành (BR1, QT-05)
    warranty_months SMALLINT NOT NULL DEFAULT 12 CHECK (warranty_months > 0),
    purchase_note   VARCHAR(255),                            -- nguồn gốc mua hàng khi không có ngày mua
    CONSTRAINT chk_device_purchase_info
        CHECK (purchase_date IS NOT NULL OR purchase_note IS NOT NULL)
);

-- 4. Nhóm sự cố (FR5)
CREATE TABLE IF NOT EXISTS issue_category (
    category_id      SERIAL PRIMARY KEY,
    category_name    VARCHAR(40) NOT NULL UNIQUE,
    default_priority VARCHAR(12) REFERENCES sla_config(priority),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Phiếu bảo hành (FR3–FR7, FR10; BR1–BR5)
CREATE TABLE IF NOT EXISTS ticket (
    ticket_id    BIGSERIAL PRIMARY KEY,
    ticket_code  VARCHAR(20) NOT NULL UNIQUE,                -- dạng BH-000231/2026
    customer_id  BIGINT NOT NULL REFERENCES customer(customer_id),
    device_id    BIGINT NOT NULL REFERENCES device(device_id),
    category_id  INT    NOT NULL REFERENCES issue_category(category_id),
    priority     VARCHAR(12) NOT NULL REFERENCES sla_config(priority),
    issue_desc   TEXT NOT NULL CHECK (length(issue_desc) BETWEEN 10 AND 2000),
    status       VARCHAR(20) NOT NULL DEFAULT 'MOI'          -- BR5 (QT-06): vòng đời trạng thái
                 CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN',
                                   'HOAN_TAT', 'DA_DONG', 'DA_HUY')),
    received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date     TIMESTAMPTZ NOT NULL,                       -- sinh theo BR2 (QT-04)
    is_warranty  BOOLEAN NOT NULL,
    closed_at    TIMESTAMPTZ,
    CONSTRAINT chk_ticket_due_after_received
        CHECK (due_date >= received_at),
    CONSTRAINT chk_ticket_closed_after_received
        CHECK (closed_at IS NULL OR closed_at >= received_at)
);

-- 6. Lịch sử trạng thái phiếu (BR5): biết phiếu ở mỗi trạng thái bao lâu
CREATE TABLE IF NOT EXISTS ticket_status_log (
    log_id      BIGSERIAL PRIMARY KEY,
    ticket_id   BIGINT NOT NULL REFERENCES ticket(ticket_id),
    from_status VARCHAR(20)
                CHECK (from_status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN',
                                       'HOAN_TAT', 'DA_DONG', 'DA_HUY')),
    to_status   VARCHAR(20) NOT NULL
                CHECK (to_status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN',
                                     'HOAN_TAT', 'DA_DONG', 'DA_HUY')),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by  VARCHAR(50) NOT NULL                         -- tên đăng nhập người thực hiện
);

-- INDEX: mỗi index phục vụ một truy vấn cụ thể
-- customer(phone) và device(serial_no) đã có index tự sinh từ ràng buộc UNIQUE.
--   customer(phone)  -> NFR1 (tra cứu < 2 giây với 40.000 bản ghi), US1
CREATE INDEX IF NOT EXISTS idx_ticket_status_due   ON ticket(status, due_date);          -- danh sách phiếu lọc theo trạng thái, sắp theo hạn (FR7, FR10; US7, US9)
CREATE INDEX IF NOT EXISTS idx_ticket_customer     ON ticket(customer_id, received_at);  -- lịch sử bảo hành của khách (US1)
CREATE INDEX IF NOT EXISTS idx_device_customer     ON device(customer_id);               -- thiết bị của khách (US3)
CREATE INDEX IF NOT EXISTS idx_log_ticket          ON ticket_status_log(ticket_id, changed_at);  -- lịch sử trạng thái (BR5)

