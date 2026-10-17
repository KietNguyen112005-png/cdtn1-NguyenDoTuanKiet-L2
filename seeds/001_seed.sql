-- Dữ liệu mẫu. Mọi câu lệnh dùng ON CONFLICT DO NOTHING nên chạy lại không nhân đôi dữ liệu (C5).

INSERT INTO sla_config (priority, hours) VALUES
    ('CAO', 24), ('TRUNG_BINH', 72), ('THAP', 120)
ON CONFLICT (priority) DO NOTHING;

INSERT INTO issue_category (category_name, default_priority) VALUES
    ('MAN_HINH', 'TRUNG_BINH'), ('PIN', 'TRUNG_BINH'), ('SAC', 'TRUNG_BINH'),
    ('PHAN_MEM', 'THAP'), ('NUOC_VAO', 'CAO'), ('KHAC', 'THAP')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO customer (full_name, phone, address, email) VALUES
    ('Nguyễn Văn B', '0901234567', 'Quận 1, TP.HCM', 'b@example.com'),
    ('Trần Thị C',   '0912345678', 'Quận 7, TP.HCM', NULL)
ON CONFLICT (phone) DO NOTHING;

-- Ba thiết bị: còn bảo hành, hết bảo hành, chưa xác minh bảo hành (không có ngày mua).
INSERT INTO device (customer_id, model_name, serial_no, purchase_date, warranty_months, purchase_note)
SELECT c.customer_id, v.model_name, v.serial_no, v.purchase_date::date, v.warranty_months::smallint, v.purchase_note
FROM (VALUES
    ('0901234567', 'iPhone 13',        '861234567890001', '2025-12-15', 12, NULL),
    ('0901234567', 'Galaxy A52',       '861234567890002', '2024-03-10', 12, NULL),
    ('0912345678', 'Xiaomi Redmi 12',  '861234567890003', NULL,         12, 'Mua tại cửa hàng ngoài, không còn hóa đơn')
) AS v(phone, model_name, serial_no, purchase_date, warranty_months, purchase_note)
JOIN customer c ON c.phone = v.phone
ON CONFLICT (serial_no) DO NOTHING;
